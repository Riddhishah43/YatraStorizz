/**
 * destination-details.js — lookup + presentation prep for one destination.
 * DOM-free. The modal owns rendering; this module only resolves data.
 */

/**
 * Find a destination by unique ID. Returns the record or null.
 * @param {unknown} list
 * @param {unknown} id
 * @returns {object|null}
 */
export function getDestinationById(list, id) {
  if (!Array.isArray(list) || typeof id !== "string" || !id) return null;
  return list.find((d) => d && typeof d === "object" && d.id === id) ?? null;
}

function text(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function textList(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
}

/**
 * Normalise a destination into a modal-ready view model.
 * Missing optional fields become empty values — never undefined crashes.
 * Returns null for invalid input.
 * @param {unknown} dest
 * @returns {object|null}
 */
export function prepareDestinationDetails(dest) {
  if (!dest || typeof dest !== "object") return null;
  const budget = dest.estimatedDailyBudget;
  return {
    id: text(dest.id),
    name: text(dest.name, "Unnamed destination"),
    country: text(dest.country, "Unknown location"),
    region: text(dest.region),
    description: text(dest.description, "No description available yet."),
    image: text(dest.image),
    categories: textList(dest.categories),
    dailyBudgetAmount:
      budget && typeof budget.amount === "number" && Number.isFinite(budget.amount) && budget.amount >= 0
        ? budget.amount
        : null,
    dailyBudgetCurrency: text(budget?.currency, "INR"),
    bestSeasons: textList(dest.bestSeasons),
    idealDurationDays:
      typeof dest.idealDurationDays === "number" && Number.isFinite(dest.idealDurationDays) && dest.idealDurationDays > 0
        ? Math.round(dest.idealDurationDays)
        : null,
    attractions: textList(dest.attractions),
    activities: textList(dest.activities),
    travelTips: textList(dest.travelTips),
  };
}
