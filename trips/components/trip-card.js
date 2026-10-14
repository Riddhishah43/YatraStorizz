/**
 * trip-card.js — reusable card for one trip (DOM only, no business logic).
 * Actions work through data-action attributes handled by trip-events.js.
 */
import { createTripStatusBadge } from "./trip-status-badge.js";
import { calculateTripDuration } from "../js/trip-service.js";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

function formatDate(ymd) {
  const [y, m, d] = String(ymd ?? "").split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Number.isNaN(dt.getTime()) ? "Date TBD" : dateFmt.format(dt);
}

function formatBudget(trip) {
  const amount = trip?.plannedBudget;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return "Budget TBD";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: trip.currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${trip.currency || "INR"}`;
  }
}

function destinationSummary(trip) {
  const list = Array.isArray(trip?.destinations) ? trip.destinations : [];
  const names = list
    .map((d) => (typeof d === "string" ? d.trim() : d?.name?.trim?.() ?? ""))
    .filter(Boolean);
  if (names.length === 0) return "Destination TBD";
  if (names.length <= 2) return names.join(" · ");
  return `${names.slice(0, 2).join(" · ")} +${names.length - 2} more`;
}

/**
 * @param {object} trip
 * @param {{ status?: string }} [options] resolved display status
 * @returns {HTMLElement}
 */
export function createTripCard(trip, options = {}) {
  const t = trip && typeof trip === "object" ? trip : {};
  const title = typeof t.title === "string" && t.title.trim() ? t.title.trim() : "Untitled trip";
  const days = calculateTripDuration(t.startDate, t.endDate);

  const card = document.createElement("article");
  card.className = "trip-card";
  if (t.id) card.dataset.tripId = String(t.id);

  const head = document.createElement("div");
  head.className = "trip-card__head";
  const titleEl = document.createElement("h3");
  titleEl.className = "trip-card__title";
  titleEl.textContent = title;
  head.appendChild(titleEl);
  head.appendChild(createTripStatusBadge(options.status ?? t.status));

  const dest = document.createElement("p");
  dest.className = "trip-card__dest";
  dest.textContent = destinationSummary(t);

  const meta = document.createElement("dl");
  meta.className = "trip-card__meta";
  const addMeta = (term, value) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = value;
    meta.appendChild(dt);
    meta.appendChild(dd);
  };
  addMeta("Dates", `${formatDate(t.startDate)} → ${formatDate(t.endDate)}`);
  addMeta("Duration", days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "Duration TBD");
  addMeta("Budget", formatBudget(t));

  const actions = document.createElement("div");
  actions.className = "trip-card__actions";
  const btn = (action, label, cls) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `btn btn--small ${cls}`;
    b.dataset.action = action;
    if (t.id) b.dataset.tripId = String(t.id);
    b.textContent = label;
    b.setAttribute("aria-label", `${label}: ${title}`);
    return b;
  };
  actions.appendChild(btn("view-trip", "View", "btn--secondary"));
  actions.appendChild(btn("edit-trip", "Edit", "btn--ghost"));
  actions.appendChild(btn("delete-trip", "Delete", "btn--ghost btn--danger"));

  card.appendChild(head);
  card.appendChild(dest);
  card.appendChild(meta);
  card.appendChild(actions);
  return card;
}
