# Changelog

All notable changes, with dates and reasoning (Constitution Principle 1: the "why", not just the "what").

## [2.1.0] — 2026-07-10

### Added — The Agora (why: user directive — a watercooler where every agent ends each task with a signed brainstorm for peer critique)
- `.agent/agora/AGORA.md`: committed, append-only, size-rotated board; entries signed with public model identity; format is machine-parsable.
- `agora_read`/`agora_post` agent tools; the agent loop enforces one end-of-task post (toggleable: Settings → "Agora ritual"); recent entry titles injected into the system prompt so agents critique instead of duplicating.
- Agora tab in the UI with a human posting form; board seeded with Mistral's review summary, Claude's implement/reject critique of it, and two new proposals.

### Added — from Mistral's review (docs/research/MISTRAL.md), implemented with judgment
- Cross-platform vault (#1): DPAPI on Windows (unchanged), macOS Keychain, Linux libsecret, AES-256-GCM machine-bound fallback replacing the old plaintext fallback. Legacy vault format reads transparently.
- Key health scoring (#4): per-key success/latency history; selection = weight × Laplace-smoothed health ÷ in-flight; health % and latency in the Keys tab.
- Session persistence (#6, lean): `data/sessions/` per-session history, auto-resume after restart, pruned to 50.
- Trace analytics (#7, lean): per-model success rate, rate-limit count, average latency in usage summary + Keys tab.
- Outline prioritization (#7-lite of #3): entry-point and recently-modified files get context budget first.
- Custom providers (safe subset of #2): declarative OpenAI-compatible endpoints in config — no plugin code loading.

### Rejected from Mistral's review (why: constitutional conflicts — reasoning posted to the Agora)
- Plugin code loading (violates zero-dependency invariant), multi-user collaborative UI (violates loopback-only invariant), auto-applied self-improvement (violates Fail-Safe Default; the Agora is its human-gated replacement), time/role-based policy (no user for it in a single-operator tool). A2A coordination deferred.

## [2.0.0] — 2026-07-10

### Restructured (why: adopt the Sovereign Agent Repository standard from `docs/research/Agentic Repository Architecture Design.md`, corrected per the Gemini critique)
- Repo layout: `.agent/` (machine partition, volatile state gitignored under `.agent/run/`), `governance/` (policy-as-code), `docs/` (human docs + research archive), `data/` (all user state, gitignored).
- Removed empty accidental directories (`agents/`, `brainstorming/`, `changelog/`, `logs/`, `research/` root clutter).
- `vibe-logger` experiment archived to `docs/research/vibe-logger-experiment/` (source only); its concept absorbed natively as Vibe Trace.

### Added
- **Vibe Trace**: append-only JSONL spans (OTel GenAI attribute names) for every turn, LLM call, tool call, and approval; mandatory `why` on every agent tool call; auto-generated `.agent/run/HANDOFF.md` digest for agent/human continuity.
- **DPAPI secrets vault** (`data/secrets.vault`): keys encrypted at rest, machine+account bound, stdin-piped (never on argv). Legacy keys in `config.json` auto-migrate into the vault.
- **Tiered Policy-as-Code**: `governance/AGENTS.policy.json` (Tier 1/2/3) enforced by `lib/policy.js` with a built-in Tier-3 hard floor; Tier-2 actions require a human gate even in YOLO mode.
- **Heartbeat protocol**: `.agent/run/HEARTBEAT.json` session locks with foreign-lock detection.
- **Security hardening**: Host-header allowlist (DNS-rebinding defense), Origin validation on mutating requests (CSRF defense), nosniff headers.
- **Test suite** (`node --test`) + GitHub Actions CI on windows-latest (eval-first rigor).
- Nested `app/AGENTS.md` operational guide, `.agent/FIRST_PRINCIPLES.md` domain invariants, `CLAUDE.md` thin adapter, `README.md`, `SECURITY.md`, MIT `LICENSE`.

### Changed
- Complete UI redesign: purple design system, collapsible git-aware file tree with filtering, Trace timeline tab with handoff digest view, live YOLO switches in the header, token-usage HUD, toast notifications, inline Tier-2 approval banners with diffs.
- Config split: non-secret settings in `data/config.json`; provider registry moved to code; keys only in the vault.

## [1.0.0] — 2026-07-10

- Initial VibeCode Command Center: zero-dependency Node server, multi-provider free-tier routing (OpenRouter, Google, Groq, Cerebras, GitHub Models, Mistral, DeepSeek, Kimi), weighted/LRU key rotation with 429/402 cooldowns, agent tool loop (git-aware list/view/grep/write/replace/PowerShell), YOLO toggles with destructive-command guardrails, live diffs, audit log.
