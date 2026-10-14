/**
 * activity-card.js — one timeline activity (DOM only).
 * Dragging starts ONLY from the visible drag handle; edit/delete/reorder
 * actions route through data-action attributes (itinerary-events.js).
 */
import { createReorderControls } from "./reorder-controls.js";

const currencyCache = new Map();
function money(amount, currency) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return null;
  const code = currency || "INR";
  try {
    if (!currencyCache.has(code)) {
      currencyCache.set(code, new Intl.NumberFormat("en-IN", { style: "currency", currency: code, maximumFractionDigits: 0 }));
    }
    return currencyCache.get(code).format(amount);
  } catch {
    return `${amount} ${code}`;
  }
}

function formatDuration(minutes, startTime, endTime) {
  if (typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0) {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  if (startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff > 0) return formatDuration(diff);
  }
  return null;
}

/**
 * @param {object} activity
 * @param {{ index?: number, total?: number, conflict?: boolean }} [options]
 * @returns {HTMLElement}
 */
export function createActivityCard(activity, options = {}) {
  const a = activity && typeof activity === "object" ? activity : {};
  const { index = 0, total = 1, conflict = false } = options;
  const title = typeof a.title === "string" && a.title.trim() ? a.title.trim() : "Untitled activity";

  const card = document.createElement("article");
  card.className = "activity-card" + (conflict ? " activity-card--conflict" : "");
  card.draggable = true; // dragstart allowed from the handle only (see drag-drop.js)
  if (a.id) card.dataset.activityId = String(a.id);

  const handle = document.createElement("span");
  handle.className = "activity-card__handle";
  handle.dataset.dragHandle = "true";
  handle.title = "Drag to reorder";
  handle.setAttribute("aria-hidden", "true");
  handle.textContent = "⋮⋮";

  const body = document.createElement("div");
  body.className = "activity-card__body";

  const titleEl = document.createElement("h3");
  titleEl.className = "activity-card__title";
  titleEl.textContent = title;

  const time = document.createElement("p");
  time.className = "activity-card__time";
  time.textContent = a.startTime && a.endTime ? `${a.startTime} – ${a.endTime}` : "Unscheduled";

  const metaBits = [];
  if (a.location?.trim?.()) metaBits.push(a.location.trim());
  if (a.category?.trim?.()) metaBits.push(a.category.trim());
  const dur = formatDuration(a.estimatedDurationMinutes, a.startTime, a.endTime);
  if (dur) metaBits.push(dur);
  const cost = money(a.estimatedCost, a.currency);
  if (cost) metaBits.push(cost);
  if (metaBits.length) {
    const meta = document.createElement("p");
    meta.className = "activity-card__meta";
    meta.textContent = metaBits.join(" · ");
    body.appendChild(titleEl);
    body.appendChild(time);
    body.appendChild(meta);
  } else {
    body.appendChild(titleEl);
    body.appendChild(time);
  }

  if (typeof a.notes === "string" && a.notes.trim()) {
    const notes = document.createElement("p");
    notes.className = "activity-card__notes";
    notes.textContent = a.notes.trim();
    body.appendChild(notes);
  }

  if (conflict) {
    const warn = document.createElement("p");
    warn.className = "activity-card__warn";
    warn.setAttribute("role", "note");
    warn.textContent = "⚠ Overlaps another activity (warning — times unchanged).";
    body.appendChild(warn);
  }

  const actions = document.createElement("div");
  actions.className = "activity-card__actions";
  actions.appendChild(createReorderControls({ activityId: a.id ?? "", title, index, total }));
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "btn btn--ghost btn--small";
  edit.dataset.action = "edit-activity";
  if (a.id) edit.dataset.activityId = String(a.id);
  edit.textContent = "Edit";
  edit.setAttribute("aria-label", `Edit ${title}`);
  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn btn--ghost btn--small btn--danger";
  del.dataset.action = "delete-activity";
  if (a.id) del.dataset.activityId = String(a.id);
  del.textContent = "Delete";
  del.setAttribute("aria-label", `Delete ${title}`);
  actions.appendChild(edit);
  actions.appendChild(del);

  card.appendChild(handle);
  card.appendChild(body);
  card.appendChild(actions);
  return card;
}
