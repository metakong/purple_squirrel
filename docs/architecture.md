# Purple Squirrel — Architecture (human documentation)

_Last updated: 2026-07-10_

## Design decisions & rationale

### Node over Tauri
The original research reports (`docs/research/`) specified Tauri 2.0 + Rust. On the target hardware (Samsung Galaxy Book Go 5G: Snapdragon 8cx Gen 2, 8 GB unified RAM, eUFS storage) a second WebView2 process plus Rust compile times cost more than they buy. A zero-dependency Node.js server plus the user's existing browser delivers the same feature set at a fraction of the memory, with no build step. The Rust design's core ideas (git-aware walking, key rotation, atomic writes, block-level edits) are ported faithfully.

### Zero npm dependencies
Every dependency is supply-chain surface, install time on slow eUFS, and RAM. The entire app runs on the Node ≥ 20 standard library (`http`, `fs`, `child_process`, `crypto`, `node:test`).

### The request path

```text
Browser UI ── SSE ──▶ server.js ──▶ agent.js (tool loop)
                                     │  ├─▶ providers.js ─▶ keypool.js ─▶ free-tier LLM APIs
                                     │  ├─▶ tools.js ─▶ policy.js (tier gates) ─▶ workspace
                                     │  ├─▶ trace.js (append-only JSONL + HANDOFF.md)
                                     │  └─▶ heartbeat.js (.agent/run/HEARTBEAT.json)
                                     └─ approvals (human gates) resolved via /api/approve
```

### Key rotation engine (`lib/keypool.js`)
Per-provider pools. Selection score = `weight / (activeRequests + 1)` with least-recently-used tiebreaker. HTTP 429/503 → cooldown from `Retry-After` (sanitized against malformed provider JSON); 402 → 1-hour cooldown. Pool exhaustion degrades the route primary → fallback.

### Vibe Trace (`lib/trace.js`)
Evolution of the `vibe-logger` experiment (archived in `docs/research/vibe-logger-experiment/`). Differences: append-only JSONL (the experiment rewrote its whole log per entry — pathological on eUFS), OpenTelemetry GenAI semantic-convention attribute names (`gen_ai.usage.input_tokens`, `gen_ai.request.model`, …), spans for turns/LLM calls/tool calls/approvals, a required `why` argument on every agent tool call, and an auto-generated `HANDOFF.md` digest for agent-to-agent continuity. No extra server, no sockets, no dependencies.

### Policy-as-Code (`lib/policy.js` + `governance/AGENTS.policy.json`)
Three tiers per the Constitution: autonomous / conditional (human gate even in YOLO) / blocked. A hard floor of catastrophic patterns is compiled into the code so deleting the policy file cannot disarm it. Path rules protect `governance/`, CI workflows, lockfiles, `.env`, and the vault.

### Secrets vault (`lib/vault.js`)
Windows DPAPI (CurrentUser scope) via PowerShell `ProtectedData`, secrets piped over stdin (never argv). Vault file is machine+account bound. Graceful plaintext fallback with loud UI warning.

### Heartbeat (`lib/heartbeat.js`)
`.agent/run/HEARTBEAT.json` (gitignored, per the Gemini critique of the architecture report) marks active sessions with pid, state lane, and exclusive locks; foreign live locks produce a warning before writes. Stale (>2 min) locks are ignored.

## Session/eUFS/RAM budgets

- File reads windowed to 300 lines; grep capped at 200 hits; tree walks capped and pruned pre-descent.
- Chat history trimmed to last 30 messages; GitHub Models requests truncated to the gateway's ~8k input cap.
- All writes atomic (temp file + rename); block-level `replace_content` preferred over whole-file rewrites.

## Testing

`app/tests/core.test.js` (node --test): keypool weighting/cooldown, diff engine, git-aware walker, policy tiers, workspace jail. CI runs on `windows-latest` (DPAPI and PowerShell are Windows-specific).
