// Policy-as-Code: loads governance/AGENTS.policy.json and evaluates every
// command and write path against tiered execution authority
// (Tier 1 autonomous / Tier 2 conditional / Tier 3 blocked), per the
// VibeCode Constitution (AGENTS.md).
'use strict';
const fs = require('fs');
const { POLICY_PATH } = require('./paths');

// Built-in floor: even if the policy file is deleted, these stay blocked.
const HARD_BLOCKED = [
  /\bformat(\s|-volume)/i,
  /\brm\s+(-rf?|--recursive)\s+([a-z]:)?[\\\/]\s*$/i,
  /remove-item\s+.*-recurse.*\s+([a-z]:)?[\\\/]\s*($|\s)/i,
  /\bshutdown\b/i, /\bdiskpart\b/i, /vssadmin\s+delete/i
];

let cache = null;
let cacheMtime = 0;

function toRx(list) {
  return (list || []).map(p => { try { return new RegExp(p, 'i'); } catch { return null; } }).filter(Boolean);
}

// Regexes are compiled once per policy-file version (mtime-keyed), not on
// every tool-call evaluation as before.
function compile(p) {
  p._compiled = {
    blockedCommands: toRx(p.tiers?.blocked?.commands),
    conditionalCommands: toRx(p.tiers?.conditional?.commands),
    blockedPaths: toRx(p.tiers?.blocked?.paths),
    conditionalPaths: toRx(p.tiers?.conditional?.paths)
  };
  return p;
}

function loadPolicy() {
  try {
    const st = fs.statSync(POLICY_PATH);
    if (cache && st.mtimeMs === cacheMtime) return cache;
    cache = compile(JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8')));
    cacheMtime = st.mtimeMs;
  } catch {
    cache = compile({ tiers: { blocked: { commands: [], paths: [] }, conditional: { commands: [], paths: [] } } });
  }
  return cache;
}

/** Evaluate a shell command. Returns { tier, rule } */
function evaluateCommand(cmd) {
  for (const rx of HARD_BLOCKED) if (rx.test(cmd)) return { tier: 'blocked', rule: `builtin:${rx.source}` };
  const c = loadPolicy()._compiled;
  for (const rx of c.blockedCommands) if (rx.test(cmd)) return { tier: 'blocked', rule: rx.source };
  for (const rx of c.conditionalCommands) if (rx.test(cmd)) return { tier: 'conditional', rule: rx.source };
  return { tier: 'autonomous', rule: null };
}

/** Evaluate a workspace-relative write path. Returns { tier, rule } */
function evaluatePath(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  const c = loadPolicy()._compiled;
  for (const rx of c.blockedPaths) if (rx.test(norm)) return { tier: 'blocked', rule: rx.source };
  for (const rx of c.conditionalPaths) if (rx.test(norm)) return { tier: 'conditional', rule: rx.source };
  return { tier: 'autonomous', rule: null };
}

module.exports = { evaluateCommand, evaluatePath, loadPolicy };
