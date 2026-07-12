// Config store. Non-secret settings live in data/config.json; API keys live
// exclusively in the DPAPI-encrypted vault (data/secrets.vault). Provider
// endpoints/quirks are code constants so config.json stays clean and shareable.
'use strict';
const fs = require('fs');
const vault = require('./vault');
const { CONFIG_PATH } = require('./paths');

// Free-tier provider registry (endpoints + per-provider quirks).
// streamUsage: provider honors OpenAI `stream_options: {include_usage: true}`
// to send token usage in the terminal SSE chunk (verified live for google +
// github 2026-07-11; without it those providers stream zero usage and the
// budget ledger undercounts). Mistral/Kimi include usage automatically and
// may reject the param, so they don't get the flag.
// freeTier.rpd: documented free-tier daily request limits (docs/research
// provider table, 2026-07-11; conservative bound where a range is given).
// Surfaced as used/limit in the UI and fed into router quota pressure.
const PROVIDERS = {
  openrouter: { label: 'OpenRouter (Free)', endpoint: 'https://openrouter.ai/api/v1/chat/completions', docs: 'https://openrouter.ai/keys', supportsStreaming: true, streamUsage: true, freeTier: { rpd: 50 } },
  google:     { label: 'Google AI Studio',  endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', docs: 'https://aistudio.google.com/apikey', supportsStreaming: true, streamUsage: true, freeTier: { rpd: 1500 } },
  groq:       { label: 'Groq (Free)',       endpoint: 'https://api.groq.com/openai/v1/chat/completions', docs: 'https://console.groq.com/keys', supportsStreaming: true, streamUsage: true, freeTier: { rpd: 1000 } },
  // freeTier.tpd: token-based daily caps where the docs give tokens, not
  // requests (Cerebras ~1M tokens/day; Mistral ~1B tokens/month ≈ 33M/day).
  cerebras:   { label: 'Cerebras (Free)',   endpoint: 'https://api.cerebras.ai/v1/chat/completions', docs: 'https://cloud.cerebras.ai', supportsStreaming: true, streamUsage: true, freeTier: { tpd: 1_000_000 } },
  github:     { label: 'GitHub Models',     endpoint: 'https://models.github.ai/inference/chat/completions', docs: 'https://github.com/settings/tokens', maxInputTokens: 8000, supportsStreaming: true, streamUsage: true, freeTier: { rpd: 150 } },
  mistral:    { label: 'Mistral (Experiment)', endpoint: 'https://api.mistral.ai/v1/chat/completions', docs: 'https://console.mistral.ai', consentRequired: true, supportsStreaming: true, noToolRole: true, freeTier: { tpd: 33_000_000 } },
  deepseek:   { label: 'DeepSeek Direct',   endpoint: 'https://api.deepseek.com/chat/completions', docs: 'https://platform.deepseek.com', supportsStreaming: true, streamUsage: true },
  kimi:       { label: 'Moonshot / Kimi',   endpoint: 'https://api.moonshot.ai/v1/chat/completions', docs: 'https://platform.moonshot.ai', forceParams: { temperature: 1.0, top_p: 0.95 }, supportsStreaming: true }
};

const DEFAULT_CONFIG = {
  port: 4477,
  routing: {
    // mode 'auto': lib/router.js picks models per prompt difficulty from the
    // catalog ladders; primary/fallback below are the manual-mode routes and
    // auto mode's last resort. Model ids come from docs/research (2026-07-11).
    mode: 'auto',
    primary:  { provider: 'openrouter', model: 'z-ai/glm-5.2' },
    fallback: { provider: 'groq', model: 'openai/gpt-oss-120b' }
  },
  // Declarative custom OpenAI-compatible providers (safe subset of a plugin
  // system — no code loading): { id: { label, endpoint, maxInputTokens? } }
  customProviders: {},
  settings: {
    yolo: {
      autoApproveEdits: true,      // Tier 1: write files without diff approval
      autoRunCommands: true,       // Tier 1: run terminal commands without approval
      guardrails: true,            // enforce governance/AGENTS.policy.json Tier 3 blocks
      mistralConsent: false        // Tier 2: data-training opt-in gate for Mistral
    },
    maxIterations: 25,
    maxFileReadLines: 300,
    contextOutline: true,
    traceEnabled: true,            // OT-AT style JSONL trace of every agent action
    agoraEnforced: true,           // require an Agora brainstorm post per completed task
    sandbox: { enabled: false }    // opt-in: route run_command through WSL (app/lib/sandbox.js)
  },
  recentProjects: []
};

/** Merged provider registry: built-ins + user-declared custom endpoints. */
function getProviders(cfg) {
  const merged = { ...PROVIDERS };
  for (const [id, p] of Object.entries((cfg && cfg.customProviders) || {})) {
    if (!p || !p.endpoint || PROVIDERS[id]) continue;
    merged[id] = { label: p.label || id, endpoint: p.endpoint, docs: p.docs || '', maxInputTokens: p.maxInputTokens, custom: true };
  }
  return merged;
}

let secretsCache = null; // { providers: { name: [{key, weight}] } }

function load() {
  let cfg;
  try {
    cfg = merge(structuredClone(DEFAULT_CONFIG), JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')));
  } catch {
    cfg = structuredClone(DEFAULT_CONFIG);
  }
  // Legacy migration: config.json used to hold provider keys — sweep them into the vault.
  if (cfg.providers) {
    const secrets = getSecrets();
    let migrated = 0;
    for (const [name, p] of Object.entries(cfg.providers)) {
      if (p && Array.isArray(p.keys) && p.keys.length) {
        secrets.providers[name] = (secrets.providers[name] || []).concat(p.keys);
        migrated += p.keys.length;
      }
    }
    delete cfg.providers;
    if (migrated) { vault.saveSecrets(secrets); console.log(`[config] Migrated ${migrated} legacy key(s) into encrypted vault.`); }
    save(cfg);
  }
  return cfg;
}

function merge(base, over) {
  for (const k of Object.keys(over)) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}

function save(cfg) {
  const clean = structuredClone(cfg);
  delete clean.providers; // never allow secrets back into config.json
  const tmp = CONFIG_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2));
  fs.renameSync(tmp, CONFIG_PATH);
}

function getSecrets() {
  if (!secretsCache) secretsCache = vault.loadSecrets();
  if (!secretsCache.providers) secretsCache.providers = {};
  return secretsCache;
}

function getKeys(provider) { return getSecrets().providers[provider] || []; }

/**
 * Validate a config for common misconfigurations. Returns an array of
 * human-readable warning strings (empty = clean). Never throws — surfaced at
 * startup so a bad edit fails loudly and early instead of mid-run.
 */
function validate(cfg) {
  const warnings = [];
  const providers = getProviders(cfg);
  const catalog = require('./catalog'); // lazy: avoids cost when validate() is unused
  if (cfg.routing && cfg.routing.mode && !['auto', 'manual'].includes(cfg.routing.mode)) {
    warnings.push(`routing.mode: "${cfg.routing.mode}" is not "auto" or "manual".`);
  }
  for (const role of ['primary', 'fallback']) {
    const r = cfg.routing && cfg.routing[role];
    if (!r) continue;
    if (r.provider && !providers[r.provider]) warnings.push(`routing.${role}: unknown provider "${r.provider}" (not in the registry).`);
    if (r.provider && !r.model) warnings.push(`routing.${role}: no model set for provider "${r.provider}".`);
    if (r.provider && r.model) {
      const dep = catalog.deprecationFor(r.provider, r.model);
      if (dep) warnings.push(`routing.${role}: ${r.provider}/${r.model} is scheduled for provider shutdown on ${dep} — pick a replacement in Settings.`);
    }
  }
  if (!Number.isInteger(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
    warnings.push(`port: ${cfg.port} is not a valid TCP port (1–65535).`);
  }
  for (const [id, p] of Object.entries(cfg.customProviders || {})) {
    if (!/^[a-z0-9_-]{2,32}$/.test(id)) warnings.push(`customProviders."${id}": id must be 2–32 chars of a-z 0-9 _ -.`);
    if (!p || !/^https:\/\//.test(p.endpoint || '')) warnings.push(`customProviders."${id}": endpoint must be an https:// URL.`);
  }
  return warnings;
}

function addKey(provider, key, weight) {
  const s = getSecrets();
  if (!s.providers[provider]) s.providers[provider] = [];
  s.providers[provider].push({ key: key.trim(), weight: weight || 1 });
  return vault.saveSecrets(s);
}

function removeKey(provider, index) {
  const s = getSecrets();
  if (s.providers[provider]) s.providers[provider].splice(index, 1);
  return vault.saveSecrets(s);
}

module.exports = { load, save, PROVIDERS, getProviders, DEFAULT_CONFIG, getKeys, addKey, removeKey, validate, CONFIG_PATH };
