// Session persistence (Mistral suggestion #6, lean): conversation history
// survives server restarts. One JSON file per session under data/sessions/.
'use strict';
const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./paths');

const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
fs.mkdirSync(SESSIONS_DIR, { recursive: true });

const MAX_SESSIONS = 50;

function fileFor(sid) {
  const safe = String(sid).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return path.join(SESSIONS_DIR, `${safe}.json`);
}

function save(sid, session) {
  try {
    const out = { id: sid, updated: new Date().toISOString(), history: (session.history || []).slice(-30) };
    const tmp = fileFor(sid) + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(out));
    fs.renameSync(tmp, fileFor(sid));
    prune();
  } catch (e) { console.error('[sessions] save failed:', e.message); }
}

function load(sid) {
  try {
    const s = JSON.parse(fs.readFileSync(fileFor(sid), 'utf8'));
    return { history: Array.isArray(s.history) ? s.history : [] };
  } catch { return null; }
}

function list() {
  try {
    return fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const s = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf8'));
          return { id: s.id, updated: s.updated, messages: (s.history || []).length };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  } catch { return []; }
}

// Keep only the most recent MAX_SESSIONS files (eUFS hygiene).
function prune() {
  try {
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'))
      .map(f => ({ f, m: fs.statSync(path.join(SESSIONS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    for (const { f } of files.slice(MAX_SESSIONS)) fs.unlinkSync(path.join(SESSIONS_DIR, f));
  } catch { /* non-fatal */ }
}

module.exports = { save, load, list };
