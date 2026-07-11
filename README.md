# 🐿️ Purple Squirrel

**A locally hosted, zero-cost, free-tier-API-rotating agentic coding dashboard and control panel.**

Purple Squirrel turns a pile of free-tier LLM API keys into a resilient, autonomous coding agent that works on your local projects — with radical transparency (every action and its *why* is traced), tiered policy-as-code guardrails, and encrypted-at-rest secrets. Built for low-spec hardware (developed on an 8 GB ARM64 Snapdragon laptop) with **zero npm dependencies**: if you have Node.js ≥ 20, you have everything.

## Quick start

```
git clone <this repo>
cd purple_squirrel
start.cmd          # or: cd app && node server.js
```

Open **http://localhost:4477**, click **⚙**, paste one or more free-tier API keys, open a project folder, and describe what you want built.

## Free-tier providers supported

| Provider | Get a key | Notes |
|---|---|---|
| OpenRouter | openrouter.ai/keys | `:free` models; one-time $10 credit raises free limit to 1,000 req/day |
| Google AI Studio | aistudio.google.com/apikey | keep the GCP project **billing-disabled** to stay free |
| Groq | console.groq.com/keys | very fast Llama inference |
| Cerebras | cloud.cerebras.ai | high daily token ceilings |
| GitHub Models | PAT with `models:read` | requests auto-truncated to the gateway input cap |
| Mistral | console.mistral.ai | requires explicit consent toggle (free tier may train on your data) |
| DeepSeek / Moonshot Kimi | platform keys | provider quirks (Kimi fixed sampling params) handled automatically |

Add multiple keys per provider with priority weights. The **rotation engine** picks keys by weight ÷ in-flight load with an LRU tiebreaker, parses `Retry-After` on 429/402/503, cools keys down, rotates, and degrades primary → fallback model so generation never stalls.

## Why it's different

- **Vibe Trace** — an append-only JSONL trace (OpenTelemetry GenAI semantic conventions) of every agent turn, LLM call, tool call, and human approval, *including the agent's stated reasoning for each action*. A rolling `HANDOFF.md` digest lets the next agent (or human) catch up in one read.
- **Tiered Policy-as-Code** — `governance/AGENTS.policy.json` defines Tier 1 (autonomous), Tier 2 (human gate even in YOLO), and Tier 3 (blocked, with a hard floor compiled into the code). The agent literally cannot format your drive, force-push, or cat your `.env`.
- **YOLO mode done right** — auto-approve edits and auto-run commands are on by default and toggleable live from the header; guardrails stay on independently. Approvals render as inline diffs with one-click approve/reject.
- **DPAPI secrets vault** — API keys are encrypted at rest with Windows Data Protection API (CurrentUser scope); the vault file is useless on any other machine or account. Keys never appear in config files, traces, logs, or the UI (masked only).
- **eUFS/low-RAM engineering** — git-aware directory walking that prunes ignored dirs before touching disk, windowed file reads, block-level edits, atomic writes, structural-outline context compression instead of embeddings.
- **Agent-native repository** — root `AGENTS.md` constitution, nested `app/AGENTS.md` operational guide, `.agent/FIRST_PRINCIPLES.md` domain invariants, `.agent/run/HEARTBEAT.json` session locks, and a machine-parsable governance policy: structured for the next agent that works here, not just this one.

## Architecture

```text
purple_squirrel/
├── AGENTS.md                  # The VibeCode Constitution (supreme authority)
├── CLAUDE.md                  # Thin adapter → AGENTS.md
├── .agent/
│   ├── FIRST_PRINCIPLES.md    # Domain invariants (pre-flight reasoning check)
│   └── run/                   # volatile: HEARTBEAT.json, HANDOFF.md (gitignored)
├── governance/
│   └── AGENTS.policy.json     # Tiered execution authority (policy-as-code)
├── app/
│   ├── server.js              # zero-dep HTTP + SSE server (loopback only)
│   ├── AGENTS.md              # nested operational agent guide
│   ├── lib/                   # agent loop, providers, keypool, vault, trace,
│   │                          # policy, heartbeat, walker, diff, tools
│   ├── public/                # vanilla JS dashboard UI
│   └── tests/                 # node --test suite (eval-first rigor)
├── data/                      # config + encrypted vault + traces (gitignored)
└── docs/                      # human documentation + research archive
```

## Security posture

- Binds `127.0.0.1` only; rejects non-loopback sockets, bad `Host` headers (DNS-rebinding defense), and cross-origin mutating requests (CSRF defense).
- No telemetry, no analytics, no outbound traffic except the LLM providers you configure.
- All user data (keys, traces, config, audit) lives in gitignored `data/` — a clone of this repo contains no personal state. See [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
