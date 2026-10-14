/**
 * itinerary.js — composition root.
 *
 * Integration contract (Trips module):
 * - Trip ID arrives via `?tripId=<id>` (established query-param convention).
 * - Trip records come from the Trips module's own service
 *   (../../trips/js/trip-service.js) over the SAME localStorage —
 *   no duplicated trip database, no backend assumed.
 * - Trips link here from the trip-details dialog ("Plan itinerary").
 */
import { createTripService } from "../../trips/js/trip-service.js";
import { createItineraryService } from "./itinerary-service.js";
import {
  generateTripDays,
  calculateTripDurationDays,
  getActivitiesForDate,
} from "./itinerary-days.js";
import {
  createActivityFlow,
  updateActivityFlow,
  reorderDayFlow,
  sortActivitiesForTimeline,
  getScheduleWarnings,
} from "./activity-manager.js";
import { detectOverlaps } from "./activity-validation.js";
import { renderTripHeader, renderDayTabs, renderDay, showItineraryError } from "./itinerary-renderer.js";
import { initItineraryEvents } from "./itinerary-events.js";
import { initDragDrop } from "./drag-drop.js";
import {
  createActivityFormDialog,
  openActivityForm,
  closeActivityForm,
  getActivityFormValues,
  setActivityFormErrors,
  clearActivityFormErrors,
  setActivityFormWarnings,
  setActivityFormSubmitting,
} from "../components/activity-form.js";

const tripService = createTripService();
const itineraryService = createItineraryService();

const state = {
  trip: null,
  days: [],
  selectedDate: "",
  sortMode: "manual",
  formMode: "create",
  editingId: null,
  submitting: false,
};

let formDialog = null;

function showStatus(message) {
  const region = document.getElementById("itinerary-status");
  if (!region) return;
  while (region.firstChild) region.removeChild(region.firstChild);
  region.textContent = message;
}

/** Conflicting activity IDs for the current day (warning badges). */
function currentConflicts(dayActivities) {
  const bad = new Set();
  for (const a of dayActivities) {
    for (const hit of detectOverlaps(dayActivities, a)) {
      bad.add(a.id);
      bad.add(hit.activityId);
    }
  }
  return bad;
}

function renderAll() {
  if (!state.trip) return;
  const all = itineraryService.getActivities(state.trip.id);
  const dayActivities = getActivitiesForDate(all, state.selectedDate);
  const ordered = sortActivitiesForTimeline(dayActivities, state.sortMode);
  renderDayTabs(
    document.getElementById("day-tabs-mount"),
    state.days,
    state.selectedDate,
    all,
    (date) => {
      state.selectedDate = date; // day switch never touches form input
      renderAll();
    }
  );
  renderDay(document.getElementById("timeline-mount"), document.getElementById("day-summary"), ordered, {
    date: state.selectedDate,
    sortMode: state.sortMode,
    conflicts: currentConflicts(dayActivities),
  });
}

function openCreate() {
  state.formMode = "create";
  state.editingId = null;
  openActivityForm(formDialog, { mode: "create", values: { date: state.selectedDate }, days: state.days });
}

function openEdit(id) {
  const activity = itineraryService.getActivity(state.trip.id, id);
  if (!activity) {
    showStatus("That activity no longer exists.");
    return;
  }
  state.formMode = "edit";
  state.editingId = id;
  openActivityForm(formDialog, { mode: "edit", values: activity, days: state.days });
}

async function submitForm() {
  if (state.submitting) return;
  state.submitting = true;
  setActivityFormSubmitting(formDialog, true, state.formMode);
  clearActivityFormErrors(formDialog);
  try {
    const values = getActivityFormValues(formDialog);
    const result =
      state.formMode === "edit"
        ? updateActivityFlow(itineraryService, state.trip, state.editingId, values)
        : createActivityFlow(itineraryService, state.trip, values);
    if (!result.ok) {
      if (result.errors) setActivityFormErrors(formDialog, result.errors);
      else showStatus("Could not save — browser storage is unavailable. Your entries are preserved.");
      return;
    }
    // Cross-day edit: follow the activity to its new day.
    if (result.activity.date !== state.selectedDate) state.selectedDate = result.activity.date;
    closeActivityForm(formDialog);
    renderAll();
    if (result.warnings?.length) {
      setActivityFormWarnings(formDialog, []); // form closed; surface on timeline instead
      showStatus(result.warnings.map((w) => w.message).join(" "));
    } else {
      showStatus(state.formMode === "edit" ? "Activity updated." : "Activity added.");
    }
  } finally {
    state.submitting = false;
    setActivityFormSubmitting(formDialog, false, state.formMode);
  }
}

function deleteFlow(id) {
  const activity = itineraryService.getActivity(state.trip.id, id);
  if (!activity) {
    showStatus("That activity no longer exists.");
    return;
  }
  // Native confirm: zero new files, accessible, and closing it never deletes.
  if (!window.confirm(`Delete “${activity.title}” from ${activity.date}? This cannot be undone.`)) return;
  const result = itineraryService.deleteActivity(state.trip.id, id);
  if (!result.ok) {
    showStatus("Could not delete — please try again.");
    return;
  }
  renderAll();
  showStatus(`Deleted “${activity.title}”.`);
}

/** Shared reorder path for buttons AND drag-and-drop. */
function moveFlow(activeId, toIndex, focusId = activeId) {
  const before = getActivitiesForDate(itineraryService.getActivities(state.trip.id), state.selectedDate);
  const fromIndex = before.findIndex((a) => a.id === activeId);
  const result = reorderDayFlow(itineraryService, state.trip.id, state.selectedDate, activeId, toIndex);
  if (!result.ok) {
    if (result.error !== "invalid-position" || fromIndex === -1) {
      showStatus("Could not reorder — please try again.");
    }
    renderAll(); // restore exact persisted order on any failure
    return;
  }
  renderAll();
  // Preserve keyboard focus on the moved control after re-render.
  const btn = document.querySelector(`[data-activity-id="${CSS.escape(focusId)}"]`);
  (btn?.closest(".activity-card")?.querySelector("[data-action]") ?? btn)?.focus?.();
}

function moveUpDown(id, delta) {
  const day = getActivitiesForDate(itineraryService.getActivities(state.trip.id), state.selectedDate);
  const i = day.findIndex((a) => a.id === id);
  if (i === -1) return;
  moveFlow(id, i + delta);
}

function applyStoredTheme() {
  try {
    const saved = localStorage.getItem("yatrastorizz.theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.dataset.theme = saved;
      return;
    }
  } catch {
    /* ignore */
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset.theme = "dark";
  }
}

function init() {
  applyStoredTheme();
  const main = document.getElementById("itinerary-main");
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("tripId")?.trim() ?? "";

  if (!tripId) {
    showItineraryError(main, "No trip was selected. Open an itinerary from the Trips page.");
    return;
  }
  const trip = tripService.getById(tripId);
  if (!trip) {
    showItineraryError(main, "That trip does not exist (it may have been deleted).");
    return;
  }
  const days = generateTripDays(trip.startDate, trip.endDate);
  if (days.length === 0) {
    showItineraryError(main, "That trip has no valid travel dates, so no itinerary days can be built.");
    return;
  }

  state.trip = trip;
  state.days = days;
  state.selectedDate = days[0].date;

  renderTripHeader(document.getElementById("trip-header-mount"), trip, calculateTripDurationDays(trip.startDate, trip.endDate));
  document.getElementById("add-activity-btn")?.removeAttribute("hidden");

  formDialog = createActivityFormDialog({ onSubmit: submitForm });
  document.body.appendChild(formDialog);

  renderAll();

  initItineraryEvents(document, {
    onAddActivity: openCreate,
    onEditActivity: openEdit,
    onDeleteActivity: deleteFlow,
    onMoveUp: (id) => moveUpDown(id, -1),
    onMoveDown: (id) => moveUpDown(id, 1),
    onSortMode: (mode) => {
      state.sortMode = mode;
      renderAll();
    },
  });

  initDragDrop(document, {
    onMove: (activeId, toIndex) => moveFlow(activeId, toIndex),
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
