// Model catalog: the single source of truth for which models exist on which
// free-tier providers, their exact API model IDs, and per-model tuning params.
// Data is transcribed verbatim from the project's research references:
//   docs/research/Top Open-Weight LLMs Report.md            (rankings, specs)
//   docs/research/Free Tier API Model Usage Guide.md        (exact IDs, params, deprecations)
// Both dated 2026-07-11. Never invent model IDs here — every `model` string
// below must be traceable to one of those two documents (or, where marked
// `liveVerified`, to a route already proven working in this install's config).
'use strict';

// tier:   frontier (hardest tasks) | strong (mid/heavy) | fast (cheap + quick)
// skills: general | coding | reasoning | vision | long-context
// providers[<id>]: {
//   model:      exact API model id for that provider,
//   deprecated: 'YYYY-MM-DD' provider shutdown date (from the usage guide),
//   params:     static extra body params for this provider+model,
//   tune:       { simple|moderate|complex: params } merged by difficulty,
//   note:       human-facing caveat shown in pickers
// }
// Entry-level `tune` applies to every provider unless the provider overrides it.
const CATALOG = [
  {
    id: 'glm-5.2', label: 'GLM-5.2 (max)', tier: 'frontier',
    skills: ['coding', 'reasoning', 'long-context'], context: 1048576,
    note: 'Top open-weight model (AA 51, SWE-bench Pro 62.1%). Verbose output.',
    providers: {
      openrouter: { model: 'z-ai/glm-5.2', tune: { complex: { reasoning_effort: 'high' } } }
    }
  },
  {
    id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro (max)', tier: 'frontier',
    skills: ['coding', 'reasoning', 'long-context'], context: 1000000,
    note: 'GPQA 90.1%, SWE Verified 80.6%. Thinking mode adds heavy latency — auto mode only enables it for complex tasks.',
    providers: {
      deepseek: {
        model: 'deepseek-v4-pro',
        tune: { simple: { reasoning: { enabled: false } }, moderate: { reasoning: { enabled: false } }, complex: { reasoning: { enabled: true } } }
      },
      openrouter: { model: 'deepseek/deepseek-v4-pro' }
    }
  },
  {
    id: 'kimi-k2.6', label: 'Kimi K2.6', tier: 'frontier',
    skills: ['reasoning', 'general', 'coding'], context: 262144,
    note: 'GPQA Diamond 90.5%. Moonshot first-party API only serves K2.6 since 2026-05-25.',
    providers: {
      kimi: { model: 'kimi-k2.6' },
      openrouter: { model: 'moonshotai/kimi-k2.6' }
    }
  },
  {
    id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash (max)', tier: 'strong',
    skills: ['coding', 'general', 'long-context'], context: 1000000,
    providers: { openrouter: { model: 'deepseek/deepseek-v4-flash' } }
  },
  {
    id: 'qwen3.5-397b', label: 'Qwen3.5 397B A17B', tier: 'frontier',
    skills: ['reasoning', 'coding', 'general'], context: 262144,
    providers: { openrouter: { model: 'qwen/qwen3.5-397b' } }
  },
  {
    id: 'qwen-3-235b', label: 'Qwen 3 235B-A22B', tier: 'strong',
    skills: ['reasoning', 'general'], context: 262144,
    note: 'Hybrid thinking mode; degrades past ~100K input tokens.',
    providers: { openrouter: { model: 'qwen/qwen-3-235b' } }
  },
  {
    id: 'mimo-v2.5-pro', label: 'MiMo-V2.5-Pro', tier: 'frontier',
    skills: ['coding', 'long-context'], context: 1048576,
    providers: { openrouter: { model: 'xiaomi/mimo-v2.5-pro' } }
  },
  {
    id: 'deepseek-r1', label: 'DeepSeek R1', tier: 'strong',
    skills: ['reasoning'], context: 128000,
    note: 'Math/logic specialist. Long CoT = high token volume; auto mode keeps it late in the ladder.',
    providers: {
      deepseek: { model: 'deepseek-reasoner' },
      openrouter: { model: 'deepseek/deepseek-r1' }
    }
  },
  {
    id: 'deepseek-v3', label: 'DeepSeek V3', tier: 'fast',
    skills: ['general', 'coding'], context: 128000,
    providers: { openrouter: { model: 'deepseek/deepseek-v3' } }
  },
  {
    id: 'glm-5', label: 'GLM-5', tier: 'frontier',
    skills: ['coding', 'general'], context: 200000,
    note: 'Superseded by GLM-5.2 (smaller context, no dual-mode thinking).',
    providers: { openrouter: { model: 'z-ai/glm-5' } }
  },
  {
    id: 'kimi-k2.5', label: 'Kimi K2.5', tier: 'strong',
    skills: ['coding', 'general'], context: 262144,
    note: 'First-party API discontinued 2026-05-25; OpenRouter keeps a stable proxy.',
    providers: { openrouter: { model: 'moonshotai/kimi-k2.5' } }
  },
  {
    id: 'mistral-large-3', label: 'Mistral Large 3', tier: 'strong',
    skills: ['general', 'coding'], context: 128000,
    note: 'Multilingual/structured-document strength; trails frontier on repo-level coding.',
    providers: {
      mistral: { model: 'mistral-large-latest' },
      openrouter: { model: 'mistralai/mistral-large-3' }
    }
  },
  {
    id: 'mistral-medium-3.5', label: 'Mistral Medium 3.5', tier: 'strong',
    skills: ['general'], context: 256000,
    providers: {
      mistral: { model: 'mistral-medium-3.5' },
      github: { model: 'mistral-ai/mistral-medium-3.5' }
    }
  },
  {
    id: 'mistral-small-4', label: 'Mistral Small 4', tier: 'fast',
    skills: ['general', 'coding', 'reasoning'], context: 262144,
    note: 'Merged Instruct+Magistral+Devstral weights; per-request reasoning_effort none/high.',
    providers: {
      mistral: {
        model: 'mistral-small-latest',
        tune: { simple: { reasoning_effort: 'none' }, complex: { reasoning_effort: 'high' } }
      },
      openrouter: { model: 'mistralai/mistral-small-2603' }
    }
  },
  {
    id: 'devstral-2', label: 'Devstral 2', tier: 'strong',
    skills: ['coding'], context: 128000,
    providers: {
      mistral: { model: 'devstral-latest' },
      openrouter: { model: 'mistralai/devstral-2' }
    }
  },
  {
    id: 'gpt-oss-120b', label: 'gpt-oss-120b', tier: 'strong',
    skills: ['reasoning', 'coding', 'general'], context: 131072,
    note: 'AIME 97.9%; three reasoning efforts (auto mode maps difficulty → effort).',
    tune: { simple: { reasoning_effort: 'low' }, moderate: { reasoning_effort: 'medium' }, complex: { reasoning_effort: 'high' } },
    providers: {
      cerebras: { model: 'gpt-oss-120b' },
      groq: { model: 'openai/gpt-oss-120b' },
      openrouter: { model: 'openai/gpt-oss-120b' }
    }
  },
  {
    id: 'gpt-oss-20b', label: 'gpt-oss-20b', tier: 'fast',
    skills: ['general', 'reasoning'], context: 131072,
    tune: { simple: { reasoning_effort: 'low' }, moderate: { reasoning_effort: 'medium' }, complex: { reasoning_effort: 'high' } },
    providers: {
      groq: { model: 'openai/gpt-oss-20b' },
      openrouter: { model: 'openai/gpt-oss-20b' }
    }
  },
  {
    id: 'nemotron-3-super', label: 'Nemotron 3 Super', tier: 'strong',
    skills: ['general', 'long-context'], context: 262144,
    providers: { openrouter: { model: 'nvidia/nemotron-3-super-120b-a12b' } }
  },
  {
    id: 'llama-4-scout', label: 'Llama 4 Scout', tier: 'strong',
    skills: ['long-context', 'general'], context: 131072,
    providers: {
      groq: { model: 'meta-llama/llama-4-scout-17b-16e-instruct', deprecated: '2026-07-17' },
      cerebras: { model: 'llama-4-scout' },
      openrouter: { model: 'meta-llama/llama-4-scout-17b-16e-instruct' }
    }
  },
  {
    id: 'llama-3.3-70b', label: 'Llama 3.3 70B', tier: 'fast',
    skills: ['general'], context: 131072,
    providers: {
      groq: { model: 'llama-3.3-70b-versatile', deprecated: '2026-08-16' },
      cerebras: { model: 'llama-3.3-70b' },
      openrouter: { model: 'meta-llama/llama-3.3-70b-instruct' }
    }
  },
  {
    id: 'command-a', label: 'Command A', tier: 'strong',
    skills: ['general'], context: 256000,
    note: 'RAG/citation specialist. CC-BY-NC-4.0 — non-commercial use only.',
    providers: { openrouter: { model: 'cohere/command-a' } }
  },
  {
    id: 'laguna-m.1', label: 'Laguna M.1', tier: 'strong',
    skills: ['coding'], context: 131072,
    note: 'Long-horizon agentic coding (SWE Verified 74.6%). Weak outside code.',
    providers: { openrouter: { model: 'poolside/laguna-m.1:free' } }
  },
  {
    id: 'north-mini-code', label: 'North Mini Code', tier: 'fast',
    skills: ['coding'], context: 256000,
    note: 'Code-execution sub-agent only — the usage guide warns against general-assistant use, so auto mode never picks it.',
    providers: { openrouter: { model: 'cohere/north-mini-code' } }
  },
  {
    id: 'gemma-4-31b', label: 'Gemma 4 31B IT', tier: 'fast',
    skills: ['vision', 'general'], context: 256000,
    providers: {
      google: { model: 'google/gemma-4-31b-it' },
      openrouter: { model: 'google/gemma-4-31b-it' }
    }
  },
  {
    id: 'gemma-4-26b-a4b', label: 'Gemma 4 26B A4B IT', tier: 'fast',
    skills: ['general'], context: 256000,
    providers: {
      google: { model: 'google/gemma-4-26b-a4b-it' },
      openrouter: { model: 'google/gemma-4-26b-a4b-it' }
    }
  },
  {
    id: 'gemma-3-27b', label: 'Gemma 3 27B IT', tier: 'fast',
    skills: ['general'], context: 128000,
    providers: {
      google: { model: 'gemma-3-27b-it' },
      openrouter: { model: 'google/gemma-3-27b-it' }
    }
  },
  {
    id: 'qwen3.6-27b', label: 'Qwen3.6 27B', tier: 'fast',
    skills: ['coding', 'general'], context: 131072,
    providers: { openrouter: { model: 'qwen/qwen3.6-27b' } }
  },
  {
    id: 'qwen3.6-35b-a3b', label: 'Qwen3.6 35B A3B', tier: 'fast',
    skills: ['coding', 'general'], context: 262144,
    note: 'Agentic coding at 3B-active speed (Terminal Bench 45.0).',
    providers: { openrouter: { model: 'qwen/qwen3.6-35b-a3b' } }
  },
  {
    id: 'hypernova-60b', label: 'HyperNova 60B 2605', tier: 'fast',
    skills: ['general'], context: 131072,
    providers: { openrouter: { model: 'multiverse/hypernova-60b-2605' } }
  },
  {
    id: 'longcat-flash-lite', label: 'LongCat Flash Lite', tier: 'fast',
    skills: ['general', 'long-context'], context: 131072,
    providers: { openrouter: { model: 'meituan/longcat-flash-lite' } }
  },
  {
    id: 'phi-4-reasoning', label: 'Phi-4 Reasoning', tier: 'fast',
    skills: ['reasoning'], context: 128000,
    providers: { github: { model: 'microsoft/Phi-4-mini-reasoning' } }
  },
  {
    id: 'phi-4-14b', label: 'Phi-4 14B', tier: 'fast',
    skills: ['general'], context: 16000,
    providers: { github: { model: 'microsoft/Phi-4-14B' } }
  },
  // Proprietary free-tier models the usage guide endorses as gateway primaries
  // ("Google AI Studio (using Gemini Flash) is typically configured as the
  // primary endpoint due to its generous 1,500 daily request allowance").
  // gemini-2.5-flash is additionally live-verified in this install's config.
  {
    id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'fast',
    skills: ['general', 'coding', 'vision'], context: 1048576,
    note: 'Proprietary free tier — 1,500 req/day, the guide’s recommended gateway primary.',
    liveVerified: true,
    providers: { google: { model: 'gemini-2.5-flash' } }
  },
  {
    id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'strong',
    skills: ['reasoning', 'coding', 'general'], context: 1048576,
    note: 'Proprietary free tier — much lower daily quota than Flash.',
    providers: { google: { model: 'gemini-2.5-pro' } }
  }
];

// Auto-routing ladders: ordered candidate lists per (difficulty × task kind).
// Order encodes the report's routing-ladder guidance: cheap/fast models absorb
// routine work; frontier reasoning engines are reserved for hard escalations.
// Every entry must be a CATALOG id whose models support tool calling well
// enough for the agent loop (Gemma/North Mini Code are deliberately absent).
const LADDERS = {
  simple: ['gemini-2.5-flash', 'gpt-oss-20b', 'qwen3.6-35b-a3b', 'mistral-small-4', 'llama-3.3-70b', 'deepseek-v3'],
  'moderate-general': ['gpt-oss-120b', 'gemini-2.5-flash', 'qwen3.6-27b', 'mistral-medium-3.5', 'deepseek-v3', 'nemotron-3-super', 'llama-3.3-70b'],
  'moderate-coding': ['gpt-oss-120b', 'qwen3.6-35b-a3b', 'devstral-2', 'kimi-k2.5', 'deepseek-v4-flash', 'mistral-small-4'],
  'complex-general': ['glm-5.2', 'deepseek-v4-pro', 'kimi-k2.6', 'qwen3.5-397b', 'mistral-large-3', 'gemini-2.5-pro', 'gpt-oss-120b', 'deepseek-r1'],
  'complex-coding': ['glm-5.2', 'deepseek-v4-pro', 'kimi-k2.6', 'mimo-v2.5-pro', 'laguna-m.1', 'qwen3.5-397b', 'gpt-oss-120b', 'devstral-2']
};

// Skip a route this many days before its provider-announced shutdown, so
// production traffic migrates ahead of the cliff (usage-guide deprecation
// guidance: Groq redirects/kills endpoints on hard dates).
const DEPRECATION_BUFFER_DAYS = 7;

function findEntry(catalogId) {
  return CATALOG.find(e => e.id === catalogId) || null;
}

/** Catalog entry (if any) that serves `model` on `provider`. */
function entryForModel(provider, model) {
  return CATALOG.find(e => e.providers[provider] && e.providers[provider].model === model) || null;
}

/** Deprecation date string for provider+model, or null. */
function deprecationFor(provider, model) {
  const e = entryForModel(provider, model);
  return (e && e.providers[provider].deprecated) || null;
}

/** True when provider+model is within the buffer window of (or past) shutdown. */
function isDeprecated(provider, model, now = Date.now()) {
  const d = deprecationFor(provider, model);
  if (!d) return false;
  const cutoff = Date.parse(d + 'T00:00:00Z') - DEPRECATION_BUFFER_DAYS * 86400000;
  return now >= cutoff;
}

/** Extra request-body params for a route at a difficulty level. */
function routeParams(entry, provider, difficulty) {
  const spec = entry && entry.providers[provider];
  if (!spec) return null;
  const tune = spec.tune || entry.tune || null;
  const merged = { ...(spec.params || {}), ...((tune && tune[difficulty]) || {}) };
  return Object.keys(merged).length ? merged : null;
}

/**
 * UI-shaped catalog: for each registered provider, the selectable models.
 * Custom providers have no catalog entries — the UI keeps a free-text
 * escape hatch for those.
 */
function forUi(providersRegistry, now = Date.now()) {
  const out = {};
  for (const prov of Object.keys(providersRegistry)) {
    const models = [];
    for (const e of CATALOG) {
      const spec = e.providers[prov];
      if (!spec) continue;
      models.push({
        value: spec.model,
        label: e.label,
        tier: e.tier,
        skills: e.skills,
        context: e.context,
        note: spec.note || e.note || '',
        deprecated: spec.deprecated || null,
        deprecatedSoon: isDeprecated(prov, spec.model, now)
      });
    }
    out[prov] = models;
  }
  return out;
}

module.exports = { CATALOG, LADDERS, DEPRECATION_BUFFER_DAYS, findEntry, entryForModel, deprecationFor, isDeprecated, routeParams, forUi };
