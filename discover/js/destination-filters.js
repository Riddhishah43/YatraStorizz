/**
 * destination-filters.js — pure, DOM-free filter logic.
 * Composable with destination-search.js: entry applies search first,
 * then these filters, on the same list.
 *
 * Decisions (documented so tests and UI stay predictable):
 * - Categories use OR semantics: a destination passes if it has ANY of
 *   the selected categories.
 * - Budget filter compares `estimatedDailyBudget.amount` (per person per
 *   day, INR). Destinations with missing/invalid budget data are KEPT
 *   when the filter is active — never hidden for lack of data.
 * - Season match is case-insensitive against `bestSeasons`.
 */

/** Canonical category list — the panel renders exactly these. */
export const CATEGORIES = Object.freeze([
  "Beaches",
  "Mountains",
  "Historical Places",
  "Adventure",
  "Nature",
  "Cultural Experiences",
  "Cities",
  "Wildlife",
]);

export const SEASONS = Object.freeze(["Spring", "Summer", "Monsoon", "Autumn", "Winter"]);

/** Budget options offered by the filter panel (max INR per person/day). */
export const BUDGET_OPTIONS = Object.freeze([
  { value: "", label: "Any budget" },
  { value: "3000", label: "Up to ₹3,000 / day" },
  { value: "6000", label: "Up to ₹6,000 / day" },
  { value: "12000", label: "Up to ₹12,000 / day" },
]);

/**
 * Fresh default filter state. Always create via this factory so the
 * entry point never shares a mutable default object.
 * @returns {{ categories: string[], country: string, maxDailyBudget: number|null, season: string }}
 */
export function createDefaultFilters() {
  return { categories: [], country: "", maxDailyBudget: null, season: "" };
}

function norm(s) {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

function dailyBudgetOf(dest) {
  const amount = dest?.estimatedDailyBudget?.amount;
  return typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/**
 * Apply a filter state to a destination list. Returns a NEW array.
 * Missing optional fields are handled safely; invalid records skipped.
 * @param {unknown} list
 * @param {{ categories?: string[], country?: string, maxDailyBudget?: number|null, season?: string }} [filters]
 * @returns {object[]}
 */
export function applyFilters(list, filters = {}) {
  if (!Array.isArray(list)) return [];
  const categories = Array.isArray(filters.categories)
    ? filters.categories.map(norm).filter(Boolean)
    : [];
  const country = norm(filters.country);
  const maxBudget =
    typeof filters.maxDailyBudget === "number" &&
    Number.isFinite(filters.maxDailyBudget) &&
    filters.maxDailyBudget >= 0
      ? filters.maxDailyBudget
      : null;
  const season = norm(filters.season);

  return list.filter((d) => {
    if (!d || typeof d !== "object") return false;
    if (categories.length > 0) {
      const mine = Array.isArray(d.categories) ? d.categories.map(norm) : [];
      if (!categories.some((c) => mine.includes(c))) return false;
    }
    if (country && norm(d.country) !== country) return false;
    if (maxBudget !== null) {
      const mine = dailyBudgetOf(d);
      if (mine !== null && mine > maxBudget) return false; // unknown budget stays visible
    }
    if (season) {
      const mine = Array.isArray(d.bestSeasons) ? d.bestSeasons.map(norm) : [];
      if (!mine.includes(season)) return false;
    }
    return true;
  });
}

/**
 * Count active (non-default) filters for badges / clear-button state.
 * @param {object} filters
 * @returns {number}
 */
export function getActiveFilterCount(filters = {}) {
  let n = 0;
  if (Array.isArray(filters.categories) && filters.categories.length > 0) n += filters.categories.length;
  if (norm(filters.country)) n += 1;
  if (typeof filters.maxDailyBudget === "number" && Number.isFinite(filters.maxDailyBudget)) n += 1;
  if (norm(filters.season)) n += 1;
  return n;
}

/** Whether a filter state equals the defaults. */
export function areFiltersDefault(filters = {}) {
  return getActiveFilterCount(filters) === 0;
}
