/**
 * budget-renderer.js — rendering orchestration (stateless).
 * Receives prepared data; calculations stay in budget-calculator.js,
 * filtering in expense-filters.js, persistence in budget-service.js.
 */
import { getBudgetSummary } from "./budget-calculator.js";
import { createBudgetProgress } from "../components/budget-progress.js";
import { createSpendingSummary } from "../components/spending-summary.js";
import { createCategoryBadge } from "../components/expense-category.js";
import { renderExpenseList } from "../components/expense-list.js";
import { formatMoney } from "./budget-calculator.js";

/** Trip context line: name + dates. */
export function renderTripContext(mount, trip) {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  if (!trip) return;
  const fmt = (ymd) => {
    const [y, m, d] = String(ymd ?? "").split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return Number.isNaN(dt.getTime())
      ? "Date TBD"
      : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(dt);
  };
  const dests = (Array.isArray(trip.destinations) ? trip.destinations : [])
    .map((d) => (typeof d === "string" ? d.trim() : d?.name?.trim?.() ?? ""))
    .filter(Boolean);
  const p = document.createElement("p");
  p.className = "trip-context";
  p.textContent = dests.length
    ? `${trip.title} — ${dests.join(" · ")} (${fmt(trip.startDate)} → ${fmt(trip.endDate)})`
    : `${trip.title} (${fmt(trip.startDate)} → ${fmt(trip.endDate)})`;
  mount.appendChild(p);
}

/**
 * Render overview sections. Shows the "set a budget" empty state when
 * no budget exists (spending still visible underneath).
 */
export function renderBudgetOverview(mounts, trip, budget, expenses, currency) {
  const summary = getBudgetSummary(budget, expenses);
  if (mounts.progress) {
    while (mounts.progress.firstChild) mounts.progress.removeChild(mounts.progress.firstChild);
    if (!budget) {
      const empty = document.createElement("div");
      empty.className = "empty-results";
      const t = document.createElement("p");
      t.className = "empty-results__title";
      t.textContent = "No budget set for this trip yet.";
      const h = document.createElement("p");
      h.className = "empty-results__hint";
      h.textContent = "Set a budget to start tracking your trip.";
      empty.appendChild(t);
      empty.appendChild(h);
      mounts.progress.appendChild(empty);
    } else {
      mounts.progress.appendChild(createBudgetProgress({ ...summary, currency }));
    }
  }
  if (mounts.summary) {
    while (mounts.summary.firstChild) mounts.summary.removeChild(mounts.summary.firstChild);
    mounts.summary.appendChild(createSpendingSummary({ ...summary, currency }));
  }
  return summary;
}

/** Category breakdown rows with per-category share bars. */
export function renderCategoryBreakdown(mount, categories, currency) {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const title = document.createElement("h2");
  title.className = "section-title";
  title.textContent = "Spending by category";
  mount.appendChild(title);
  if (!categories.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "No categorized spending yet.";
    mount.appendChild(p);
    return;
  }
  const ul = document.createElement("ul");
  ul.className = "category-breakdown";
  for (const c of categories) {
    const li = document.createElement("li");
    li.className = "category-breakdown__row";
    const left = document.createElement("div");
    left.className = "category-breakdown__label";
    left.appendChild(createCategoryBadge(c.category));
    const share = document.createElement("span");
    share.className = "category-breakdown__share";
    share.textContent = `${c.percent}%`;
    left.appendChild(share);
    const amount = document.createElement("span");
    amount.className = "category-breakdown__amount";
    amount.textContent = formatMoney(c.total, currency);
    const bar = document.createElement("div");
    bar.className = "progress progress--thin";
    const fill = document.createElement("div");
    fill.className = "progress__bar";
    fill.setAttribute("role", "progressbar");
    fill.setAttribute("aria-label", `${c.category} share of spending: ${c.percent} percent`);
    fill.setAttribute("aria-valuemin", "0");
    fill.setAttribute("aria-valuemax", "100");
    fill.setAttribute("aria-valuenow", String(Math.round(c.percent)));
    fill.style.width = `${Math.min(100, c.percent)}%`;
    bar.appendChild(fill);
    li.appendChild(left);
    li.appendChild(amount);
    li.appendChild(bar);
    ul.appendChild(li);
  }
  mount.appendChild(ul);
}

/** Expense list + result count line. */
export function renderExpenses(mount, countMount, expenses, { currency, filteredEmpty }) {
  const n = renderExpenseList(mount, expenses, { currency, filteredEmpty });
  if (countMount) {
    countMount.textContent = n === 1 ? "1 expense" : `${n} expenses`;
  }
  return n;
}

/** Read-only itinerary estimate line (estimates ≠ actual spending). */
export function renderItineraryEstimate(mount, total, activityCount, currency) {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  if (!activityCount) return;
  const p = document.createElement("p");
  p.className = "estimate-note";
  p.textContent =
    `Itinerary estimate: ${formatMoney(total, currency)} across ${activityCount} planned ` +
    `${activityCount === 1 ? "activity" : "activities"} (estimate only — not counted as spending).`;
  mount.appendChild(p);
}
