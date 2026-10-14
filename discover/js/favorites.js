/**
 * favorites.js — favorite-ID persistence + in-memory state.
 *
 * Only destination IDs are stored (never whole objects). IDs resolve
 * against the canonical dataset via getFavoriteDestinations().
 * UI sync uses a tiny pub/sub: subscribe(listener) → unsubscribe.
 */

const STORAGE_KEY = "yatrastorizz.favorites.v1";

const listeners = new Set();
let favoriteIds = loadFavoriteIds();

/** Read persisted IDs; malformed/foreign data safely yields []. */
export function loadFavoriteIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id) => typeof id === "string" && id.trim()))];
  } catch {
    return [];
  }
}

/** Persist IDs. Returns false when storage is unavailable. */
export function saveFavoriteIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

function commit(next) {
  favoriteIds = [...new Set(next.filter((id) => typeof id === "string" && id))];
  const ok = saveFavoriteIds(favoriteIds);
  for (const fn of [...listeners]) {
    try {
      fn(getFavoriteIds(), ok);
    } catch {
      /* a failing listener must not break favorites */
    }
  }
  return getFavoriteIds();
}

/** Current favorite IDs (fresh copy). */
export function getFavoriteIds() {
  return [...favoriteIds];
}

export function isFavorite(id) {
  return typeof id === "string" && favoriteIds.includes(id);
}

export function addFavorite(id) {
  if (typeof id !== "string" || !id || favoriteIds.includes(id)) return getFavoriteIds();
  return commit([...favoriteIds, id]);
}

export function removeFavorite(id) {
  if (!favoriteIds.includes(id)) return getFavoriteIds();
  return commit(favoriteIds.filter((x) => x !== id));
}

export function toggleFavorite(id) {
  if (typeof id !== "string" || !id) return getFavoriteIds();
  return isFavorite(id) ? removeFavorite(id) : addFavorite(id);
}

/**
 * Resolve favorite IDs to destination records (dataset order).
 * Unknown/outdated IDs are ignored.
 */
export function getFavoriteDestinations(list, ids = favoriteIds) {
  if (!Array.isArray(list)) return [];
  const wanted = new Set(Array.isArray(ids) ? ids : []);
  return list.filter((d) => d && typeof d === "object" && wanted.has(d.id));
}

/**
 * Subscribe to favorite changes: listener(ids, persistedOk).
 * @returns {() => void} unsubscribe
 */
export function subscribe(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}
