// Generic in-memory TTL cache with in-flight promise coalescing and optional
// sessionStorage persistence. Used by api/api.js so the many mount-effect call
// sites for /settings, /transactions, /countries and /users/profile stop firing
// redundant backend requests. Client-only: the module-level maps must never be
// reached during SSR (they would be shared across users), so every consumer
// reaches them through a browser-only path (useEffect / event handlers).

import CONFIG from "../config/environment/current";

const memory = new Map(); // key -> { value, expiresAt }
const inFlight = new Map(); // key -> Promise
// Bumped by invalidate(): a fetch started before the invalidation must not
// re-populate the cache with pre-mutation data when it resolves.
const generations = new Map(); // key -> number

// Kill switch: when CONFIG.API_CACHE_ENABLED is explicitly false, getOrFetch
// degrades to a plain fetcher() call (no cache read/write, no coalescing).
// A missing key (older env file) means enabled.
const isCacheEnabled = () => !CONFIG || CONFIG.API_CACHE_ENABLED !== false;

// ttlMs may be a function of the resolved value, for TTLs that are only known
// after the fetch (e.g. a TTL delivered inside the /settings payload itself).
// Non-finite or <= 0 results mean "do not cache".
const resolveTtlMs = (ttlMs, value) => {
    const ms = typeof ttlMs === "function" ? ttlMs(value) : ttlMs;
    return typeof ms === "number" && Number.isFinite(ms) && ms > 0 ? ms : 0;
};

const hasWindow = () => typeof window !== "undefined";

const storageKey = (key) => `apiCache:${key}`;

const readPersisted = (key) => {
    if (!hasWindow()) return null;
    try {
        const raw = window.sessionStorage.getItem(storageKey(key));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.expiresAt !== "number") return null;
        return parsed;
    } catch (error) {
        return null;
    }
};

const writePersisted = (key, entry) => {
    if (!hasWindow()) return;
    try {
        window.sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
    } catch (error) {
        // sessionStorage may be full or unavailable; caching is best-effort.
    }
};

const removePersisted = (key) => {
    if (!hasWindow()) return;
    try {
        window.sessionStorage.removeItem(storageKey(key));
    } catch (error) {
        // ignore
    }
};

/**
 * Resolve `key` from cache or run `fetcher`, caching the resolved value for
 * `ttlMs`. Concurrent callers for the same key share the single in-flight
 * promise. Rejections are never cached. A resolved value is stored only when
 * `shouldCache(value)` is true, so error responses (e.g. HTTP 401 bodies) are
 * returned to the caller once but not retained. When the cache is disabled
 * via CONFIG.API_CACHE_ENABLED = false, every call goes straight to `fetcher`.
 *
 * @param {string} key
 * @param {number | ((value: any) => number)} ttlMs - fixed TTL, or a function
 *   of the resolved value evaluated when the entry is stored
 * @param {() => Promise<any>} fetcher
 * @param {{ persist?: boolean, shouldCache?: (value: any) => boolean }} [options]
 * @returns {Promise<any>}
 */
export function getOrFetch(key, ttlMs, fetcher, options = {}) {
    if (!isCacheEnabled()) {
        return Promise.resolve().then(fetcher);
    }

    const { persist = false, shouldCache = () => true } = options;
    const now = Date.now();

    const cached = memory.get(key);
    if (cached && cached.expiresAt > now) {
        return Promise.resolve(cached.value);
    }

    if (persist) {
        const stored = readPersisted(key);
        if (stored && stored.expiresAt > now) {
            memory.set(key, stored);
            return Promise.resolve(stored.value);
        }
    }

    const pending = inFlight.get(key);
    if (pending) {
        return pending;
    }

    const generation = generations.get(key) || 0;
    const promise = Promise.resolve()
        .then(fetcher)
        .then((value) => {
            if (inFlight.get(key) === promise) {
                inFlight.delete(key);
            }
            const isStale = (generations.get(key) || 0) !== generation;
            const ttl = resolveTtlMs(ttlMs, value);
            if (!isStale && ttl > 0 && shouldCache(value)) {
                const entry = { value, expiresAt: Date.now() + ttl };
                memory.set(key, entry);
                if (persist) {
                    writePersisted(key, entry);
                }
            }
            return value;
        })
        .catch((error) => {
            if (inFlight.get(key) === promise) {
                inFlight.delete(key);
            }
            throw error;
        });

    inFlight.set(key, promise);
    return promise;
}

/**
 * Drop any cached value, in-flight promise and persisted entry for `key`, so
 * the next getOrFetch(key, ...) fetches fresh data.
 *
 * @param {string} key
 */
export function invalidate(key) {
    generations.set(key, (generations.get(key) || 0) + 1);
    memory.delete(key);
    inFlight.delete(key);
    removePersisted(key);
}
