/**
 * activity-validation.js — pure, DOM-free activity validation.
 *
 * Time convention: "HH:MM" 24-hour strings on a single calendar day.
 * EXPLICIT midnight rule: overnight spans are NOT supported — an endTime
 * must be strictly later than startTime on the same date. Split overnight
 * plans into two activities instead of silently accepting them.
 *
 * Returns { valid, errors, warnings, value }. Errors block saving;
 * warnings (scheduling overlaps) never block saving.
 */

export const ACTIVITY_CATEGORIES = Object.freeze([
  "Sightseeing",
  "Food and Dining",
  "Adventure",
  "Shopping",
  "Transportation",
  "Accommodation",
  "Cultural Experience",
  "Other",
]);

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(v) {
  return typeof v === "string" ? v.trim() : "";
}

export function isValidTime(v) {
  return typeof v === "string" && TIME_RE.test(v);
}

export function isValidDay(v) {
  if (typeof v !== "string" || !DATE_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Normalize raw form input into the canonical activity shape (no id/order). */
export function normalizeActivityInput(input) {
  const src = input && typeof input === "object" ? input : {};
  const costRaw =
    typeof src.estimatedCost === "string" && src.estimatedCost.trim() !== ""
      ? Number(src.estimatedCost)
      : src.estimatedCost;
  const durRaw =
    typeof src.estimatedDurationMinutes === "string" && src.estimatedDurationMinutes.trim() !== ""
      ? Number(src.estimatedDurationMinutes)
      : src.estimatedDurationMinutes;
  return {
    title: text(src.title),
    date: text(src.date),
    startTime: text(src.startTime),
    endTime: text(src.endTime),
    location: text(src.location),
    category: text(src.category),
    estimatedCost: costRaw === "" ? undefined : costRaw,
    currency: text(src.currency).toUpperCase() || "INR",
    estimatedDurationMinutes: durRaw === "" ? undefined : durRaw,
    notes: text(src.notes),
  };
}

/**
 * Validate activity input against trip boundaries.
 * @param {unknown} input
 * @param {{ tripStart?: string, tripEnd?: string }} [bounds]
 */
export function validateActivityInput(input, bounds = {}) {
  const value = normalizeActivityInput(input);
  const errors = {};

  if (!value.title) errors.title = "Activity title is required.";
  else if (value.title.length > 120) errors.title = "Title must be 120 characters or fewer.";

  if (!value.date) errors.date = "Activity date is required.";
  else if (!isValidDay(value.date)) errors.date = "Date must be valid (YYYY-MM-DD).";
  else {
    if (bounds.tripStart && value.date < bounds.tripStart)
      errors.date = "Date is before the trip starts.";
    else if (bounds.tripEnd && value.date > bounds.tripEnd)
      errors.date = "Date is after the trip ends.";
  }

  if (value.startTime && !isValidTime(value.startTime)) errors.startTime = "Start time must be HH:MM (24-hour).";
  if (value.endTime && !isValidTime(value.endTime)) errors.endTime = "End time must be HH:MM (24-hour).";
  if (!errors.startTime && !errors.endTime && value.startTime && value.endTime) {
    if (timeToMinutes(value.endTime) <= timeToMinutes(value.startTime)) {
      errors.endTime =
        "End time must be later than start time. Overnight spans are not supported — split them into two activities.";
    }
  }

  if (value.estimatedCost !== undefined) {
    if (typeof value.estimatedCost !== "number" || !Number.isFinite(value.estimatedCost))
      errors.estimatedCost = "Cost must be a valid number.";
    else if (value.estimatedCost < 0) errors.estimatedCost = "Cost cannot be negative.";
    else value.estimatedCost = Math.round(value.estimatedCost * 100) / 100;
  }

  if (!/^[A-Z]{3}$/.test(value.currency)) value.currency = "INR";

  if (value.estimatedDurationMinutes !== undefined) {
    if (typeof value.estimatedDurationMinutes !== "number" || !Number.isFinite(value.estimatedDurationMinutes) || value.estimatedDurationMinutes < 0)
      errors.estimatedDurationMinutes = "Duration must be a non-negative number of minutes.";
    else value.estimatedDurationMinutes = Math.round(value.estimatedDurationMinutes);
  }

  if (value.category && !ACTIVITY_CATEGORIES.includes(value.category))
    errors.category = `Category must be one of: ${ACTIVITY_CATEGORIES.join(", ")}.`;

  if (value.notes.length > 2000) errors.notes = "Notes are too long.";

  return { valid: Object.keys(errors).length === 0, errors, warnings: [], value };
}

/**
 * Find timed activities on the same date overlapping the candidate.
 * Unscheduled activities (missing start or end) never conflict — only
 * overlapping CLOCK times count, never differing locations.
 * @param {object[]} dayActivities activities already on that date
 * @param {{ id?: string, startTime?: string, endTime?: string }} candidate
 * @returns {{ activityId: string, title: string }[]}
 */
export function detectOverlaps(dayActivities, candidate) {
  if (!candidate?.startTime || !candidate?.endTime || !isValidTime(candidate.startTime) || !isValidTime(candidate.endTime)) {
    return [];
  }
  const cs = timeToMinutes(candidate.startTime);
  const ce = timeToMinutes(candidate.endTime);
  if (!(ce > cs)) return [];
  const hits = [];
  for (const a of Array.isArray(dayActivities) ? dayActivities : []) {
    if (!a || typeof a !== "object" || (candidate.id && a.id === candidate.id)) continue;
    if (!isValidTime(a.startTime) || !isValidTime(a.endTime)) continue;
    const s = timeToMinutes(a.startTime);
    const e = timeToMinutes(a.endTime);
    if (!(e > s)) continue;
    if (s < ce && cs < e) hits.push({ activityId: a.id, title: a.title ?? "(untitled)" });
  }
  return hits;
}
