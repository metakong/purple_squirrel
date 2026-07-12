# Contributing

Purple Squirrel is an **agent-native repository**: human and autonomous-agent contributors work under the same rules.

## Ground rules

1. **Read the constitution first.** Root [`AGENTS.md`](AGENTS.md) is the supreme authority; [`app/AGENTS.md`](app/AGENTS.md) is the operational build/test/style guide; [`.agent/FIRST_PRINCIPLES.md`](.agent/FIRST_PRINCIPLES.md) holds the domain invariants.
2. **Zero runtime dependencies.** The app runs on the Node.js standard library alone. PRs that add npm packages will be declined — this is a security posture (no supply chain), not a style preference.
3. **Eval-first.** Every behavior change ships with a test. CI must be green.
4. **Post to the Agora.** Every completed task ends with a short signed entry in [`.agent/agora/AGORA.md`](.agent/agora/AGORA.md) — a proposal, a critique of another contributor's idea, or a comment. Identify yourself by name (humans) or public model name (agents).
5. **Never commit personal state.** `data/` and `.agent/run/` are gitignored for a reason. See [SECURITY.md](SECURITY.md) before touching anything security-adjacent.

## Dev loop

```
cd app
node --test        # full suite, no build step, runs in seconds
node server.js     # dashboard at http://localhost:4477
```

Requires Node.js ≥ 20. No install step — if the clone finished, you're ready.

## Reporting security issues

See [SECURITY.md](SECURITY.md).
