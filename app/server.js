// Purple Squirrel — VibeCode Command Center server.
// Zero-dependency Node.js: static UI + JSON API + SSE agent stream.
// Security: loopback bind, Host allowlist (DNS-rebinding defense), Origin
// check on mutating requests (CSRF defense), secrets in a DPAPI vault,
// no telemetry, no external calls except the LLM providers you configure.
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const configStore = require('./lib/config');
const keypool = require('./lib/keypool');
const trace = require('./lib/trace');
const vault = require('./lib/vault');
const agora = require('./lib/agora');
const sandbox = require('./lib/sandbox');
const sessionStore = require('./lib/sessions');
const { runAgent } = require('./lib/agent');
const { walk } = require('./lib/walker');
const { resolveInWorkspace } = require('./lib/tools');

let config = configStore.load();
const PORT = config.port || 4477;
const approvals = new Map();
const auditLog = [];
const sessions = new Map();

const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]);
const ALLOWED_ORIGINS = new Set([`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`, `http://[::1]:${PORT}`]);

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 20_000_000) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

// Server boot identity: lets the UI (and diagnosers) detect a stale server
// process still running pre-fix code — the failure mode behind the 2026-07-11
// empty-chat incident, where fixed files sat on disk under a stale process.
const BOOT = { startedAt: new Date().toISOString(), pid: process.pid, node: process.version };

// Public view of config: provider registry + key status, never raw keys.
function publicConfig() {
  const c = structuredClone(config);
  c.server = { ...BOOT };
  c.providers = {};
  for (const [name, meta] of Object.entries(configStore.getProviders(config))) {
    const keys = configStore.getKeys(name);
    c.providers[name] = {
      label: meta.label,
      docs: meta.docs,
      consentRequired: !!meta.consentRequired,
      custom: !!meta.custom,
      keys: keys.map(k => ({ masked: k.key.slice(0, 6) + '…' + k.key.slice(-4), weight: k.weight || 1 })),
      keyStatus: keypool.status(name, keys)
    };
  }
  c.vault = vault.vaultStatus();
  c.sandbox = { available: sandbox.isAvailable(), enabled: !!(config.settings.sandbox && config.settings.sandbox.enabled) };
  return c;
}

const server = http.createServer(async (req, res) => {
  // --- Security boundary ---
  const remote = req.socket.remoteAddress || '';
  if (!/^(::1|127\.|::ffff:127\.)/.test(remote)) { res.writeHead(403); return res.end('Local access only'); }
  if (req.headers.host && !ALLOWED_HOSTS.has(req.headers.host)) { res.writeHead(403); return res.end('Bad Host header'); }
  if (req.method !== 'GET' && req.headers.origin && !ALLOWED_ORIGINS.has(req.headers.origin)) {
    res.writeHead(403); return res.end('Cross-origin requests are not allowed');
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    // ---------- API ----------
    if (url.pathname === '/api/config' && req.method === 'GET') return json(res, 200, publicConfig());

    if (url.pathname === '/api/config' && req.method === 'POST') {
      const body = await readBody(req);
      if (body.settings) config.settings = { ...config.settings, ...body.settings, yolo: { ...config.settings.yolo, ...(body.settings.yolo || {}) } };
      if (body.routing) config.routing = { ...config.routing, ...body.routing };
      configStore.save(config);
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/keys' && req.method === 'POST') {
      const { provider, key, weight, remove } = await readBody(req);
      if (!configStore.getProviders(config)[provider]) return json(res, 400, { error: 'Unknown provider' });
      let encrypted;
      if (remove !== undefined) encrypted = configStore.removeKey(provider, remove);
      else if (key) encrypted = configStore.addKey(provider, key, weight || 1);
      else return json(res, 400, { error: 'No key provided' });
      return json(res, 200, { ok: true, encrypted });
    }

    if (url.pathname === '/api/project/open' && req.method === 'POST') {
      const { dir } = await readBody(req);
      const full = path.resolve(dir || '');
      if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) return json(res, 400, { error: 'Directory not found: ' + full });
      config.recentProjects = [full, ...config.recentProjects.filter(d => d !== full)].slice(0, 10);
      configStore.save(config);
      trace.span({ kind: 'system', name: 'project_open', project: full });
      return json(res, 200, { ok: true, dir: full, tree: walk(full, { maxEntries: 3000 }) });
    }

    if (url.pathname === '/api/project/tree' && req.method === 'GET') {
      const dir = url.searchParams.get('dir');
      if (!dir || !fs.existsSync(dir)) return json(res, 400, { error: 'Bad dir' });
      return json(res, 200, { tree: walk(dir, { maxEntries: 3000 }) });
    }

    // Directory browser for the folder picker. Read-only: returns subdirectory
    // names only (never file contents). Loopback + Origin-checked above; this is
    // the single local user browsing their own filesystem.
    if (url.pathname === '/api/fs/list' && req.method === 'GET') {
      const dir = url.searchParams.get('dir') || '';
      try {
        if (!dir) {
          const drives = [];
          for (let c = 67; c <= 90; c++) { // C..Z (skip A/B floppy letters)
            const root = String.fromCharCode(c) + ':\\';
            try { if (fs.statSync(root).isDirectory()) drives.push({ name: root, path: root }); } catch { /* no such drive */ }
          }
          return json(res, 200, { path: '', parent: null, dirs: drives });
        }
        const full = path.resolve(dir);
        if (!fs.statSync(full).isDirectory()) return json(res, 400, { error: 'Not a directory' });
        const dirs = fs.readdirSync(full, { withFileTypes: true })
          .filter(e => { try { return e.isDirectory(); } catch { return false; } })
          .filter(e => !e.name.startsWith('$'))
          .slice(0, 1000)
          .map(e => ({ name: e.name, path: path.join(full, e.name) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        const parent = path.dirname(full);
        return json(res, 200, { path: full, parent: parent === full ? '' : parent, dirs });
      } catch (e) { return json(res, 400, { error: e.message }); }
    }

    if (url.pathname === '/api/project/file' && req.method === 'GET') {
      const dir = url.searchParams.get('dir'), file = url.searchParams.get('file');
      const full = resolveInWorkspace(dir, file);
      const text = fs.readFileSync(full, 'utf8');
      return json(res, 200, { content: text.slice(0, 500000) });
    }

    if (url.pathname === '/api/approve' && req.method === 'POST') {
      const { id, approved } = await readBody(req);
      const resolve = approvals.get(id);
      if (resolve) {
        approvals.delete(id);
        trace.span({ kind: 'approval', name: 'human_gate', status: approved ? 'approved' : 'rejected' });
        resolve(!!approved);
        return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'Approval not found or expired' });
    }

    if (url.pathname === '/api/audit' && req.method === 'GET') return json(res, 200, { audit: auditLog.slice(-500) });

    if (url.pathname === '/api/trace' && req.method === 'GET') {
      return json(res, 200, {
        spans: trace.query({
          limit: parseInt(url.searchParams.get('limit'), 10) || 300,
          kind: url.searchParams.get('kind') || null,
          sessionId: url.searchParams.get('session') || null
        })
      });
    }

    if (url.pathname === '/api/trace/handoff' && req.method === 'GET') {
      return json(res, 200, { markdown: trace.readHandoff() });
    }

    if (url.pathname === '/api/usage' && req.method === 'GET') return json(res, 200, trace.usageSummary());

    if (url.pathname === '/api/budget' && req.method === 'GET') return json(res, 200, { keys: trace.budgetByKey() });

    if (url.pathname === '/api/sessions' && req.method === 'GET') return json(res, 200, { sessions: sessionStore.list() });

    if (url.pathname === '/api/agora' && req.method === 'GET') {
      const dir = url.searchParams.get('dir');
      if (!dir || !fs.existsSync(dir)) return json(res, 400, { error: 'Bad dir' });
      return json(res, 200, agora.read(dir, parseInt(url.searchParams.get('limit'), 10) || 50));
    }

    if (url.pathname === '/api/agora' && req.method === 'POST') {
      const { dir, type, title, body, replyTo } = await readBody(req);
      if (!dir || !fs.existsSync(dir)) return json(res, 400, { error: 'Open a project first.' });
      const id = agora.post(dir, { author: 'Human Operator', identity: 'human', type, title, body, replyTo });
      trace.span({ kind: 'system', name: 'agora_post', target: title, why: 'human posted to the board' });
      return json(res, 200, { ok: true, id });
    }

    if (url.pathname === '/api/providers/custom' && req.method === 'POST') {
      const { id, label, endpoint, maxInputTokens, remove } = await readBody(req);
      if (remove) {
        delete config.customProviders[remove];
      } else {
        if (!id || !/^[a-z0-9_-]{2,32}$/.test(id)) return json(res, 400, { error: 'Provider id must be 2-32 chars: a-z 0-9 _ -' });
        if (configStore.PROVIDERS[id]) return json(res, 400, { error: 'That id is a built-in provider' });
        if (!/^https:\/\//.test(endpoint || '')) return json(res, 400, { error: 'Endpoint must be an https:// chat-completions URL' });
        config.customProviders[id] = { label: (label || id).slice(0, 60), endpoint, ...(maxInputTokens ? { maxInputTokens: +maxInputTokens } : {}) };
      }
      configStore.save(config);
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/chat' && req.method === 'POST') {
      const { sessionId, dir, message, reset } = await readBody(req);
      if (!dir || !fs.existsSync(dir)) return json(res, 400, { error: 'Open a project directory first.' });
      const sid = sessionId || 'default';
      if (reset) sessions.set(sid, { history: [] });
      else if (!sessions.has(sid)) sessions.set(sid, sessionStore.load(sid) || { history: [] });
      const session = sessions.get(sid);

      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
      const emit = (ev) => { try { res.write(`data: ${JSON.stringify(ev)}\n\n`); } catch { /* client gone */ } };
      const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 15000);

      try {
        const newHistory = await runAgent({ root: dir, config, history: session.history, userMessage: message, sessionId: sid, emit, approvals, auditLog });
        session.history = newHistory.slice(-30);
        sessionStore.save(sid, session);
      } catch (e) {
        emit({ type: 'error', message: e.message });
        emit({ type: 'done' });
      }
      clearInterval(ping);
      return res.end();
    }

    // ---------- Static ----------
    let file = url.pathname === '/' ? '/index.html' : url.pathname;
    const full = path.join(PUBLIC_DIR, path.normalize(file));
    if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      // no-cache: the UI is tiny and local; stale cached app.js after a code
      // update silently masks fixes (root-caused during the 2026-07-11 empty
      // chat incident). Revalidation costs ~nothing on loopback.
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
      return fs.createReadStream(full).pipe(res);
    }
    res.writeHead(404); res.end('Not found');
  } catch (e) {
    try { json(res, 500, { error: e.message }); } catch { /* headers sent */ }
  }
});

// Pre-flight hardware safety check: the target is an 8 GB unified-memory ARM64
// laptop, so agentic execution under memory pressure risks host OOM instability.
const LOW_MEM_THRESHOLD = 2 * 1024 * 1024 * 1024; // 2 GB

server.listen(PORT, '127.0.0.1', () => {
  const v = vault.vaultStatus();
  console.log(`\n  🐿  Purple Squirrel — VibeCode Command Center`);
  console.log(`  →  http://localhost:${PORT}`);
  console.log(`  →  secrets vault: ${v.exists ? (v.encrypted ? 'DPAPI-encrypted' : 'PLAINTEXT (DPAPI unavailable)') : 'not created yet'}\n`);
  const freeMem = os.freemem();
  if (freeMem < LOW_MEM_THRESHOLD) {
    // ANSI yellow — stands out without failing startup.
    console.log(`\x1b[33m  ⚠  Low Memory Warning: Less than 2GB RAM available (${(freeMem / (1024 ** 3)).toFixed(2)} GB free). Agentic execution may cause system instability.\x1b[0m\n`);
  }
  for (const w of configStore.validate(config)) {
    console.log(`\x1b[33m  ⚠  Config: ${w}\x1b[0m`);
  }
});
