/**
 * dashboard.js — composition root (entry point).
 * Wires data -> stats/filtering -> rendering -> events. Keeps detailed
 * logic in the specialised modules; this file stays concise.
 *
 * Data contract:
 *   { trips: Trip[], activities: Activity[] }
 *   Trip: { id, title, destinations|string[], destination?, startDate, endDate, plannedBudget|budget, actualExpenses?, status }
 *   Activity: { id, type, description, timestamp }
 *
 * Data source: demo fixture below + optional localStorage override
 * (`yatrastorizz.dashboard.v1`). No backend is assumed or faked.
 */
import { renderDashboard } from "./dashboard-renderer.js";
import { initDashboardEvents, showStatus } from "./dashboard-events.js";
import { initSubpageNav } from "../../js/services/subpage-nav.js";

const STORAGE_KEY = "yatrastorizz.dashboard.v1";
const THEME_KEY = "yatrastorizz.theme";

/** Demo fixture for local development only — never presented as a backend. */
const DEMO_DATA = Object.freeze({
  trips: Object.freeze([
    {
      id: "trip-001",
      title: "Rajasthan Getaway",
      destinations: ["Jaipur", "Udaipur"],
      startDate: "2026-11-10",
      endDate: "2026-11-15",
      plannedBudget: 18000,
      actualExpenses: 6500,
      status: "upcoming",
    },
    {
      id: "trip-002",
      title: "Kerala Backwaters",
      destinations: ["Alleppey", "Kochi"],
      startDate: "2026-12-05",
      endDate: "2026-12-10",
      plannedBudget: 25000,
      actualExpenses: 0,
      status: "upcoming",
    },
    {
      id: "trip-003",
      title: "Himachal Trek",
      destinations: ["Manali", "Solang"],
      startDate: "2026-06-01",
      endDate: "2026-06-06",
      plannedBudget: 15000,
      actualExpenses: 14200,
      status: "completed",
    },
  ]),
  activities: Object.freeze([
    { id: "activity-001", type: "trip_created", description: "Created Rajasthan Getaway", timestamp: "2026-10-12T10:30:00Z" },
    { id: "activity-002", type: "budget_modified", description: "Updated Kerala Backwaters budget", timestamp: "2026-10-13T08:00:00Z" },
    { id: "activity-003", type: "trip_completed", description: "Completed Himachal Trek", timestamp: "2026-06-06T18:00:00Z" },
  ]),
});

/** Load dashboard data: live trips storage wins, then dashboard override, else demo fixture. */
function loadDashboardData() {
  try {
    const tripsRaw = localStorage.getItem("yatrastorizz.trips.v1");
    if (tripsRaw) {
      const tripsParsed = JSON.parse(tripsRaw);
      if (Array.isArray(tripsParsed) && tripsParsed.length > 0) {
        let budgetsData = {};
        try {
          const bRaw = localStorage.getItem("yatrastorizz.budgets.v1");
          if (bRaw) budgetsData = JSON.parse(bRaw) || {};
        } catch {
          /* ignore */
        }

        const mappedTrips = tripsParsed.map((t) => {
          const tripBudgetEntry = budgetsData[t.id];
          let actual = 0;
          if (tripBudgetEntry && Array.isArray(tripBudgetEntry.expenses)) {
            actual = tripBudgetEntry.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          } else if (typeof t.actualExpenses === "number") {
            actual = t.actualExpenses;
          }
          const destNames = Array.isArray(t.destinations)
            ? t.destinations.map((d) => (typeof d === "string" ? d : d?.name)).filter(Boolean)
            : (typeof t.destination === "string" ? [t.destination] : []);

          return {
            ...t,
            destinations: destNames,
            plannedBudget: t.budget ?? t.plannedBudget ?? 0,
            actualExpenses: actual,
          };
        });

        const activities = [];
        mappedTrips.forEach((t) => {
          if (t.createdAt) {
            activities.push({
              id: `act-${t.id}`,
              type: "trip_created",
              description: `Created ${t.title}`,
              timestamp: t.createdAt,
            });
          }
        });

        return {
          trips: mappedTrips,
          activities: activities.length > 0 ? activities : [...DEMO_DATA.activities],
          source: "localStorage.trips",
        };
      }
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          trips: Array.isArray(parsed.trips) ? parsed.trips : [],
          activities: Array.isArray(parsed.activities) ? parsed.activities : [],
          source: "localStorage",
        };
      }
    }
  } catch {
    /* fall through to demo data */
  }
  return { trips: [...DEMO_DATA.trips], activities: [...DEMO_DATA.activities], source: "demo" };
}

function applyStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
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

function setHeader() {
  const greetingEl = document.getElementById("dashboard-greeting");
  const dateEl = document.getElementById("dashboard-date");
  const now = new Date();
  const h = now.getHours();
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  if (greetingEl) {
    greetingEl.textContent = `${part} — welcome back!`;
  }
  if (dateEl) {
    dateEl.textContent = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    dateEl.setAttribute("datetime", now.toISOString().slice(0, 10));
  }

  // Personalize with stored profile if available
  try {
    const rawProfile = localStorage.getItem("yatrastorizz.profile.v1");
    if (rawProfile) {
      const p = JSON.parse(rawProfile);
      if (p?.name && greetingEl) {
        const firstName = p.name.trim().split(/\s+/)[0];
        greetingEl.textContent = `${part}, ${firstName} — welcome back!`;
      }
      if (p?.name) {
        const parts = p.name.trim().split(/\s+/);
        const initials = parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        const navAv = document.getElementById("nav-avatar");
        const dashAv = document.getElementById("dash-avatar");
        if (navAv) navAv.textContent = initials;
        if (dashAv) dashAv.textContent = initials;
      }
    }
  } catch {
    /* fallback to defaults */
  }
}

function init() {
  initSubpageNav();
  applyStoredTheme();
  setHeader();
  const mounts = {
    stats: document.getElementById("stats-grid"),
    upcoming: document.getElementById("upcoming-list"),
    budget: document.getElementById("budget-mount"),
    activity: document.getElementById("activity-mount"),
  };
  let data;
  try {
    data = loadDashboardData();
  } catch {
    data = { trips: [], activities: [], source: "empty" };
  }
  const result = renderDashboard(data, mounts, { upcomingLimit: 3 });
  if (!result.ok) {
    showStatus(document, "Dashboard failed to load. Please refresh the page.");
  }
  initDashboardEvents(document, {
    onPlanTrip: () => {
      window.location.href = "../trips/trips.html";
    },
    onViewTrip: (id) => {
      window.location.href = `../itinerary/trip-details.html?tripId=${encodeURIComponent(id)}`;
    },
    onViewAllTrips: () => {
      window.location.href = "../trips/trips.html";
    },
    onQuickAction: (action) => {
      if (action === "budget") {
        window.location.href = "../budget/budget.html";
      } else if (action === "discover") {
        window.location.href = "../discover/discover.html";
      } else {
        window.location.href = "../trips/trips.html";
      }
    },
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
