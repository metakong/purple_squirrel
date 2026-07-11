// Standardized Agentic Heartbeat Protocol: a volatile session lock at
// .agent/run/HEARTBEAT.json (gitignored per the Gemini critique) so parallel
// agents/tools can detect an active session and avoid write races.
'use strict';
const fs = require('fs');
const { HEARTBEAT_PATH } = require('./paths');

const STALE_MS = 120000; // a heartbeat older than 2 minutes is considered dead

function write(status, info = {}) {
  const hb = {
    $schema: 'https://aaif.io/schemas/v1/heartbeat.schema.json',
    sessionId: info.sessionId || 'unknown',
    orchestrator: 'com.purple-squirrel.vibecode',
    pid: process.pid,
    timestamp: new Date().toISOString(),
    status, // 'working' | 'awaiting-approval' | 'idle'
    activeAgents: [{
      agentId: `vibecode-${process.pid}`,
      role: 'contributor',
      pid: process.pid,
      stateLane: info.project || null,
      exclusiveLocks: info.locks || [],
      lastActive: new Date().toISOString()
    }]
  };
  try {
    const tmp = HEARTBEAT_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(hb, null, 2));
    fs.renameSync(tmp, HEARTBEAT_PATH);
  } catch { /* non-fatal */ }
}

/** Returns info about a live foreign session lock, or null. */
function foreignLock() {
  try {
    const hb = JSON.parse(fs.readFileSync(HEARTBEAT_PATH, 'utf8'));
    if (hb.pid === process.pid) return null;
    const age = Date.now() - new Date(hb.timestamp).getTime();
    if (age > STALE_MS) return null; // stale lock from a dead process
    if (hb.status === 'idle') return null;
    return hb;
  } catch { return null; }
}

function clear(sessionId) { write('idle', { sessionId }); }

module.exports = { write, foreignLock, clear };
