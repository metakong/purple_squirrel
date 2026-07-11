// LLM provider dispatch: OpenAI-compatible chat completions with tool calling,
// vault-backed key rotation, 429/402/503 cooldown + retry, provider quirks,
// primary->fallback degradation, and OTel-GenAI trace spans per call.
'use strict';
const keypool = require('./keypool');
const trace = require('./trace');
const { getProviders, getKeys } = require('./config');

function estTokens(messages) {
  let chars = 0;
  for (const m of messages) chars += (typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content || '').length);
  return Math.ceil(chars / 4);
}

function truncateMessages(messages, maxTokens) {
  const out = messages.slice();
  while (estTokens(out) > maxTokens && out.length > 2) {
    const idx = out.findIndex(m => m.role !== 'system');
    if (idx === -1) break;
    out.splice(idx, 1);
  }
  return out;
}

// Normalize a message array to a provider's constraints at the send boundary.
// This is the single place provider quirks are reconciled, so conversation
// history and primary->fallback hand-offs are covered — not just freshly built
// messages (the bug that produced the logged Mistral/Gemini 400s). Two rules:
//   - noToolRole (e.g. Mistral): rewrite every role:'tool' result into a plain
//     user message and drop assistant tool_calls. Mistral 400s both on a 'tool'
//     role after 'system' and on dangling tool_calls.
//   - all providers: guarantee a non-empty name on tool results. Google's
//     OpenAI-compat shim maps this to function_response.name and rejects "".
function normalizeForProvider(messages, prov) {
  let msgs = messages.map(m => (m.role === 'tool'
    ? { ...m, name: (m.name && String(m.name).trim()) || 'tool' }
    : m));
  if (prov && prov.noToolRole) {
    msgs = msgs.map(m => {
      if (m.role === 'tool') {
        return { role: 'user', content: `[Tool result for ${m.name || 'tool'}]: ${String(m.content).slice(0, 4000)}` };
      }
      if (m.role === 'assistant' && m.tool_calls) {
        const called = m.tool_calls.map(t => t.function && t.function.name).filter(Boolean).join(', ');
        const content = called ? `${m.content || ''}\n[Called tools: ${called}]`.trim() : (m.content || '');
        return { role: 'assistant', content };
      }
      return m;
    });
  }
  return msgs;
}

function parseRetryAfter(res, bodyText) {
  let retry = res.headers.get('retry-after');
  if (!retry) {
    try {
      // Sanitize provider anomalies (stray commas in Google 429 SSE bodies).
      const j = JSON.parse(bodyText.replace(/,\s*,/g, ','));
      retry = j?.error?.metadata?.headers?.['Retry-After'] || j?.error?.details?.find?.(d => d.retryDelay)?.retryDelay;
    } catch { /* ignore */ }
  }
  const n = parseInt(retry, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 900) : 60;
}

/**
 * One chat completion with tools. Rotates keys within the provider on
 * rate-limit errors; if the pool is exhausted, degrades to the fallback route.
 * Returns { message, usage, route }.
 * Supports streaming SSE responses when provider supports it.
 */
async function chatCompletion({ config, messages, tools, sessionId, onStatus, onDelta }) {
  const routes = [config.routing.primary, config.routing.fallback].filter(r => r && r.provider && r.model);
  let lastErr = null;

  const registry = getProviders(config);
  for (const route of routes) {
    const prov = registry[route.provider];
    const keys = getKeys(route.provider);
    if (!prov) { lastErr = new Error(`Unknown provider "${route.provider}"`); continue; }
    if (!keys.length) { lastErr = new Error(`No API keys configured for provider "${route.provider}"`); continue; }
    if (prov.consentRequired && !config.settings.yolo.mistralConsent) {
      lastErr = new Error('Mistral requires data-training consent (Settings → toggles) before routing project files.');
      continue;
    }

    const maxAttempts = keys.length * 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const lease = keypool.acquire(route.provider, keys);
      if (!lease) { lastErr = new Error(`All keys for "${route.provider}" are in cooldown.`); break; }

      let msgs = normalizeForProvider(messages, prov);
      if (prov.maxInputTokens) msgs = truncateMessages(msgs, prov.maxInputTokens);

      // Use streaming if provider supports it and callback is provided
      const useStreaming = prov.supportsStreaming && onDelta;
      const body = { model: route.model, messages: msgs, stream: useStreaming };
      if (tools && tools.length) { body.tools = tools; body.tool_choice = 'auto'; }
      if (prov.forceParams) Object.assign(body, prov.forceParams);

      const started = Date.now();
      try {
        onStatus && onStatus(`Calling ${route.provider}/${route.model} (key #${lease.index + 1}, attempt ${attempt + 1})`);
        const res = await fetch(prov.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lease.key}`,
            ...(route.provider === 'openrouter' ? { 'HTTP-Referer': 'http://localhost', 'X-Title': 'Purple Squirrel VibeCode' } : {})
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(180000)
        });

        if (res.status === 429 || res.status === 402 || res.status === 503) {
          const text = await res.text();
          const wait = res.status === 402 ? 3600 : parseRetryAfter(res, text);
          keypool.cooldown(route.provider, lease.index, wait);
          keypool.recordResult(route.provider, lease.index, false, Date.now() - started);
          trace.span({ kind: 'llm_call', sessionId, 'gen_ai.operation.name': 'chat', 'gen_ai.request.model': route.model, provider: route.provider, status: 'rate_limited', http: res.status, cooldownSec: wait, latencyMs: Date.now() - started });
          onStatus && onStatus(`Key #${lease.index + 1} on ${route.provider} hit ${res.status}; cooldown ${wait}s, rotating…`);
          lastErr = new Error(`${route.provider} returned ${res.status}`);
          continue;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${route.provider} ${res.status}: ${text.slice(0, 500)}`);
        }

        // Handle streaming response
        if (useStreaming) {
          const { message, usage } = await parseStreamingResponse(res, route.provider, onDelta, started, sessionId);
          keypool.recordResult(route.provider, lease.index, true, Date.now() - started);
          trace.span({
            kind: 'llm_call', sessionId,
            'gen_ai.operation.name': 'chat',
            'gen_ai.request.model': route.model,
            provider: route.provider,
            'gen_ai.usage.input_tokens': usage.prompt_tokens || 0,
            'gen_ai.usage.output_tokens': usage.completion_tokens || 0,
            toolCalls: (message.tool_calls || []).length,
            status: 'ok', latencyMs: Date.now() - started
          });
          return { message, usage, route };
        }

        // Handle non-streaming response
        const data = JSON.parse((await res.text()).replace(/,\s*,/g, ','));
        const choice = data.choices && data.choices[0];
        if (!choice || !choice.message) throw new Error(`Malformed response from ${route.provider}`);
        keypool.recordResult(route.provider, lease.index, true, Date.now() - started);
        const usage = data.usage || {};
        trace.span({
          kind: 'llm_call', sessionId,
          'gen_ai.operation.name': 'chat',
          'gen_ai.request.model': route.model,
          provider: route.provider,
          'gen_ai.usage.input_tokens': usage.prompt_tokens || 0,
          'gen_ai.usage.output_tokens': usage.completion_tokens || 0,
          toolCalls: (choice.message.tool_calls || []).length,
          status: 'ok', latencyMs: Date.now() - started
        });
        return { message: choice.message, usage, route };
      } catch (e) {
        if (e.name === 'TimeoutError' || e.name === 'AbortError') {
          keypool.recordResult(route.provider, lease.index, false, Date.now() - started);
          lastErr = new Error(`${route.provider} request timed out`);
          continue;
        }
        keypool.recordResult(route.provider, lease.index, false, Date.now() - started);
        trace.span({ kind: 'llm_call', sessionId, 'gen_ai.request.model': route.model, provider: route.provider, status: 'error', error: String(e.message).slice(0, 300), latencyMs: Date.now() - started });
        lastErr = e;
        break; // terminal validation error: don't burn the whole pool
      } finally {
        lease.release();
      }
    }
    onStatus && onStatus(`Route ${route.provider}/${route.model} unavailable (${lastErr && lastErr.message}); trying fallback…`);
  }
  throw lastErr || new Error('No usable provider routes configured.');
}

/**
 * Parse streaming SSE response from provider and forward deltas via callback.
 * Returns accumulated message and usage data.
 */
async function parseStreamingResponse(res, provider, onDelta, started, sessionId) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let fullContent = '';
  let toolCalls = [];
  let currentToolCall = null;
  let usage = {};
  let finishReason = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop();
    
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') {
        // Stream complete
        trace.span({ kind: 'llm_stream', sessionId, provider, status: 'complete', finishReason, latencyMs: Date.now() - started });
        continue;
      }
      
      try {
        const chunk = JSON.parse(dataStr.replace(/,\s*,/g, ','));
        const choice = chunk.choices && chunk.choices[0];
        if (!choice) continue;
        
        // Handle content delta
        if (choice.delta && choice.delta.content) {
          fullContent += choice.delta.content;
          onDelta({ type: 'text_delta', text: choice.delta.content });
        }
        
        // Handle tool calls
        if (choice.delta && choice.delta.tool_calls) {
          for (const tcDelta of choice.delta.tool_calls) {
            const index = tcDelta.index || 0;
            
            // Initialize tool call if this is the start
            if (!toolCalls[index]) {
              toolCalls[index] = {
                id: tcDelta.id || '',
                type: tcDelta.type || 'function',
                function: { name: tcDelta.function?.name || '', arguments: '' }
              };
            }
            
            // Accumulate tool call data
            if (tcDelta.function?.name) {
              toolCalls[index].function.name += tcDelta.function.name;
            }
            if (tcDelta.function?.arguments) {
              toolCalls[index].function.arguments += tcDelta.function.arguments;
            }
            if (tcDelta.id) {
              toolCalls[index].id += tcDelta.id;
            }
          }
        }
        
        // Handle usage (usually in final chunk)
        if (chunk.usage) {
          usage = chunk.usage;
        }
        
        // Handle finish reason
        if (choice.finish_reason) {
          finishReason = choice.finish_reason;
        }
        
      } catch (e) {
        // Silently ignore malformed chunks (provider anomalies)
        trace.span({ kind: 'llm_stream', sessionId, provider, status: 'error', error: String(e.message).slice(0, 200), latencyMs: Date.now() - started });
      }
    }
  }

  // Build final message
  const message = {
    role: 'assistant',
    content: fullContent
  };
  
  // Add tool calls if any
  if (toolCalls.length > 0) {
    message.tool_calls = toolCalls.map(tc => ({
      id: tc.id,
      type: tc.type,
      function: tc.function
    }));
  }

  return { message, usage };
}

module.exports = { chatCompletion, estTokens, normalizeForProvider };
