/**
 * itinerary-days.js — calendar-date day generation (DOM-free).
 *
 * Same convention as the Trips module: "YYYY-MM-DD" is a LOCAL calendar
 * day. Day arithmetic uses setDate() (calendar arithmetic), never raw
 * +86400000 timestamps, so DST transitions cannot shift or skip days.
 * A trip Nov 10 → Nov 12 has THREE days (inclusive).
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse YMD to a local Date at midnight, or null. */
export function parseDay(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

/** Format a Date back to YYYY-MM-DD (local). */
export function toDayString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Inclusive trip duration in days. 0 when the range is invalid. */
export function calculateTripDurationDays(startDate, endDate) {
  const s = parseDay(startDate);
  const e = parseDay(endDate);
  if (!s || !e) return 0;
  const days = Math.round((e - s) / 86400000) + 1;
  return Number.isFinite(days) && days >= 1 ? days : 0;
}

/**
 * Generate [{ dayNumber: 1.., date: "YYYY-MM-DD" }] for the trip.
 * Invalid ranges yield [] (never throw).
 */
export function generateTripDays(startDate, endDate) {
  const s = parseDay(startDate);
  const e = parseDay(endDate);
  if (!s || !e || e < s) return [];
  const days = [];
  const cursor = new Date(s.getTime());
  let n = 1;
  while (cursor <= e) {
    days.push({ dayNumber: n, date: toDayString(cursor) });
    cursor.setDate(cursor.getDate() + 1); // calendar arithmetic, DST-safe
    n += 1;
  }
  return days;
}

/** Whether a YMD falls within [startDate, endDate] (string compare is exact for YMD). */
export function isDateInTrip(date, startDate, endDate) {
  if (!parseDay(date) || !parseDay(startDate) || !parseDay(endDate)) return false;
  return date >= startDate && date <= endDate;
}

/** 1-based day number for a date, or null when outside the trip. */
export function getDayNumber(date, startDate, endDate) {
  if (!isDateInTrip(date, startDate, endDate)) return null;
  return calculateTripDurationDays(startDate, date);
}

/** Activities on one date, in stored order. Pure; invalid records skipped. */
export function getActivitiesForDate(activities, date) {
  if (!Array.isArray(activities)) return [];
  return activities.filter((a) => a && typeof a === "object" && a.date === date);
}
