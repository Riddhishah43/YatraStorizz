/**
 * upcoming-trips.js — selection and preparation of upcoming trips.
 * Filtering / sorting live here; DOM rendering lives in the components
 * and dashboard-renderer.js.
 */
import { normalizeStatus, parseDate, startOfDay, resolveNow, EXCLUDED_UPCOMING_STATUSES } from "./dashboard-stats.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Inclusive trip duration in days (same-day trip = 1).
 * Returns 0 when either date is missing / invalid.
 * @param {unknown} startDate
 * @param {unknown} endDate
 * @returns {number}
 */
export function calculateTripDays(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return 0;
  const diff = Math.round((startOfDay(end) - startOfDay(start)) / MS_PER_DAY) + 1;
  if (!Number.isFinite(diff) || diff < 1) return 0;
  return diff;
}

/**
 * Whether a trip is eligible for the upcoming list.
 * @param {unknown} trip
 * @param {Date | string} [now]
 * @returns {boolean}
 */
export function isEligibleUpcoming(trip, now) {
  if (!trip || typeof trip !== "object") return false;
  const status = normalizeStatus(trip.status);
  if (EXCLUDED_UPCOMING_STATUSES.includes(status)) return false;
  const start = parseDate(trip.startDate);
  if (!start) return false;
  const ref = startOfDay(resolveNow(now));
  return startOfDay(start) >= ref;
}

/**
 * Filter, sort (earliest startDate first), and limit upcoming trips.
 * Never mutates the input array.
 * @param {unknown} trips
 * @param {{ limit?: number, now?: Date | string }} [options]
 * @returns {object[]}
 */
export function getUpcomingTrips(trips, options = {}) {
  const { limit = 3, now } = options;
  const list = Array.isArray(trips) ? trips : [];
  const eligible = list.filter((t) => isEligibleUpcoming(t, now));
  eligible.sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate));
  const n = Number.isFinite(Number(limit)) ? Math.max(0, Math.floor(Number(limit))) : 3;
  return eligible.slice(0, n);
}

/**
 * Normalise a trip into a presentation-ready view model.
 * @param {object} trip
 * @returns {{ id:string, title:string, destinations:string[], startDate:string, endDate:string, days:number, plannedBudget:number, status:string }}
 */
export function prepareTripForDisplay(trip) {
  const t = trip && typeof trip === "object" ? trip : {};
  const destinations = Array.isArray(t.destinations)
    ? t.destinations.filter((d) => typeof d === "string" && d.trim() !== "").map((d) => d.trim())
    : typeof t.destination === "string" && t.destination.trim() !== ""
      ? [t.destination.trim()]
      : [];
  const rawBudget = t.plannedBudget ?? t.budget;
  const plannedBudget =
    typeof rawBudget === "number" && Number.isFinite(rawBudget) && rawBudget > 0
      ? rawBudget
      : rawBudget === 0
        ? 0
        : 0;
  return {
    id: typeof t.id === "string" ? t.id : "",
    title: typeof t.title === "string" && t.title.trim() !== "" ? t.title.trim() : "Untitled trip",
    destinations,
    startDate: typeof t.startDate === "string" ? t.startDate : "",
    endDate: typeof t.endDate === "string" ? t.endDate : "",
    days: calculateTripDays(t.startDate, t.endDate),
    plannedBudget,
    status: typeof t.status === "string" && t.status.trim() !== "" ? t.status.trim() : "upcoming",
  };
}
