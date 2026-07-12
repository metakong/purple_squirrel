'use strict';
const $ = (s) => document.querySelector(s);
let CONFIG = null;
let PROJECT_DIR = null;
let TREE = [];
let BUDGET = []; // per-key usage today, from /api/budget
let CATALOG_UI = null;    // /api/catalog → { provider: [model entries] }
let ROUTE_OVERRIDE = null; // session-scoped manual route from the chat picker
let SESSION_ID = 'ui-' + Math.random().toString(36).slice(2);

/* ---------- helpers ---------- */
async function api(path, opts) {
  const res = await fetch(path, opts ? { headers: { 'Content-Type': 'application/json' }, ...opts } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
function toast(text, cls = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + cls;
  t.textContent = text;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 3800);
}
function addMsg(cls, text) {
  const d = document.createElement('div');
  d.className = 'msg ' + cls;
  d.textContent = text;
  $('#chatLog').appendChild(d);
  $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
  return d;
}
let typingEl = null;
function showTyping(on) {
  if (on && !typingEl) {
    typingEl = document.createElement('div');
    typingEl.className = 'typing';
    typingEl.innerHTML = '<i></i><i></i><i></i>';
    $('#chatLog').appendChild(typingEl);
    $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
  } else if (!on && typingEl) { typingEl.remove(); typingEl = null; }
}
function switchTab(name) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-body').forEach(t => t.classList.toggle('hidden', t.id !== 'tab-' + name));
  if (name === 'keys') renderKeyStatus();
  if (name === 'audit') renderAudit();
  if (name === 'trace') renderTrace();
  if (name === 'agora') renderAgora();
}
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

function showDiff(diff) {
  const v = $('#viewer');
  v.classList.remove('dim');
  v.innerHTML = '';
  for (const line of diff.split('\n')) {
    const span = document.createElement('span');
    span.textContent = line + '\n';
    if (line.startsWith('+') && !line.startsWith('+++')) span.className = 'add';
    else if (line.startsWith('-') && !line.startsWith('---')) span.className = 'del';
    else if (line.startsWith('@@')) span.className = 'hunk';
    v.appendChild(span);
  }
  switchTab('viewer');
}

/* ---------- config / settings ---------- */
async function loadConfig() {
  CONFIG = await api('/api/config');
  $('#qYoloEdits').checked = CONFIG.settings.yolo.autoApproveEdits;
  $('#qYoloCmds').checked = CONFIG.settings.yolo.autoRunCommands;
  $('#qGuardrails').checked = CONFIG.settings.yolo.guardrails;
  const v = CONFIG.vault || {};
  const vb = $('#vaultBadge');
  vb.textContent = v.encrypted ? '🔒 vault' : (v.exists ? '⚠ vault plaintext' : '🔓 vault empty');
  vb.classList.toggle('good', !!v.encrypted);
  // Boot identity tooltip: hover the vault badge to confirm the server process
  // is fresh (a stale process silently runs pre-fix code after updates).
  if (CONFIG.server) vb.title = `server pid ${CONFIG.server.pid} · up since ${new Date(CONFIG.server.startedAt).toLocaleString()} · node ${CONFIG.server.node}`;
  const dl = $('#recentDirs'); dl.innerHTML = '';
  for (const d of CONFIG.recentProjects) { const o = document.createElement('option'); o.value = d; dl.appendChild(o); }
  if (!PROJECT_DIR && CONFIG.recentProjects[0]) $('#projectDir').value = CONFIG.recentProjects[0];
}
async function refreshUsage() {
  try {
    const u = await api('/api/usage');
    $('#usageBadge').textContent = `◈ ${fmtK(u.inputTokens)} ▸ ${fmtK(u.outputTokens)} · ${u.llmCalls} calls`;
    $('#usageBadge').classList.add('accent');
  } catch { /* ignore */ }
}
function fmtK(n) { return n > 9999 ? (n / 1000).toFixed(1) + 'k' : String(n || 0); }

/* ---------- model catalog (friction-free pickers) ---------- */
async function loadCatalog() {
  if (!CATALOG_UI) { try { CATALOG_UI = (await api('/api/catalog')).providers || {}; } catch { CATALOG_UI = {}; } }
  return CATALOG_UI;
}
// Populate a routing model <select> from the catalog for `provider`, keeping
// the currently configured model selectable even if it left the catalog, and
// always offering a "Custom…" escape hatch (the only place typing remains).
function fillModelSelect(selectEl, customEl, provider, currentModel) {
  const models = (CATALOG_UI && CATALOG_UI[provider]) || [];
  selectEl.innerHTML = '';
  let found = false;
  for (const m of models) {
    const o = document.createElement('option');
    o.value = m.value;
    o.textContent = `${m.label}  ·  ${m.value}${m.deprecatedSoon ? '  ⚠ deprecating' : ''}`;
    o.title = [m.note, m.deprecated ? `Provider shutdown ${m.deprecated}` : ''].filter(Boolean).join(' — ');
    if (m.value === currentModel) { o.selected = true; found = true; }
    selectEl.appendChild(o);
  }
  if (currentModel && !found) {
    const o = document.createElement('option');
    o.value = currentModel; o.textContent = `${currentModel}  (current)`; o.selected = true;
    selectEl.appendChild(o);
  }
  const custom = document.createElement('option');
  custom.value = '__custom__'; custom.textContent = '✏️ Custom model id…';
  selectEl.appendChild(custom);
  if (!models.length && !currentModel) custom.selected = true;
  syncCustomInput(selectEl, customEl);
}
function syncCustomInput(selectEl, customEl) {
  customEl.classList.toggle('hidden', selectEl.value !== '__custom__');
}
function modelValue(selectEl, customEl) {
  return selectEl.value === '__custom__' ? customEl.value.trim() : selectEl.value;
}

async function fillSettingsDlg() {
  try { BUDGET = (await api('/api/budget')).keys || []; } catch { BUDGET = []; }
  await loadCatalog();
  const s = CONFIG.settings;
  $('#setAutoEdits').checked = s.yolo.autoApproveEdits;
  $('#setAutoCmds').checked = s.yolo.autoRunCommands;
  $('#setGuardrails').checked = s.yolo.guardrails;
  $('#setMistralConsent').checked = s.yolo.mistralConsent;
  $('#setOutline').checked = s.contextOutline;
  $('#setTrace').checked = s.traceEnabled !== false;
  $('#setAgora').checked = s.agoraEnforced !== false;
  $('#setSandbox').checked = !!(s.sandbox && s.sandbox.enabled);
  const sb = CONFIG.sandbox || {};
  $('#setSandbox').disabled = !sb.available;
  $('#sandboxNote').textContent = sb.available
    ? 'Route run_command through WSL (Linux bash) instead of host PowerShell'
    : 'Unavailable — no runnable WSL distro found. Run `wsl --install`, then reopen Settings.';
  $('#setMaxIter').value = s.maxIterations;
  $('#maxIterVal').textContent = s.maxIterations;
  renderCustomProviders();
  $('#vaultNote').textContent = CONFIG.vault && CONFIG.vault.encrypted ? '(encrypted at rest with Windows DPAPI)' : '(vault will be created on first key)';
  const provs = Object.keys(CONFIG.providers);
  for (const sel of ['#routePrimaryProvider', '#routeFallbackProvider', '#newKeyProvider']) {
    const el = $(sel); el.innerHTML = '';
    provs.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = CONFIG.providers[p].label; el.appendChild(o); });
  }
  const mode = (CONFIG.routing.mode || 'auto') === 'manual' ? 'manual' : 'auto';
  $('#modeAuto').checked = mode === 'auto';
  $('#modeManual').checked = mode === 'manual';
  $('#routePrimaryProvider').value = CONFIG.routing.primary.provider;
  $('#routeFallbackProvider').value = CONFIG.routing.fallback.provider;
  fillModelSelect($('#routePrimaryModel'), $('#routePrimaryCustom'), CONFIG.routing.primary.provider, CONFIG.routing.primary.model);
  fillModelSelect($('#routeFallbackModel'), $('#routeFallbackCustom'), CONFIG.routing.fallback.provider, CONFIG.routing.fallback.model);
  renderKeysEditor();
}
// Provider change re-fills its model dropdown; picking "Custom…" reveals the text input.
$('#routePrimaryProvider').onchange = () => fillModelSelect($('#routePrimaryModel'), $('#routePrimaryCustom'), $('#routePrimaryProvider').value, '');
$('#routeFallbackProvider').onchange = () => fillModelSelect($('#routeFallbackModel'), $('#routeFallbackCustom'), $('#routeFallbackProvider').value, '');
$('#routePrimaryModel').onchange = () => syncCustomInput($('#routePrimaryModel'), $('#routePrimaryCustom'));
$('#routeFallbackModel').onchange = () => syncCustomInput($('#routeFallbackModel'), $('#routeFallbackCustom'));
$('#setMaxIter').oninput = () => { $('#maxIterVal').textContent = $('#setMaxIter').value; };
function renderKeysEditor() {
  const box = $('#keysEditor'); box.innerHTML = '';
  for (const [name, p] of Object.entries(CONFIG.providers)) {
    if (!p.keys.length) continue;
    const div = document.createElement('div');
    div.className = 'keys-provider';
    div.innerHTML = `<b>${p.label}</b>`;
    p.keys.forEach((k, i) => {
      const row = document.createElement('div');
      row.className = 'key-item';
      const st = (p.keyStatus && p.keyStatus[i]) || {};
      const b = BUDGET.find(x => x.provider === name && x.keyIndex === i);
      const reqs = b ? b.requests : 0;
      const toks = b ? (b.inputTokens + b.outputTokens) : 0;
      const health = st.calls ? ` · ♥${st.healthPct}%` : '';
      const cool = st.cooled ? ` · cooldown ${st.resetInSec}s` : '';
      // Show used/limit when the provider's free-tier daily cap is known
      // (rpd = requests/day; tpd = tokens/day for Cerebras/Mistral).
      const ft = p.freeTier || {};
      const reqTxt = ft.rpd ? `${reqs}/${ft.rpd} req` : `${reqs} req`;
      const tokTxt = ft.tpd ? `${fmtK(toks)}/${fmtK(ft.tpd)} tok today` : `${fmtK(toks)} tok today`;
      const nearCap = (ft.rpd && reqs >= ft.rpd * 0.9) || (ft.tpd && toks >= ft.tpd * 0.9);
      row.innerHTML = `<span>${k.masked}</span><span class="${nearCap ? 'key-cool' : 'dim'}">w=${k.weight} · ${reqTxt} · ${tokTxt}${health}${cool}${nearCap ? ' · ⚠ near daily cap' : ''}</span>`;
      const del = document.createElement('button');
      del.textContent = '✕'; del.className = 'mini-btn';
      del.onclick = async () => { await api('/api/keys', { method: 'POST', body: JSON.stringify({ provider: name, remove: i }) }); await loadConfig(); fillSettingsDlg(); toast('Key removed'); };
      row.appendChild(del);
      div.appendChild(row);
    });
    box.appendChild(div);
  }
  if (!box.children.length) box.innerHTML = '<em class="dim">No keys yet — add free-tier keys below. Get them free: OpenRouter, Google AI Studio, Groq, Cerebras…</em>';
}
$('#settingsBtn').onclick = async () => { await fillSettingsDlg(); $('#settingsDlg').showModal(); };
$('#closeSettingsBtn').onclick = () => $('#settingsDlg').close();
$('#settingsX').onclick = () => $('#settingsDlg').close();
$('#addKeyBtn').onclick = async () => {
  const key = $('#newKeyValue').value.trim();
  if (!key) return;
  const r = await api('/api/keys', { method: 'POST', body: JSON.stringify({ provider: $('#newKeyProvider').value, key, weight: +$('#newKeyWeight').value || 1 }) });
  $('#newKeyValue').value = '';
  await loadConfig(); fillSettingsDlg();
  toast(r.encrypted ? 'Key stored in DPAPI-encrypted vault 🔒' : 'Key stored (plaintext fallback — DPAPI unavailable)', r.encrypted ? 'ok' : 'err');
};
$('#saveSettingsBtn').onclick = async () => {
  const primaryModel = modelValue($('#routePrimaryModel'), $('#routePrimaryCustom'));
  const fallbackModel = modelValue($('#routeFallbackModel'), $('#routeFallbackCustom'));
  if (!primaryModel || !fallbackModel) { toast('Pick a model for both routes (or fill in the custom id).', 'err'); return; }
  await api('/api/config', { method: 'POST', body: JSON.stringify({
    settings: {
      yolo: {
        autoApproveEdits: $('#setAutoEdits').checked,
        autoRunCommands: $('#setAutoCmds').checked,
        guardrails: $('#setGuardrails').checked,
        mistralConsent: $('#setMistralConsent').checked
      },
      contextOutline: $('#setOutline').checked,
      traceEnabled: $('#setTrace').checked,
      agoraEnforced: $('#setAgora').checked,
      sandbox: { enabled: $('#setSandbox').checked },
      maxIterations: +$('#setMaxIter').value || 25
    },
    routing: {
      mode: $('#modeManual').checked ? 'manual' : 'auto',
      primary: { provider: $('#routePrimaryProvider').value, model: primaryModel },
      fallback: { provider: $('#routeFallbackProvider').value, model: fallbackModel }
    }
  }) });
  await loadConfig();
  $('#settingsDlg').close();
  toast('Settings saved', 'ok');
};
// live header switches
for (const [id, key] of [['#qYoloEdits', 'autoApproveEdits'], ['#qYoloCmds', 'autoRunCommands'], ['#qGuardrails', 'guardrails']]) {
  $(id).onchange = async (e) => {
    await api('/api/config', { method: 'POST', body: JSON.stringify({ settings: { yolo: { [key]: e.target.checked } } }) });
    await loadConfig();
    toast(`${key} ${e.target.checked ? 'ON' : 'OFF'}`);
  };
}

/* ---------- project & file tree ---------- */
$('#openBtn').onclick = openProject;

/* ---------- folder picker ---------- */
let FS_CUR = ''; // current browse path ('' = drive list)
async function fsBrowse(dir) {
  try {
    const data = await api(`/api/fs/list?dir=${encodeURIComponent(dir || '')}`);
    FS_CUR = data.path || '';
    $('#fsPath').textContent = FS_CUR || 'This PC — pick a drive';
    $('#fsUpBtn').disabled = data.parent === null;
    $('#fsUpBtn').dataset.parent = data.parent == null ? '' : data.parent;
    $('#fsOpenBtn').disabled = !FS_CUR;
    const list = $('#fsList'); list.innerHTML = '';
    if (!data.dirs.length) { list.innerHTML = '<em class="dim">No subfolders here.</em>'; return; }
    for (const d of data.dirs) {
      const row = document.createElement('button');
      row.type = 'button'; row.className = 'fs-item';
      row.textContent = '📁 ' + d.name;
      row.onclick = () => fsBrowse(d.path);
      list.appendChild(row);
    }
  } catch (e) { toast(e.message, 'err'); }
}
$('#browseBtn').onclick = () => { fsBrowse($('#projectDir').value.trim() || ''); $('#fsDlg').showModal(); };
$('#fsUpBtn').onclick = () => fsBrowse($('#fsUpBtn').dataset.parent || '');
$('#fsCancelBtn').onclick = () => $('#fsDlg').close();
$('#fsX').onclick = () => $('#fsDlg').close();
$('#fsOpenBtn').onclick = () => { if (!FS_CUR) return; $('#projectDir').value = FS_CUR; $('#fsDlg').close(); openProject(); };
$('#refreshTreeBtn').onclick = async () => { if (PROJECT_DIR) { const { tree } = await api(`/api/project/tree?dir=${encodeURIComponent(PROJECT_DIR)}`); TREE = tree; renderTree(); } };
$('#treeFilter').oninput = () => renderTree();

async function openProject() {
  const dir = $('#projectDir').value.trim();
  if (!dir) return;
  try {
    const { dir: full, tree } = await api('/api/project/open', { method: 'POST', body: JSON.stringify({ dir }) });
    PROJECT_DIR = full;
    TREE = tree;
    renderTree();
    addMsg('status', `Opened ${full} (${tree.length} entries)`);
    toast(`Project opened: ${full}`, 'ok');
    await loadConfig();
  } catch (e) { toast(e.message, 'err'); }
}

function renderTree() {
  const filter = $('#treeFilter').value.trim().toLowerCase();
  const box = $('#fileTree'); box.innerHTML = '';
  const entries = filter ? TREE.filter(e => e.path.toLowerCase().includes(filter)) : TREE;
  // build nested structure
  const root = { dirs: {}, files: [] };
  for (const e of entries) {
    const parts = e.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node.dirs[parts[i]]) node.dirs[parts[i]] = { dirs: {}, files: [] };
      node = node.dirs[parts[i]];
    }
    if (e.isDir) { if (!node.dirs[parts[parts.length - 1]]) node.dirs[parts[parts.length - 1]] = { dirs: {}, files: [] }; }
    else node.files.push({ name: parts[parts.length - 1], path: e.path });
  }
  const build = (node, container, open) => {
    for (const [name, sub] of Object.entries(node.dirs).sort()) {
      const det = document.createElement('details');
      if (open || filter) det.open = true;
      const sum = document.createElement('summary');
      sum.textContent = name;
      det.appendChild(sum);
      build(sub, det, false);
      container.appendChild(det);
    }
    for (const f of node.files.sort((a, b) => a.name.localeCompare(b.name))) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      leaf.textContent = f.name;
      leaf.title = f.path;
      leaf.onclick = async () => {
        try {
          const { content } = await api(`/api/project/file?dir=${encodeURIComponent(PROJECT_DIR)}&file=${encodeURIComponent(f.path)}`);
          const v = $('#viewer'); v.classList.remove('dim'); v.textContent = content;
          switchTab('viewer');
        } catch (err) { toast(err.message, 'err'); }
      };
      container.appendChild(leaf);
    }
  };
  build(root, box, true);
  if (!box.children.length) box.innerHTML = '<em class="dim">No files match.</em>';
}

/* ---------- chat model picker (per-session route override) ---------- */
function mpOption(route, label, sub, checked, disabled, tier) {
  const row = document.createElement('label');
  row.className = 'mp-opt' + (disabled ? ' mp-disabled' : '');
  const r = document.createElement('input');
  r.type = 'radio'; r.name = 'mpRoute'; r.checked = !!checked; r.disabled = !!disabled;
  r.onchange = () => { setRouteOverride(route); hideModelPicker(); };
  row.appendChild(r);
  const body = document.createElement('span');
  body.className = 'mp-txt';
  body.innerHTML = `<b>${esc(label)}</b>${tier ? ` <i class="mp-tier mp-${tier}">${esc(tier)}</i>` : ''}<small>${esc(sub)}</small>`;
  row.appendChild(body);
  return row;
}
async function buildModelPicker() {
  await loadCatalog();
  const box = $('#modelPicker'); box.innerHTML = '';
  const head = document.createElement('div'); head.className = 'mp-head';
  head.textContent = 'Model for this chat session';
  box.appendChild(head);
  box.appendChild(mpOption(null, '⚡ Auto (recommended)', 'routes each prompt to the best-fit free-tier model for its difficulty', !ROUTE_OVERRIDE));
  // Providers with keys sort first — those are the ones that will actually answer.
  const provs = Object.entries(CONFIG.providers)
    .filter(([name]) => (CATALOG_UI[name] || []).length)
    .sort((a, b) => (b[1].keys.length ? 1 : 0) - (a[1].keys.length ? 1 : 0));
  for (const [name, p] of provs) {
    const g = document.createElement('div'); g.className = 'mp-group';
    g.innerHTML = `<span>${esc(p.label)}</span><em>${p.keys.length ? `${p.keys.length} key${p.keys.length > 1 ? 's' : ''}` : 'no key — add in ⚙'}</em>`;
    box.appendChild(g);
    for (const m of CATALOG_UI[name]) {
      const checked = !!ROUTE_OVERRIDE && ROUTE_OVERRIDE.provider === name && ROUTE_OVERRIDE.model === m.value;
      const sub = [m.value, m.deprecatedSoon ? '⚠ deprecating soon' : '', m.note].filter(Boolean).join(' · ');
      box.appendChild(mpOption({ provider: name, model: m.value, label: m.label }, m.label, sub, checked, !p.keys.length, m.tier));
    }
  }
}
function setRouteOverride(route) {
  ROUTE_OVERRIDE = route;
  const btn = $('#modelPickerBtn');
  btn.textContent = route ? `🎯 ${route.label || route.model}` : '⚡ Auto';
  btn.classList.toggle('overridden', !!route);
  toast(route ? `This chat now uses ${route.provider}/${route.model}` : 'Auto routing re-enabled', 'ok');
}
function hideModelPicker() { $('#modelPicker').classList.add('hidden'); }
$('#modelPickerBtn').onclick = async () => {
  const pick = $('#modelPicker');
  if (pick.classList.contains('hidden')) { await buildModelPicker(); pick.classList.remove('hidden'); }
  else hideModelPicker();
};
document.addEventListener('click', (e) => {
  const pick = $('#modelPicker');
  if (!pick.classList.contains('hidden') && !pick.contains(e.target) && !$('#modelPickerBtn').contains(e.target)) hideModelPicker();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideModelPicker(); hideSessionPicker(); } });

/* ---------- session resume picker ---------- */
async function buildSessionPicker() {
  const box = $('#sessionPicker'); box.innerHTML = '';
  const head = document.createElement('div'); head.className = 'mp-head';
  head.textContent = 'Chat sessions';
  box.appendChild(head);
  const fresh = document.createElement('button');
  fresh.type = 'button'; fresh.className = 'fs-item';
  fresh.textContent = '✨ New chat';
  fresh.onclick = () => {
    SESSION_ID = 'ui-' + Math.random().toString(36).slice(2);
    $('#chatLog').innerHTML = '';
    addMsg('status', 'New chat session started.');
    hideSessionPicker();
  };
  box.appendChild(fresh);
  let list = [];
  try { list = (await api('/api/sessions')).sessions || []; } catch { /* ignore */ }
  for (const s of list.slice(0, 15)) {
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'fs-item' + (s.id === SESSION_ID ? ' current' : '');
    row.innerHTML = `<b>${esc(s.title)}</b><small class="dim"> · ${s.messages} msgs · ${s.updated ? new Date(s.updated).toLocaleString() : ''}</small>`;
    row.onclick = () => resumeSession(s.id);
    box.appendChild(row);
  }
  if (!list.length) { const e = document.createElement('div'); e.className = 'dim'; e.style.padding = '6px 8px'; e.textContent = 'No saved sessions yet.'; box.appendChild(e); }
}
async function resumeSession(sid) {
  hideSessionPicker();
  try {
    const { display } = await api(`/api/session?id=${encodeURIComponent(sid)}`);
    SESSION_ID = sid;
    needsReset = false;
    $('#chatLog').innerHTML = '';
    addMsg('status', `Resumed session ${sid} (${display.length} entries). Continue where you left off.`);
    for (const d of display) addMsg(d.kind === 'tool' ? 'tool ok' : d.kind, d.text);
  } catch (e) { toast(e.message, 'err'); }
}
function hideSessionPicker() { $('#sessionPicker').classList.add('hidden'); }
$('#sessionsBtn').onclick = async () => {
  const pick = $('#sessionPicker');
  if (pick.classList.contains('hidden')) { await buildSessionPicker(); pick.classList.remove('hidden'); }
  else hideSessionPicker();
};
document.addEventListener('click', (e) => {
  const pick = $('#sessionPicker');
  if (!pick.classList.contains('hidden') && !pick.contains(e.target) && !$('#sessionsBtn').contains(e.target)) hideSessionPicker();
});

/* ---------- chat / agent stream ---------- */
$('#chatForm').onsubmit = (e) => { e.preventDefault(); send(); };
$('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); send(); } });
let needsReset = false;
$('#resetBtn').onclick = () => { $('#chatLog').innerHTML = ''; addMsg('status', 'Conversation cleared.'); needsReset = true; };

async function send() {
  const text = $('#chatInput').value.trim();
  if (!text) return;
  if (!PROJECT_DIR) { toast('Open a project directory first.', 'err'); return; }
  $('#chatInput').value = '';
  addMsg('user', text);
  $('#sendBtn').disabled = true;
  showTyping(true);
  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: SESSION_ID, dir: PROJECT_DIR, message: text, reset: needsReset,
        ...(ROUTE_OVERRIDE ? { routeOverride: { provider: ROUTE_OVERRIDE.provider, model: ROUTE_OVERRIDE.model } } : {})
      })
    });
    needsReset = false;
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || res.statusText); }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for (const part of parts) {
        if (!part.trim()) continue;
        // Scan all lines in the event block for the data: field (id:/event: fields may precede it).
        let dataStr = null;
        for (const rawLine of part.split('\n')) {
          const l = rawLine.trim();
          if (l.startsWith('data:')) { dataStr = l.slice(5).trim(); break; }
        }
        if (!dataStr || dataStr === '[DONE]') continue;
        try { handleEvent(JSON.parse(dataStr)); } catch { /* ignore malformed */ }
      }
    }
    // flush remaining buf (stream closed without trailing \n\n)
    if (buf.trim()) {
      let dataStr = null;
      for (const rawLine of buf.split('\n')) {
        const l = rawLine.trim();
        if (l.startsWith('data:')) { dataStr = l.slice(5).trim(); break; }
      }
      if (dataStr && dataStr !== '[DONE]') {
        try { handleEvent(JSON.parse(dataStr)); } catch { /* ignore */ }
      }
    }
  } catch (e) {
    addMsg('error', e.message);
  } finally {
    showTyping(false);
    $('#sendBtn').disabled = false;
    $('#approvalBox').classList.add('hidden');
    refreshUsage();
  }
}

function handleEvent(ev) {
  switch (ev.type) {
    case 'status': addMsg('status', ev.text); break;
    case 'route_plan': {
      const tag = ev.mode === 'auto' ? `⚡ auto (${ev.difficulty} ${ev.kind})` : (ev.mode === 'override' ? '🎯 your override' : '🎛 manual');
      addMsg('status', `Router ${tag}: ${ev.provider}/${ev.model}${ev.fallback ? ` — fallback ${ev.fallback}` : ''}`);
      break;
    }
    case 'route': { const b = $('#routeBadge'); b.textContent = `${ev.provider}/${ev.model}`; b.classList.add('accent'); window.currentAssistantMsg = null; break; }
    case 'text': showTyping(false); addMsg('assistant', ev.text); showTyping(true); window.currentAssistantMsg = null; break;
    case 'text_delta':
      // Handle streaming text deltas. Append a text node (not innerHTML +=,
      // which re-parses the whole bubble on every delta — O(n²) on long
      // answers) and keep the log pinned to the bottom while streaming.
      if (!window.currentAssistantMsg) {
        window.currentAssistantMsg = addMsg('assistant', '');
      }
      window.currentAssistantMsg.appendChild(document.createTextNode(ev.text));
      $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
      showTyping(true);
      break;
    case 'tool_call': {
      const d = addMsg('tool', '');
      const why = ev.args && ev.args.why ? ` — ${ev.args.why}` : '';
      d.innerHTML = `▶ <b>${esc(ev.name)}</b> ${esc(summarizeArgs(ev.name, ev.args))}<span class="why">${esc(why)}</span>`;
      break;
    }
    case 'tool_result': { const d = addMsg('tool ok', `✔ ${ev.name}: ${ev.result.split('\n')[0].slice(0, 150)}`); break; }
    case 'diff': showDiff(ev.diff); break;
    case 'usage': if (ev.summary) { $('#usageBadge').textContent = `◈ ${fmtK(ev.summary.inputTokens)} ▸ ${fmtK(ev.summary.outputTokens)} · ${ev.summary.llmCalls} calls`; } break;
    case 'audit': break;
    case 'approval_required': showApproval(ev); break;
    case 'error': showTyping(false); addMsg('error', ev.message); break;
    case 'done': showTyping(false); addMsg('status', '— turn complete —'); window.currentAssistantMsg = null; break;
  }
}
function esc(s) { const d = document.createElement('span'); d.textContent = s || ''; return d.innerHTML; }
function summarizeArgs(name, args) {
  if (!args) return '';
  if (name === 'run_command') return args.command || '';
  if (args.path) return args.path;
  if (args.pattern) return '/' + args.pattern + '/';
  return '';
}

function showApproval(ev) {
  const box = $('#approvalBox');
  box.classList.remove('hidden');
  box.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'ap-title';
  title.innerHTML = (ev.kind === 'edit' ? `Approve edit to ${esc(ev.detail.path)}?` : 'Approve command?') +
    (ev.detail.tier === 'conditional' ? '<span class="tier-tag">TIER 2 — policy requires human gate</span>' : '');
  box.appendChild(title);
  const pre = document.createElement('pre');
  pre.textContent = ev.kind === 'edit' ? ev.detail.diff : ev.detail.command;
  box.appendChild(pre);
  if (ev.kind === 'edit') showDiff(ev.detail.diff);
  const actions = document.createElement('div');
  actions.className = 'approve-actions';
  for (const [label, cls, approved] of [['✔ Approve', 'yes', true], ['✕ Reject', 'no', false]]) {
    const b = document.createElement('button');
    b.textContent = label; b.className = 'btn ' + cls;
    b.onclick = async () => {
      await api('/api/approve', { method: 'POST', body: JSON.stringify({ id: ev.id, approved }) });
      box.classList.add('hidden');
    };
    actions.appendChild(b);
  }
  box.appendChild(actions);
}

/* ---------- agora ---------- */
const TYPE_ICON = { proposal: '💡', critique: '⚔️', comment: '💬', question: '❓' };
$('#agoraForm').onsubmit = async (e) => {
  e.preventDefault();
  if (!PROJECT_DIR) { toast('Open a project first.', 'err'); return; }
  const title = $('#agoraTitle').value.trim(), body = $('#agoraBody').value.trim();
  if (!title || !body) return;
  try {
    await api('/api/agora', { method: 'POST', body: JSON.stringify({ dir: PROJECT_DIR, type: $('#agoraType').value, title, body }) });
    $('#agoraTitle').value = ''; $('#agoraBody').value = '';
    toast('Posted to the Agora', 'ok');
    renderAgora();
  } catch (err) { toast(err.message, 'err'); }
};
async function renderAgora() {
  const box = $('#agoraList');
  if (!PROJECT_DIR) { box.innerHTML = '<em class="dim">Open a project to see its Agora board.</em>'; return; }
  try {
    const { exists, entries } = await api(`/api/agora?dir=${encodeURIComponent(PROJECT_DIR)}&limit=50`);
    box.innerHTML = '';
    if (!exists || !entries.length) { box.innerHTML = '<em class="dim">Board is empty — the first agent task will christen it.</em>'; return; }
    for (const en of entries.slice().reverse()) {
      const d = document.createElement('div');
      d.className = 'agora-entry t-' + en.type;
      d.innerHTML =
        `<div class="ae-head">${TYPE_ICON[en.type] || '💬'} <b>${esc(en.title)}</b></div>` +
        `<div class="ae-meta">${esc(en.author)} <span class="dim">(${esc(en.identity)})</span> · ${new Date(en.ts).toLocaleString()}${en.replyTo ? ` · re: <a href="#${esc(en.replyTo)}">${esc(en.replyTo)}</a>` : ''} · <span class="dim">${esc(en.id)}</span></div>` +
        `<div class="ae-body">${esc(en.body)}</div>`;
      d.id = en.id;
      box.appendChild(d);
    }
  } catch (err) { box.innerHTML = `<em class="dim">${esc(err.message)}</em>`; }
}

/* ---------- custom providers ---------- */
function renderCustomProviders() {
  const box = $('#customProvList'); box.innerHTML = '';
  const customs = Object.entries(CONFIG.providers).filter(([, p]) => p.custom);
  for (const [id, p] of customs) {
    const row = document.createElement('div');
    row.className = 'key-item';
    row.innerHTML = `<span><b>${esc(id)}</b> ${esc(p.label)}</span>`;
    const del = document.createElement('button');
    del.textContent = '✕'; del.className = 'mini-btn';
    del.onclick = async () => { await api('/api/providers/custom', { method: 'POST', body: JSON.stringify({ remove: id }) }); await loadConfig(); fillSettingsDlg(); };
    row.appendChild(del);
    box.appendChild(row);
  }
  if (!customs.length) box.innerHTML = '<em class="dim" style="font-size:12px">None yet.</em>';
}
$('#addProvBtn').onclick = async () => {
  try {
    await api('/api/providers/custom', { method: 'POST', body: JSON.stringify({ id: $('#cpId').value.trim(), label: $('#cpLabel').value.trim(), endpoint: $('#cpEndpoint').value.trim() }) });
    $('#cpId').value = ''; $('#cpLabel').value = ''; $('#cpEndpoint').value = '';
    await loadConfig(); fillSettingsDlg();
    toast('Custom provider added', 'ok');
  } catch (e) { toast(e.message, 'err'); }
};

/* ---------- trace / audit / keys ---------- */
$('#traceRefresh').onclick = () => renderTrace();
$('#traceKind').onchange = () => renderTrace();
$('#handoffBtn').onclick = async () => {
  const { markdown } = await api('/api/trace/handoff');
  const box = $('#traceList');
  box.innerHTML = '';
  const pre = document.createElement('pre');
  pre.className = 'handoff';
  pre.textContent = markdown;
  box.appendChild(pre);
};
async function renderTrace() {
  const kind = $('#traceKind').value;
  const { spans } = await api('/api/trace?limit=200' + (kind ? '&kind=' + kind : ''));
  const box = $('#traceList'); box.innerHTML = '';
  for (const s of spans.slice().reverse()) {
    const d = document.createElement('div');
    d.className = `span-row k-${s.kind} s-${s.status || 'ok'}`;
    const t = new Date(s.ts).toLocaleTimeString();
    let line = '';
    if (s.kind === 'llm_call') line = `<b>${esc(s['gen_ai.request.model'] || '?')}</b> <span class="meta">${esc(s.provider || '')} · ${s['gen_ai.usage.input_tokens'] || 0}▸${s['gen_ai.usage.output_tokens'] || 0} tok · ${s.latencyMs || 0}ms · ${esc(s.status)}</span>`;
    else if (s.kind === 'tool_call') line = `<b>${esc(s.name)}</b> <span class="meta">${esc((s.target || '').toString().slice(0, 80))} · ${esc(s.status || 'ok')}</span>` + (s.why ? `<span class="why">${esc(s.why)}</span>` : '');
    else if (s.kind === 'router') line = `<b>route ${esc(s.mode)}</b> <span class="meta">${esc(s.difficulty || '')} ${esc(s.taskKind || '')} → ${esc(s.chosen || '')}</span>` + (s.why ? `<span class="why">${esc(s.why)}</span>` : '');
    else if (s.kind === 'agent_turn') line = `<b>turn ${esc(s.phase)}</b> <span class="meta">${esc((s.goal || s.outcome || '').toString().slice(0, 90))}</span>`;
    else if (s.kind === 'approval') line = `<b>human gate</b> <span class="meta">${esc(s.status)}</span>`;
    else line = `<b>${esc(s.name || s.kind)}</b> <span class="meta">${esc((s.project || '').toString().slice(0, 60))}</span>`;
    d.innerHTML = `<span class="meta">${t}</span> · ${line}`;
    box.appendChild(d);
  }
  if (!spans.length) box.innerHTML = '<em class="dim">No trace spans yet — run an agent turn.</em>';
}
async function renderAudit() {
  const { audit } = await api('/api/audit');
  const box = $('#auditList'); box.innerHTML = '';
  for (const a of audit.slice().reverse()) {
    const d = document.createElement('div');
    d.className = 'audit-entry';
    const dur = Number.isFinite(a.durationMs) ? ` · ${a.durationMs}ms` : '';
    const st = a.status && a.status !== 'ok' ? ` · ${esc(a.status)}` : '';
    d.innerHTML = `<b>${esc(a.tool)}</b> ${a.blocked ? '⛔ ' : ''}${esc((a.target || '').toString().slice(0, 110))}${st}${dur} <span style="float:right">${new Date(a.ts).toLocaleTimeString()}</span>`;
    box.appendChild(d);
  }
  if (!audit.length) box.innerHTML = '<em class="dim">No agent actions this session.</em>';
}
async function renderKeyStatus() {
  await loadConfig();
  const box = $('#keyStatus'); box.innerHTML = '';
  for (const [name, p] of Object.entries(CONFIG.providers)) {
    const h = document.createElement('div');
    h.className = 'prov-head';
    h.innerHTML = `${esc(p.label)} <a href="${esc(p.docs)}" target="_blank" rel="noreferrer noopener">get key ↗</a>`;
    box.appendChild(h);
    if (!p.keyStatus.length) { const e = document.createElement('div'); e.className = 'dim'; e.style.fontSize = '11px'; e.textContent = 'no keys'; box.appendChild(e); continue; }
    for (const k of p.keyStatus) {
      const d = document.createElement('div');
      d.className = 'key-row';
      const health = k.calls ? ` · ♥${k.healthPct}%${k.avgLatencyMs != null ? ` · ${k.avgLatencyMs}ms` : ''}` : '';
      d.innerHTML = `<span>${esc(k.masked)} <span class="dim">w=${k.weight}${health}</span></span><span class="${k.cooled ? 'key-cool' : 'key-ok'}">${k.cooled ? `cooldown ${k.resetInSec}s` : `ready (${k.active} in-flight)`}</span>`;
      box.appendChild(d);
    }
  }
  // model reliability stats (from trace analytics)
  try {
    const u = await api('/api/usage');
    const models = Object.entries(u.byModel || {});
    if (models.length) {
      const h = document.createElement('div'); h.className = 'prov-head'; h.textContent = 'Model stats (recent traces)'; box.appendChild(h);
      for (const [m, s] of models) {
        const d = document.createElement('div');
        d.className = 'key-row';
        d.innerHTML = `<span>${esc(m)}</span><span class="dim">${s.calls} calls · ${s.successPct}% ok · ${s.avgLatencyMs}ms · ${fmtK(s.in)}▸${fmtK(s.out)} tok</span>`;
        box.appendChild(d);
      }
    }
  } catch { /* ignore */ }
}
setInterval(() => { if (!$('#tab-keys').classList.contains('hidden')) renderKeyStatus(); }, 5000);

/* ---------- boot ---------- */
loadConfig().then(() => {
  refreshUsage();
  addMsg('status', 'Purple Squirrel ready. Open a project, add free-tier keys (⚙), and start vibing. Every action is traced locally with its reasoning.');
});
