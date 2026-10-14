/**
 * budget-summary-card.js — reusable budget visualisation.
 * Clearly separates planned budget from actual spending.
 */
import { toSafeAmount, calculateRemainingBudget, calculateUtilization } from "../js/dashboard-stats.js";

const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * @param {{ planned?: unknown, actual?: unknown }} data
 * @returns {HTMLElement}
 */
export function createBudgetSummaryCard(data) {
  const planned = toSafeAmount(data?.planned);
  // Missing expense data is a valid state: treat as 0 but flag it.
  const hasActual = data?.actual !== undefined && data?.actual !== null;
  const actual = toSafeAmount(data?.actual);
  const remaining = calculateRemainingBudget(planned, actual);
  const utilization = calculateUtilization(planned, actual);
  const overspent = remaining < 0;
  const visualPct = planned <= 0 ? 0 : Math.min(100, utilization);

  const card = document.createElement("article");
  card.className = "budget-card" + (overspent ? " budget-card--overspent" : "");

  const title = document.createElement("h3");
  title.className = "budget-card__title";
  title.textContent = "Budget summary";
  card.appendChild(title);

  const rows = document.createElement("dl");
  rows.className = "budget-card__rows";

  const addRow = (term, value, extraClass) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    if (extraClass) dd.className = extraClass;
    dd.textContent = value;
    rows.appendChild(dt);
    rows.appendChild(dd);
  };

  addRow("Planned budget", currencyFmt.format(planned));
  addRow("Actual spending", hasActual ? currencyFmt.format(actual) : "No expense data yet");
  addRow("Remaining", currencyFmt.format(remaining), overspent ? "budget-card__overspent" : "budget-card__remaining");

  card.appendChild(rows);

  const pctLabel = document.createElement("p");
  pctLabel.className = "budget-card__pct";
  pctLabel.textContent =
    planned <= 0
      ? "No planned budget set"
      : overspent
        ? `Overspent by ${currencyFmt.format(Math.abs(remaining))} (${utilization}% used)`
        : `${utilization}% of budget used`;
  card.appendChild(pctLabel);

  const track = document.createElement("div");
  track.className = "progress";
  const bar = document.createElement("div");
  bar.className = "progress__bar" + (overspent ? " progress__bar--overspent" : "");
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Budget utilization");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", String(Math.round(visualPct)));
  bar.style.width = `${visualPct}%`;
  track.appendChild(bar);
  card.appendChild(track);

  return card;
}
