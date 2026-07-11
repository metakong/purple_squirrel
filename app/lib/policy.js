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

function loadPolicy() {
  try {
    const st = fs.statSync(POLICY_PATH);
    if (cache && st.mtimeMs === cacheMtime) return cache;
    cache = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
    cacheMtime = st.mtimeMs;
  } catch {
    cache = { tiers: { blocked: { commands: [], paths: [] }, conditional: { commands: [], paths: [] } } };
  }
  return cache;
}

function toRx(list) {
  return (list || []).map(p => { try { return new RegExp(p, 'i'); } catch { return null; } }).filter(Boolean);
}

/** Evaluate a shell command. Returns { tier, rule } */
function evaluateCommand(cmd) {
  for (const rx of HARD_BLOCKED) if (rx.test(cmd)) return { tier: 'blocked', rule: `builtin:${rx.source}` };
  const p = loadPolicy();
  for (const rx of toRx(p.tiers?.blocked?.commands)) if (rx.test(cmd)) return { tier: 'blocked', rule: rx.source };
  for (const rx of toRx(p.tiers?.conditional?.commands)) if (rx.test(cmd)) return { tier: 'conditional', rule: rx.source };
  return { tier: 'autonomous', rule: null };
}

/** Evaluate a workspace-relative write path. Returns { tier, rule } */
function evaluatePath(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  const p = loadPolicy();
  for (const rx of toRx(p.tiers?.blocked?.paths)) if (rx.test(norm)) return { tier: 'blocked', rule: rx.source };
  for (const rx of toRx(p.tiers?.conditional?.paths)) if (rx.test(norm)) return { tier: 'conditional', rule: rx.source };
  return { tier: 'autonomous', rule: null };
}

module.exports = { evaluateCommand, evaluatePath, loadPolicy };
