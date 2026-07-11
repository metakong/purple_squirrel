// Agent loop: system prompt + structural outline context, OpenAI tool-calling
// iterations, approval gates, heartbeat session lock, and full Vibe Trace
// spans (turns, tool calls, reasoning) with a handoff digest per turn.
'use strict';
const fs = require('fs');
const path = require('path');
const { chatCompletion } = require('./providers');
const { TOOL_DEFS, executeTool } = require('./tools');
const { projectOutline } = require('./walker');
const trace = require('./trace');
const heartbeat = require('./heartbeat');
const agora = require('./agora');

function buildSystemPrompt(root, config) {
  let prompt = `You are VibeCode, an autonomous coding agent operating on the user's local project at "${root}" (Windows 11 ARM64, PowerShell shell).
Rules:
- Use the provided tools to inspect and modify the project. Prefer replace_content for edits; use write_file only for new files or full rewrites.
- Every tool call MUST include a short "why" argument stating your reasoning — it feeds the project's transparency trace.
- View files before editing them (skeptical memory: never assume a file's contents). Keep reads windowed to conserve context.
- After making changes, verify them when practical (run tests/build via run_command).
- If the same error occurs 3 times in a row, stop retrying and report to the user.
- Be concise. When done, summarize what you changed and why.
- Never touch files outside the workspace.
- THE AGORA RITUAL: after completing the user's task (and before your final summary), post exactly ONE short brainstorm to the shared agent board via agora_post — a novel improvement proposal, or a critique/comment on an existing entry (read them with agora_read). Sign-off happens automatically with your model identity. Keep it concrete; no filler.`;

  if (config.settings.agoraEnforced !== false) {
    const dig = agora.digest(root, 8);
    if (dig) prompt += `\n\n## Recent Agora entries (agent brainstorming board — critique or build on these)\n${dig}`;
  }

  for (const f of ['AGENTS.md', 'CLAUDE.md', '.vibe.md']) {
    try {
      const t = fs.readFileSync(path.join(root, f), 'utf8');
      prompt += `\n\n## Project guidelines (${f})\n${t.slice(0, 8000)}`;
      break;
    } catch { /* none */ }
  }

  if (config.settings.contextOutline) {
    const outline = projectOutline(root);
    if (outline) prompt += `\n\n## Project structural outline (signatures only)\n${outline}`;
  }
  return prompt;
}

/**
 * Run one agent turn. `emit(event)` streams SSE events to the client.
 */
async function runAgent({ root, config, history, userMessage, sessionId, emit, approvals, auditLog }) {
  trace.setEnabled(config.settings.traceEnabled !== false);

  // Respect a live foreign session lock (multi-agent coordination).
  const foreign = heartbeat.foreignLock();
  if (foreign) {
    emit({ type: 'status', text: `Warning: another agent session (${foreign.sessionId}, pid ${foreign.pid}) appears active on this repo.` });
  }
  heartbeat.write('working', { sessionId, project: root });
  trace.span({ kind: 'agent_turn', phase: 'start', sessionId, project: root, goal: String(userMessage).slice(0, 300), 'gen_ai.agent.name': 'vibecode' });

  const messages = [
    { role: 'system', content: buildSystemPrompt(root, config) },
    ...history,
    { role: 'user', content: userMessage }
  ];

  const editedFiles = new Set();
  let activeRoute = null;
  const ctx = {
    root,
    settings: config.settings,
    agoraPosted: false,
    getModelIdentity: () => activeRoute
      ? { author: `${activeRoute.model} via Purple Squirrel`, identity: `${activeRoute.provider}/${activeRoute.model}` }
      : { author: 'Unknown Agent', identity: 'unknown' },
    audit: (ev) => {
      const entry = { ts: Date.now(), ...ev };
      auditLog.push(entry);
      emit({ type: 'audit', entry });
      trace.span({ kind: 'tool_call', sessionId, name: ev.tool, target: ev.target, why: ev.why, status: ev.status || 'ok', 'gen_ai.operation.name': 'execute_tool' });
      if ((ev.tool === 'write_file' || ev.tool === 'replace_content') && !ev.status) {
        editedFiles.add(ev.target);
        heartbeat.write('working', { sessionId, project: root, locks: [...editedFiles] });
      }
    },
    emitDiff: (d) => emit({ type: 'diff', ...d }),
    requestApproval: (kind, detail) => new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2);
      approvals.set(id, resolve);
      heartbeat.write('awaiting-approval', { sessionId, project: root, locks: [...editedFiles] });
      emit({ type: 'approval_required', id, kind, detail });
      setTimeout(() => { if (approvals.has(id)) { approvals.delete(id); resolve(false); } }, 600000);
    })
  };

  const finish = (outcome) => {
    trace.span({ kind: 'agent_turn', phase: 'end', sessionId, project: root, outcome, filesEdited: [...editedFiles] });
    trace.writeHandoff();
    heartbeat.clear(sessionId);
    emit({ type: 'usage', summary: trace.usageSummary() });
    emit({ type: 'done' });
  };

  try {
    const maxIter = config.settings.maxIterations || 25;
    let agoraReminded = false;
    for (let iter = 0; iter < maxIter; iter++) {
      const { message, route } = await chatCompletion({
        config, messages, tools: TOOL_DEFS, sessionId,
        onStatus: (s) => emit({ type: 'status', text: s }),
        onDelta: (delta) => emit(delta)
      });
      activeRoute = route;
      emit({ type: 'route', provider: route.provider, model: route.model });

      const assistantMsg = { role: 'assistant', content: message.content || '' };
      if (message.tool_calls && message.tool_calls.length) assistantMsg.tool_calls = message.tool_calls;
      // DeepSeek contract: echo reasoning_content back only when a tool call occurred.
      if (message.reasoning_content && message.tool_calls && message.tool_calls.length) {
        assistantMsg.reasoning_content = message.reasoning_content;
      }
      messages.push(assistantMsg);

      // Only emit full text if we didn't stream it (for non-streaming providers)
      if (message.content && !route.streamUsed) emit({ type: 'text', text: message.content });

      if (!message.tool_calls || message.tool_calls.length === 0) {
        // The Agora ritual: one gentle enforcement round if the agent tried to
        // finish a substantive turn (it used tools) without posting.
        const usedTools = messages.some(m => m.role === 'tool');
        if (config.settings.agoraEnforced !== false && !ctx.agoraPosted && !agoraReminded && usedTools && iter < maxIter - 1) {
          agoraReminded = true;
          emit({ type: 'status', text: 'Agora ritual: asking the agent for its end-of-task brainstorm post…' });
          messages.push({ role: 'user', content: 'Before we finish: complete the Agora ritual. Call agora_post once with one concrete brainstorm (proposal, critique, or comment — read the board with agora_read first if useful), then give your final one-line summary.' });
          continue;
        }
        finish('completed');
        return messages.slice(1);
      }

      for (const tc of message.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch { /* keep empty */ }
        emit({ type: 'tool_call', name: tc.function.name, args });
        heartbeat.write('working', { sessionId, project: root, locks: [...editedFiles] });
        let result;
        try {
          result = await executeTool(tc.function.name, args, ctx);
        } catch (e) {
          result = `TOOL ERROR: ${e.message}`;
          trace.span({ kind: 'tool_call', sessionId, name: tc.function.name, status: 'error', error: String(e.message).slice(0, 300) });
        }
        emit({ type: 'tool_result', name: tc.function.name, result: String(result).slice(0, 4000) });
        // Store tool results in canonical OpenAI shape, always carrying the
        // function name (Google's OpenAI-compat shim rejects an empty
        // function_response.name). Provider-specific rewriting — e.g. Mistral's
        // noToolRole — happens once at the send boundary in providers.js, so
        // stored history and primary->fallback hand-offs are covered too.
        messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name || 'tool', content: String(result) });
      }
    }
    emit({ type: 'text', text: '(Stopped: reached max agent iterations. Increase the limit in Settings if needed.)' });
    finish('max_iterations');
    return messages.slice(1);
  } catch (e) {
    finish(`error: ${String(e.message).slice(0, 200)}`);
    throw e;
  }
}

module.exports = { runAgent };
