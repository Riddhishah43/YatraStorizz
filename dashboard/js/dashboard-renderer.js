/**
 * dashboard-renderer.js — rendering orchestration only.
 * Calls reusable components, updates mount points, renders
 * loading / populated / empty / error states. No statistics math here.
 */
import { getDashboardSummary } from "./dashboard-stats.js";
import { getUpcomingTrips } from "./upcoming-trips.js";
import { createStatCard } from "../components/stat-card.js";
import { createUpcomingTripCard } from "../components/upcoming-trip-card.js";
import { createBudgetSummaryCard } from "../components/budget-summary-card.js";
import { createActivitySummary } from "../components/activity-summary.js";

const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function emptyState(message) {
  const p = document.createElement("p");
  p.className = "empty-state";
  p.textContent = message;
  return p;
}

function errorState(message) {
  const p = document.createElement("p");
  p.className = "error-state";
  p.setAttribute("role", "alert");
  p.textContent = message;
  return p;
}

/**
 * Render the four overview statistic cards.
 * @param {HTMLElement} mount
 * @param {object[]} trips
 * @param {Date|string} [now]
 */
export function renderStats(mount, trips, now) {
  if (!mount) return;
  clear(mount);
  try {
    const s = getDashboardSummary(trips, now);
    const cards = [
      { label: "Total trips", value: s.totalTrips, icon: "🧳", description: "All trips associated with you" },
      { label: "Upcoming trips", value: s.upcomingTrips, icon: "🗓", description: "Scheduled for a future date" },
      { label: "Places explored", value: s.placesExplored, icon: "📍", description: "Distinct visited destinations" },
      { label: "Total travel budget", value: currencyFmt.format(s.totalBudget), icon: "💰", description: "Aggregate planned budget" },
    ];
    for (const c of cards) mount.appendChild(createStatCard(c));
  } catch {
    mount.appendChild(errorState("Could not load statistics."));
  }
}

/**
 * Render the upcoming-trips section.
 * @param {HTMLElement} mount
 * @param {object[]} trips
 * @param {{ limit?: number, now?: Date|string }} [options]
 */
export function renderUpcomingTrips(mount, trips, options = {}) {
  if (!mount) return;
  clear(mount);
  try {
    const upcoming = getUpcomingTrips(trips, options);
    if (upcoming.length === 0) {
      mount.appendChild(emptyState("No upcoming trips. Plan your next journey to see it here."));
      return;
    }
    for (const trip of upcoming) mount.appendChild(createUpcomingTripCard(trip));
  } catch {
    mount.appendChild(errorState("Could not load upcoming trips."));
  }
}

/**
 * Render the budget summary card.
 * @param {HTMLElement} mount
 * @param {object[]} trips
 */
export function renderBudgetSummary(mount, trips) {
  if (!mount) return;
  clear(mount);
  try {
    const s = getDashboardSummary(trips);
    mount.appendChild(
      createBudgetSummaryCard({ planned: s.totalBudget, actual: s.totalExpenses })
    );
  } catch {
    mount.appendChild(errorState("Could not load budget summary."));
  }
}

/**
 * Render the recent-activity feed.
 * @param {HTMLElement} mount
 * @param {unknown} activities
 */
export function renderActivity(mount, activities) {
  if (!mount) return;
  clear(mount);
  try {
    mount.appendChild(createActivitySummary(activities, { limit: 5 }));
  } catch {
    mount.appendChild(errorState("Could not load recent activity."));
  }
}

/**
 * Orchestrate a full dashboard render.
 * @param {{ trips?: unknown, activities?: unknown }} data
 * @param {{ stats:HTMLElement|null, upcoming:HTMLElement|null, budget:HTMLElement|null, activity:HTMLElement|null }} mounts
 * @param {{ upcomingLimit?: number, now?: Date|string }} [options]
 * @returns {{ ok:boolean, error?:string }}
 */
export function renderDashboard(data, mounts, options = {}) {
  try {
    const trips = Array.isArray(data?.trips) ? data.trips : [];
    const activities = Array.isArray(data?.activities) ? data.activities : [];
    if (mounts?.stats) renderStats(mounts.stats, trips, options.now);
    if (mounts?.upcoming) renderUpcomingTrips(mounts.upcoming, trips, { limit: options.upcomingLimit ?? 3, now: options.now });
    if (mounts?.budget) renderBudgetSummary(mounts.budget, trips);
    if (mounts?.activity) renderActivity(mounts.activity, activities);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Render failed" };
  }
}
