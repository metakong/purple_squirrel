// Intelligent key rotation engine with health scoring (Mistral suggestion #4):
// weighted selection × historical health, penalized by in-flight concurrency,
// LRU tiebreaker, and 429/402 cooldown handling.
'use strict';

class KeyPool {
  constructor() {
    // state[provider][index] = { active, lastUsed, cooldownUntil, ok, fail, latSum, latN }
    this.state = {};
  }

  _ensure(provider, count) {
    if (!this.state[provider]) this.state[provider] = [];
    const arr = this.state[provider];
    while (arr.length < count) arr.push({ active: 0, lastUsed: 0, cooldownUntil: 0, ok: 0, fail: 0, latSum: 0, latN: 0 });
    return arr;
  }

  // Laplace-smoothed success rate so new keys start neutral (0.5→1.0 range).
  _health(s) { return (s.ok + 1) / (s.ok + s.fail + 2); }

  // Pick the best key index for a provider. keys: [{key, weight}]
  acquire(provider, keys) {
    if (!keys || keys.length === 0) return null;
    const st = this._ensure(provider, keys.length);
    const now = Date.now();
    let best = -1, bestScore = -Infinity;
    for (let i = 0; i < keys.length; i++) {
      const s = st[i];
      if (s.cooldownUntil > now) continue;
      const weight = keys[i].weight || 1;
      const score = (weight * this._health(s)) / (s.active + 1) - s.lastUsed / 1e15;
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best === -1) return null;
    st[best].active++;
    st[best].lastUsed = now;
    return { index: best, key: keys[best].key, release: () => { st[best].active = Math.max(0, st[best].active - 1); } };
  }

  cooldown(provider, index, seconds) {
    const st = this._ensure(provider, index + 1);
    st[index].cooldownUntil = Date.now() + seconds * 1000;
  }

  // Record call outcome for health scoring.
  recordResult(provider, index, success, latencyMs) {
    const st = this._ensure(provider, index + 1);
    const s = st[index];
    if (success) s.ok++; else s.fail++;
    if (Number.isFinite(latencyMs)) { s.latSum += latencyMs; s.latN++; }
  }

  status(provider, keys) {
    const st = this._ensure(provider, (keys || []).length);
    const now = Date.now();
    return (keys || []).map((k, i) => ({
      index: i,
      masked: k.key.slice(0, 6) + '…' + k.key.slice(-4),
      weight: k.weight || 1,
      active: st[i].active,
      cooled: st[i].cooldownUntil > now,
      resetInSec: Math.max(0, Math.ceil((st[i].cooldownUntil - now) / 1000)),
      healthPct: Math.round(this._health(st[i]) * 100),
      calls: st[i].ok + st[i].fail,
      avgLatencyMs: st[i].latN ? Math.round(st[i].latSum / st[i].latN) : null
    }));
  }
}

module.exports = new KeyPool();
