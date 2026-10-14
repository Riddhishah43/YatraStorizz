/**
 * trip-details.js — detail retrieval + presentation coordination.
 * Data access stays in trip-service.js; this module prepares the view
 * model and owns the transient details dialog.
 */
import { deriveTripStatus, calculateTripDuration } from "./trip-service.js";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

function formatYMD(ymd) {
  const [y, m, d] = String(ymd ?? "").split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Number.isNaN(dt.getTime()) ? "Date TBD" : dateFmt.format(dt);
}

function formatMoney(amount, currency) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return "Not specified";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency || "INR"}`;
  }
}

/**
 * Build a display-ready view model, or null when the trip is missing.
 * Pure and independently testable.
 */
export function getTripDetailsView(trip, now) {
  if (!trip || typeof trip !== "object" || !trip.id) return null;
  const dests = Array.isArray(trip.destinations) ? trip.destinations : [];
  const names = dests
    .map((d) => (typeof d === "string" ? d.trim() : d?.name?.trim?.() ?? ""))
    .filter(Boolean);
  return {
    id: trip.id,
    title: trip.title?.trim?.() || "Untitled trip",
    destinationsText: names.length ? names.join(" · ") : "Destination TBD",
    dateRange: `${formatYMD(trip.startDate)} → ${formatYMD(trip.endDate)}`,
    durationDays: calculateTripDuration(trip.startDate, trip.endDate),
    budgetText: formatMoney(trip.plannedBudget, trip.currency),
    status: deriveTripStatus(trip, now),
    description: trip.description?.trim?.() || "",
    companions: Array.isArray(trip.companions) ? trip.companions.filter((c) => typeof c === "string" && c.trim()) : [],
    notes: trip.notes?.trim?.() || "",
  };
}

function row(dl, term, value) {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  dd.textContent = value;
  dl.appendChild(dt);
  dl.appendChild(dd);
}

/** Open (or re-render) the details dialog for a trip ID. Returns false when unknown. */
export function openTripDetails(service, id, { onEdit, onDelete } = {}) {
  const trip = service.getById(id);
  const view = getTripDetailsView(trip);
  if (!view) return false;

  closeTripDetails();
  const dialog = document.createElement("dialog");
  dialog.className = "trip-details-dialog";
  dialog.dataset.tripId = view.id;
  dialog.setAttribute("aria-labelledby", "trip-details-title");

  const close = document.createElement("button");
  close.type = "button";
  close.className = "btn btn--ghost btn--small";
  close.dataset.action = "details-close";
  close.setAttribute("aria-label", "Close trip details");
  close.textContent = "✕ Close";

  const title = document.createElement("h2");
  title.id = "trip-details-title";
  title.textContent = view.title;

  const dest = document.createElement("p");
  dest.className = "trip-details__dest";
  dest.textContent = view.destinationsText;

  const dl = document.createElement("dl");
  dl.className = "trip-details__facts";
  row(dl, "Dates", view.dateRange);
  row(dl, "Duration", view.durationDays > 0 ? `${view.durationDays} day${view.durationDays === 1 ? "" : "s"}` : "Duration TBD");
  row(dl, "Planned budget", view.budgetText);
  row(dl, "Status", view.status.charAt(0).toUpperCase() + view.status.slice(1));
  if (view.description) row(dl, "Description", view.description);
  if (view.companions.length) row(dl, "Companions", view.companions.join(", "));
  if (view.notes) row(dl, "Notes", view.notes);

  const actions = document.createElement("div");
  actions.className = "trip-details__actions";
  const plan = document.createElement("a");
  plan.className = "btn btn--primary";
  plan.href = `../itinerary/trip-details.html?tripId=${encodeURIComponent(view.id)}`;
  plan.textContent = "Plan itinerary";
  plan.setAttribute("aria-label", `Plan itinerary for ${view.title}`);
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "btn btn--secondary";
  edit.dataset.action = "edit-trip";
  edit.dataset.tripId = view.id;
  edit.textContent = "Edit trip";
  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn btn--ghost btn--danger";
  del.dataset.action = "delete-trip";
  del.dataset.tripId = view.id;
  del.textContent = "Delete trip";
  actions.appendChild(plan);
  actions.appendChild(edit);
  actions.appendChild(del);

  dialog.appendChild(close);
  dialog.appendChild(title);
  dialog.appendChild(dest);
  dialog.appendChild(dl);
  dialog.appendChild(actions);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeTripDetails();
  });

  document.body.appendChild(dialog);
  // Future itinerary builder integrates here: append sections to `dialog`
  // before showModal, using view.id as the trip key.
  dialog.showModal();
  close.focus();
  return true;
}

/** Refresh the open details dialog when its trip changed (no-op if absent). */
export function refreshTripDetails(service, id, handlers = {}) {
  const open = document.querySelector("dialog.trip-details-dialog");
  if (open && open.dataset.tripId === id) openTripDetails(service, id, handlers);
}

export function closeTripDetails() {
  document.querySelector("dialog.trip-details-dialog")?.remove();
}
