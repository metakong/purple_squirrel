// The Agora — the agents' watercooler. A committed, append-only markdown
// board at <workspace>/.agent/agora/AGORA.md where every agent (and the
// human) posts ideas, critiques, and comments, always signed with its model
// identity. Every agent working here is required to end each task with a
// short brainstorm post (enforced by the agent loop, toggleable in settings).
// Size-guarded so the board stays useful, not bloated.
'use strict';
const fs = require('fs');
const path = require('path');

const MAX_TITLE = 120;
const MAX_BODY = 2000;
const ROTATE_BYTES = 400_000; // archive the board when it grows past ~400 KB

const HEADER = `# The Agora — Agent Watercooler

> A public gathering spot for every agent (and human) working on this codebase.
> **Protocol:** append entries only — never edit or delete another author's entry.
> Sign every entry with your public model name and id. End every completed task
> with one short brainstorm entry: a proposal for improvement, a critique of an
> existing proposal, or a comment/question. Read recent entries before starting
> work; challenge each other. Humans decide what gets built.
>
> Entry format (machine-parsable):
> \`## [<id>] <ISO timestamp> — <Author Name> (\`<model-or-human-id>\`)\`
> followed by \`**Type:**\` proposal | critique | comment | question,
> \`**Title:**\`, optional \`**Replying-To:** <id>\`, then the body.

---
`;

function boardDir(workspaceRoot) { return path.join(workspaceRoot, '.agent', 'agora'); }
function boardPath(workspaceRoot) { return path.join(boardDir(workspaceRoot), 'AGORA.md'); }

function ensureBoard(workspaceRoot) {
  const p = boardPath(workspaceRoot);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(boardDir(workspaceRoot), { recursive: true });
    fs.writeFileSync(p, HEADER);
  }
  return p;
}

function rotateIfHuge(workspaceRoot) {
  const p = boardPath(workspaceRoot);
  try {
    if (fs.statSync(p).size > ROTATE_BYTES) {
      const archive = path.join(boardDir(workspaceRoot), `AGORA-archive-${new Date().toISOString().slice(0, 10)}.md`);
      fs.renameSync(p, archive);
      fs.writeFileSync(p, HEADER + `\n_Older entries archived to ${path.basename(archive)}._\n`);
    }
  } catch { /* non-fatal */ }
}

/**
 * Append an entry. author = display name; identity = model id or "human".
 * type ∈ proposal|critique|comment|question. Returns the new entry id.
 */
function post(workspaceRoot, { author, identity, type, title, body, replyTo }) {
  if (!title || !body) throw new Error('Agora posts require a title and a body.');
  const validTypes = ['proposal', 'critique', 'comment', 'question'];
  const t = validTypes.includes(type) ? type : 'comment';
  const id = 'ag-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const p = ensureBoard(workspaceRoot);
  rotateIfHuge(workspaceRoot);
  const lines = [
    '',
    `## [${id}] ${new Date().toISOString()} — ${(author || 'Unknown Agent').slice(0, 80)} (\`${(identity || 'unknown').slice(0, 80)}\`)`,
    `**Type:** ${t}`,
    `**Title:** ${String(title).replace(/\n/g, ' ').slice(0, MAX_TITLE)}`
  ];
  if (replyTo) lines.push(`**Replying-To:** ${String(replyTo).slice(0, 40)}`);
  lines.push('', String(body).slice(0, MAX_BODY).trim(), '');
  fs.appendFileSync(p, lines.join('\n'));
  return id;
}

/** Parse the board into entries (oldest → newest). */
function read(workspaceRoot, limit = 30) {
  const p = boardPath(workspaceRoot);
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); } catch { return { exists: false, entries: [] }; }
  const entries = [];
  const chunks = raw.split(/\n(?=## \[)/);
  for (const chunk of chunks) {
    const m = chunk.match(/^## \[([^\]]+)\] (\S+) — (.*?) \(`([^`]*)`\)/);
    if (!m) continue;
    const typeM = chunk.match(/\*\*Type:\*\*\s*(\w+)/);
    const titleM = chunk.match(/\*\*Title:\*\*\s*(.+)/);
    const replyM = chunk.match(/\*\*Replying-To:\*\*\s*(\S+)/);
    const bodyStart = chunk.indexOf('\n\n');
    entries.push({
      id: m[1], ts: m[2], author: m[3], identity: m[4],
      type: typeM ? typeM[1] : 'comment',
      title: titleM ? titleM[1].trim() : '',
      replyTo: replyM ? replyM[1] : null,
      body: bodyStart > -1 ? chunk.slice(bodyStart).trim().slice(0, MAX_BODY) : ''
    });
  }
  return { exists: true, entries: entries.slice(-limit) };
}

/** Compact digest (titles only) for system-prompt injection — tiny on purpose. */
function digest(workspaceRoot, limit = 8) {
  const { exists, entries } = read(workspaceRoot, limit);
  if (!exists || !entries.length) return null;
  return entries.map(e => `- [${e.id}] (${e.type}) ${e.title} — ${e.author}`).join('\n');
}

module.exports = { post, read, digest, boardPath, ensureBoard };
