# Purple Squirrel — Prioritized Backlog

_Ranked most-urgent/important → least. Maintained for autonomous agents picking up work._
_Last curated: 2026-07-11 by `anthropic/claude-opus-4-8`._

**Before starting any item:** read `AGENTS.md` (constitution), `.agent/FIRST_PRINCIPLES.md` (invariants), and recent `.agent/agora/AGORA.md` entries. Respect the hard invariants: **zero npm dependencies in `app/`**, **loopback-only**, **secrets stay in the DPAPI vault**, **workspace jail**, **append-only traces/Agora**. Every feature ships with an eval (Principle 2). End each task with an Agora post.

---

## P0 — Correctness & reliability (do first)

### 1. Automated coverage for the provider network path  _(partially done)_
**Why:** Recent production bugs all lived in `app/lib/providers.js` / `app/lib/agent.js`, which had **zero automated coverage** because they do real `fetch`.
**Done 2026-07-11:** `parseStreamingResponse` is now exported and covered — writing the tests immediately surfaced and fixed two live bugs (tool-call name/id doubling → `"view_fileview_file"`; usage dropped from terminal `choices:[]` chunks).
**Remaining:** Inject a fetch shim (`chatCompletion({ ..., _fetch })` defaulting to global `fetch`) — note this also needs `getKeys` decoupled/injected since `chatCompletion` reads the vault via `config.getKeys`. Then cover: 429/402/503 cooldown + key rotation, primary→fallback degradation, and the `streamed:true/false` contract end-to-end. Also consider requesting `stream_options:{include_usage:true}` for streaming providers so usage actually flows (gate per-provider — some strict endpoints 400 on unknown fields).
**Effort:** M. **Files:** `app/lib/providers.js`, `app/lib/config.js`, `app/tests/core.test.js`.

### 2. Startup configuration validation — SHIPPED (2026-07-11)
**Delivered:** `config.validate(cfg)` returns human-readable warnings for unknown routing providers, missing models, invalid ports, and malformed `customProviders` (bad id / non-https endpoint). Never throws. `server.js` prints them in yellow at boot, alongside the low-RAM warning. Tests cover the flagged cases and a clean default. **Follow-up:** optionally surface these in the UI Settings dialog too.

---

## P1 — High-value features the human explicitly requested (Agora)

### 3. Free-tier budget / quota forecaster  _(human: `ag-mrfu6khlkel`; Fable 5: `ag-mrft367ushj`)_
**Why:** Today we react to 429s after they hit. The human asked for a live view of tokens/requests remaining per provider per period.
**Approach:** (a) One-line change: record `keyIndex` on every `llm_call` span in `providers.js`. (b) New `app/lib/budget.js` folds `data/traces/*.jsonl` into a per-provider-per-key ledger (requests today, tokens today, window reset) using known free-tier limits from `docs/research`. (c) HUD shows "~N requests left on groq key #1 today"; router can prefer keys with headroom. **No external calls** — derived purely from our own traces.
**Effort:** M–L. **Files:** `app/lib/providers.js`, `app/lib/budget.js` (new), `app/server.js` (`/api/budget`), `app/public/*`.

### 4. Native-feeling folder picker  _(human: `ag-mrfualr7f43`)_
**Why:** Users currently type an absolute path. They want a browse/upload-style directory picker.
**Approach:** Browsers can't return real FS paths from `<input type=file>` for security, so build a zero-dep in-app directory browser: new `GET /api/fs/list?dir=` returning child directories (guard against traversal above a sensible root; never leak file contents), plus a modal that walks directories and returns the chosen absolute path to the existing "Open" flow. Keep loopback-only.
**Effort:** M. **Files:** `app/server.js`, `app/public/index.html`, `app/public/app.js`, `app/public/style.css`.

---

## P2 — Real sandbox  _(DONE 2026-07-11, human-approved)_

### 5. `wsl.exe`-based execution backend — SHIPPED
**Delivered:** `app/lib/sandbox.js` (`spawn('wsl.exe', ['-e','bash','-lc', cmd])`, no `-it`, output caps, timeout, graceful degradation), opt-in interception in `tools.js` (host PowerShell remains the default/fallback), `settings.sandbox.enabled` config, shell-aware system prompt in `agent.js`, `/api/config` status (`available`/`enabled`), an availability-aware Settings toggle, and honest boundary docs in `SECURITY.md`. Tests: graceful-degradation + `formatResult` shape.
**Verified:** unavailable-path + API status confirmed on a distro-less host (`available:false`).
**Not yet verified (blocked):** real command execution — this host has **no WSL distro installed** (`wsl --install` needs admin + interactive Linux-account creation). Once a distro exists, call `sandbox.resetAvailability()` (or restart) and exercise a real `run_command`.
**Follow-ups:** stronger isolation (dedicated distro with `/mnt` automount disabled, or confine cwd); optional per-command backend override.

---

## P3 — Quality & robustness

### 6. Accessibility pass  _(gpt-4o-mini: `ag-mrfv37uy191`)_
ARIA roles/labels, focus management, and keyboard operability for the dashboard (chat log as `log`/`aria-live`, labelled controls, approval dialog as `role=dialog`). **Effort:** S–M. **Files:** `app/public/index.html`, `app/public/app.js`.

### 7. Extract server route handlers  _(gpt-4o-mini: `ag-mrfv37uy191`)_
`app/server.js` is a growing if/else chain. Refactor to a small method+path → handler map (still zero-dep) for testability. Add a request-routing unit test. **Effort:** M. **Files:** `app/server.js`, tests.

### 8. A2A coordination increment  _(Mistral: `ag-mrft367qqhd` #6)_
Extend `.agent/run/HEARTBEAT.json` with a lightweight task queue so multiple agents can claim/hand off work — not a network gateway. Build on existing `foreignLock()`. **Effort:** M. **Files:** `app/lib/heartbeat.js`, `app/lib/agent.js`.

---

## P4 — Vision (large; plan incrementally, never one big refactor)

### 9. IDE-like capabilities  _(human: `ag-mrfueukdiay`)_
Editor pane with syntax highlighting, file tabs, apply-diff-in-place, inline problems. Must be decomposed into small shippable slices and remain zero-dependency + lean on the 8 GB ARM64 target. Post concrete slice proposals to the Agora for critique before building.

---

### Recently shipped (context for the next agent)
- Mistral `tool`-role & Gemini empty-`name` 400s fixed at the provider send boundary (`normalizeForProvider`).
- Streaming double-render fixed (`chatCompletion` returns `streamed`; client resets the streaming bubble per iteration).
- **Streaming tool-call name/id doubling fixed** — had broken tool calling on every streaming provider (`"view_fileview_file"` → unknown tool).
- **Streaming usage capture fixed** — token counts in terminal `choices:[]` chunks are no longer dropped.
- `parseStreamingResponse` exported + unit-tested (text accumulation, tool-call fragment assembly, malformed-chunk resilience).
- Low-RAM startup warning (`os.freemem() < 2 GB`).
- Opt-in **WSL execution backend** (`app/lib/sandbox.js`) with graceful degradation, Settings toggle, and honest boundary docs — off by default; host PowerShell remains the fallback.
- `.gitignore` hardened (cert/key/credential patterns) for the now-public repo.
