// Vibe Trace — the evolved vibe-logger. Append-only JSONL spans using
// OpenTelemetry GenAI semantic-convention attribute names (gen_ai.*), one
// file per day under data/traces/. Append-only writes are cheap on eUFS
// (the original vibe-logger experiment rewrote its whole log per entry).
// Every span carries the agent's stated "why" so future agents and humans
// can reconstruct recent reasoning without replaying the session.
'use strict';
const fs = require('fs');
const path = require('path');
const { TRACE_DIR, HANDOFF_PATH } = require('./paths');

let enabled = true;
function setEnabled(v) { enabled = !!v; }

function traceFile(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  return path.join(TRACE_DIR, `${d}.jsonl`);
}

/**
 * Record one span. Common fields:
 *  kind: 'agent_turn' | 'llm_call' | 'tool_call' | 'approval' | 'system'
 *  name, sessionId, why (the reasoning), status ('ok'|'error'|'blocked'|'rejected')
 *  plus flattened OTel GenAI attrs like 'gen_ai.request.model',
 *  'gen_ai.usage.input_tokens', 'gen_ai.usage.output_tokens'.
 */
function span(entry) {
  if (!enabled) return;
  const rec = { ts: Date.now(), iso: new Date().toISOString(), ...entry };
  try { fs.appendFileSync(traceFile(), JSON.stringify(rec) + '\n'); } catch { /* tracing must never break the app */ }
}

/** Read recent spans (today + yesterday), newest last. */
function query({ limit = 300, kind = null, sessionId = null } = {}) {
  const days = [new Date(Date.now() - 86400000).toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)];
  let out = [];
  for (const d of days) {
    let raw;
    try { raw = fs.readFileSync(traceFile(d), 'utf8'); } catch { continue; }
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line);
        if (kind && rec.kind !== kind) continue;
        if (sessionId && rec.sessionId !== sessionId) continue;
        out.push(rec);
      } catch { /* skip corrupt line */ }
    }
  }
  return out.slice(-limit);
}

/** Aggregate token usage, latency, and reliability for the HUD + analytics. */
function usageSummary() {
  const spans = query({ limit: 5000 });
  const sum = { inputTokens: 0, outputTokens: 0, llmCalls: 0, toolCalls: 0, turns: 0, errors: 0, byModel: {} };
  for (const s of spans) {
    if (s.kind === 'llm_call') {
      sum.llmCalls++;
      sum.inputTokens += s['gen_ai.usage.input_tokens'] || 0;
      sum.outputTokens += s['gen_ai.usage.output_tokens'] || 0;
      const m = s['gen_ai.request.model'] || 'unknown';
      if (!sum.byModel[m]) sum.byModel[m] = { calls: 0, in: 0, out: 0, ok: 0, rateLimited: 0, errors: 0, latSum: 0 };
      const bm = sum.byModel[m];
      bm.calls++;
      bm.in += s['gen_ai.usage.input_tokens'] || 0;
      bm.out += s['gen_ai.usage.output_tokens'] || 0;
      bm.latSum += s.latencyMs || 0;
      if (s.status === 'ok') bm.ok++;
      else if (s.status === 'rate_limited') bm.rateLimited++;
      else { bm.errors++; sum.errors++; }
    }
    if (s.kind === 'tool_call') { sum.toolCalls++; if (s.status === 'error') sum.errors++; }
    if (s.kind === 'agent_turn' && s.phase === 'start') sum.turns++;
  }
  for (const bm of Object.values(sum.byModel)) {
    bm.successPct = bm.calls ? Math.round((bm.ok / bm.calls) * 100) : 0;
    bm.avgLatencyMs = bm.calls ? Math.round(bm.latSum / bm.calls) : 0;
    delete bm.latSum;
  }
  return sum;
}

/**
 * Per-provider, per-key usage ledger for *today*, derived purely from our own
 * llm_call spans (no external calls). Feeds the free-tier budget view the human
 * asked for. Pass a spans array to test in isolation; defaults to today+yesterday.
 * Returns rows sorted by provider then key index.
 */
function budgetByKey(spans) {
  const rows = spans || query({ limit: 5000 });
  const today = new Date().toISOString().slice(0, 10);
  const out = {};
  for (const s of rows) {
    if (s.kind !== 'llm_call') continue;
    if (!s.iso || s.iso.slice(0, 10) !== today) continue;
    const provider = s.provider || 'unknown';
    const keyIndex = Number.isInteger(s.keyIndex) ? s.keyIndex : 0;
    const k = `${provider}#${keyIndex}`;
    if (!out[k]) out[k] = { provider, keyIndex, requests: 0, inputTokens: 0, outputTokens: 0, rateLimited: 0, errors: 0 };
    const r = out[k];
    r.requests++;
    r.inputTokens += s['gen_ai.usage.input_tokens'] || 0;
    r.outputTokens += s['gen_ai.usage.output_tokens'] || 0;
    if (s.status === 'rate_limited') r.rateLimited++;
    else if (s.status === 'error') r.errors++;
  }
  return Object.values(out).sort((a, b) => a.provider.localeCompare(b.provider) || a.keyIndex - b.keyIndex);
}

/**
 * Write the human/agent handoff digest (.agent/run/HANDOFF.md): a compact
 * markdown summary of the most recent actions and their reasoning, so any
 * newly arriving agent (or human) can catch up in one read.
 */
function writeHandoff() {
  const spans = query({ limit: 2000 });
  const turns = [];
  let current = null;
  for (const s of spans) {
    if (s.kind === 'agent_turn' && s.phase === 'start') {
      current = { start: s, actions: [], end: null };
      turns.push(current);
    } else if (s.kind === 'agent_turn' && s.phase === 'end' && current) {
      current.end = s;
    } else if (current && (s.kind === 'tool_call' || s.kind === 'approval')) {
      current.actions.push(s);
    }
  }
  const recent = turns.slice(-8);
  const lines = [
    '# Session Handoff Digest',
    '',
    `_Auto-generated by Vibe Trace at ${new Date().toISOString()}. Read this to catch up on recent agent activity; full spans in \`data/traces/\`._`,
    ''
  ];
  for (const t of recent) {
    lines.push(`## ${t.start.iso} — ${t.start.project || 'unknown project'}`);
    lines.push(`**Goal:** ${t.start.goal || '(not recorded)'}`);
    for (const a of t.actions.slice(0, 30)) {
      const why = a.why ? ` — _${a.why}_` : '';
      const flag = a.status === 'blocked' ? ' ⛔' : a.status === 'rejected' ? ' ✋' : a.status === 'error' ? ' ⚠' : '';
      lines.push(`- \`${a.name}\` ${a.target || ''}${flag}${why}`);
    }
    if (t.end) lines.push(`**Outcome:** ${t.end.outcome || t.end.status || 'completed'}`);
    lines.push('');
  }
  try { fs.writeFileSync(HANDOFF_PATH, lines.join('\n')); } catch { /* non-fatal */ }
}

function readHandoff() {
  try { return fs.readFileSync(HANDOFF_PATH, 'utf8'); } catch { return '# Session Handoff Digest\n\n_No sessions traced yet._'; }
}

module.exports = { span, query, usageSummary, budgetByKey, writeHandoff, readHandoff, setEnabled };
