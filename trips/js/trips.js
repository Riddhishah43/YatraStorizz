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
import { createReviewModal } from "../../js/components/review-modal.js";
import { initSubpageNav } from "../../js/services/subpage-nav.js";

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

function cascadeDeleteTrip(tripId) {
  if (!tripId) return;
  try {
    const itKey = "yatrastorizz.itineraries.v1";
    const itRaw = localStorage.getItem(itKey);
    if (itRaw) {
      const itAll = JSON.parse(itRaw);
      if (itAll && itAll[tripId]) {
        delete itAll[tripId];
        localStorage.setItem(itKey, JSON.stringify(itAll));
      }
    }
    const bgKey = "yatrastorizz.budgets.v1";
    const bgRaw = localStorage.getItem(bgKey);
    if (bgRaw) {
      const bgAll = JSON.parse(bgRaw);
      if (bgAll && bgAll[tripId]) {
        delete bgAll[tripId];
        localStorage.setItem(bgKey, JSON.stringify(bgAll));
      }
    }
  } catch (err) {
    console.warn("Cascade delete error:", err);
  }
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
  cascadeDeleteTrip(id);
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
  initSubpageNav();
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

  // Seed demo starter trips on first-ever launch if storage key has never been set
  try {
    if (localStorage.getItem("yatrastorizz.trips.v1") === null) {
      const starterTrips = [
        {
          title: "Rajasthan Getaway",
          destinations: "Jaipur, Udaipur",
          startDate: "2026-11-10",
          endDate: "2026-11-15",
          plannedBudget: 18000,
          currency: "INR",
          description: "Historic forts, vibrant bazaars, and scenic lakes.",
          companions: "Asha, Ravi",
          notes: "Book Amber Fort tickets early.",
        },
        {
          title: "Kerala Backwaters",
          destinations: "Alleppey, Kochi",
          startDate: "2026-12-05",
          endDate: "2026-12-10",
          plannedBudget: 25000,
          currency: "INR",
          description: "Houseboat cruise, coconut groves, and tranquil lagoons.",
          companions: "Family",
          notes: "Check weather forecast.",
        },
        {
          title: "Himachal Trek",
          destinations: "Manali, Solang",
          startDate: "2026-06-01",
          endDate: "2026-06-06",
          plannedBudget: 15000,
          currency: "INR",
          description: "Alpine meadows, mountain passes, and river rafting.",
          companions: "College friends",
          notes: "Trekking gear required.",
        },
      ];
      for (const t of starterTrips) service.create(t);
    }
  } catch {
    /* ignore storage errors */
  }

  renderAll();

  // Check URL parameters (e.g. ?dest=Jaipur from Discover or Landing bento)
  try {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get("dest");
    if (dest) {
      openCreate();
      setTripFormValues(formDialog, { destinations: dest });
    }
  } catch {
    /* ignore */
  }

  const reviewModal = createReviewModal({
    onSubmit: () => {
      showStatus("Review published! Thank you for rating your trip.");
    },
  });
  document.body.appendChild(reviewModal.element);

  document.addEventListener("click", (e) => {
    const rateBtn = e.target.closest('[data-action="rate-trip"]');
    if (rateBtn) {
      const dest = rateBtn.dataset.tripDest || "";
      reviewModal.open({ destination: dest });
    }
  });

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
