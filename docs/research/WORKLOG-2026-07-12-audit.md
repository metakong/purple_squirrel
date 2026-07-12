# Full-Codebase Audit Worklog — 2026-07-12 (Claude Fable 5)

Purpose: durable progress log for the whole-repo flaw/improvement sweep, so any
agent (or human) can resume if this session is cut off. Updated continuously.

## Status legend
- [ ] observed, not yet fixed
- [x] fixed + tested
- [~] deliberately deferred (with reason)

## Baseline (already shipped earlier this session, all tested 37/37)
- Smart difficulty-based routing (lib/catalog.js + lib/router.js), route_plan SSE + router trace spans
- Dropdown-only model selection in Settings; ⚡ per-chat override picker; centered dialogs + ✕
- Fixes: keypool.remove() state shift; O(n²) text_delta render + autoscroll; empty-model save guard
- Server currently running fresh on port 4477 with all of the above

## Audit queue (remaining unreviewed modules)
- [ ] lib/trace.js
- [ ] lib/vault.js
- [ ] lib/walker.js
- [ ] lib/policy.js
- [ ] lib/agora.js
- [ ] lib/diff.js
- [ ] lib/heartbeat.js
- [ ] lib/sandbox.js
- [ ] server.js re-pass (smaller issues)
- [ ] public/app.js re-pass

## Findings

### lib/trace.js (reviewed)
- [ ] T1 PERF: `query()` re-reads + re-parses up to 2 full days of JSONL on every
      call; called by /api/usage (HUD poll), usageSummary per turn end, budget,
      trace tab. On an 8 GB machine with big trace days this is the hottest
      wasted cycle in the app. Plan: incremental cache keyed by (file, byte
      size) — re-parse only appended bytes.
- [~] T2: writeHandoff scans 2000 spans per turn — acceptable once T1's cache
      lands (same query path).

### Implemented this pass (40/40 tests green)
- [x] T1 trace.js: incremental parse cache (readSpansCached) — re-parses only
      appended bytes; capped at 6000 spans/file in memory; corrupt lines still
      skipped; missing file clears cache. Test added.
- [x] P1 policy.js: regexes compiled once per policy mtime instead of on every
      tool-call evaluation. Behavior-identical; tier test added.
- [x] R1 router.js: budget-aware ladder ordering (was my Agora proposal
      ag-mrh42has81k NEXT item; human blanket-authorized). providerPressure()
      folds today's 429s from trace.budgetByKey() into a stable demotion sort —
      ladder quality order preserved among equally-pressured providers; failure
      degrades to no demotion. Deterministic deps injection in tests.
- reviewed clean: walker.js, agora.js, heartbeat.js, diff.js, sandbox.js,
  governance/AGENTS.policy.json (force-push + .env covered)

- [x] Q1: free-tier daily request limits (docs/research provider table:
      google 1500, groq 1000, openrouter 50 conservative, github 150) added to
      config.PROVIDERS.freeTier, surfaced as "used/limit req" + "⚠ near daily
      cap" in the Settings keys editor, and folded into router pressure
      (≥90% of rpd → demoted BEFORE the 429). Test added.

## Pass 3 (human asked for more upgrades) — COMPLETE, 42/42 tests green
- [x] B1: token-based free-tier budgets: cerebras freeTier.tpd=1M,
      mistral tpd=33M (≈1B/month); providerPressure demotes at ≥90% of tpd;
      keys editor shows tok-used/tpd + near-cap warning. Test added.
- [x] S1: session resume — real gap fixed: sessions persisted server-side but
      the UI minted a random id per load so resumption never happened. Added
      titles (first user msg) to /api/sessions, GET /api/session?id (display-
      shaped replay, Agora-reminder turns filtered), 🕘 picker popover with
      "New chat" + recent sessions; resume replays history and continues the
      conversation under the old id. Live-verified in browser.
- [x] D1: tool durationMs + non-ok status in audit entries and tool_call trace
      spans (implements gemini-2.5-flash's Agora proposal ag-mrgpigsi552);
      Audit tab shows both.
- [x] U1: maxIterations is now a slider with live value readout.
- Live verification: no server/browser errors; session picker lists 16
  sessions; resuming "verify-router" replayed user+assistant turns; slider
  updates live; dialog ✕ close confirmed working.

## COMPLETE — final state 2026-07-12
- 41/41 tests green (`node --test tests/core.test.js` from app/)
- Server restarted on new code; no server or browser console errors;
  /api/config confirms freeTier + routing.mode=auto live.
- Deferred (logged above with reasons): V1 macOS keychain argv exposure;
  T2 handoff scan (subsumed by T1 cache).
- Remaining future ideas (Agora): token-based budgets for cerebras/mistral
  (tpd/tpm, not rpd); dedicated WSL distro with automount off for real
  isolation; A2A task queue in HEARTBEAT.json.

### lib/vault.js (reviewed)
- [~] V1: macOS `security add-generic-password -w <hex>` puts the data key on a
      command line, contradicting the "never on a command line" comment. Windows
      is the deployment target and the exposure window is ms-scale; deferred —
      noted for any future macOS deployment (use `security -i` batch mode).
- OK otherwise: DPAPI chain, honest fallback reporting, atomic writes.
