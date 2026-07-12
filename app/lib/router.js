// Smart model router: classifies each prompt's task difficulty with local
// heuristics (zero extra LLM calls — a classification call would itself burn
// free-tier quota), then resolves a primary+fallback route from the catalog
// ladders, filtered by key availability, consent gates, cooldowns, and
// provider deprecation dates. Manual mode and per-message overrides bypass
// the classifier but still get catalog tuning params when known.
'use strict';
const catalog = require('./catalog');
const keypool = require('./keypool');
const trace = require('./trace');
const { getProviders, getKeys } = require('./config');

const HARD_KEYWORDS = [
  'refactor', 'architect', 'implement', 'debug', 'root cause', 'optimi',
  'migrat', 'concurren', 'race condition', 'memory leak', 'security',
  'vulnerab', 'algorithm', 'rewrite', 'end-to-end', 'integration test',
  'protocol', 'benchmark', 'deadlock', 'encrypt', 'scalab', 'distributed'
];
const CODING_HINTS = [
  'bug', 'fix', 'test', 'compile', 'build', 'lint', 'function', 'class',
  'api', 'endpoint', 'module', 'file', 'code', 'script', 'stack trace',
  'refactor', 'implement', 'deploy', 'regression', 'unit test'
];

/**
 * Classify a prompt into { level, kind, score, signals }.
 * level: 'simple' | 'moderate' | 'complex'; kind: 'general' | 'coding'.
 * Pure function of (text, history) — deterministic and unit-testable.
 */
function classifyDifficulty(text, history = []) {
  const t = String(text || '');
  const lower = t.toLowerCase();
  let score = 0;
  const signals = [];

  if (t.length > 2400) { score += 2; signals.push('long prompt'); }
  else if (t.length > 700) { score += 1; signals.push('medium-length prompt'); }

  const hasCode = /```|(?:^|\n)\s*(?:function |class |def |const |import |#include)/.test(t)
    || /\.(?:js|ts|py|rs|go|java|cpp?|cs|rb|php|html|css|json|ya?ml|sql|sh|ps1)\b/i.test(t);
  if (hasCode) { score += 1; signals.push('code content'); }

  const hardHits = HARD_KEYWORDS.filter(k => lower.includes(k));
  if (hardHits.length) { score += Math.min(hardHits.length, 4); signals.push('hard keywords: ' + hardHits.slice(0, 3).join(', ')); }

  const steps = (t.match(/(?:^|\n)\s*(?:\d+[.)]|[-*])\s+\S/g) || []).length;
  if (steps >= 3) { score += 1; signals.push(steps + ' listed steps'); }
  if ((t.match(/\b(?:then|after that|finally)\b/gi) || []).length >= 2) { score += 1; signals.push('sequenced instructions'); }

  if (t.length > 300 && /(?:\berror\b|exception|traceback|stack trace)/i.test(t)) { score += 1; signals.push('error dump'); }

  const trimmed = t.trim();
  if (trimmed.length < 160 && /^(?:what|who|when|where|how many|which|is|are|does|do|can|list|show|explain|summari[sz]e|translate|tl;?dr)\b/i.test(trimmed)) {
    score -= 2; signals.push('short factual ask');
  }
  if (/\b(?:typo|rename|one[- ]liner|quick question|briefly|small change)\b/i.test(lower)) { score -= 1; signals.push('explicitly small task'); }

  if (history.filter(m => m.role === 'tool').length > 6) { score += 1; signals.push('deep agentic session'); }

  const codingHits = CODING_HINTS.filter(k => lower.includes(k)).length;
  const kind = (hasCode || codingHits >= 2) ? 'coding' : 'general';
  const level = score <= 0 ? 'simple' : (score <= 3 ? 'moderate' : 'complex');
  return { level, kind, score, signals };
}

function ladderKey(level, kind) {
  return level === 'simple' ? 'simple' : `${level}-${kind}`;
}

/** A provider is usable when registered, keyed, consented, and not fully cooled. */
function providerUsable(provider, config, deps) {
  const registry = getProviders(config);
  const meta = registry[provider];
  if (!meta) return false;
  if (meta.consentRequired && !(config.settings && config.settings.yolo && config.settings.yolo.mistralConsent)) return false;
  const keys = deps.getKeys(provider);
  if (!keys.length) return false;
  const status = deps.poolStatus(provider, keys);
  return status.some(k => !k.cooled);
}

/**
 * Per-provider rate-limit pressure from today's own trace ledger (zero
 * external calls): providers that already returned 429s today get demoted so
 * auto mode routes toward remaining quota instead of re-hitting known walls
 * (predictive routing, not just reactive key rotation).
 */
function providerPressure(budgetRows, registry) {
  const p = {};
  for (const r of budgetRows || []) {
    let score = r.rateLimited || 0;
    // Quota proximity: a key at ≥90% of its documented daily request limit is
    // about to hit the wall — demote before the 429, not after.
    const ft = (registry && registry[r.provider] && registry[r.provider].freeTier) || {};
    if (ft.rpd && r.requests >= ft.rpd * 0.9) score += 3;
    // Token-based caps (Cerebras/Mistral): same 90% early-demotion rule.
    if (ft.tpd && (r.inputTokens + r.outputTokens) >= ft.tpd * 0.9) score += 3;
    p[r.provider] = (p[r.provider] || 0) + score;
  }
  return p;
}

/** Expand a ladder into concrete routes for the providers this user can reach. */
function candidatesForLadder(key, level, config, deps) {
  const out = [];
  for (const catalogId of (catalog.LADDERS[key] || [])) {
    const entry = catalog.findEntry(catalogId);
    if (!entry) continue;
    for (const [prov, spec] of Object.entries(entry.providers)) {
      if (!providerUsable(prov, config, deps)) continue;
      if (catalog.isDeprecated(prov, spec.model, deps.now())) continue;
      const params = catalog.routeParams(entry, prov, level);
      out.push({ provider: prov, model: spec.model, ...(params ? { params } : {}), catalogId, label: entry.label });
    }
  }
  // Stable demotion by rate-limit pressure: ladder order (quality fit) is
  // preserved among providers with equal pressure today.
  const pressure = deps.pressure || {};
  return out
    .map((c, i) => ({ c, i }))
    .sort((a, b) => ((pressure[a.c.provider] || 0) - (pressure[b.c.provider] || 0)) || (a.i - b.i))
    .map(x => x.c);
}

/** Attach catalog tuning params to a manually chosen route, when we know the model. */
function withCatalogParams(route, level) {
  if (!route || !route.provider || !route.model) return route;
  const entry = catalog.entryForModel(route.provider, route.model);
  if (!entry) return route;
  const params = catalog.routeParams(entry, route.provider, level);
  return params ? { ...route, params } : route;
}

/**
 * Resolve the effective { primary, fallback, meta } routing for one turn.
 * Precedence: per-message override > manual mode > auto ladder.
 * Auto prefers a cross-provider fallback (multi-provider failover per the
 * usage guide) and always keeps the configured manual routes as last resort.
 * `deps` is injectable for tests: { getKeys, poolStatus, now }.
 */
function resolveRouting({ config, userMessage, history, routeOverride }, deps = {}) {
  const d = {
    getKeys: deps.getKeys || getKeys,
    poolStatus: deps.poolStatus || ((prov, keys) => keypool.status(prov, keys)),
    now: deps.now || (() => Date.now())
  };
  // Budget pressure must never break routing — degrade to no demotion.
  try { d.pressure = deps.pressure || providerPressure(trace.budgetByKey(), getProviders(config)); } catch { d.pressure = {}; }
  const cls = classifyDifficulty(userMessage, history || []);
  const manual = config.routing || {};

  if (routeOverride && routeOverride.provider && routeOverride.model) {
    const primary = withCatalogParams({ provider: routeOverride.provider, model: routeOverride.model }, cls.level);
    const autoCands = candidatesForLadder(ladderKey(cls.level, cls.kind), cls.level, config, d)
      .filter(c => !(c.provider === primary.provider && c.model === primary.model));
    const fallback = autoCands.find(c => c.provider !== primary.provider) || autoCands[0] || manual.fallback || null;
    return {
      primary, fallback,
      meta: { mode: 'override', ...cls, why: `user override → ${primary.provider}/${primary.model}` }
    };
  }

  if (manual.mode === 'manual') {
    return {
      primary: withCatalogParams(manual.primary, cls.level),
      fallback: withCatalogParams(manual.fallback, cls.level),
      meta: { mode: 'manual', ...cls, why: `manual routing → ${manual.primary && manual.primary.provider}/${manual.primary && manual.primary.model}` }
    };
  }

  const key = ladderKey(cls.level, cls.kind);
  const cands = candidatesForLadder(key, cls.level, config, d);
  if (!cands.length) {
    return {
      primary: withCatalogParams(manual.primary, cls.level),
      fallback: withCatalogParams(manual.fallback, cls.level),
      meta: { mode: 'auto', ...cls, ladder: key, why: 'auto: no ladder candidate has usable keys — using configured manual routes' }
    };
  }
  const primary = cands[0];
  const fallback = cands.find(c => c.provider !== primary.provider) || cands[1] || manual.fallback || null;
  return {
    primary, fallback,
    meta: {
      mode: 'auto', ...cls, ladder: key,
      why: `auto: ${cls.level} ${cls.kind} task (score ${cls.score}${cls.signals.length ? ': ' + cls.signals.join('; ') : ''}) → ${primary.provider}/${primary.model}`
    }
  };
}

module.exports = { classifyDifficulty, resolveRouting, candidatesForLadder, ladderKey, providerPressure };
