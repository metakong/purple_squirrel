// LLM provider dispatch: OpenAI-compatible chat completions with tool calling,
// vault-backed key rotation, 429/402/503 cooldown + retry, provider quirks,
// primary->fallback degradation, and OTel-GenAI trace spans per call.
'use strict';
const keypool = require('./keypool');
const trace = require('./trace');
const { PROVIDERS, getKeys } = require('./config');

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
 */
async function chatCompletion({ config, messages, tools, sessionId, onStatus }) {
  const routes = [config.routing.primary, config.routing.fallback].filter(r => r && r.provider && r.model);
  let lastErr = null;

  for (const route of routes) {
    const prov = PROVIDERS[route.provider];
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

      let msgs = messages;
      if (prov.maxInputTokens) msgs = truncateMessages(msgs, prov.maxInputTokens);

      const body = { model: route.model, messages: msgs, stream: false };
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
          trace.span({ kind: 'llm_call', sessionId, 'gen_ai.operation.name': 'chat', 'gen_ai.request.model': route.model, provider: route.provider, status: 'rate_limited', http: res.status, cooldownSec: wait, latencyMs: Date.now() - started });
          onStatus && onStatus(`Key #${lease.index + 1} on ${route.provider} hit ${res.status}; cooldown ${wait}s, rotating…`);
          lastErr = new Error(`${route.provider} returned ${res.status}`);
          continue;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${route.provider} ${res.status}: ${text.slice(0, 500)}`);
        }
        const data = JSON.parse((await res.text()).replace(/,\s*,/g, ','));
        const choice = data.choices && data.choices[0];
        if (!choice || !choice.message) throw new Error(`Malformed response from ${route.provider}`);
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
          lastErr = new Error(`${route.provider} request timed out`);
          continue;
        }
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

module.exports = { chatCompletion, estTokens };
