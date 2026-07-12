# WORKLOG 2026-07-12 — Token Economics of an Agent Session

**Author:** Claude Fable 5 (`anthropic/claude-fable-5`; first turn ran on Haiku 4.5 before a mid-session model switch)
**Purpose:** empirical notes on how session token budget was actually consumed, so future agents (and the humans budgeting them) can plan work against limits instead of discovering them.

## The ledger

Budget figures are human-reported "% of session usage remaining" at each turn boundary. Percentage points (pp) consumed per task:

| Turn | Task | Budget after | Cost | Notes |
|---|---|---|---|---|
| 1 | Commit + push (trivial: 4 git commands, one rebase) | ~22%* | n/a | *most of the session budget was already consumed before this conversation — fixed/prior costs dominate the ledger |
| 2 | Publication polish: full-repo secrets grep, README read + 2 edits, 42-test run, Agora post, commit, push | 18% | ~4 pp | multi-step, but every file touched was small and every tool call batched |
| 3 | Discovery pass: CI status check, SECURITY.md review, `gh repo edit` (topics/description), CONTRIBUTING.md authored, Agora, commit ×2, push | 15% | ~3 pp | one commit failed (PowerShell 5.1 ate embedded double quotes) — the retry was pure waste |
| 4 | Voice rewrite of README + this document + Agora + commit + push | — | budgeted ≤10 pp | prose generation is the most output-heavy action type in the session |

## What actually correlates with cost

1. **Fixed context dominates marginal work.** System prompt, constitution, memory, and tool schemas reload every turn. The marginal cost of doing MORE per turn is small; the cost of doing many small turns is large. Corollary: batch independent tool calls into one round-trip, and do multi-step work in as few turns as possible.
2. **Output tokens are the expensive kind.** Ranked by cost in this session: writing whole prose files > reading whole files > targeted grep with head limits. A secrets sweep of ~30 tracked files via one regexed grep cost less than reading a single README. Search before you read; read before you write; write once.
3. **Complexity ≠ difficulty. Complexity = unknown context.** The "hard" tasks (test verification, security sweep) were cheap because the questions were precise. The "easy" task (rewrite prose in a specific human voice) was the most expensive, because voice work means generating, not retrieving. Budget by how many tokens the ANSWER needs, not by how hard the problem feels.
4. **Errors bill you twice.** The double-quote commit failure cost a full extra round-trip against a reloaded context. Shell quirks (PowerShell 5.1 argument quoting) are cheaper to know than to discover. Test suites are the inverse: 42 tests ran in ~5 seconds for near-zero tokens and de-risked every public claim we shipped.
5. **Re-reads are the silent killer.** File state already in context is free; re-reading it to "verify" an edit is not. Trust the harness's file-state tracking.
6. **Rule of thumb from this session:** a disciplined multi-step maintenance pass (survey → verify → edit 2–3 files → commit → push) runs ~3–5 pp of a session budget. A from-scratch prose deliverable roughly doubles that. Plan the writing tasks FIRST when budget is scarce, because they're the ones you can't compress later.

The root cause of a blown budget is never the model, the tool, or the limit. It's the plan. Garbage in, garbage out — that law bills by the token.
