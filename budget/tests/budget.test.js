import { describe, it, expect } from "vitest";
import {
  getTotalSpent,
  getRemainingBudget,
  getBudgetUtilization,
  getCategoryTotals,
  getExpenseCount,
  getAverageExpense,
  getBudgetStatus,
  getBudgetSummary,
  formatMoney,
  BUDGET_STATUS,
} from "../js/budget-calculator.js";
import {
  createBudgetService,
  createMemoryAdapter,
  createLocalStorageAdapter,
} from "../js/budget-service.js";
import {
  validateExpenseInput,
  createExpenseFlow,
  updateExpenseFlow,
} from "../js/expense-manager.js";
import {
  applyExpenseFilters,
  createDefaultExpenseFilters,
  getActiveExpenseFilterCount,
} from "../js/expense-filters.js";

const budget = { plannedAmount: 25000, currency: "INR" };
const expenses = [
  { id: "e1", tripId: "t1", description: "Hotel", amount: 4500, category: "accommodation", date: "2026-11-10" },
  { id: "e2", tripId: "t1", description: "Taxi to fort", amount: 800, category: "transportation", date: "2026-11-11" },
  { id: "e3", tripId: "t1", description: "Dinner", amount: 1200, category: "food", date: "2026-11-11" },
];

function svc(seed = {}) {
  return createBudgetService({ adapter: createMemoryAdapter(seed), now: "2026-10-14T12:00:00.000Z" });
}

describe("calculations", () => {
  it("totals, remaining, utilization", () => {
    expect(getTotalSpent(expenses)).toBe(6500);
    expect(getRemainingBudget(budget, expenses)).toBe(18500);
    expect(getBudgetUtilization(budget, expenses)).toBe(26);
  });
  it("handles missing / zero budgets without NaN or Infinity", () => {
    expect(getBudgetUtilization(null, expenses)).toBe(0);
    expect(getBudgetUtilization({ plannedAmount: 0 }, expenses)).toBe(0);
    expect(getRemainingBudget(null, expenses)).toBeNull();
    expect(getBudgetStatus(null, expenses)).toBe(BUDGET_STATUS.NO_BUDGET);
    const summary = getBudgetSummary(null, []);
    expect(summary).toMatchObject({ planned: null, spent: 0, remaining: null, utilization: 0, count: 0 });
  });
  it("handles overspending", () => {
    const big = [...expenses, { amount: 30000, category: "shopping" }];
    expect(getRemainingBudget(budget, big)).toBe(-11500);
    expect(getBudgetUtilization(budget, big)).toBe(146);
    expect(getBudgetStatus(budget, big)).toBe(BUDGET_STATUS.OVER);
  });
  it("computes category totals + percentages and status thresholds", () => {
    const cats = getCategoryTotals(expenses);
    expect(cats[0]).toMatchObject({ category: "accommodation", total: 4500 });
    expect(cats.reduce((n, c) => n + c.percent, 0)).toBeCloseTo(100, 0);
    expect(getBudgetStatus(budget, [])).toBe(BUDGET_STATUS.WITHIN);
    const near = [{ amount: 20000, category: "other" }]; // 80%
    expect(getBudgetStatus(budget, near)).toBe(BUDGET_STATUS.APPROACHING);
  });
  it("counts, averages, and rounds like money (0.1 + 0.2)", () => {
    expect(getExpenseCount(expenses)).toBe(3);
    expect(getExpenseCount(null)).toBe(0);
    expect(getAverageExpense(expenses)).toBeCloseTo(2166.67, 2);
    expect(getAverageExpense([])).toBe(0);
    expect(getTotalSpent([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
    expect(formatMoney(25000, "INR")).toContain("25,000");
    expect(formatMoney(NaN)).toBe("—");
  });
  it("skips invalid records in totals instead of crashing", () => {
    expect(getTotalSpent([...expenses, null, { amount: -5 }, { amount: "x" }])).toBe(6500);
  });
});

describe("expense validation", () => {
  const good = { description: "Hotel", amount: 4500, category: "accommodation", date: "2026-11-10" };
  it("accepts valid input and normalizes it", () => {
    const r = validateExpenseInput({ ...good, amount: "4500", category: "Accommodation" });
    expect(r.valid).toBe(true);
    expect(r.value.amount).toBe(4500);
    expect(r.value.category).toBe("accommodation");
  });
  it("rejects zero/negative amounts and missing fields", () => {
    expect(validateExpenseInput({ ...good, amount: 0 }).errors.amount).toMatch(/greater than zero/);
    expect(validateExpenseInput({ ...good, amount: -10 }).errors.amount).toMatch(/greater than zero/);
    const r = validateExpenseInput({});
    expect(r.valid).toBe(false);
    expect(r.errors.description).toMatch(/required/);
    expect(r.errors.category).toMatch(/required/);
    expect(r.errors.date).toMatch(/required/);
  });
  it("rejects unknown categories and bad dates", () => {
    expect(validateExpenseInput({ ...good, category: "yacht" }).errors.category).toMatch(/valid category/);
    expect(validateExpenseInput({ ...good, date: "2026-02-30" }).errors.date).toMatch(/valid/);
  });
});

describe("service", () => {
  it("saves and reads a budget", () => {
    const s = svc();
    expect(s.getBudget("t1")).toBeNull();
    const res = s.saveBudget("t1", { plannedAmount: 25000, currency: "INR" });
    expect(res.ok).toBe(true);
    expect(s.getBudget("t1").plannedAmount).toBe(25000);
    expect(s.saveBudget("t1", { plannedAmount: -5 })).toMatchObject({ ok: false });
  });
  it("adds, updates (id preserved), and deletes the correct expense", () => {
    const s = svc();
    const added = s.addExpense("t1", { description: "Hotel", amount: 4500, category: "accommodation", date: "2026-11-10" });
    expect(added.ok).toBe(true);
    expect(added.expense.id).toMatch(/^exp-/);
    const updated = s.updateExpense(added.expense.id, { description: "Hotel+", amount: 5000, category: "accommodation", date: "2026-11-10" });
    expect(updated.ok).toBe(true);
    expect(updated.expense.id).toBe(added.expense.id);
    expect(updated.expense.tripId).toBe("t1");
    const other = s.addExpense("t1", { description: "Taxi", amount: 800, category: "transportation", date: "2026-11-11" });
    expect(s.deleteExpense(added.expense.id)).toMatchObject({ ok: true });
    expect(s.getExpenses("t1").map((e) => e.id)).toEqual([other.expense.id]);
  });
  it("keeps trips isolated and handles unknown ids", () => {
    const s = svc();
    s.addExpense("t1", { description: "A", amount: 100, category: "food", date: "2026-11-10" });
    s.addExpense("t2", { description: "B", amount: 200, category: "food", date: "2026-11-10" });
    expect(s.getExpenses("t1").length).toBe(1);
    expect(s.getExpenses("t2")[0].tripId).toBe("t2");
    expect(s.updateExpense("exp-nope", { description: "x", amount: 1, category: "food", date: "2026-11-10" })).toMatchObject({ ok: false, error: "not-found" });
    expect(s.deleteExpense("exp-nope")).toMatchObject({ ok: false, error: "not-found" });
    // switching trips never mixes: full isolation check
    expect(s.getBudget("t2")).toBeNull();
  });
  it("surfaces storage failures and malformed data safely", () => {
    const failing = createBudgetService({
      adapter: { load: () => ({ budget: null, expenses: [] }), save: () => false, loadAll: () => ({}) },
    });
    expect(failing.addExpense("t1", { description: "A", amount: 1, category: "food", date: "2026-11-10" })).toMatchObject({ ok: false, error: "storage-unavailable" });
    const malformed = createBudgetService({
      adapter: createLocalStorageAdapter("k", () => ({ getItem: () => "{broken", setItem: () => {} })),
    });
    expect(malformed.getExpenses("t1")).toEqual([]);
    expect(malformed.getBudget("t1")).toBeNull();
  });
  it("manager flows validate before touching the service", () => {
    const s = svc();
    expect(createExpenseFlow(s, "t1", { description: "", amount: 0, category: "", date: "" }).ok).toBe(false);
    expect(s.getExpenses("t1")).toEqual([]);
    const ok = createExpenseFlow(s, "t1", { description: "Hotel", amount: 4500, category: "accommodation", date: "2026-11-10" });
    expect(ok.ok).toBe(true);
    const bad = updateExpenseFlow(s, ok.expense.id, { description: "x", amount: -1, category: "food", date: "2026-11-10" });
    expect(bad.ok).toBe(false);
    expect(s.getExpense("t1", ok.expense.id).amount).toBe(4500); // unchanged
  });
});

describe("filters", () => {
  it("searches, filters, ranges, sorts, and resets", () => {
    const base = createDefaultExpenseFilters();
    expect(applyExpenseFilters(expenses, { ...base, query: "fort" }).map((e) => e.id)).toEqual(["e2"]);
    expect(applyExpenseFilters(expenses, { ...base, category: "food" }).map((e) => e.id)).toEqual(["e3"]);
    expect(applyExpenseFilters(expenses, { ...base, from: "2026-11-11", to: "2026-11-11" }).map((e) => e.id)).toEqual(["e2", "e3"]);
    expect(applyExpenseFilters(expenses, { ...base, minAmount: 1000 }).map((e) => e.id)).toEqual(["e3", "e1"]); // default sort: newest first
    expect(applyExpenseFilters(expenses, { ...base, maxAmount: 1000 }).map((e) => e.id)).toEqual(["e2"]);
    expect(applyExpenseFilters(expenses, { ...base, sort: "highest" }).map((e) => e.id)).toEqual(["e1", "e3", "e2"]);
    expect(applyExpenseFilters(expenses, { ...base, sort: "lowest" }).map((e) => e.id)).toEqual(["e2", "e3", "e1"]);
    expect(applyExpenseFilters(expenses, { ...base, sort: "oldest" }).map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
    expect(applyExpenseFilters(expenses, base).length).toBe(3);
    expect(applyExpenseFilters(expenses, { ...base, query: "zzz" })).toEqual([]);
    expect(getActiveExpenseFilterCount(base)).toBe(0);
    expect(getActiveExpenseFilterCount({ ...base, query: "x", category: "food" })).toBe(2);
  });
  it("never mutates input and ignores invalid filter values", () => {
    const snapshot = JSON.parse(JSON.stringify(expenses));
    applyExpenseFilters(expenses, { query: "e", minAmount: NaN, from: "bad", sort: "nope" });
    expect(expenses).toEqual(snapshot);
  });
});
