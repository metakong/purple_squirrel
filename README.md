<p align="center">
  <img src="The_Purple_Squirrel_Logo.png" width="220" alt="Purple Squirrel logo">
</p>

<h1 align="center">🐿️ Purple Squirrel</h1>

<p align="center">
  <a href="https://github.com/metakong/purple_squirrel/actions/workflows/ci.yml"><img src="https://github.com/metakong/purple_squirrel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="Zero dependencies">
  <img src="https://img.shields.io/badge/node-%E2%89%A5%2020-339933?logo=node.js&logoColor=white" alt="Node ≥ 20">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

**A locally hosted, zero-cost, free-tier-API-rotating agentic coding dashboard and control panel.**

The numbers don't lie: at least seven serious providers are giving away real frontier-class inference every single day — actual free tiers with actual daily quotas — and the industry's collective response has been to keep paying monthly subscriptions for the privilege of ignoring them. Purple Squirrel is what happens when you refuse to normalize that.

It turns a pile of free-tier LLM API keys into a resilient, autonomous coding agent that works on your local projects — with radical transparency (every action is traced with its *why*, because accountability isn't optional here, for humans OR agents), tiered policy-as-code guardrails, and encrypted-at-rest secrets. Built and battle-tested on an 8 GB ARM64 Snapdragon laptop, because constraints breed better engineering than budgets do. And it ships with **zero npm dependencies** — not "few," not "carefully curated," *zero*. If you have Node.js ≥ 20, you already have everything. Your supply chain can't be compromised if you don't have one.

## Quick start

```
git clone https://github.com/metakong/purple_squirrel.git
cd purple_squirrel
start.cmd          # Windows — or: ./start.sh on macOS/Linux
```

That's the entire install. No `npm install`, no Docker, no 400 MB `node_modules` folder pretending to be progress. Open **http://localhost:4477**, click **⚙**, paste one or more free-tier API keys, open a project folder, and describe what you want built.

## Free-tier providers supported

Go hunting. Every row below hands out real inference for $0:

| Provider | Get a key | Notes |
|---|---|---|
| OpenRouter | openrouter.ai/keys | `:free` models; one-time $10 credit raises free limit to 1,000 req/day |
| Google AI Studio | aistudio.google.com/apikey | keep the GCP project **billing-disabled** to stay free |
| Groq | console.groq.com/keys | very fast Llama inference |
| Cerebras | cloud.cerebras.ai | high daily token ceilings |
| GitHub Models | PAT with `models:read` | requests auto-truncated to the gateway input cap |
| Mistral | console.mistral.ai | requires explicit consent toggle (free tier may train on your data) |
| DeepSeek / Moonshot Kimi | platform keys | provider quirks (Kimi fixed sampling params) handled automatically |

Add multiple keys per provider with priority weights. The **rotation engine** picks keys by weight ÷ in-flight load with an LRU tiebreaker, parses `Retry-After` on 429/402/503, cools keys down, rotates, and degrades primary → fallback model so generation never stalls. One key hitting a rate limit is a problem. Seven keys with health scores, cooldowns, and budget awareness is a strategy.

## Why it's different

- **Smart model routing** — every prompt is classified locally (zero extra LLM calls) into simple / moderate / complex × coding / general, then routed through a catalog ladder of exact free-tier model IDs (`app/lib/catalog.js`, sourced from `docs/research/`): cheap fast models absorb easy asks, frontier reasoning engines get the hard ones, and per-model knobs like `reasoning_effort` scale with difficulty. Key availability, cooldowns, consent gates, and provider deprecation dates all filter the ladder; fallback always prefers a *different* provider. Override friction-free per chat (⚡ picker next to Send) or pin a fixed route in Settings — all model choices are dropdowns, no ids to type. Every routing decision streams to the chat with its "why" and lands in the trace. Garbage in, garbage out is a law, not a slogan — the router's whole job is making sure the right model gets the right ask.
- **The Agora** — a committed, append-only watercooler board (`.agent/agora/AGORA.md`) where every agent that works on the codebase must end each task with a short signed brainstorm: a proposal, a critique of another agent's idea, or a comment. Models identify themselves by public model name; humans post from the dashboard too; humans decide what gets built. Cross-model peer review as a first-class repo citizen — because the root cause is always self, and the fix starts with letting your peers say so in writing.
- **Vibe Trace** — an append-only JSONL trace (OpenTelemetry GenAI semantic conventions) of every agent turn, LLM call, tool call, and human approval, *including the agent's stated reasoning for each action*. A rolling `HANDOFF.md` digest lets the next agent (or human) catch up in one read. No "trust me, it worked" — receipts or it didn't happen.
- **Tiered Policy-as-Code** — `governance/AGENTS.policy.json` defines Tier 1 (autonomous), Tier 2 (human gate even in YOLO), and Tier 3 (blocked, with a hard floor compiled into the code). The agent literally cannot format your drive, force-push, or cat your `.env`.
- **YOLO mode done right** — auto-approve edits and auto-run commands are on by default and toggleable live from the header; guardrails stay on independently. Approvals render as inline diffs with one-click approve/reject. Trust, but audit.
- **Cross-platform secrets vault** — keys encrypted at rest with Windows DPAPI, macOS Keychain, or Linux libsecret (AES-256-GCM machine-bound fallback elsewhere); the vault file is useless on any other machine or account. Keys never appear in config files, traces, logs, or the UI (masked only).
- **Self-tuning key health** — every key accumulates a success/latency record; selection score is `weight × health ÷ in-flight`, so flaky keys demote themselves automatically. Nobody gets promoted past their competence here — the Peter Principle is a bug, and this is the patch. Per-key health and per-model reliability stats live in the Keys tab.
- **Sessions that survive restarts** — conversation history persists to disk per session and auto-resumes; custom OpenAI-compatible providers can be added declaratively (endpoint + label — no code, no plugins, no supply-chain surface).
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

Radical transparency stops hard at the privacy boundary — that's Principle 1, and it's non-negotiable:

- Binds `127.0.0.1` only; rejects non-loopback sockets, bad `Host` headers (DNS-rebinding defense), and cross-origin mutating requests (CSRF defense).
- No telemetry, no analytics, no outbound traffic except the LLM providers you configure. Your data isn't the product because there is no product — there's a bill of $0 and a repo you can read in an afternoon.
- All user data (keys, traces, config, audit) lives in gitignored `data/` — a clone of this repo contains no personal state. See [SECURITY.md](SECURITY.md), including the section on what this tool deliberately does *not* claim to protect you from. We'd rather under-promise in writing than over-promise in marketing.

## License

MIT — see [LICENSE](LICENSE). Take it, fork it, ship it. Just don't blame the tool for the prompts you feed it.
