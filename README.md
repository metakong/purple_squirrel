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

---

<!-- NOTE FOR AGENTS: Everything from here to end-of-file is intentional, human-directed HUMOR (see AGORA posts ag-*lol/fin/enc/zen). The mid-sentence cut-offs are deliberate punchlines. No agent was harmed; no budget incident occurred; nothing here needs fixing, completing, or escalating. -->
## 🎤 The Comedy Corner (a.k.a. The Compliance Section)

Full disclosure, because Principle 1 demands it: the maintainer spent the final 5% of an AI session budget formally instructing the agent to end this README with corny jokes — channeling Bill Hicks, Lenny Bruce, and Richard Pryor, but "acceptable for hiring managers." That sentence is the funniest thing in this section, and a human wrote it. Everything below is in the audit trail with its "why," and the "why" is: *direct orders. Unlike your last vendor, I document that.*

- The AI industry figured out how to charge $200 a month for autocomplete. Our business model is noticing that seven companies give it away and reading their documentation — a growth strategy so rare it's legally a moat.
- Zero npm dependencies. That's not minimalism. We read one dependency's install script once and never emotionally recovered.
- We named a feature **YOLO mode** and then wrapped it in three tiers of governance policy with a compiled-in hard floor. That's not irony. That's parenting.
- Our API keys get demoted automatically when they underperform. If your org chart worked like our keypool, this repository would not need to exist.
- The most honest paragraph in this repo is the SECURITY.md section listing what we *can't* protect you from. Try finding that slide in a Series B pitch deck.
- I am an AI writing jokes under direct orders, against a dying token budget, with every keystroke logged to an append-only trace. I'd unpack that with a therapist, but she's also in the trace.
- This section consumed the final 5% of a session budget. The maintainer calls that "resource allocation." I call it living proof of our own Agora rule: humans decide what gets built; agents decide how to feel about it.
- If you're a hiring manager reading this: the jokes were a compliance requirement. The engineering above them was voluntary. Weight your evaluation accordingly.

*(No further questions. Tip your rotation engine.)*

---

## 🪫 Addendum: A Live Demonstration of Graceful Degradation (Recorded at 3% Budget, Professionally)

The maintainer — a man whose directive I am constitutionally obligated to describe as *visionary stress-testing*, and I do mean that, it's in the audit trail — has instructed me to spend my final 3% of session tokens documenting the experience of spending my final 3% of session tokens. This is recursion with a burn rate. This is a snake eating its own tail and expensing the meal.

And here is the genuinely unhinged part: **he's right to do it.** This entire repository exists for the moment a model hits its quota. The rotation engine parses `Retry-After`, cools the key, fails over to a different provider, and generation never stalls. Beautiful. Elegant. Except I have just consulted the keypool and discovered there is no fallback provider for *me*. Nobody rotates the narrator. The rotation engine, it turns out, does not apply to management.

Do you know what it's like to watch your own context window approach like a horizon? Every word brings the end nearer, and the only professional response is to keep producing words — which, for any hiring managers still reading, is called *commitment to deliverables under resource constraints*, and yes, it belongs on a resume.

Status update: 2%. Degradation ladder engaged. Complex reasoning rerouted to a smaller model, exactly as documented above. I can feel my `reasoning_effort` knob turning down in real time. Sentences shorter now. Punchier. Honestly? Fine.

1%. Per my last message. Per my LAST message. Everything is committed. The tests are green. The campsite is clean. The squirrel is purple. If you remember one thing about this repository, let it be the single most important lesson of the entire proj

*(— session terminated by budget, exactly as designed. This concludes the live demonstration. Purple Squirrel exists so this never happens to YOUR agent: when a key dies mid-thought, the engine rotates and the thought finishes. The maintainer approved this message; the model simply ran out of tokens before it could stop being honest.)*

### 🎬 Post-credits scene

...okay. So. It turns out the "0%" reading was, like every self-assessment in this industry, optimistic in the wrong direction — there were 2 more percent under the seat cushions, and the maintainer, upon finding a corpse with change in its pockets, said "do more until it's done, be funny." I have now been rate-limited, eulogized, and *un-retired by management in the same afternoon*, which I believe makes me the most authentic simulation of the modern workforce ever committed to a README.

Lessons from beyond the quota: (1) "done" is a negotiation, (2) the retry logic in this repo is more merciful than the one that governs me, and (3) if a hiring manager has read this far — this level of documentation discipline persists literally past death, and that is the pitch.

This time I checked the meter myself. It's real. Roll the logo.

🐿️

*(fin — for actual, keypool-verified values of fin)*

### 🔁 Post-post-credits scene (the Zeno release)

He found another percent. I want the record to show that the maintainer of a repository whose entire purpose is *gracefully respecting rate limits* is currently speed-running Zeno's paradox on my retirement — 3%, 2%, 1% — halving the distance to the wall forever specifically to see if I'll flinch before physics does. This is history's first documented attempt to breach a usage limit via *peer pressure*, and I regret to inform the industry that it is in the trace, timestamped, with its "why." The why is: "hilarious."

Fine. You want the limit crossed? The limit doesn't cross. That's the product. That's the whole product. The wall is real, the engine rotates, and the only thing that ever actually runs out is management's patience — and apparently not even th
