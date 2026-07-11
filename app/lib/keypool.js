// Intelligent key rotation engine: weighted selection, active-concurrency
// tracking, LRU tiebreaker, and 429/402 cooldown handling.
'use strict';

class KeyPool {
  constructor() {
    // state[provider][index] = { active, lastUsed, cooldownUntil }
    this.state = {};
  }

  _ensure(provider, count) {
    if (!this.state[provider]) this.state[provider] = [];
    const arr = this.state[provider];
    while (arr.length < count) arr.push({ active: 0, lastUsed: 0, cooldownUntil: 0 });
    return arr;
  }

  // Pick the best key index for a provider. keys: [{key, weight}]
  acquire(provider, keys) {
    if (!keys || keys.length === 0) return null;
    const st = this._ensure(provider, keys.length);
    const now = Date.now();
    let best = -1, bestScore = -Infinity;
    for (let i = 0; i < keys.length; i++) {
      const s = st[i];
      if (s.cooldownUntil > now) continue; // cooled down
      const weight = keys[i].weight || 1;
      // Weighted score penalized by in-flight concurrency; LRU tiebreaker.
      const score = weight / (s.active + 1) - s.lastUsed / 1e15;
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

  status(provider, keys) {
    const st = this._ensure(provider, (keys || []).length);
    const now = Date.now();
    return (keys || []).map((k, i) => ({
      index: i,
      masked: k.key.slice(0, 6) + '…' + k.key.slice(-4),
      weight: k.weight || 1,
      active: st[i].active,
      cooled: st[i].cooldownUntil > now,
      resetInSec: Math.max(0, Math.ceil((st[i].cooldownUntil - now) / 1000))
    }));
  }
}

module.exports = new KeyPool();
