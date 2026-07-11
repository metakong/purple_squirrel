// Canonical repository paths (Sovereign Agent Repository layout).
// All user data lives under data/ (gitignored); volatile agent state under
// .agent/run/ (gitignored); machine-enforceable policy under governance/.
'use strict';
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(REPO_ROOT, 'data');
const TRACE_DIR = path.join(DATA_DIR, 'traces');
const RUN_DIR = path.join(REPO_ROOT, '.agent', 'run');
const GOVERNANCE_DIR = path.join(REPO_ROOT, 'governance');

for (const d of [DATA_DIR, TRACE_DIR, RUN_DIR]) fs.mkdirSync(d, { recursive: true });

module.exports = {
  REPO_ROOT,
  DATA_DIR,
  TRACE_DIR,
  RUN_DIR,
  GOVERNANCE_DIR,
  CONFIG_PATH: path.join(DATA_DIR, 'config.json'),
  VAULT_PATH: path.join(DATA_DIR, 'secrets.vault'),
  HEARTBEAT_PATH: path.join(RUN_DIR, 'HEARTBEAT.json'),
  HANDOFF_PATH: path.join(RUN_DIR, 'HANDOFF.md'),
  POLICY_PATH: path.join(GOVERNANCE_DIR, 'AGENTS.policy.json')
};
