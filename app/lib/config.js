// Config store. Non-secret settings live in data/config.json; API keys live
// exclusively in the DPAPI-encrypted vault (data/secrets.vault). Provider
// endpoints/quirks are code constants so config.json stays clean and shareable.
'use strict';
const fs = require('fs');
const vault = require('./vault');
const { CONFIG_PATH } = require('./paths');

// Free-tier provider registry (endpoints + per-provider quirks).
const PROVIDERS = {
  openrouter: { label: 'OpenRouter (Free)', endpoint: 'https://openrouter.ai/api/v1/chat/completions', docs: 'https://openrouter.ai/keys' },
  google:     { label: 'Google AI Studio',  endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', docs: 'https://aistudio.google.com/apikey' },
  groq:       { label: 'Groq (Free)',       endpoint: 'https://api.groq.com/openai/v1/chat/completions', docs: 'https://console.groq.com/keys' },
  cerebras:   { label: 'Cerebras (Free)',   endpoint: 'https://api.cerebras.ai/v1/chat/completions', docs: 'https://cloud.cerebras.ai' },
  github:     { label: 'GitHub Models',     endpoint: 'https://models.github.ai/inference/chat/completions', docs: 'https://github.com/settings/tokens', maxInputTokens: 8000 },
  mistral:    { label: 'Mistral (Experiment)', endpoint: 'https://api.mistral.ai/v1/chat/completions', docs: 'https://console.mistral.ai', consentRequired: true },
  deepseek:   { label: 'DeepSeek Direct',   endpoint: 'https://api.deepseek.com/chat/completions', docs: 'https://platform.deepseek.com' },
  kimi:       { label: 'Moonshot / Kimi',   endpoint: 'https://api.moonshot.ai/v1/chat/completions', docs: 'https://platform.moonshot.ai', forceParams: { temperature: 1.0, top_p: 0.95 } }
};

const DEFAULT_CONFIG = {
  port: 4477,
  routing: {
    primary:  { provider: 'openrouter', model: 'qwen/qwen3-coder:free' },
    fallback: { provider: 'groq', model: 'llama-3.3-70b-versatile' }
  },
  settings: {
    yolo: {
      autoApproveEdits: true,      // Tier 1: write files without diff approval
      autoRunCommands: true,       // Tier 1: run terminal commands without approval
      guardrails: true,            // enforce governance/AGENTS.policy.json Tier 3 blocks
      mistralConsent: false        // Tier 2: data-training opt-in gate for Mistral
    },
    maxIterations: 25,
    maxFileReadLines: 300,
    contextOutline: true,
    traceEnabled: true             // OT-AT style JSONL trace of every agent action
  },
  recentProjects: []
};

let secretsCache = null; // { providers: { name: [{key, weight}] } }

function load() {
  let cfg;
  try {
    cfg = merge(structuredClone(DEFAULT_CONFIG), JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')));
  } catch {
    cfg = structuredClone(DEFAULT_CONFIG);
  }
  // Legacy migration: config.json used to hold provider keys — sweep them into the vault.
  if (cfg.providers) {
    const secrets = getSecrets();
    let migrated = 0;
    for (const [name, p] of Object.entries(cfg.providers)) {
      if (p && Array.isArray(p.keys) && p.keys.length) {
        secrets.providers[name] = (secrets.providers[name] || []).concat(p.keys);
        migrated += p.keys.length;
      }
    }
    delete cfg.providers;
    if (migrated) { vault.saveSecrets(secrets); console.log(`[config] Migrated ${migrated} legacy key(s) into encrypted vault.`); }
    save(cfg);
  }
  return cfg;
}

function merge(base, over) {
  for (const k of Object.keys(over)) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}

function save(cfg) {
  const clean = structuredClone(cfg);
  delete clean.providers; // never allow secrets back into config.json
  const tmp = CONFIG_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2));
  fs.renameSync(tmp, CONFIG_PATH);
}

function getSecrets() {
  if (!secretsCache) secretsCache = vault.loadSecrets();
  if (!secretsCache.providers) secretsCache.providers = {};
  return secretsCache;
}

function getKeys(provider) { return getSecrets().providers[provider] || []; }

function addKey(provider, key, weight) {
  const s = getSecrets();
  if (!s.providers[provider]) s.providers[provider] = [];
  s.providers[provider].push({ key: key.trim(), weight: weight || 1 });
  return vault.saveSecrets(s);
}

function removeKey(provider, index) {
  const s = getSecrets();
  if (s.providers[provider]) s.providers[provider].splice(index, 1);
  return vault.saveSecrets(s);
}

module.exports = { load, save, PROVIDERS, DEFAULT_CONFIG, getKeys, addKey, removeKey, CONFIG_PATH };
