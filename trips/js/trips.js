/**
 * trips.js — composition root. Initializes the service, renders the page,
 * and connects form / list / details / events. No business logic here.
 */
import { createTripService } from "./trip-service.js";
import { applyView, renderTripList, renderTripStats } from "./trip-list.js";
import { initTripForm } from "./trip-form.js";
import { openTripDetails, refreshTripDetails, closeTripDetails } from "./trip-details.js";
import { initTripEvents } from "./trip-events.js";
import {
  createTripFormModal,
  openTripFormModal,
  setTripFormValues,
} from "../components/trip-form-modal.js";
import { openDeleteConfirmation } from "../components/delete-confirmation.js";

const service = createTripService(); // localStorage-backed; swap adapter for an API later
const view = { query: "", status: "all", sort: "startDate" };
let formApi = null;
let formDialog = null;

function showStatus(message) {
  const region = document.getElementById("trips-status");
  if (!region) return;
  while (region.firstChild) region.removeChild(region.firstChild);
  region.textContent = message;
}

function renderAll() {
  const trips = service.getAll();
  const visible = applyView(trips, view);
  renderTripStats(document.getElementById("trips-stats"), trips);
  renderTripList(document.getElementById("trips-grid"), visible);
  const count = document.getElementById("trips-count");
  if (count) {
    count.textContent =
      visible.length === trips.length
        ? `${trips.length} trip${trips.length === 1 ? "" : "s"}`
        : `${visible.length} of ${trips.length} trips`;
  }
}

function openCreate() {
  formApi.openCreate();
  openTripFormModal(formDialog, { mode: "create" });
}

function openEdit(id) {
  const trip = service.getById(id);
  if (!trip) {
    showStatus("That trip no longer exists.");
    return;
  }
  if (!formApi.openEdit(trip)) {
    showStatus("Could not open the editor for that trip.");
    return;
  }
  openTripFormModal(formDialog, { mode: "edit" });
  setTripFormValues(formDialog, trip);
}

async function askDelete(id) {
  const trip = service.getById(id);
  if (!trip) {
    showStatus("That trip no longer exists.");
    return;
  }
  const confirmed = await openDeleteConfirmation(trip.title);
  if (!confirmed) return; // closing the dialog never deletes
  const result = service.remove(id);
  if (!result.ok) {
    showStatus("Could not delete the trip — please try again.");
    return;
  }
  closeTripDetails(); // drop any open details for the deleted trip
  renderAll();
  showStatus(`Deleted “${trip.title}”.`);
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

  formDialog = createTripFormModal({ onSubmit: () => formApi.submit() });
  document.body.appendChild(formDialog);
  formApi = initTripForm({
    dialog: formDialog,
    service,
    onSaved: (mode) => {
      renderAll();
      if (mode === "edit") {
        const open = document.querySelector("dialog.trip-details-dialog");
        if (open?.dataset.tripId) refreshTripDetails(service, open.dataset.tripId);
      }
      showStatus(mode === "edit" ? "Trip updated." : "Trip created.");
    },
    onError: (message) => showStatus(message),
  });

  renderAll();

  initTripEvents(
    {
      searchInput: document.getElementById("trip-search"),
      statusSelect: document.getElementById("filter-status"),
      sortSelect: document.getElementById("sort-by"),
    },
    {
      onCreate: openCreate,
      onView: (id) => {
        if (!openTripDetails(service, id)) showStatus("That trip could not be found.");
      },
      onEdit: openEdit,
      onDelete: askDelete,
      onQuery: (q) => {
        view.query = q;
        renderAll();
      },
      onViewChange: (patch) => {
        Object.assign(view, patch);
        renderAll();
      },
      onDetailsClose: () => closeTripDetails(),
    }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
