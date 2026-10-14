/**
 * expense-list.js — readable expense rows (DOM only).
 * Actions route via data-action edit-expense/delete-expense + data-expense-id.
 * Currency formats consistently through the shared formatter.
 */
import { formatMoney } from "../js/budget-calculator.js";
import { createCategoryBadge } from "./expense-category.js";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function formatDay(ymd) {
  const [y, m, d] = String(ymd ?? "").split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Number.isNaN(dt.getTime()) ? "Date TBD" : dateFmt.format(dt);
}

/**
 * @param {HTMLElement} mount
 * @param {object[]} expenses already filtered + sorted
 * @param {{ currency?: string, filteredEmpty?: boolean, onResetFilters?: string }} [options]
 * @returns {number} rendered count
 */
export function renderExpenseList(mount, expenses, options = {}) {
  if (!mount) return 0;
  const { currency = "INR", filteredEmpty = false } = options;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const list = Array.isArray(expenses) ? expenses : [];

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-results";
    const t = document.createElement("p");
    t.className = "empty-results__title";
    t.textContent = filteredEmpty ? "No expenses match your filters." : "No expenses recorded yet.";
    const h = document.createElement("p");
    h.className = "empty-results__hint";
    h.textContent = filteredEmpty
      ? "Try widening the date or amount range, or reset the filters."
      : "Add your first expense to start tracking spending.";
    empty.appendChild(t);
    empty.appendChild(h);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--secondary btn--small";
    if (filteredEmpty) {
      btn.dataset.action = "reset-expense-filters";
      btn.textContent = "Reset filters";
    } else {
      btn.dataset.action = "add-expense";
      btn.textContent = "Add expense";
    }
    empty.appendChild(btn);
    mount.appendChild(empty);
    return 0;
  }

  const ul = document.createElement("ul");
  ul.className = "expense-list";
  for (const e of list) {
    const li = document.createElement("li");
    li.className = "expense-item";
    if (e.id) li.dataset.expenseId = String(e.id);

    const main = document.createElement("div");
    main.className = "expense-item__main";
    const desc = document.createElement("p");
    desc.className = "expense-item__desc";
    desc.textContent = e.description?.trim?.() || "(No description)";
    const sub = document.createElement("p");
    sub.className = "expense-item__sub";
    const bits = [formatDay(e.date)];
    if (e.paymentMethod?.trim?.()) bits.push(e.paymentMethod.trim());
    sub.textContent = bits.join(" · ");
    main.appendChild(desc);
    main.appendChild(sub);
    if (typeof e.notes === "string" && e.notes.trim()) {
      const notes = document.createElement("p");
      notes.className = "expense-item__notes";
      notes.textContent = e.notes.trim();
      main.appendChild(notes);
    }

    const side = document.createElement("div");
    side.className = "expense-item__side";
    side.appendChild(createCategoryBadge(e.category));
    const amount = document.createElement("p");
    amount.className = "expense-item__amount";
    amount.textContent = formatMoney(e.amount, e.currency || currency);
    side.appendChild(amount);

    const actions = document.createElement("div");
    actions.className = "expense-item__actions";
    for (const [action, label, cls] of [["edit-expense", "Edit", "btn--ghost"], ["delete-expense", "Delete", "btn--ghost btn--danger"]]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `btn btn--small ${cls}`;
      b.dataset.action = action;
      if (e.id) b.dataset.expenseId = String(e.id);
      b.textContent = label;
      b.setAttribute("aria-label", `${label} expense: ${e.description ?? ""}`);
      actions.appendChild(b);
    }
    side.appendChild(actions);

    li.appendChild(main);
    li.appendChild(side);
    ul.appendChild(li);
  }
  mount.appendChild(ul);
  return list.length;
}
