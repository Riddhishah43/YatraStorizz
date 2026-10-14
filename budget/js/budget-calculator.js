/**
 * budget-calculator.js — pure financial calculations (no DOM, no storage).
 *
 * Precision: all sums run in INTEGER minor units (paise/cents) and convert
 * back once, so 0.1 + 0.2 style errors never reach the UI.
 * Missing/zero budget never yields NaN or Infinity — utilization is 0 and
 * status is "no-budget"; callers render "Set a budget to track spending".
 */

/** Utilization % at which spending counts as "approaching" the limit. */
export const APPROACHING_THRESHOLD = 80;

export const BUDGET_STATUS = Object.freeze({
  NO_BUDGET: "no-budget",
  WITHIN: "within",
  APPROACHING: "approaching",
  OVER: "over",
});

const toMinor = (amount) => Math.round(amount * 100);
const fromMinor = (minor) => minor / 100;

function validAmount(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function plannedOf(budget) {
  const p = budget?.plannedAmount;
  return typeof p === "number" && Number.isFinite(p) && p >= 0 ? p : null;
}

/** Sum of valid expense amounts (> 0, finite). Invalid records are SKIPPED for totals. */
export function getTotalSpent(expenses) {
  let minor = 0;
  for (const e of Array.isArray(expenses) ? expenses : []) {
    const a = validAmount(e?.amount);
    if (a !== null) minor += toMinor(a);
  }
  return fromMinor(minor);
}

/** Planned minus spent. Null when no usable budget (caller shows the empty state). */
export function getRemainingBudget(budget, expenses) {
  const planned = plannedOf(budget);
  if (planned === null) return null;
  return fromMinor(toMinor(planned) - toMinor(getTotalSpent(expenses)));
}

/** Utilization %. 0 for missing/zero budgets (never NaN/Infinity). Overspend yields > 100. */
export function getBudgetUtilization(budget, expenses) {
  const planned = plannedOf(budget);
  if (planned === null || planned === 0) return 0;
  const pct = (fromMinor(toMinor(getTotalSpent(expenses))) / planned) * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.round(pct * 10) / 10;
}

/**
 * Per-category totals, sorted by total desc.
 * Unknown/missing categories group under "other" (never dropped silently —
 * the service rejects unknown categories on write; this is a read-time guard).
 */
export function getCategoryTotals(expenses) {
  const map = new Map();
  for (const e of Array.isArray(expenses) ? expenses : []) {
    const a = validAmount(e?.amount);
    if (a === null) continue;
    const cat = typeof e?.category === "string" && e.category.trim() ? e.category.trim().toLowerCase() : "other";
    map.set(cat, (map.get(cat) ?? 0) + toMinor(a));
  }
  const total = getTotalSpent(expenses);
  const out = [...map.entries()].map(([category, minor]) => {
    const amount = fromMinor(minor);
    return {
      category,
      total: amount,
      percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    };
  });
  out.sort((a, b) => b.total - a.total);
  return out;
}

export function getExpenseCount(expenses) {
  return Array.isArray(expenses) ? expenses.filter((e) => e && typeof e === "object").length : 0;
}

/** Mean of valid expense amounts. 0 when there are none. */
export function getAverageExpense(expenses) {
  let minor = 0;
  let n = 0;
  for (const e of Array.isArray(expenses) ? expenses : []) {
    const a = validAmount(e?.amount);
    if (a === null) continue;
    minor += toMinor(a);
    n += 1;
  }
  return n === 0 ? 0 : fromMinor(minor) / n;
}

/**
 * Budget status from documented thresholds:
 * no-budget → over (spent > planned) → approaching (>= 80%) → within.
 */
export function getBudgetStatus(budget, expenses, approachingAt = APPROACHING_THRESHOLD) {
  const planned = plannedOf(budget);
  if (planned === null) return BUDGET_STATUS.NO_BUDGET;
  const spent = getTotalSpent(expenses);
  if (planned === 0) return spent > 0 ? BUDGET_STATUS.OVER : BUDGET_STATUS.WITHIN;
  if (spent > planned) return BUDGET_STATUS.OVER;
  if (spent / planned >= approachingAt / 100) return BUDGET_STATUS.APPROACHING;
  return BUDGET_STATUS.WITHIN;
}

/** Convenience roll-up used by the renderer. */
export function getBudgetSummary(budget, expenses) {
  const spent = getTotalSpent(expenses);
  return {
    planned: plannedOf(budget),
    spent,
    remaining: getRemainingBudget(budget, expenses),
    utilization: getBudgetUtilization(budget, expenses),
    status: getBudgetStatus(budget, expenses),
    count: getExpenseCount(expenses),
    average: getAverageExpense(expenses),
    categories: getCategoryTotals(expenses),
  };
}

/** Consistent currency formatting; falls back gracefully on bad codes. */
export function formatMoney(amount, currency = "INR") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
