/**
 * destinations.js — composition root for the Discover page.
 *
 * Data flow: canonical dataset → search → filters → saved-only →
 * grid render. Favorites resolve IDs against the dataset and notify
 * via subscription; the entry re-renders instead of owning persistence.
 *
 * State shape:
 * { query, filters: { categories, country, maxDailyBudget, season },
 *   favoritesOnly, selectedDestinationId }
 */
import { destinations, validateDestinations } from "../data/destinations-data.js";
import { searchDestinations } from "./destination-search.js";
import { applyFilters, createDefaultFilters, getActiveFilterCount } from "./destination-filters.js";
import { getDestinationById, prepareDestinationDetails } from "./destination-details.js";
import {
  getFavoriteIds,
  toggleFavorite,
  subscribe as subscribeFavorites,
} from "./favorites.js";
import { createSearchBar } from "../components/search-bar.js";
import { createFilterPanel, syncFilterPanel } from "../components/filter-panel.js";
import { renderDestinationGrid } from "../components/destination-grid.js";
import {
  createDestinationModal,
  openDestinationModal,
  updateModalFavorite,
} from "../components/destination-modal.js";
import { initDiscoverEvents, showStatus } from "./discover-events.js";

const state = {
  query: "",
  filters: createDefaultFilters(),
  favoritesOnly: false,
  selectedDestinationId: null,
};

let searchApi = null;
let panelRoot = null;
let modal = null;

function els() {
  return {
    searchMount: document.getElementById("search-mount"),
    panelMount: document.getElementById("filter-mount"),
    grid: document.getElementById("dest-grid"),
    count: document.getElementById("result-count"),
    savedBtn: document.getElementById("saved-toggle"),
    featured: document.getElementById("featured-mount"),
  };
}

/** Full pipeline: search → filters → saved-only. Returns visible items. */
export function computeVisible() {
  let items = searchDestinations(destinations, state.query);
  items = applyFilters(items, state.filters);
  if (state.favoritesOnly) {
    const favs = new Set(getFavoriteIds());
    items = items.filter((d) => favs.has(d.id));
  }
  return items;
}

function renderAll() {
  const { grid, count, savedBtn } = els();
  const items = computeVisible();
  const favIds = getFavoriteIds();
  renderDestinationGrid(grid, items, {
    favoriteIds: favIds,
    emptyHint: state.favoritesOnly
      ? "You have no saved destinations matching these filters. Toggle a favorite or clear the filters."
      : "Try a different keyword or clear your search and filters.",
  });
  if (count) {
    count.textContent =
      items.length === destinations.length
        ? `Showing all ${items.length} destinations`
        : `Showing ${items.length} of ${destinations.length} destinations`;
  }
  if (savedBtn) {
    const n = favIds.length;
    savedBtn.setAttribute("aria-pressed", state.favoritesOnly ? "true" : "false");
    savedBtn.textContent = state.favoritesOnly ? `★ Saved (${n}) — showing` : `☆ Saved (${n})`;
  }
  const clearBtn = document.getElementById("filters-clear-inline");
  if (clearBtn) {
    const active = getActiveFilterCount(state.filters) + (state.query.trim() ? 1 : 0);
    clearBtn.hidden = active === 0 && !state.favoritesOnly;
  }
}

/** Push favorite state into every visible card + open modal. */
function syncFavoriteUI(changedId) {
  const favIds = new Set(getFavoriteIds());
  for (const btn of document.querySelectorAll('[data-action="toggle-favorite"]')) {
    const id = btn.dataset.destinationId;
    if (!id) continue;
    const on = favIds.has(id);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    if (btn.classList.contains("modal__fav")) {
      btn.textContent = on ? "★ Saved" : "☆ Save to favorites";
    } else {
      btn.classList.toggle("is-fav", on);
      const label = btn.querySelector("span:last-child");
      const star = btn.querySelector("span:first-child");
      if (label) label.textContent = on ? "Saved" : "Save";
      if (star) star.textContent = on ? "★ " : "☆ ";
    }
    const card = btn.closest(".dest-card");
    const name = card?.querySelector(".dest-card__title")?.textContent ?? "Destination";
    btn.setAttribute("aria-label", on ? `Remove ${name} from favorites` : `Save ${name} to favorites`);
  }
  if (modal?.open && state.selectedDestinationId === changedId) {
    const details = prepareDestinationDetails(getDestinationById(destinations, changedId));
    if (details) updateModalFavorite(modal, details, favIds.has(changedId));
  }
  if (state.favoritesOnly) renderAll();
  else {
    const { savedBtn } = els();
    if (savedBtn) {
      savedBtn.textContent = state.favoritesOnly
        ? `★ Saved (${favIds.size}) — showing`
        : `☆ Saved (${favIds.size})`;
    }
  }
}

function renderFeatured() {
  const { featured } = els();
  if (!featured || !destinations.length) return;
  const pick = destinations[0];
  while (featured.firstChild) featured.removeChild(featured.firstChild);
  const card = document.createElement("article");
  card.className = "featured-card";
  const text = document.createElement("div");
  const kicker = document.createElement("p");
  kicker.className = "featured-card__kicker";
  kicker.textContent = "Featured destination";
  const title = document.createElement("h2");
  title.textContent = pick.name;
  const sub = document.createElement("p");
  sub.className = "featured-card__sub";
  sub.textContent = pick.region ? `${pick.region}, ${pick.country} — ${pick.description}` : `${pick.country} — ${pick.description}`;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--primary btn--small";
  btn.dataset.action = "view-destination";
  btn.dataset.destinationId = pick.id;
  btn.textContent = `Explore ${pick.name}`;
  text.appendChild(kicker);
  text.appendChild(title);
  text.appendChild(sub);
  text.appendChild(btn);
  card.appendChild(text);
  featured.appendChild(card);
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
  const check = validateDestinations(destinations);
  if (!check.valid) console.warn("Destination data issues:", check.errors);

  const { searchMount, panelMount } = els();

  searchApi = createSearchBar({});
  searchMount?.appendChild(searchApi.element);

  panelRoot = createFilterPanel({ destinations, filters: state.filters });
  panelMount?.appendChild(panelRoot);

  modal = createDestinationModal();
  document.body.appendChild(modal);

  renderFeatured();
  renderAll();

  subscribeFavorites((ids, persistedOk) => {
    if (!persistedOk) showStatus(document, "Favorites could not be saved — browser storage is unavailable.");
    renderAll();
  });

  initDiscoverEvents(document, {
    onQuery: (q) => {
      state.query = q;
      renderAll();
    },
    onFilters: (f) => {
      state.filters = { ...createDefaultFilters(), ...f };
      renderAll();
    },
    onClearFilters: () => {
      state.filters = createDefaultFilters();
      if (panelRoot) syncFilterPanel(panelRoot, state.filters);
      renderAll();
    },
    onResetAll: () => {
      state.query = "";
      state.filters = createDefaultFilters();
      state.favoritesOnly = false;
      searchApi?.setQuery("");
      if (panelRoot) syncFilterPanel(panelRoot, state.filters);
      renderAll();
    },
    onToggleFavorite: (id) => {
      toggleFavorite(id);
      syncFavoriteUI(id); // subscription re-renders too; this keeps labels in sync
    },
    onViewDestination: (id) => {
      const raw = getDestinationById(destinations, id);
      const details = prepareDestinationDetails(raw);
      if (!details) {
        showStatus(document, "That destination could not be found.");
        return;
      }
      state.selectedDestinationId = id;
      const favIds = new Set(getFavoriteIds());
      openDestinationModal(modal, details, favIds.has(id));
    },
    onPlanTrip: (id) => {
      const raw = id ? getDestinationById(destinations, id) : null;
      showStatus(
        document,
        raw
          ? `Trip creation for “${raw.name}” is not connected yet — this demo does not create trips.`
          : "Trip creation is not connected yet — this demo does not create trips."
      );
    },
    onToggleSavedOnly: () => {
      state.favoritesOnly = !state.favoritesOnly;
      renderAll();
    },
  });

  modal.addEventListener("close", () => {
    state.selectedDestinationId = null;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
