/**
 * expense-filters.js — pure search/filter/sort (no DOM).
 * Always returns a NEW array; invalid filter values are ignored safely.
 */

export const EXPENSE_SORTS = Object.freeze([
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
]);

export function createDefaultExpenseFilters() {
  return { query: "", category: "all", from: "", to: "", minAmount: null, maxAmount: null, sort: "newest" };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v) => typeof v === "string" && DATE_RE.test(v);

function amountOf(e) {
  const a = e?.amount;
  return typeof a === "number" && Number.isFinite(a) ? a : null;
}

/**
 * @param {object[]} expenses
 * @param {{ query?:string, category?:string, from?:string, to?:string, minAmount?:number|null, maxAmount?:number|null, sort?:string }} [filters]
 */
export function applyExpenseFilters(expenses, filters = {}) {
  const list = Array.isArray(expenses) ? [...expenses] : [];
  const q = typeof filters.query === "string" ? filters.query.trim().toLowerCase() : "";
  const cat = typeof filters.category === "string" ? filters.category.trim().toLowerCase() : "all";
  const from = isDay(filters.from) ? filters.from : "";
  const to = isDay(filters.to) ? filters.to : "";
  const min = typeof filters.minAmount === "number" && Number.isFinite(filters.minAmount) ? filters.minAmount : null;
  const max = typeof filters.maxAmount === "number" && Number.isFinite(filters.maxAmount) ? filters.maxAmount : null;
  const sort = EXPENSE_SORTS.some((o) => o.value === filters.sort) ? filters.sort : "newest";

  let out = list.filter((e) => e && typeof e === "object");
  if (q) {
    out = out.filter((e) =>
      [e.description, e.notes].filter((s) => typeof s === "string").join(" ").toLowerCase().includes(q)
    );
  }
  if (cat && cat !== "all") {
    out = out.filter((e) => String(e.category ?? "").toLowerCase() === cat);
  }
  if (from) out = out.filter((e) => typeof e.date === "string" && e.date >= from);
  if (to) out = out.filter((e) => typeof e.date === "string" && e.date <= to);
  if (min !== null) out = out.filter((e) => { const a = amountOf(e); return a !== null && a >= min; });
  if (max !== null) out = out.filter((e) => { const a = amountOf(e); return a !== null && a <= max; });

  const dateOf = (e) => (typeof e.date === "string" && e.date ? e.date : "");
  const createdOf = (e) => (typeof e.createdAt === "string" ? e.createdAt : "");
  if (sort === "oldest") out.sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || createdOf(a).localeCompare(createdOf(b)));
  else if (sort === "highest") out.sort((a, b) => (amountOf(b) ?? -1) - (amountOf(a) ?? -1));
  else if (sort === "lowest") out.sort((a, b) => (amountOf(a) ?? Infinity) - (amountOf(b) ?? Infinity));
  else out.sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || createdOf(b).localeCompare(createdOf(a)));
  return out;
}

/** Number of active (non-default) filters, for badges/clear-button state. */
export function getActiveExpenseFilterCount(filters = {}) {
  let n = 0;
  if (typeof filters.query === "string" && filters.query.trim()) n += 1;
  if (typeof filters.category === "string" && filters.category && filters.category !== "all") n += 1;
  if (isDay(filters.from) || isDay(filters.to)) n += 1;
  if (typeof filters.minAmount === "number" && Number.isFinite(filters.minAmount)) n += 1;
  if (typeof filters.maxAmount === "number" && Number.isFinite(filters.maxAmount)) n += 1;
  return n;
}
