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
| Command execution backend | Default is host PowerShell. An **opt-in** WSL backend (`app/lib/sandbox.js`, off by default) can route `run_command` into a Linux distro's bash. See the honest caveat below — it is process/userland separation, not a strong jail. |
| Repository hygiene | All personal state lives in gitignored `data/` and `.agent/run/`. A fresh clone contains no user data. |

## What this tool intentionally does NOT protect against

- A malicious local process running as your user (it can read what you can read).
- Prompt-injected model output: YOLO mode executes agent-proposed commands. Tier-3 blocks and guardrails reduce the blast radius, but if you point the agent at untrusted repository content, turn auto-run off.
- Provider-side data handling — read each provider's free-tier terms (notably Mistral's data-training opt-in, which is gated behind an explicit consent toggle).
- The optional WSL sandbox is **not** a strong security boundary as shipped. It gives the agent a separate Linux process/environment namespace, but WSL automounts your Windows drives under `/mnt` by default, so a command can still reach the Windows filesystem. It is useful for Linux tooling and as a foundation for stronger isolation (a dedicated distro with automount disabled, or confining the working directory), not as a containment jail. Treat commands run in it with the same caution as host commands.

## Reporting a vulnerability

Open a GitHub issue with the `security` label (no secrets/PoCs against third parties in the issue body), or contact the maintainer privately. Please include reproduction steps and affected file paths.
