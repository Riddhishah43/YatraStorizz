/**
 * budget-service.js — budgets + expenses persistence (adapter-style).
 *
 * Storage shape under "yatrastorizz.budgets.v1":
 *   { [tripId]: { budget: { plannedAmount, currency, updatedAt } | null,
 *                 expenses: [{ id, tripId, description, amount, category,
 *                              date, paymentMethod, notes, createdAt, updatedAt }] } }
 *
 * INTEGRATION RULE: trips are NEVER stored here. Trip existence/identity
 * comes from the Trips service (entry validates tripId against it).
 * Expense IDs are globally unique (`exp-…`), so id-based update/delete
 * safely resolve across trips without array indexes.
 */
import { validateExpenseInput } from "./expense-manager.js";

const DEFAULT_STORAGE_KEY = "yatrastorizz.budgets.v1";

export function generateExpenseId() {
  return `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLocalStorageAdapter(key = DEFAULT_STORAGE_KEY, getStorage = () => globalThis.localStorage) {
  const readAll = () => {
    try {
      const raw = getStorage()?.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };
  const entryOf = (all, tripId) => {
    const e = all[tripId];
    if (!e || typeof e !== "object") return { budget: null, expenses: [] };
    return {
      budget: e.budget && typeof e.budget === "object" ? e.budget : null,
      expenses: Array.isArray(e.expenses) ? e.expenses.filter((x) => x && typeof x === "object") : [],
    };
  };
  return {
    load: (tripId) => entryOf(readAll(), tripId),
    save: (tripId, entry) => {
      try {
        const all = readAll();
        all[tripId] = entry;
        getStorage()?.setItem(key, JSON.stringify(all));
        return true;
      } catch {
        return false;
      }
    },
    loadAll: () => {
      const all = readAll();
      const out = {};
      for (const k of Object.keys(all)) out[k] = entryOf(all, k);
      return out;
    },
  };
}

export function createMemoryAdapter(seed = {}) {
  const data = {};
  for (const [k, v] of Object.entries(seed && typeof seed === "object" ? seed : {})) {
    data[k] = {
      budget: v?.budget ? { ...v.budget } : null,
      expenses: Array.isArray(v?.expenses) ? v.expenses.map((e) => ({ ...e })) : [],
    };
  }
  return {
    load: (tripId) => ({
      budget: data[tripId]?.budget ? { ...data[tripId].budget } : null,
      expenses: (data[tripId]?.expenses ?? []).map((e) => ({ ...e })),
    }),
    save: (tripId, entry) => {
      data[tripId] = {
        budget: entry.budget ? { ...entry.budget } : null,
        expenses: entry.expenses.map((e) => ({ ...e })),
      };
      return true;
    },
    loadAll: () => JSON.parse(JSON.stringify(data)),
  };
}

function validBudgetData(data) {
  const planned = typeof data?.plannedAmount === "string" && String(data.plannedAmount).trim() !== ""
    ? Number(data.plannedAmount)
    : data?.plannedAmount;
  const currency = typeof data?.currency === "string" && /^[A-Za-z]{3}$/.test(data.currency.trim())
    ? data.currency.trim().toUpperCase()
    : "INR";
  if (typeof planned !== "number" || !Number.isFinite(planned) || planned < 0) {
    return { ok: false, errors: { plannedAmount: "Budget must be a non-negative number." } };
  }
  return { ok: true, value: { plannedAmount: Math.round(planned * 100) / 100, currency } };
}

/**
 * @param {{ adapter?: {load,save,loadAll}, now?: Date|string|number|(()=>unknown) }} [options]
 */
export function createBudgetService(options = {}) {
  const adapter = options.adapter ?? createLocalStorageAdapter();
  const stamp = () => {
    const raw = typeof options.now === "function" ? options.now() : options.now ?? new Date();
    const dt = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
  };

  return {
    getBudget(tripId) {
      if (typeof tripId !== "string" || !tripId) return null;
      const { budget } = adapter.load(tripId);
      return budget ? { ...budget } : null;
    },

    saveBudget(tripId, budgetData) {
      if (typeof tripId !== "string" || !tripId) return { ok: false, error: "invalid-trip" };
      const checked = validBudgetData(budgetData);
      if (!checked.ok) return checked;
      const entry = adapter.load(tripId);
      const budget = { ...checked.value, updatedAt: stamp() };
      if (!adapter.save(tripId, { ...entry, budget })) return { ok: false, error: "storage-unavailable" };
      return { ok: true, budget };
    },

    getExpenses(tripId) {
      if (typeof tripId !== "string" || !tripId) return [];
      return adapter.load(tripId).expenses.map((e) => ({ ...e }));
    },

    getExpense(tripId, expenseId) {
      if (typeof expenseId !== "string" || !expenseId) return null;
      const found = adapter.load(tripId).expenses.find((e) => e.id === expenseId);
      return found ? { ...found } : null;
    },

    /** Resolve an expense ID across trips (IDs are globally unique). */
    findExpense(expenseId) {
      if (typeof expenseId !== "string" || !expenseId) return null;
      for (const [tripId, entry] of Object.entries(adapter.loadAll())) {
        const found = entry.expenses.find((e) => e.id === expenseId);
        if (found) return { tripId, expense: { ...found } };
      }
      return null;
    },

    addExpense(tripId, expenseData) {
      if (typeof tripId !== "string" || !tripId) return { ok: false, error: "invalid-trip" };
      const checked = validateExpenseInput(expenseData);
      if (!checked.valid) return { ok: false, errors: checked.errors };
      const entry = adapter.load(tripId);
      const expense = {
        ...checked.value,
        id: generateExpenseId(),
        tripId,
        createdAt: stamp(),
        updatedAt: stamp(),
      };
      entry.expenses.push(expense);
      if (!adapter.save(tripId, entry)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, expense: { ...expense } };
    },

    updateExpense(expenseId, updates) {
      const located = this.findExpense(expenseId);
      if (!located) return { ok: false, error: "not-found" };
      const checked = validateExpenseInput(updates);
      if (!checked.valid) return { ok: false, errors: checked.errors };
      const entry = adapter.load(located.tripId);
      const i = entry.expenses.findIndex((e) => e.id === expenseId);
      entry.expenses[i] = {
        ...checked.value,
        id: expenseId, // stable ID preserved
        tripId: located.tripId, // trip association preserved
        createdAt: entry.expenses[i].createdAt ?? stamp(),
        updatedAt: stamp(),
      };
      if (!adapter.save(located.tripId, entry)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, expense: { ...entry.expenses[i] } };
    },

    deleteExpense(expenseId) {
      const located = this.findExpense(expenseId);
      if (!located) return { ok: false, error: "not-found" };
      const entry = adapter.load(located.tripId);
      entry.expenses = entry.expenses.filter((e) => e.id !== expenseId);
      if (!adapter.save(located.tripId, entry)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, id: expenseId, tripId: located.tripId };
    },
  };
}
