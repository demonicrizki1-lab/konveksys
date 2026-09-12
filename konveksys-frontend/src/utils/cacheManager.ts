// ============================================================
// KonvekSys Client Cache Manager (Stale-While-Revalidate)
// ============================================================

const CACHE_PREFIX = 'konvek_v2_cache_';
const CACHE_VERSION = 1;

export interface CacheWrapper<T> {
  version: number;
  timestamp: number;
  data: T;
}

/**
 * Retrieve cached data from localStorage synchronously.
 * Returns fallback if not found, corrupted, or version mismatch.
 */
export function getCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return fallback;
    const parsed: CacheWrapper<T> = JSON.parse(raw);
    if (parsed.version !== CACHE_VERSION || !parsed.data) {
      return fallback;
    }
    return parsed.data;
  } catch (err) {
    console.warn(`[Cache] Error reading ${key}:`, err);
    return fallback;
  }
}

/**
 * Store data into localStorage with timestamp and schema version.
 */
export function setCache<T>(key: string, data: T): void {
  try {
    const wrapper: CacheWrapper<T> = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(wrapper));
  } catch (err) {
    console.warn(`[Cache] Error writing ${key}:`, err);
  }
}

/**
 * Remove a specific cache item.
 */
export function removeCache(key: string): void {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    console.warn(`[Cache] Error removing ${key}:`, err);
  }
}

/**
 * Clear all KonvekSys v2 cache keys (e.g. upon user logout).
 */
export function clearAllCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.warn('[Cache] Error clearing all cache:', err);
  }
}
