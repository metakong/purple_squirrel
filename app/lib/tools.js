// Agent workspace tools: token-aware file views, atomic writes, precise block
// replacement (eUFS-friendly), git-aware listing, regex grep, and a native
// PowerShell executor — all governed by tiered Policy-as-Code
// (governance/AGENTS.policy.json) and traced with the agent's stated "why".
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { walk } = require('./walker');
const { unifiedDiff } = require('./diff');
const policy = require('./policy');
const agora = require('./agora');

function resolveInWorkspace(root, relPath) {
  const full = path.resolve(root, relPath);
  const normRoot = path.resolve(root);
  if (full !== normRoot && !full.startsWith(normRoot + path.sep)) {
    throw new Error(`Path escapes workspace: ${relPath}`);
  }
  return full;
}

const WHY = { type: 'string', description: 'One short sentence: why you are taking this action (recorded in the transparency trace).' };

// OpenAI tool schemas advertised to the model. Every tool takes a `why`.
const TOOL_DEFS = [
  { type: 'function', function: { name: 'list_dir', description: 'List workspace files as a git-aware tree (ignored dirs like node_modules pruned). Returns relative paths.', parameters: { type: 'object', properties: { subdir: { type: 'string', description: 'Optional subdirectory relative to workspace root' }, why: WHY } } } },
  { type: 'function', function: { name: 'view_file', description: 'Read a file. For large files pass start_line/end_line (max 300-line window) to conserve context.', parameters: { type: 'object', properties: { path: { type: 'string' }, start_line: { type: 'integer' }, end_line: { type: 'integer' }, why: WHY }, required: ['path'] } } },
  { type: 'function', function: { name: 'grep_search', description: 'Regex search across workspace files. Returns matching lines with file:line.', parameters: { type: 'object', properties: { pattern: { type: 'string' }, glob_ext: { type: 'string', description: 'Optional extension filter like ".ts"' }, why: WHY }, required: ['pattern'] } } },
  { type: 'function', function: { name: 'write_file', description: 'Create or fully overwrite a file with new content (atomic write).', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' }, why: WHY }, required: ['path', 'content'] } } },
  { type: 'function', function: { name: 'replace_content', description: 'Replace an exact block of text in a file with new text. The search block must match exactly once. Preferred over write_file for edits.', parameters: { type: 'object', properties: { path: { type: 'string' }, search: { type: 'string' }, replace: { type: 'string' }, why: WHY }, required: ['path', 'search', 'replace'] } } },
  { type: 'function', function: { name: 'run_command', description: 'Run a PowerShell command in the workspace directory. Returns stdout/stderr/exit code. 120s timeout.', parameters: { type: 'object', properties: { command: { type: 'string' }, why: WHY }, required: ['command'] } } },
  { type: 'function', function: { name: 'agora_read', description: 'Read recent entries from the Agora — the shared agent brainstorming board for this workspace (.agent/agora/AGORA.md). Read it before proposing, so you can critique or build on existing ideas.', parameters: { type: 'object', properties: { limit: { type: 'integer', description: 'Max entries, default 15' }, why: WHY } } } },
  { type: 'function', function: { name: 'agora_post', description: 'Post to the Agora, signed with your model identity. REQUIRED once at the end of every completed task: one short brainstorm — a novel improvement proposal, a critique of an existing entry, or a comment/question. Be concrete and concise.', parameters: { type: 'object', properties: { type: { type: 'string', enum: ['proposal', 'critique', 'comment', 'question'] }, title: { type: 'string', description: 'One-line idea summary (max 120 chars)' }, body: { type: 'string', description: 'The idea, rationale, and rough approach (max 2000 chars)' }, reply_to: { type: 'string', description: 'Optional entry id you are critiquing/answering' } }, required: ['type', 'title', 'body'] } } }
];

function atomicWrite(full, content) {
  const dir = path.dirname(full);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.vibe_tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, full);
}

/**
 * Gate a write/edit through policy + YOLO settings.
 * Returns null to proceed, or a string result the model should see.
 */
async function gateEdit(ctx, relPath, diff) {
  const verdict = policy.evaluatePath(relPath);
  if (verdict.tier === 'blocked' && ctx.settings.yolo.guardrails) {
    return `BLOCKED by governance policy (Tier 3, rule: ${verdict.rule}): editing ${relPath} is prohibited. Explain to the user what you wanted to do.`;
  }
  const needApproval = verdict.tier === 'conditional' || !ctx.settings.yolo.autoApproveEdits;
  if (needApproval) {
    const ok = await ctx.requestApproval('edit', { path: relPath, diff, tier: verdict.tier });
    if (!ok) return 'USER REJECTED this edit. Do not retry the same change; ask the user for guidance.';
  } else {
    ctx.emitDiff && ctx.emitDiff({ path: relPath, diff });
  }
  return null;
}

/**
 * Execute a tool call. ctx = { root, settings, requestApproval, audit, emitDiff, traceTool }
 */
async function executeTool(name, args, ctx) {
  const { root, settings } = ctx;
  const why = args.why || '';
  const rec = (extra) => { ctx.audit({ tool: name, why, ...extra }); };

  switch (name) {
    case 'list_dir': {
      const base = args.subdir ? resolveInWorkspace(root, args.subdir) : root;
      const entries = walk(base, { maxEntries: 2000 });
      rec({ target: args.subdir || '.' });
      return entries.map(e => (e.isDir ? '[dir] ' : '') + e.path).join('\n') || '(empty)';
    }
    case 'view_file': {
      const full = resolveInWorkspace(root, args.path);
      const text = fs.readFileSync(full, 'utf8');
      const lines = text.split('\n');
      const maxWin = settings.maxFileReadLines || 300;
      let start = Math.max(1, args.start_line || 1);
      let end = Math.min(lines.length, args.end_line || start + maxWin - 1);
      if (end - start + 1 > maxWin) end = start + maxWin - 1;
      rec({ target: args.path, range: `${start}-${end}` });
      const body = lines.slice(start - 1, end).map((l, i) => `${start + i}\t${l}`).join('\n');
      return `File ${args.path} (${lines.length} lines total, showing ${start}-${end}):\n${body}`;
    }
    case 'grep_search': {
      const rx = new RegExp(args.pattern);
      const entries = walk(root, { maxEntries: 5000 });
      const hits = [];
      for (const e of entries) {
        if (e.isDir) continue;
        if (args.glob_ext && !e.path.endsWith(args.glob_ext)) continue;
        let text;
        try { text = fs.readFileSync(path.join(root, e.path), 'utf8'); } catch { continue; }
        if (text.length > 1_000_000 || text.includes('\u0000')) continue;
        const lines = text.split('\n');
        for (let i = 0; i < lines.length && hits.length < 200; i++) {
          if (rx.test(lines[i])) hits.push(`${e.path}:${i + 1}: ${lines[i].trim().slice(0, 200)}`);
        }
        if (hits.length >= 200) break;
      }
      rec({ target: args.pattern });
      return hits.join('\n') || '(no matches)';
    }
    case 'write_file': {
      const full = resolveInWorkspace(root, args.path);
      let oldText = '';
      try { oldText = fs.readFileSync(full, 'utf8'); } catch { /* new file */ }
      const diff = unifiedDiff(args.path, oldText, args.content);
      const gate = await gateEdit(ctx, args.path, diff);
      if (gate) { rec({ target: args.path, status: gate.startsWith('BLOCKED') ? 'blocked' : 'rejected' }); return gate; }
      atomicWrite(full, args.content);
      rec({ target: args.path, bytes: args.content.length });
      return `Wrote ${args.path} (${args.content.length} bytes).`;
    }
    case 'replace_content': {
      const full = resolveInWorkspace(root, args.path);
      const oldText = fs.readFileSync(full, 'utf8');
      const count = oldText.split(args.search).length - 1;
      if (count === 0) return `ERROR: search block not found in ${args.path}. View the file and retry with the exact text.`;
      if (count > 1) return `ERROR: search block matches ${count} times in ${args.path}; include more surrounding context to make it unique.`;
      const newText = oldText.replace(args.search, () => args.replace);
      const diff = unifiedDiff(args.path, oldText, newText);
      const gate = await gateEdit(ctx, args.path, diff);
      if (gate) { rec({ target: args.path, status: gate.startsWith('BLOCKED') ? 'blocked' : 'rejected' }); return gate; }
      atomicWrite(full, newText);
      rec({ target: args.path });
      return `Replaced block in ${args.path}.\n${diff.slice(0, 2000)}`;
    }
    case 'run_command': {
      const cmd = args.command || '';
      const verdict = policy.evaluateCommand(cmd);
      if (verdict.tier === 'blocked' && settings.yolo.guardrails) {
        rec({ target: cmd, blocked: true, status: 'blocked' });
        return `BLOCKED by governance policy (Tier 3, rule: ${verdict.rule}). Explain to the user what you wanted to do.`;
      }
      if (verdict.tier === 'conditional' || !settings.yolo.autoRunCommands) {
        const ok = await ctx.requestApproval('command', { command: cmd, tier: verdict.tier });
        if (!ok) { rec({ target: cmd, status: 'rejected' }); return 'USER REJECTED this command. Do not retry it; ask the user for guidance.'; }
      }
      rec({ target: cmd });
      return await runPowershell(cmd, root);
    }
    case 'agora_read': {
      const { exists, entries } = agora.read(root, args.limit || 15);
      rec({ target: '.agent/agora/AGORA.md' });
      if (!exists || !entries.length) return 'The Agora board is empty for this workspace. Yours can be the first entry (agora_post).';
      return entries.map(e =>
        `[${e.id}] ${e.ts} — ${e.author} (${e.identity})\n  ${e.type.toUpperCase()}: ${e.title}${e.replyTo ? ` (re: ${e.replyTo})` : ''}\n  ${e.body.slice(0, 400).replace(/\n/g, '\n  ')}`
      ).join('\n\n');
    }
    case 'agora_post': {
      const identity = (ctx.getModelIdentity && ctx.getModelIdentity()) || { author: 'Unknown Agent', identity: 'unknown' };
      const id = agora.post(root, {
        author: identity.author, identity: identity.identity,
        type: args.type, title: args.title, body: args.body, replyTo: args.reply_to
      });
      ctx.agoraPosted = true;
      rec({ target: `${args.type}: ${String(args.title).slice(0, 80)}` });
      return `Posted to the Agora as ${identity.author} (entry ${id}). Thank you for keeping the watercooler alive.`;
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

function runPowershell(command, cwd) {
  return new Promise((resolve) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { cwd, windowsHide: true });
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill(); out += '\n[TIMEOUT after 120s]'; }, 120000);
    child.stdout.on('data', d => { if (out.length < 60000) out += d; });
    child.stderr.on('data', d => { if (err.length < 20000) err += d; });
    child.on('close', code => {
      clearTimeout(timer);
      resolve(`Exit code: ${code}\nSTDOUT:\n${out.slice(0, 30000) || '(empty)'}\nSTDERR:\n${err.slice(0, 10000) || '(empty)'}`);
    });
    child.on('error', e => { clearTimeout(timer); resolve(`Failed to spawn PowerShell: ${e.message}`); });
  });
}

module.exports = { TOOL_DEFS, executeTool, resolveInWorkspace };
