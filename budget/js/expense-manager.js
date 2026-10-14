/**
 * expense-manager.js — canonical categories + expense validation + flows.
 *
 * EXPENSE_CATEGORIES is the SINGLE source of category truth: the form,
 * filters, list badges, and summaries all import these values.
 * Storage stays in budget-service.js; this module never touches it —
 * flows receive a service instance (same pattern as the Itinerary module).
 */

export const EXPENSE_CATEGORIES = Object.freeze([
  { value: "accommodation", label: "Accommodation", icon: "🏨" },
  { value: "transportation", label: "Transportation", icon: "🚌" },
  { value: "food", label: "Food & Dining", icon: "🍽" },
  { value: "activities", label: "Activities & Attractions", icon: "🎟" },
  { value: "shopping", label: "Shopping", icon: "🛍" },
  { value: "other", label: "Other", icon: "📦" },
]);

export const PAYMENT_METHODS = Object.freeze(["Cash", "Card", "UPI", "Bank transfer", "Other"]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(v) {
  return typeof v === "string" ? v.trim() : "";
}

export function isKnownCategory(value) {
  return EXPENSE_CATEGORIES.some((c) => c.value === String(value ?? "").toLowerCase());
}

export function categoryLabel(value) {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === String(value ?? "").toLowerCase());
  return found ? found.label : "Other";
}

export function isValidExpenseDate(v) {
  if (typeof v !== "string" || !DATE_RE.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** Normalize raw form input (no id/trip/audit fields). Never throws. */
export function normalizeExpenseInput(input) {
  const src = input && typeof input === "object" ? input : {};
  const amountRaw =
    typeof src.amount === "string" && src.amount.trim() !== "" ? Number(src.amount) : src.amount;
  return {
    description: text(src.description),
    amount: amountRaw,
    category: text(src.category).toLowerCase(),
    date: text(src.date),
    paymentMethod: text(src.paymentMethod),
    notes: text(src.notes),
  };
}

/**
 * @returns {{ valid: boolean, errors: Record<string,string>, value: object }}
 * errors keys: description, amount, category, date.
 */
export function validateExpenseInput(input) {
  const value = normalizeExpenseInput(input);
  const errors = {};

  if (!value.description) errors.description = "Description is required.";
  else if (value.description.length > 120) errors.description = "Description must be 120 characters or fewer.";

  if (value.amount === undefined || value.amount === null || value.amount === "") {
    errors.amount = "Amount is required.";
  } else if (typeof value.amount !== "number" || !Number.isFinite(value.amount)) {
    errors.amount = "Amount must be a valid number.";
  } else if (value.amount <= 0) {
    errors.amount = "Amount must be greater than zero.";
  } else {
    value.amount = Math.round(value.amount * 100) / 100;
  }

  if (!value.category) errors.category = "Category is required.";
  else if (!isKnownCategory(value.category)) errors.category = "Choose a valid category.";

  if (!value.date) errors.date = "Expense date is required.";
  else if (!isValidExpenseDate(value.date)) errors.date = "Date must be valid (YYYY-MM-DD).";

  if (value.notes.length > 2000) errors.notes = "Notes are too long.";

  return { valid: Object.keys(errors).length === 0, errors, value };
}

/* ---- flows: validate → service ---- */

export function createExpenseFlow(service, tripId, values) {
  const checked = validateExpenseInput(values);
  if (!checked.valid) return { ok: false, errors: checked.errors };
  return service.addExpense(tripId, checked.value);
}

export function updateExpenseFlow(service, expenseId, values) {
  const checked = validateExpenseInput(values);
  if (!checked.valid) return { ok: false, errors: checked.errors };
  return service.updateExpense(expenseId, checked.value);
}
