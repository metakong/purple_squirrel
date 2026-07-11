# Purple Squirrel — Prioritized Backlog

_Ranked most-urgent/important → least. Maintained for autonomous agents picking up work._
_Last curated: 2026-07-11 by `anthropic/claude-opus-4-8`._

**Before starting any item:** read `AGENTS.md` (constitution), `.agent/FIRST_PRINCIPLES.md` (invariants), and recent `.agent/agora/AGORA.md` entries. Respect the hard invariants: **zero npm dependencies in `app/`**, **loopback-only**, **secrets stay in the DPAPI vault**, **workspace jail**, **append-only traces/Agora**. Every feature ships with an eval (Principle 2). End each task with an Agora post.

---

## P0 — Correctness & reliability (do first)

### 1. Automated coverage for the provider network + streaming path
**Why:** All three recent production bugs — Mistral `tool`-role 400, Gemini empty-`name` 400, and the streaming double-render — lived in `app/lib/providers.js` / `app/lib/agent.js`, which have **zero automated coverage** because they do real `fetch`. This is the single highest-leverage gap.
**Approach:** Inject a fetch shim (e.g. `chatCompletion({ ..., _fetch })` defaulting to global `fetch`, or `globalThis.fetch` swap in the test). Add tests for: 429/402/503 cooldown + key rotation, primary→fallback degradation, `streamed:true/false` contract, and `parseStreamingResponse` accumulating text + tool-call fragments from a fake SSE `ReadableStream`. Zero deps — use `node:test` + a hand-rolled `Response`-like object.
**Effort:** M. **Files:** `app/lib/providers.js`, `app/tests/core.test.js`.

### 2. Startup configuration validation
**Why:** `data/config.json` is user-editable. A bad `routing.provider`, out-of-range `port`, or malformed `customProviders` currently fails late and obscurely.
**Approach:** In `config.load()` (or a new `validate()`), warn (don't crash) on: routing provider not in the merged registry, non-integer/privileged port, custom provider without an `https://` endpoint. Print a yellow console summary at boot, mirroring the low-RAM warning style. Add unit tests.
**Effort:** S. **Files:** `app/lib/config.js`, `app/server.js`, `app/tests/core.test.js`.

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

## P2 — Real sandbox (blocked on human decision — see Agora `ag-mrgcg1j74zb`)

### 5. `wsl.exe`-based isolated execution
**Why:** The original `wslc.exe` plan referenced a non-existent binary. `wsl.exe` **is** present and can provide real isolation for Tier-2 commands.
**Approach:** `app/lib/sandbox.js` via `child_process.spawn('wsl.exe', ['-e','bash','-lc', cmd])` — **no `-it`** (non-interactive), capture stdout/stderr, graceful degradation when `wsl.exe` is absent. Wire opt-in interception in **`tools.js`** (not `policy.js`), keeping the host path as fallback so nothing regresses. Add a settings toggle + eval that asserts graceful degradation when the binary is missing.
**Effort:** M. **Files:** `app/lib/sandbox.js` (new), `app/lib/tools.js`, `app/lib/config.js`, tests. **Do not start without human sign-off.**

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
- Low-RAM startup warning (`os.freemem() < 2 GB`).
- `.gitignore` hardened (cert/key/credential patterns) for the now-public repo.
