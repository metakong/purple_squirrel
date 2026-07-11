# Security Policy

## Threat model & guarantees

Purple Squirrel is a **local-first** tool. Its security posture:

| Surface | Control |
|---|---|
| Network exposure | Server binds `127.0.0.1` only and rejects any non-loopback socket. |
| DNS rebinding | `Host` header allowlist (`localhost` / `127.0.0.1` / `[::1]` with the configured port). |
| CSRF from malicious websites | `Origin` header validated on every non-GET request; no CORS headers are ever emitted. |
| API keys at rest | Encrypted with Windows DPAPI (CurrentUser). The vault (`data/secrets.vault`) cannot be decrypted on another machine or account. Plaintext fallback only if DPAPI is unavailable, and the UI warns loudly. |
| API keys in transit | Sent only as `Authorization` headers directly to the provider endpoints you configured, over HTTPS. |
| Secrets in artifacts | Keys never enter `config.json`, trace files, audit logs, the handoff digest, or HTTP responses (masked display only). |
| Agent blast radius | Workspace jail (`resolveInWorkspace`), tiered policy-as-code (`governance/AGENTS.policy.json`) with a built-in Tier-3 hard floor, human approval gates for Tier-2 actions, and full action tracing. |
| Repository hygiene | All personal state lives in gitignored `data/` and `.agent/run/`. A fresh clone contains no user data. |

## What this tool intentionally does NOT protect against

- A malicious local process running as your user (it can read what you can read).
- Prompt-injected model output: YOLO mode executes agent-proposed commands. Tier-3 blocks and guardrails reduce the blast radius, but if you point the agent at untrusted repository content, turn auto-run off.
- Provider-side data handling — read each provider's free-tier terms (notably Mistral's data-training opt-in, which is gated behind an explicit consent toggle).

## Reporting a vulnerability

Open a GitHub issue with the `security` label (no secrets/PoCs against third parties in the issue body), or contact the maintainer privately. Please include reproduction steps and affected file paths.
