/**
 * spending-summary.js — concise financial roll-up (presentation only).
 * Numbers arrive pre-computed from budget-calculator.js.
 * Over-budget vs remaining is explicit text, never color-only.
 */
import { BUDGET_STATUS, formatMoney } from "../js/budget-calculator.js";

/**
 * @param {{ planned: number|null, spent: number, remaining: number|null, utilization: number, status: string, count: number, average: number, currency?: string }} summary
 * @returns {HTMLElement}
 */
export function createSpendingSummary(summary) {
  const { planned, spent = 0, remaining, utilization = 0, status, count = 0, average = 0, currency = "INR" } = summary ?? {};
  const card = document.createElement("article");
  card.className = "spending-summary";

  const title = document.createElement("h2");
  title.className = "spending-summary__title";
  title.textContent = "Spending summary";
  card.appendChild(title);

  const grid = document.createElement("dl");
  grid.className = "spending-summary__grid";
  const add = (term, value, cls) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    if (cls) dd.className = cls;
    dd.textContent = value;
    grid.appendChild(dt);
    grid.appendChild(dd);
  };

  add("Planned budget", planned === null ? "Not set" : formatMoney(planned, currency));
  add("Total spent", formatMoney(spent, currency));
  if (planned === null) {
    add("Remaining", "Set a budget to track spending");
  } else if (status === BUDGET_STATUS.OVER) {
    add("Over budget by", formatMoney(Math.abs(remaining), currency), "is-over");
  } else {
    add("Remaining", formatMoney(remaining, currency), "is-left");
  }
  add("Utilization", planned === null ? "—" : `${utilization}%`);
  add("Expenses", String(count));
  add("Average expense", count === 0 ? "—" : formatMoney(Math.round(average * 100) / 100, currency));

  card.appendChild(grid);
  return card;
}
