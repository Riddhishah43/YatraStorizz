/**
 * trip-list.js — list rendering + search/filter/sort coordination.
 * Pure view helpers (applyView) stay testable; renderers paint mounts.
 * The entry owns the view state so it survives list refreshes.
 */
import { deriveTripStatus } from "./trip-service.js";
import { createTripCard } from "../components/trip-card.js";

export const SORT_OPTIONS = Object.freeze([
  { value: "startDate", label: "Start date (earliest first)" },
  { value: "createdAt", label: "Recently created" },
  { value: "title", label: "Trip name (A–Z)" },
]);

export const STATUS_FILTERS = Object.freeze(["all", "upcoming", "ongoing", "completed", "cancelled"]);

function namesBlob(trip) {
  const parts = [trip?.title, trip?.description];
  for (const d of Array.isArray(trip?.destinations) ? trip.destinations : []) {
    parts.push(typeof d === "string" ? d : d?.name, d?.country);
  }
  return parts.filter((p) => typeof p === "string").join(" ").toLowerCase();
}

/**
 * Filter + sort a trip array. Pure: never mutates input.
 * @param {object[]} trips
 * @param {{ query?: string, status?: string, sort?: string }} [view]
 * @param {Date|string} [now]
 * @returns {object[]}
 */
export function applyView(trips, view = {}, now) {
  const list = Array.isArray(trips) ? [...trips] : [];
  const q = typeof view.query === "string" ? view.query.trim().toLowerCase() : "";
  const status = STATUS_FILTERS.includes(view.status) ? view.status : "all";
  const sort = SORT_OPTIONS.some((o) => o.value === view.sort) ? view.sort : "startDate";

  let out = list;
  if (q) out = out.filter((t) => namesBlob(t).includes(q));
  if (status !== "all") out = out.filter((t) => deriveTripStatus(t, now) === status);

  const byTitle = (a, b) => String(a?.title ?? "").localeCompare(String(b?.title ?? ""));
  if (sort === "title") out.sort(byTitle);
  else if (sort === "createdAt") out.sort((a, b) => String(b?.createdAt ?? "").localeCompare(String(a?.createdAt ?? "")) || byTitle(a, b));
  else out.sort((a, b) => String(a?.startDate ?? "").localeCompare(String(b?.startDate ?? "")) || byTitle(a, b));
  return out;
}

/** Summary counts derived from data (total + per-status). */
export function getTripStats(trips, now) {
  const stats = { total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 };
  for (const t of Array.isArray(trips) ? trips : []) {
    if (!t || typeof t !== "object") continue;
    stats.total += 1;
    const s = deriveTripStatus(t, now);
    if (stats[s] !== undefined) stats[s] += 1;
  }
  return stats;
}

/**
 * Render cards (or the empty state) into a mount.
 * @returns {number} visible count
 */
export function renderTripList(mount, trips, now) {
  if (!mount) return 0;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const list = Array.isArray(trips) ? trips : [];
  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-results";
    const title = document.createElement("p");
    title.className = "empty-results__title";
    title.textContent = "No trips found.";
    const hint = document.createElement("p");
    hint.className = "empty-results__hint";
    hint.textContent = "Create your first trip, or adjust the search and filters.";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--primary";
    btn.dataset.action = "create-trip";
    btn.textContent = "Create New Trip";
    empty.appendChild(title);
    empty.appendChild(hint);
    empty.appendChild(btn);
    mount.appendChild(empty);
    return 0;
  }
  for (const trip of list) {
    mount.appendChild(createTripCard(trip, { status: deriveTripStatus(trip, now) }));
  }
  return list.length;
}

/** Render the four summary stat chips. */
export function renderTripStats(mount, trips, now) {
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const s = getTripStats(trips, now);
  for (const [label, value] of [["Total trips", s.total], ["Upcoming", s.upcoming], ["Ongoing", s.ongoing], ["Completed", s.completed]]) {
    const chip = document.createElement("div");
    chip.className = "stat-chip";
    const v = document.createElement("p");
    v.className = "stat-chip__value";
    v.textContent = String(value);
    const l = document.createElement("p");
    l.className = "stat-chip__label";
    l.textContent = label;
    chip.appendChild(v);
    chip.appendChild(l);
    mount.appendChild(chip);
  }
}
