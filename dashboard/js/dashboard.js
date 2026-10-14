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

/** Load dashboard data: localStorage override wins, else demo fixture. */
function loadDashboardData() {
  try {
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
  if (greetingEl) {
    const h = now.getHours();
    const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
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
}

function init() {
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
    onPlanTrip: () => showStatus(document, "Trip creation is not connected yet — this demo does not create trips."),
    onViewTrip: (id) => showStatus(document, `Trip “${id}” preview is not connected yet.`),
    onViewAllTrips: () => showStatus(document, "The full trips list is not connected yet."),
    onQuickAction: () => showStatus(document, "That section is not connected yet in this demo."),
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
