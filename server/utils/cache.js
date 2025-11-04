// Simple in-memory cache with TTL
// Default OMDb cache TTL (seconds). Default to 7 days to reduce outbound OMDb calls on hosts
const defaultTTL = Number(process.env.OMDB_CACHE_TTL_SECONDS) || 60 * 60 * 24 * 7; // default 7 days

class SimpleCache {
  constructor() {
    this.store = new Map();
  }

  _now() { return Date.now(); }

  set(key, value, ttlSeconds = defaultTTL) {
    const expiresAt = this._now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < this._now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  del(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = new SimpleCache();
