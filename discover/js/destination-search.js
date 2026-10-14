/**
 * destination-search.js — pure, DOM-free search logic.
 *
 * Searchable fields: name, country, region, categories, description,
 * attractions, and activities (treated as keywords).
 * Matching is case-insensitive; every whitespace-separated query token
 * must appear as a substring somewhere in the record (AND semantics),
 * so partial-word queries like "jaip" match "Jaipur".
 */

function str(value) {
  return typeof value === "string" ? value : "";
}

function strList(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

/**
 * Normalise a raw query: trim, collapse inner whitespace, lowercase.
 * @param {unknown} query
 * @returns {string}
 */
export function normalizeQuery(query) {
  if (typeof query !== "string") return "";
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Build the searchable text blob for one destination (lowercased).
 * Missing optional fields contribute nothing — never throws.
 * @param {unknown} dest
 * @returns {string}
 */
export function getSearchableText(dest) {
  if (!dest || typeof dest !== "object") return "";
  return [
    str(dest.name),
    str(dest.country),
    str(dest.region),
    str(dest.city),
    strList(dest.categories).join(" "),
    str(dest.description),
    strList(dest.attractions).join(" "),
    strList(dest.activities).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Whether one record matches an already-normalised query.
 * Empty normalised query matches everything.
 * @param {unknown} dest
 * @param {string} normalizedQuery
 * @returns {boolean}
 */
export function matchesQuery(dest, normalizedQuery) {
  if (!dest || typeof dest !== "object") return false;
  if (!normalizedQuery) return true;
  const blob = getSearchableText(dest);
  return normalizedQuery.split(" ").every((token) => token && blob.includes(token));
}

/**
 * Filter a destination list by free-text query.
 * Returns a NEW array; the input is never mutated. Invalid records
 * (null / non-objects) are skipped. Empty query returns all valid records.
 * @param {unknown} list
 * @param {unknown} query
 * @returns {object[]}
 */
export function searchDestinations(list, query) {
  if (!Array.isArray(list)) return [];
  const q = normalizeQuery(query);
  if (!q) return list.filter((d) => d && typeof d === "object");
  return list.filter((d) => matchesQuery(d, q));
}
