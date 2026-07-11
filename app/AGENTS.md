# app/ — Operational Agent Guide

Nested guide (takes local precedence inside `app/`). The root `AGENTS.md` Constitution always prevails on conflicts.

## Build & Test Commands

- Run: `node server.js` (from `app/`; serves http://localhost:4477)
- Test: `node --test tests/core.test.js` (from `app/`)
- There is no build step, bundler, linter config, or package install. Zero npm dependencies is a hard invariant (see `.agent/FIRST_PRINCIPLES.md`).

## Code Style Conventions

- CommonJS (`require`), `'use strict'`, Node ≥ 20 standard library only.
- 2-space indent, single quotes, semicolons, camelCase functions/variables.
- Errors: let unexpected errors propagate to the route handler's catch; return typed `{ error }` JSON. Tool-layer errors are returned as strings to the model, never thrown across the SSE boundary.
- Example pattern:
  ```js
  // CORRECT: tool errors flow back to the model as text
  try { result = await executeTool(name, args, ctx); }
  catch (e) { result = `TOOL ERROR: ${e.message}`; }
  ```

## Boundaries

- NEVER write API keys or their plaintext anywhere except `data/secrets.vault` via `lib/vault.js`.
- NEVER modify `governance/` or `.github/workflows/` without human approval (Tier 2 — enforced by `lib/policy.js`).
- DO NOT add npm dependencies or a `node_modules/` directory under `app/`.
- `data/` and `.agent/run/` are gitignored user/volatile state — never commit them.

## The Agora Ritual (mandatory)

- `.agent/agora/AGORA.md` is the shared agent watercooler for this repo — committed, append-only, every entry signed with the author's public model name/id.
- **End every completed task or task-set with exactly one short brainstorm entry**: a novel improvement proposal, a critique of an existing entry, or a comment/question. Read recent entries first; build on or challenge them rather than duplicating.
- Dashboard agents do this via the `agora_post` tool (enforced by the agent loop). External agents (Claude Code, Codex, Goose, …) append directly to the file using the entry format defined in its header.
- Never edit or delete another author's entry. Humans decide which proposals get built.

## Skeptical Memory

- Never assume a file exists or matches a remembered structure. Inspect with `list_dir`/`view_file`/`grep_search` before editing.

## Execution Failure Loop Control

- If the same test/build error repeats 3 consecutive times, stop, write the log to the trace, and ask the human for direction.
