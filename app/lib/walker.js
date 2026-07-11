// Git-aware workspace walker optimized for slow eUFS storage: prunes ignored
// directories at the directory-entry level so they are never opened.
'use strict';
const fs = require('fs');
const path = require('path');

const ALWAYS_IGNORE = new Set([
  'node_modules', '.git', 'target', 'dist', 'build', '.next', '.nuxt', 'out',
  '__pycache__', '.venv', 'venv', '.cache', '.turbo', 'coverage', '.idea', '.vs'
]);

// Parse a .gitignore into simple matchers (supports the common cases:
// dir/, *.ext, plain names, leading-slash roots, ! negation is skipped).
function parseGitignore(dir) {
  const rules = [];
  try {
    const raw = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    for (let line of raw.split('\n')) {
      line = line.trim();
      if (!line || line.startsWith('#') || line.startsWith('!')) continue;
      const dirOnly = line.endsWith('/');
      if (dirOnly) line = line.slice(0, -1);
      const anchored = line.startsWith('/');
      if (anchored) line = line.slice(1);
      // convert glob to regex
      const rx = new RegExp('^' + line.split('*').map(s => s.replace(/[.+^${}()|[\]\\?]/g, '\\$&')).join('[^/]*') + '$');
      rules.push({ rx, dirOnly, anchored });
    }
  } catch { /* no .gitignore */ }
  return rules;
}

function matches(rules, name, relPath, isDir) {
  for (const r of rules) {
    if (r.dirOnly && !isDir) continue;
    if (r.anchored ? r.rx.test(relPath.replace(/\\/g, '/')) : r.rx.test(name)) return true;
  }
  return false;
}

/**
 * Walk a workspace returning a flat list of entries { path, isDir, size }.
 * Ignored dirs are pruned before descent (never stat'd/opened).
 */
function walk(root, { maxEntries = 20000 } = {}) {
  const rootRules = parseGitignore(root);
  const entries = [];
  const stack = [{ dir: root, rules: rootRules }];
  while (stack.length && entries.length < maxEntries) {
    const { dir, rules } = stack.pop();
    let dirents;
    try { dirents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    // pick up nested .gitignore
    let localRules = rules;
    if (dir !== root && dirents.some(d => d.name === '.gitignore')) {
      localRules = rules.concat(parseGitignore(dir));
    }
    for (const d of dirents) {
      const name = d.name;
      if (name.startsWith('.') && name !== '.gitignore' && name !== '.env.example') continue;
      const full = path.join(dir, name);
      const rel = path.relative(root, full);
      const isDir = d.isDirectory();
      if (isDir && ALWAYS_IGNORE.has(name)) continue;
      if (matches(localRules, name, rel, isDir)) continue;
      entries.push({ path: rel.replace(/\\/g, '/'), isDir });
      if (isDir) stack.push({ dir: full, rules: localRules });
      if (entries.length >= maxEntries) break;
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

// Structural outline compression: extract signatures only (zero-RAM indexing).
const SIG_PATTERNS = [
  /^(export\s+)?(default\s+)?(async\s+)?function\s+\w+/,
  /^(export\s+)?(abstract\s+)?class\s+\w+/,
  /^(export\s+)?interface\s+\w+/,
  /^(export\s+)?type\s+\w+\s*=/,
  /^(export\s+)?const\s+\w+\s*=\s*(async\s*)?\(/,
  /^(pub\s+)?(async\s+)?fn\s+\w+/,
  /^(pub\s+)?struct\s+\w+/,
  /^(pub\s+)?trait\s+\w+/,
  /^(pub\s+)?enum\s+\w+/,
  /^impl\b/,
  /^def\s+\w+/, /^class\s+\w+/, /^async\s+def\s+\w+/,
  /^func\s+\w+/, /^type\s+\w+\s+(struct|interface)/,
  /^(public|private|protected)\s+.*\(/
];

function outlineFile(fullPath, relPath) {
  let text;
  try { text = fs.readFileSync(fullPath, 'utf8'); } catch { return null; }
  if (text.length > 500000) return null;
  const lines = text.split('\n');
  const sigs = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (SIG_PATTERNS.some(rx => rx.test(t))) sigs.push(`${i + 1}: ${t.slice(0, 160)}`);
  }
  return sigs.length ? `### ${relPath}\n${sigs.join('\n')}` : null;
}

const CODE_EXT = new Set(['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.rs', '.py', '.go', '.java', '.cs', '.rb', '.php', '.svelte', '.vue', '.c', '.cpp', '.h']);

// Entry points and recently-touched files carry the most signal, so they get
// outline budget first (lightweight take on semantic context prioritization).
const ENTRY_RX = /(^|\/)(index|main|server|app|cli|lib)\.[a-z]+$/;

function projectOutline(root, maxChars = 24000) {
  const entries = walk(root, { maxEntries: 5000 });
  const candidates = [];
  for (const e of entries) {
    if (e.isDir || !CODE_EXT.has(path.extname(e.path))) continue;
    let mtime = 0;
    try { mtime = fs.statSync(path.join(root, e.path)).mtimeMs; } catch { /* skip stat */ }
    candidates.push({ path: e.path, mtime, boost: ENTRY_RX.test(e.path) ? 1 : 0 });
  }
  candidates.sort((a, b) => (b.boost - a.boost) || (b.mtime - a.mtime));
  const parts = [];
  let total = 0;
  for (const c of candidates) {
    const o = outlineFile(path.join(root, c.path), c.path);
    if (o) {
      if (total + o.length > maxChars) break;
      parts.push(o); total += o.length;
    }
  }
  return parts.join('\n\n');
}

module.exports = { walk, projectOutline };
