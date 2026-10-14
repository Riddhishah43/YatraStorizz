/**
 * budget.js — composition root.
 *
 * Integration contracts (inspected, not invented):
 * - Trips: ../../trips/js/trip-service.js over shared localStorage
 *   ("yatrastorizz.trips.v1"). Trip picked via ?tripId= (same convention
 *   as the Itinerary page) or the trip selector dropdown. Budgets/expenses
 *   never duplicate trip records; unknown/deleted trips show an error.
 * - Itinerary: ../../itinerary/js/itinerary-service.js, read-only.
 *   Summed activity estimates display as "estimate only" and are NEVER
 *   added to actual spending (no double-counting by design).
 */
import { createTripService } from "../../trips/js/trip-service.js";
import { createItineraryService } from "../../itinerary/js/itinerary-service.js";
import { createBudgetService } from "./budget-service.js";
import { createExpenseFlow, updateExpenseFlow } from "./expense-manager.js";
import { applyExpenseFilters, createDefaultExpenseFilters } from "./expense-filters.js";
import {
  renderTripContext,
  renderBudgetOverview,
  renderCategoryBreakdown,
  renderExpenses,
  renderItineraryEstimate,
} from "./budget-renderer.js";
import { initBudgetEvents } from "./budget-events.js";
import {
  createExpenseFormDialog,
  openExpenseForm,
  closeExpenseForm,
  getExpenseFormValues,
  setExpenseFormErrors,
  clearExpenseFormErrors,
  setExpenseFormSubmitting,
} from "../components/expense-form.js";
import { getCategoryOptions } from "../components/expense-category.js";

const tripService = createTripService();
const itineraryService = createItineraryService();
const budgetService = createBudgetService();

const state = {
  tripId: "",
  filters: createDefaultExpenseFilters(),
  formMode: "create",
  editingId: null,
  submitting: false,
};

let formDialog = null;

function showStatus(message) {
  const region = document.getElementById("budget-status");
  if (!region) return;
  while (region.firstChild) region.removeChild(region.firstChild);
  region.textContent = message;
}

function currentTrip() {
  return state.tripId ? tripService.getById(state.tripId) : null;
}

/** Budget currency wins, then the trip's own currency, then INR. */
function activeCurrency(trip, budget) {
  if (budget?.currency) return budget.currency;
  if (trip?.currency) return trip.currency;
  return "INR";
}

function itineraryEstimate(tripId) {
  let total = 0;
  let count = 0;
  for (const a of itineraryService.getActivities(tripId)) {
    if (typeof a?.estimatedCost === "number" && Number.isFinite(a.estimatedCost) && a.estimatedCost >= 0) {
      total += a.estimatedCost;
      count += 1;
    }
  }
  return { total: Math.round(total * 100) / 100, count };
}

function renderAll() {
  const trip = currentTrip();
  if (!trip) {
    renderTripContext(document.getElementById("trip-context-mount"), null);
    showStatus("That trip is unavailable (it may have been deleted). Pick another trip.");
    return;
  }
  const budget = budgetService.getBudget(trip.id);
  const expenses = budgetService.getExpenses(trip.id);
  const currency = activeCurrency(trip, budget);

  // Keep the editor in sync (without clobbering focused typing).
  const amountInput = document.getElementById("budget-amount");
  if (amountInput && document.activeElement !== amountInput) {
    amountInput.value = budget ? String(budget.plannedAmount) : "";
  }
  const currencyTag = document.getElementById("budget-currency-tag");
  if (currencyTag) currencyTag.textContent = currency;

  renderTripContext(document.getElementById("trip-context-mount"), trip);
  const summary = renderBudgetOverview(
    { progress: document.getElementById("budget-progress-mount"), summary: document.getElementById("spending-summary-mount") },
    trip,
    budget,
    expenses,
    currency
  );
  renderCategoryBreakdown(document.getElementById("category-breakdown-mount"), summary.categories, currency);

  const visible = applyExpenseFilters(expenses, state.filters);
  const filteredEmpty = visible.length === 0 && expenses.length > 0;
  renderExpenses(document.getElementById("expense-list-mount"), document.getElementById("expense-count"), visible, {
    currency,
    filteredEmpty,
  });

  const est = itineraryEstimate(trip.id);
  renderItineraryEstimate(document.getElementById("estimate-mount"), est.total, est.count, currency);

  if (summary.status === "over") showStatus("You’ve exceeded your planned budget.");
  else if (summary.status === "approaching") showStatus("You’re approaching your budget limit.");
}

function selectTrip(tripId, { pushUrl = true } = {}) {
  const trip = tripId ? tripService.getById(tripId) : null;
  if (!trip) return false;
  state.tripId = trip.id;
  state.filters = createDefaultExpenseFilters();
  syncFilterControls();
  if (pushUrl) {
    try {
      history.replaceState(null, "", `?tripId=${encodeURIComponent(trip.id)}`);
    } catch {
      /* URL sync is cosmetic */
    }
  }
  renderAll();
  return true;
}

function syncFilterControls() {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  set("expense-search", state.filters.query);
  set("filter-category", state.filters.category);
  set("filter-sort", state.filters.sort);
  set("filter-from", state.filters.from);
  set("filter-to", state.filters.to);
  set("filter-min", state.filters.minAmount ?? "");
  set("filter-max", state.filters.maxAmount ?? "");
}

function saveBudgetFromEditor() {
  const trip = currentTrip();
  if (!trip) return;
  const input = document.getElementById("budget-amount");
  const errorSlot = document.getElementById("budget-error");
  const result = budgetService.saveBudget(trip.id, {
    plannedAmount: input?.value ?? "",
    currency: activeCurrency(trip, budgetService.getBudget(trip.id)),
  });
  if (!result.ok) {
    if (errorSlot) {
      errorSlot.textContent = result.errors?.plannedAmount ?? "Could not save the budget.";
      errorSlot.hidden = false;
    }
    return;
  }
  if (errorSlot) errorSlot.hidden = true;
  renderAll();
  showStatus("Budget saved.");
}

function openCreate() {
  state.formMode = "create";
  state.editingId = null;
  openExpenseForm(formDialog, { mode: "create" });
}

function openEdit(id) {
  const trip = currentTrip();
  const expense = trip ? budgetService.getExpense(trip.id, id) : null;
  if (!expense) {
    showStatus("That expense no longer exists.");
    return;
  }
  state.formMode = "edit";
  state.editingId = id;
  openExpenseForm(formDialog, { mode: "edit", values: expense });
}

async function submitExpenseForm() {
  if (state.submitting) return;
  state.submitting = true;
  setExpenseFormSubmitting(formDialog, true, state.formMode);
  clearExpenseFormErrors(formDialog);
  try {
    const values = getExpenseFormValues(formDialog);
    const result =
      state.formMode === "edit"
        ? updateExpenseFlow(budgetService, state.editingId, values)
        : createExpenseFlow(budgetService, state.tripId, values);
    if (!result.ok) {
      if (result.errors) setExpenseFormErrors(formDialog, result.errors);
      else showStatus("Could not save — browser storage is unavailable. Your entries are preserved.");
      return;
    }
    closeExpenseForm(formDialog);
    renderAll();
    showStatus(state.formMode === "edit" ? "Expense updated." : "Expense added.");
  } finally {
    state.submitting = false;
    setExpenseFormSubmitting(formDialog, false, state.formMode);
  }
}

function deleteFlow(id) {
  const located = budgetService.findExpense(id);
  if (!located || located.tripId !== state.tripId) {
    showStatus("That expense no longer exists.");
    return;
  }
  if (!window.confirm(`Delete “${located.expense.description}”? This cannot be undone.`)) return;
  const result = budgetService.deleteExpense(id);
  if (!result.ok) {
    showStatus("Could not delete — please try again.");
    return;
  }
  renderAll();
  showStatus(`Deleted “${located.expense.description}”.`);
}

function populateTripSelector() {
  const select = document.getElementById("trip-select");
  if (!select) return [];
  while (select.firstChild) select.removeChild(select.firstChild);
  const trips = tripService.getAll();
  for (const t of trips) {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t.title;
    select.appendChild(o);
  }
  return trips;
}

function populateCategoryFilter() {
  const select = document.getElementById("filter-category");
  if (!select) return;
  while (select.firstChild) select.removeChild(select.firstChild);
  for (const o of getCategoryOptions(true)) {
    const el = document.createElement("option");
    el.value = o.value;
    el.textContent = o.label;
    select.appendChild(el);
  }
}

function applyStoredTheme() {
  try {
    const saved = localStorage.getItem("yatrastorizz.theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.dataset.theme = saved;
      return;
    }
  } catch {
    /* ignore */
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset.theme = "dark";
  }
}

function showNoTrips(main) {
  while (main.firstChild) main.removeChild(main.firstChild);
  const box = document.createElement("div");
  box.className = "error-box";
  const t = document.createElement("p");
  t.className = "error-box__title";
  t.textContent = "No trips yet.";
  const m = document.createElement("p");
  m.textContent = "Create a trip first — budgets and expenses belong to a trip.";
  const link = document.createElement("a");
  link.className = "btn btn--primary";
  link.href = "../trips/trips.html";
  link.textContent = "Go to My Trips";
  box.appendChild(t);
  box.appendChild(m);
  box.appendChild(link);
  main.appendChild(box);
}

function init() {
  applyStoredTheme();
  populateCategoryFilter();
  const trips = populateTripSelector();

  if (trips.length === 0) {
    showNoTrips(document.getElementById("budget-main"));
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requested = params.get("tripId")?.trim() ?? "";
  const initial = trips.some((t) => t.id === requested) ? requested : trips[0].id;
  state.tripId = initial;
  document.getElementById("trip-select").value = initial;

  formDialog = createExpenseFormDialog({ onSubmit: submitExpenseForm });
  document.body.appendChild(formDialog);

  renderAll();

  initBudgetEvents(
    {
      tripSelect: document.getElementById("trip-select"),
      budgetAmount: document.getElementById("budget-amount"),
      searchInput: document.getElementById("expense-search"),
      categorySelect: document.getElementById("filter-category"),
      sortSelect: document.getElementById("filter-sort"),
      fromInput: document.getElementById("filter-from"),
      toInput: document.getElementById("filter-to"),
      minInput: document.getElementById("filter-min"),
      maxInput: document.getElementById("filter-max"),
    },
    {
      onTripChange: (id) => {
        if (!selectTrip(id)) showStatus("That trip is unavailable.");
      },
      onSaveBudget: saveBudgetFromEditor,
      onAddExpense: openCreate,
      onEditExpense: openEdit,
      onDeleteExpense: deleteFlow,
      onFilters: (patch) => {
        // NaN amounts (unparseable input) are dropped, never stored.
        if (patch && typeof patch.minAmount === "number" && Number.isNaN(patch.minAmount)) patch.minAmount = null;
        if (patch && typeof patch.maxAmount === "number" && Number.isNaN(patch.maxAmount)) patch.maxAmount = null;
        Object.assign(state.filters, patch);
        const trip = currentTrip();
        if (!trip) return;
        const expenses = budgetService.getExpenses(trip.id);
        const visible = applyExpenseFilters(expenses, state.filters);
        renderExpenses(document.getElementById("expense-list-mount"), document.getElementById("expense-count"), visible, {
          currency: activeCurrency(trip, budgetService.getBudget(trip.id)),
          filteredEmpty: visible.length === 0 && expenses.length > 0,
        });
      },
      onResetFilters: () => {
        state.filters = createDefaultExpenseFilters();
        syncFilterControls();
        renderAll();
      },
    }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
