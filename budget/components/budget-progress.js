/**
 * budget-progress.js — reusable budget bar (presentation only).
 * Thresholds from budget-calculator.js. Visual fill caps at 100% while the
 * true utilization prints separately. State is text + class, never color-only.
 */
import { BUDGET_STATUS, formatMoney } from "../js/budget-calculator.js";

const STATE_TEXT = Object.freeze({
  [BUDGET_STATUS.NO_BUDGET]: "No budget set",
  [BUDGET_STATUS.WITHIN]: "Within budget",
  [BUDGET_STATUS.APPROACHING]: "Approaching budget limit",
  [BUDGET_STATUS.OVER]: "Over budget",
});

/**
 * @param {{ planned: number|null, spent: number, remaining: number|null, utilization: number, status: string, currency?: string }} summary
 * @returns {HTMLElement}
 */
export function createBudgetProgress(summary) {
  const { planned, spent, remaining, utilization, status, currency = "INR" } = summary ?? {};
  const card = document.createElement("article");
  card.className = `budget-progress budget-progress--${status ?? "no-budget"}`;

  const top = document.createElement("div");
  top.className = "budget-progress__top";
  const state = document.createElement("p");
  state.className = "budget-progress__state";
  state.textContent = STATE_TEXT[status] ?? STATE_TEXT[BUDGET_STATUS.NO_BUDGET];
  const pct = document.createElement("p");
  pct.className = "budget-progress__pct";
  pct.textContent = planned === null ? "—" : `${utilization}% used`;
  top.appendChild(state);
  top.appendChild(pct);

  const track = document.createElement("div");
  track.className = "progress";
  const bar = document.createElement("div");
  bar.className = "progress__bar" + (status === BUDGET_STATUS.OVER ? " progress__bar--over" : "");
  const fill = planned === null || planned === 0 ? 0 : Math.min(100, utilization);
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", `Budget used: ${planned === null ? "no budget set" : `${utilization} percent`}`);
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", String(Math.round(fill)));
  bar.style.width = `${fill}%`;
  track.appendChild(bar);

  const rows = document.createElement("dl");
  rows.className = "budget-progress__rows";
  const addRow = (term, value, cls) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    if (cls) dd.className = cls;
    dd.textContent = value;
    rows.appendChild(dt);
    rows.appendChild(dd);
  };
  addRow("Planned", planned === null ? "Not set" : formatMoney(planned, currency));
  addRow("Spent", formatMoney(spent ?? 0, currency));
  addRow(
    remaining !== null && remaining < 0 ? "Over by" : "Remaining",
    remaining === null ? "—" : formatMoney(Math.abs(remaining), currency),
    status === BUDGET_STATUS.OVER ? "is-over" : "is-left"
  );

  card.appendChild(top);
  card.appendChild(track);
  card.appendChild(rows);
  return card;
}
