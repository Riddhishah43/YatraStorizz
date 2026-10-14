/**
 * budget-events.js — interaction coordination (delegation, idempotent).
 * Mutation operations update data first (via entry handlers), then the
 * entry refreshes the UI. No calculations or persistence here.
 */

/**
 * @param {{ root?: ParentNode, tripSelect?: HTMLSelectElement|null, budgetAmount?: HTMLInputElement|null, searchInput?: HTMLInputElement|null, categorySelect?: HTMLSelectElement|null, sortSelect?: HTMLSelectElement|null, fromInput?: HTMLInputElement|null, toInput?: HTMLInputElement|null, minInput?: HTMLInputElement|null, maxInput?: HTMLInputElement|null }} mounts
 * @param {{ onTripChange?:(id:string)=>void, onSaveBudget?:()=>void, onAddExpense?:()=>void, onEditExpense?:(id:string)=>void, onDeleteExpense?:(id:string)=>void, onFilters?:(patch:object)=>void, onResetFilters?:()=>void }} [handlers]
 * @returns {() => void} cleanup
 */
export function initBudgetEvents(mounts = {}, handlers = {}) {
  const { root = document, tripSelect = null, budgetAmount = null, searchInput = null } = mounts;
  const scope = root;
  if (scope?.dataset?.budgetEventsBound === "true") return () => {};
  if (scope?.dataset) scope.dataset.budgetEventsBound = "true";

  const readNumber = (el) => {
    if (!el || el.value.trim() === "") return null;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : NaN;
  };

  const collectFilters = () => ({
    query: mounts.searchInput?.value ?? "",
    category: mounts.categorySelect?.value ?? "all",
    from: mounts.fromInput?.value ?? "",
    to: mounts.toInput?.value ?? "",
    minAmount: readNumber(mounts.minInput),
    maxAmount: readNumber(mounts.maxInput),
    sort: mounts.sortSelect?.value ?? "newest",
  });

  const onClick = (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-action]") : null;
    if (!t || !scope.contains(t)) return;
    const id = t.dataset.expenseId;
    switch (t.dataset.action) {
      case "save-budget":
        handlers.onSaveBudget?.();
        break;
      case "add-expense":
        handlers.onAddExpense?.();
        break;
      case "edit-expense":
        if (id) handlers.onEditExpense?.(id);
        break;
      case "delete-expense":
        if (id) handlers.onDeleteExpense?.(id);
        break;
      case "reset-expense-filters":
        handlers.onResetFilters?.();
        break;
      case "theme-toggle": {
        const rootEl = document.documentElement;
        const next = rootEl.dataset.theme === "dark" ? "light" : "dark";
        rootEl.dataset.theme = next;
        try {
          localStorage.setItem("yatrastorizz.theme", next);
        } catch {
          /* theme still applies for this session */
        }
        break;
      }
      default:
        break;
    }
  };

  const onTrip = (e) => handlers.onTripChange?.(e.target.value ?? "");
  const onSearch = () => handlers.onFilters?.(collectFilters());
  const onFilterChange = () => handlers.onFilters?.(collectFilters());
  const onBudgetEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handlers.onSaveBudget?.();
    }
  };

  scope.addEventListener("click", onClick);
  tripSelect?.addEventListener("change", onTrip);
  searchInput?.addEventListener("input", onSearch);
  mounts.categorySelect?.addEventListener("change", onFilterChange);
  mounts.sortSelect?.addEventListener("change", onFilterChange);
  mounts.fromInput?.addEventListener("change", onFilterChange);
  mounts.toInput?.addEventListener("change", onFilterChange);
  mounts.minInput?.addEventListener("input", onFilterChange);
  mounts.maxInput?.addEventListener("input", onFilterChange);
  budgetAmount?.addEventListener("keydown", onBudgetEnter);

  return () => {
    scope.removeEventListener("click", onClick);
    tripSelect?.removeEventListener("change", onTrip);
    searchInput?.removeEventListener("input", onSearch);
    mounts.categorySelect?.removeEventListener("change", onFilterChange);
    mounts.sortSelect?.removeEventListener("change", onFilterChange);
    mounts.fromInput?.removeEventListener("change", onFilterChange);
    mounts.toInput?.removeEventListener("change", onFilterChange);
    mounts.minInput?.removeEventListener("input", onFilterChange);
    mounts.maxInput?.removeEventListener("input", onFilterChange);
    budgetAmount?.removeEventListener("keydown", onBudgetEnter);
    if (scope?.dataset) delete scope.dataset.budgetEventsBound;
  };
}
