/**
 * itinerary-renderer.js — rendering orchestration (no state of its own).
 * Every render function receives fully-prepared data; the entry owns state.
 */
import { createDayTabs } from "../components/day-tabs.js";
import { renderActivityTimeline } from "../components/activity-timeline.js";
import { getDayCostTotal } from "./activity-manager.js";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

function formatYMD(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(y, m - 1, d));
}

/** Trip summary header. Handles missing budget gracefully. */
export function renderTripHeader(mount, trip, durationDays) {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const wrap = document.createElement("div");
  wrap.className = "trip-summary";

  const title = document.createElement("h2");
  title.className = "trip-summary__title";
  title.textContent = trip.title?.trim?.() || "Untitled trip";

  const dests = (Array.isArray(trip.destinations) ? trip.destinations : [])
    .map((d) => (typeof d === "string" ? d.trim() : d?.name?.trim?.() ?? ""))
    .filter(Boolean);
  const sub = document.createElement("p");
  sub.className = "trip-summary__sub";
  const when = `${formatYMD(trip.startDate)} → ${formatYMD(trip.endDate)} · ${durationDays} day${durationDays === 1 ? "" : "s"}`;
  sub.textContent = dests.length ? `${dests.join(" · ")} — ${when}` : when;

  wrap.appendChild(title);
  wrap.appendChild(sub);

  if (typeof trip.plannedBudget === "number" && Number.isFinite(trip.plannedBudget) && trip.plannedBudget >= 0) {
    const budget = document.createElement("p");
    budget.className = "trip-summary__budget";
    try {
      budget.textContent = `Planned budget: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: trip.currency || "INR", maximumFractionDigits: 0 }).format(trip.plannedBudget)}`;
    } catch {
      budget.textContent = `Planned budget: ${trip.plannedBudget} ${trip.currency || "INR"}`;
    }
    wrap.appendChild(budget);
  }
  mount.appendChild(wrap);
}

/** Day tabs with per-day activity counts. */
export function renderDayTabs(mount, days, selectedDate, allActivities, onSelect) {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const counts = {};
  for (const a of allActivities) {
    if (a?.date) counts[a.date] = (counts[a.date] ?? 0) + 1;
  }
  mount.appendChild(createDayTabs({ days, selectedDate, counts, onSelect }));
}

/** Timeline + day summary (count + cost total). Returns rendered count. */
export function renderDay(mount, summaryMount, dayActivities, { date, sortMode, conflicts }) {
  const n = renderActivityTimeline(mount, dayActivities, { date, sortMode, conflicts });
  if (summaryMount) {
    while (summaryMount.firstChild) summaryMount.removeChild(summaryMount.firstChild);
    const count = document.createElement("p");
    count.className = "day-summary__count";
    count.textContent = n === 1 ? "1 activity planned" : `${n} activities planned`;
    const cost = document.createElement("p");
    cost.className = "day-summary__cost";
    const total = getDayCostTotal(dayActivities);
    cost.textContent = total > 0 ? `Estimated day total: ₹${total.toLocaleString("en-IN")}` : "No estimated costs for this day";
    summaryMount.appendChild(count);
    summaryMount.appendChild(cost);
  }
  return n;
}

/** Full-page error state (unknown trip, bad id, storage failure). */
export function showItineraryError(mount, message, backHref = "../trips/trips.html") {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const box = document.createElement("div");
  box.className = "error-box";
  box.setAttribute("role", "alert");
  const t = document.createElement("p");
  t.className = "error-box__title";
  t.textContent = "Could not load this itinerary.";
  const m = document.createElement("p");
  m.textContent = message;
  const back = document.createElement("a");
  back.className = "btn btn--secondary";
  back.href = backHref;
  back.textContent = "Back to My Trips";
  box.appendChild(t);
  box.appendChild(m);
  box.appendChild(back);
  mount.appendChild(box);
}

export { dateFmt };
