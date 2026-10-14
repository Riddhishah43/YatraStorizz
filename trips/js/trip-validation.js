/**
 * trip-validation.js — pure, DOM-free validation + normalization.
 * Same rules for create and edit. Never touches the DOM or storage.
 *
 * Accepted input shapes (form-friendly):
 * - destinations: "Jaipur, Udaipur" string OR [{name, country?}] OR ["Jaipur"]
 * - companions: "Asha, Ravi" string OR ["Asha"]
 * - plannedBudget: number or numeric string
 * - status: "auto" | "" | undefined (derive from dates) or a known status
 */

export const KNOWN_STATUSES = Object.freeze(["upcoming", "ongoing", "completed", "cancelled"]);
export const MAX_TITLE_LENGTH = 120;
export const MAX_TEXT_LENGTH = 2000;

function toTrimmedString(v) {
  return typeof v === "string" ? v.trim() : "";
}

function splitNames(v) {
  const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  const names = [];
  for (const item of raw) {
    const name = typeof item === "string" ? item.trim() : toTrimmedString(item?.name);
    if (name) names.push(name);
  }
  return names;
}

/** Strict calendar-date check: format YYYY-MM-DD and a real calendar day. */
export function isValidCalendarDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/**
 * Normalize raw input into the canonical trip shape (without id/timestamps).
 * Never throws on unexpected shapes.
 */
export function normalizeTripInput(input) {
  const src = input && typeof input === "object" ? input : {};
  const destinations = splitNames(src.destinations ?? src.destination).map((name) => ({ name, country: "" }));
  const budgetRaw = typeof src.plannedBudget === "string" && src.plannedBudget.trim() !== ""
    ? Number(src.plannedBudget)
    : src.plannedBudget;
  const statusRaw = toTrimmedString(src.status).toLowerCase();
  return {
    title: toTrimmedString(src.title),
    destinations,
    startDate: toTrimmedString(src.startDate),
    endDate: toTrimmedString(src.endDate),
    plannedBudget: budgetRaw,
    currency: toTrimmedString(src.currency).toUpperCase() || "INR",
    status: !statusRaw || statusRaw === "auto" ? undefined : statusRaw,
    description: toTrimmedString(src.description),
    companions: splitNames(src.companions),
    notes: toTrimmedString(src.notes),
  };
}

/**
 * Validate (and normalize) trip input.
 * @returns {{ valid: boolean, errors: Record<string,string>, value: object }}
 * errors keys: title, destinations, startDate, endDate, plannedBudget, status.
 * A date-range violation is reported on `endDate` so it renders nearby.
 */
export function validateTripInput(input) {
  const value = normalizeTripInput(input);
  const errors = {};

  if (!value.title) errors.title = "Trip title is required.";
  else if (value.title.length > MAX_TITLE_LENGTH)
    errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;

  if (value.destinations.length === 0) errors.destinations = "Add at least one destination.";
  else if (value.destinations.some((d) => d.name.length > 80))
    errors.destinations = "Destination names must be 80 characters or fewer.";

  if (!value.startDate) errors.startDate = "Start date is required.";
  else if (!isValidCalendarDate(value.startDate)) errors.startDate = "Start date must be a valid date (YYYY-MM-DD).";

  if (!value.endDate) errors.endDate = "End date is required.";
  else if (!isValidCalendarDate(value.endDate)) errors.endDate = "End date must be a valid date (YYYY-MM-DD).";

  if (!errors.startDate && !errors.endDate && value.endDate < value.startDate) {
    errors.endDate = "End date cannot be earlier than the start date.";
  }

  if (value.plannedBudget === undefined || value.plannedBudget === null || value.plannedBudget === "") {
    errors.plannedBudget = "Planned budget is required.";
  } else if (typeof value.plannedBudget !== "number" || !Number.isFinite(value.plannedBudget)) {
    errors.plannedBudget = "Budget must be a valid number.";
  } else if (value.plannedBudget < 0) {
    errors.plannedBudget = "Budget cannot be negative.";
  } else {
    value.plannedBudget = Math.round(value.plannedBudget * 100) / 100;
  }

  if (!/^[A-Z]{3}$/.test(value.currency)) value.currency = "INR";

  if (value.status !== undefined && !KNOWN_STATUSES.includes(value.status)) {
    errors.status = `Status must be one of: ${KNOWN_STATUSES.join(", ")}.`;
  }

  if (value.description.length > MAX_TEXT_LENGTH) errors.description = "Description is too long.";
  if (value.notes.length > MAX_TEXT_LENGTH) errors.notes = "Notes are too long.";

  return { valid: Object.keys(errors).length === 0, errors, value };
}
