---
type: domain_invariants
version: 2.0.0
scope: application_layer
---

# First Principles — Domain Invariants

Permanent conceptual rules of Purple Squirrel. These cannot be bypassed by any tooling update, refactor, or agent decision. Verify against this file before generating code (pre-flight reasoning check).

## Domain Invariants

- **Local-only surface:** The server binds `127.0.0.1` exclusively. No feature may ever listen on a public interface, add remote access, or introduce telemetry. The only outbound traffic is to LLM provider endpoints the user explicitly configured.
- **Zero-cost invariant:** Only free-tier provider endpoints are integrated. Any change that could silently incur billing (e.g., Google projects with billing enabled) must surface an explicit warning in the UI.
- **Zero-dependency invariant:** The app runs on the Node.js standard library alone. No npm packages may be added to `app/` — every dependency is an attack surface, a supply-chain risk, and an eUFS install cost on the target hardware.
- **Secrets boundary:** API keys exist only inside `data/secrets.vault` (DPAPI-encrypted) and in memory. They must never be written to `config.json`, traces, audit logs, the handoff digest, HTTP responses, or console output. UI receives masked keys only.
- **Workspace jail:** Every agent file operation resolves through `resolveInWorkspace()` and must stay inside the user-opened project directory. No tool may follow a path outside it.
- **Append-only trace:** `data/traces/*.jsonl` is append-only. Never rewrite, truncate, or reorder trace files — the transparency guarantee depends on it.
- **Policy supremacy:** `governance/AGENTS.policy.json` Tier 3 rules are enforced in code with a built-in hard floor that survives even deletion of the policy file.

## Hardware Invariants (Samsung Galaxy Book Go 5G)

- 8 GB unified LPDDR4X RAM: keep server RSS lean; never load whole directory trees or giant files into memory; window all file reads.
- eUFS storage: prefer append and block-replace writes over whole-file rewrites; prune ignored directories before descent; all writes atomic (temp + rename).
- ARM64 Windows: never introduce a dependency that requires x64 emulation or native compilation.

## Architectural Decomposition

- **State:** durable user state in `data/` (gitignored); volatile coordination state in `.agent/run/` (gitignored); code and policy in git.
- **Time:** all persisted timestamps are ISO-8601 UTC plus epoch millis.
- **Coordination:** multi-agent sessions coordinate via `.agent/run/HEARTBEAT.json`; check `foreignLock()` before multi-file writes.
- **Interface:** every HTTP handler validates Host, Origin (mutating requests), and loopback remote address before doing work.
