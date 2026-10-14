/**
 * dashboard-stats.js — pure statistics and budget calculations.
 *
 * DOM-free. All functions are pure (no mutation of inputs) and safe
 * against missing / invalid data. Date-dependent functions accept an
 * injectable `now` reference so unit tests are deterministic.
 *
 * Conventions:
 * - Trip status is a case-insensitive string. Recognised values:
 *   "upcoming", "ongoing" | "active", "completed", "cancelled".
 *   Unknown / missing status is treated as active (eligible).
 * - A trip is "upcoming" when: it has a valid startDate on or after the
 *   start of the reference day, AND its status is not completed/cancelled.
 * - A destination counts as "explored" when its trip has status
 *   "completed" OR a valid endDate strictly before the reference day.
 * - Monetary values: finite numbers >= 0 are used as-is; anything else
 *   (missing, NaN, Infinity, negative, numeric strings are coerced when
 *   sensible) normalises to 0. Negative budgets are treated as 0 rather
 *   than leaking negatives into totals.
 * - Utilisation = actual / planned * 100. Planned <= 0 yields 0
 *   (avoids division by zero / NaN / Infinity). Overspend yields > 100,
 *   which callers may clamp visually but never hide.
 */

/** Statuses that disqualify a trip from "upcoming". */
export const EXCLUDED_UPCOMING_STATUSES = Object.freeze(["completed", "cancelled"]);

/** Status that marks a trip as explored regardless of dates. */
export const EXPLORED_STATUS = "completed";

/**
 * Coerce any value to a safe non-negative finite number.
 * Numeric strings ("18000") are accepted; everything else -> 0.
 * @param {unknown} value
 * @returns {number}
 */
export function toSafeAmount(value) {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    if (parsed === 0) return 0;
    return 0;
  }
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (value === 0) return 0;
  return 0;
}

/**
 * Normalise a status string for comparison.
 * @param {unknown} status
 * @returns {string} lowercase trimmed status, or "" when missing.
 */
export function normalizeStatus(status) {
  if (typeof status !== "string") return "";
  return status.trim().toLowerCase();
}

/**
 * Parse a value into a valid Date, or null when invalid.
 * Accepts Date instances and ISO / short date strings.
 * @param {unknown} value
 * @returns {Date | null}
 */
export function parseDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  if (typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Return the start of the local day for a date (00:00:00.000).
 * @param {Date} date
 * @returns {Date}
 */
export function startOfDay(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Resolve the reference "now" used by date-dependent helpers.
 * @param {Date | string | undefined} now
 * @returns {Date}
 */
export function resolveNow(now) {
  const parsed = now === undefined ? new Date() : parseDate(now);
  return parsed ?? new Date();
}

function asTripArray(trips) {
  return Array.isArray(trips) ? trips : [];
}

/**
 * Total number of trips. Non-array input yields 0.
 * @param {unknown} trips
 * @returns {number}
 */
export function getTotalTrips(trips) {
  return asTripArray(trips).length;
}

/**
 * Count trips scheduled for a future date.
 * A trip counts when its startDate is valid and >= start of the
 * reference day, and its status is not completed / cancelled.
 * @param {unknown} trips
 * @param {Date | string} [now] injectable reference date (default: today)
 * @returns {number}
 */
export function countUpcomingTrips(trips, now) {
  const ref = startOfDay(resolveNow(now));
  let count = 0;
  for (const trip of asTripArray(trips)) {
    if (!trip || typeof trip !== "object") continue;
    const status = normalizeStatus(trip.status);
    if (EXCLUDED_UPCOMING_STATUSES.includes(status)) continue;
    const start = parseDate(trip.startDate);
    if (!start) continue;
    if (startOfDay(start) >= ref) count += 1;
  }
  return count;
}

/**
 * Extract a flat list of destination names from a trip.
 * Accepts `destinations` array or a single `destination` string.
 * @param {object} trip
 * @returns {string[]}
 */
function tripDestinations(trip) {
  const out = [];
  const push = (v) => {
    if (typeof v === "string" && v.trim() !== "") out.push(v.trim());
  };
  if (Array.isArray(trip.destinations)) trip.destinations.forEach(push);
  if (typeof trip.destination === "string") push(trip.destination);
  return out;
}

/**
 * Count distinct destinations visited / completed (case-insensitive).
 * A trip contributes its destinations when status === "completed"
 * OR its valid endDate is before the reference day.
 * @param {unknown} trips
 * @param {Date | string} [now] injectable reference date
 * @returns {number}
 */
export function countPlacesExplored(trips, now) {
  const ref = startOfDay(resolveNow(now));
  const seen = new Set();
  for (const trip of asTripArray(trips)) {
    if (!trip || typeof trip !== "object") continue;
    const status = normalizeStatus(trip.status);
    const end = parseDate(trip.endDate);
    const completed = status === EXPLORED_STATUS;
    const endedInPast = end !== null && startOfDay(end) < ref;
    if (!completed && !endedInPast) continue;
    for (const dest of tripDestinations(trip)) {
      seen.add(dest.toLowerCase());
    }
  }
  return seen.size;
}

/**
 * Aggregate planned budget across trips. Invalid / missing -> 0.
 * @param {unknown} trips
 * @returns {number}
 */
export function getTotalPlannedBudget(trips) {
  let total = 0;
  for (const trip of asTripArray(trips)) {
    if (!trip || typeof trip !== "object") continue;
    total += toSafeAmount(trip.plannedBudget ?? trip.budget);
  }
  return total;
}

/**
 * Aggregate actual expenses across trips. Missing expense data -> 0
 * for that trip (never NaN). Never mutates input.
 * @param {unknown} trips
 * @returns {number}
 */
export function getTotalActualExpenses(trips) {
  let total = 0;
  for (const trip of asTripArray(trips)) {
    if (!trip || typeof trip !== "object") continue;
    total += toSafeAmount(trip.actualExpenses ?? trip.spent ?? trip.expenses);
  }
  return total;
}

/**
 * Remaining budget from two amounts. Can be negative (overspend).
 * @param {unknown} planned
 * @param {unknown} actual
 * @returns {number}
 */
export function calculateRemainingBudget(planned, actual) {
  return toSafeAmount(planned) - toSafeAmount(actual);
}

/**
 * Remaining budget across a trip list (planned - actual).
 * @param {unknown} trips
 * @returns {number}
 */
export function getRemainingBudget(trips) {
  return calculateRemainingBudget(getTotalPlannedBudget(trips), getTotalActualExpenses(trips));
}

/**
 * Budget utilisation percentage from two amounts.
 * Returns 0 when planned <= 0 (avoids NaN / Infinity).
 * Rounded to one decimal place. Overspend yields > 100.
 * @param {unknown} planned
 * @param {unknown} actual
 * @returns {number}
 */
export function calculateUtilization(planned, actual) {
  const p = toSafeAmount(planned);
  const a = toSafeAmount(actual);
  if (p <= 0) return 0;
  const pct = (a / p) * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.round(pct * 10) / 10;
}

/**
 * Budget utilisation percentage across a trip list.
 * @param {unknown} trips
 * @returns {number}
 */
export function getBudgetUtilization(trips) {
  const list = asTripArray(trips);
  return calculateUtilization(getTotalPlannedBudget(list), getTotalActualExpenses(list));
}

/**
 * Convenience: compute every overview number in one pass-friendly call.
 * @param {unknown} trips
 * @param {Date | string} [now]
 * @returns {{ totalTrips:number, upcomingTrips:number, placesExplored:number, totalBudget:number, totalExpenses:number, remaining:number, utilization:number }}
 */
export function getDashboardSummary(trips, now) {
  const list = asTripArray(trips);
  const totalBudget = getTotalPlannedBudget(list);
  const totalExpenses = getTotalActualExpenses(list);
  return {
    totalTrips: getTotalTrips(list),
    upcomingTrips: countUpcomingTrips(list, now),
    placesExplored: countPlacesExplored(list, now),
    totalBudget,
    totalExpenses,
    remaining: calculateRemainingBudget(totalBudget, totalExpenses),
    utilization: calculateUtilization(totalBudget, totalExpenses),
  };
}
