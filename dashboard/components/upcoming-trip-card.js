/**
 * upcoming-trip-card.js — reusable card for a single upcoming trip.
 * Uses textContent only; consistent Intl formatting for dates/currency.
 */
import { calculateTripDays } from "../js/upcoming-trips.js";
import { toSafeAmount } from "../js/dashboard-stats.js";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatDate(value) {
  if (!value) return "Date TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date TBD";
  return dateFmt.format(d);
}

export function formatTripBudget(value) {
  return currencyFmt.format(toSafeAmount(value));
}

/**
 * @param {object} trip raw or prepared trip object
 * @returns {HTMLElement}
 */
export function createUpcomingTripCard(trip) {
  const t = trip && typeof trip === "object" ? trip : {};
  const title = typeof t.title === "string" && t.title.trim() ? t.title.trim() : "Untitled trip";
  const destinations = Array.isArray(t.destinations) && t.destinations.length
    ? t.destinations.filter((d) => typeof d === "string" && d.trim()).join(" · ")
    : typeof t.destination === "string" && t.destination.trim()
      ? t.destination.trim()
      : "Destination TBD";
  const days = Number.isFinite(t.days) && t.days > 0 ? t.days : calculateTripDays(t.startDate, t.endDate);
  const status = typeof t.status === "string" && t.status.trim() ? t.status.trim().toLowerCase() : "upcoming";

  const card = document.createElement("article");
  card.className = "trip-card";
  if (t.id) card.dataset.tripId = String(t.id);

  const head = document.createElement("div");
  head.className = "trip-card__head";

  const titleEl = document.createElement("h3");
  titleEl.className = "trip-card__title";
  titleEl.textContent = title;

  const statusEl = document.createElement("span");
  statusEl.className = `trip-card__status trip-card__status--${status.replace(/[^a-z]/g, "") || "upcoming"}`;
  statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);

  head.appendChild(titleEl);
  head.appendChild(statusEl);

  const destEl = document.createElement("p");
  destEl.className = "trip-card__dest";
  destEl.textContent = destinations;

  const meta = document.createElement("dl");
  meta.className = "trip-card__meta";

  const addMeta = (term, desc) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = desc;
    meta.appendChild(dt);
    meta.appendChild(dd);
  };

  addMeta("Dates", `${formatDate(t.startDate)} → ${formatDate(t.endDate)}`);
  addMeta("Duration", days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "Duration TBD");
  addMeta("Budget", formatTripBudget(t.plannedBudget ?? t.budget));

  const action = document.createElement("button");
  action.type = "button";
  action.className = "btn btn--secondary btn--small";
  action.dataset.action = "view-trip";
  if (t.id) action.dataset.tripId = String(t.id);
  action.textContent = "View / Continue planning";
  action.setAttribute("aria-label", `View or continue planning ${title}`);

  card.appendChild(head);
  card.appendChild(destEl);
  card.appendChild(meta);
  card.appendChild(action);
  return card;
}
