import { describe, it, expect } from "vitest";
import {
  getTotalTrips,
  countUpcomingTrips,
  countPlacesExplored,
  getTotalPlannedBudget,
  getTotalActualExpenses,
  calculateRemainingBudget,
  getRemainingBudget,
  calculateUtilization,
  getBudgetUtilization,
  getDashboardSummary,
  toSafeAmount,
  parseDate,
} from "../js/dashboard-stats.js";

// Fixed reference date: Tuesday 2026-10-14 (matches "today" for deterministic tests).
const NOW = new Date("2026-10-14T12:00:00Z");

const normalTrips = [
  {
    id: "t1",
    title: "Rajasthan Getaway",
    destinations: ["Jaipur", "Udaipur"],
    startDate: "2026-11-10",
    endDate: "2026-11-15",
    plannedBudget: 18000,
    actualExpenses: 6500,
    status: "upcoming",
  },
  {
    id: "t2",
    title: "Kerala Backwaters",
    destinations: ["Kochi"],
    startDate: "2026-09-01",
    endDate: "2026-09-05",
    plannedBudget: 25000,
    actualExpenses: 27000,
    status: "completed",
  },
  {
    id: "t3",
    title: "Goa Weekend",
    destinations: ["Goa", "goa ", " GOA"],
    startDate: "2026-12-01",
    endDate: "2026-12-03",
    plannedBudget: 12000,
    actualExpenses: 2000,
    status: "upcoming",
  },
];

describe("empty datasets", () => {
  it("returns predictable zeros", () => {
    expect(getTotalTrips([])).toBe(0);
    expect(countUpcomingTrips([], NOW)).toBe(0);
    expect(countPlacesExplored([], NOW)).toBe(0);
    expect(getTotalPlannedBudget([])).toBe(0);
    expect(getTotalActualExpenses([])).toBe(0);
    expect(getRemainingBudget([])).toBe(0);
    expect(getBudgetUtilization([])).toBe(0);
  });
  it("handles non-array input safely", () => {
    expect(getTotalTrips(null)).toBe(0);
    expect(getTotalTrips(undefined)).toBe(0);
    expect(countUpcomingTrips(null, NOW)).toBe(0);
    expect(getTotalPlannedBudget("nope")).toBe(0);
  });
});

describe("normal dataset", () => {
  it("computes overview numbers", () => {
    expect(getTotalTrips(normalTrips)).toBe(3);
    // t1 + t3 are future & eligible; t2 completed -> excluded
    expect(countUpcomingTrips(normalTrips, NOW)).toBe(2);
    // Explored: t2 completed -> Kochi; t1/t3 future -> not explored; Goa only via future trips -> 1
    expect(countPlacesExplored(normalTrips, NOW)).toBe(1);
    expect(getTotalPlannedBudget(normalTrips)).toBe(55000);
    expect(getTotalActualExpenses(normalTrips)).toBe(35500);
    expect(getRemainingBudget(normalTrips)).toBe(19500);
  });
  it("getDashboardSummary agrees with individual functions", () => {
    const s = getDashboardSummary(normalTrips, NOW);
    expect(s).toMatchObject({
      totalTrips: 3,
      upcomingTrips: 2,
      placesExplored: 1,
      totalBudget: 55000,
      totalExpenses: 35500,
      remaining: 19500,
    });
    expect(s.utilization).toBeCloseTo((35500 / 55000) * 100, 1);
  });
});

describe("past / present / future trips", () => {
  const trips = [
    { startDate: "2026-10-01", endDate: "2026-10-03", status: "upcoming" }, // past start, not completed -> NOT upcoming, but explored via past endDate
    { startDate: "2026-10-14", endDate: "2026-10-16", status: "upcoming" }, // today -> upcoming
    { startDate: "2026-10-20", endDate: "2026-10-22", status: "upcoming" }, // future -> upcoming
  ];
  it("counts today and future starts as upcoming", () => {
    expect(countUpcomingTrips(trips, NOW)).toBe(2);
  });
  it("counts past-ended trips as explored", () => {
    const withDest = [{ destinations: ["Past Place"], startDate: "2026-10-01", endDate: "2026-10-03", status: "upcoming" }];
    expect(countPlacesExplored(withDest, NOW)).toBe(1);
  });
});

describe("completed and cancelled trips", () => {
  it("excludes completed/cancelled from upcoming (case-insensitive)", () => {
    const trips = [
      { startDate: "2026-11-01", status: "Completed" },
      { startDate: "2026-11-01", status: "CANCELLED" },
      { startDate: "2026-11-01", status: "upcoming" },
    ];
    expect(countUpcomingTrips(trips, NOW)).toBe(1);
  });
});

describe("destinations", () => {
  it("dedupes case-insensitively and trims", () => {
    const trips = [
      { destinations: ["Goa", "goa", " GOA "], status: "completed", startDate: "2026-01-01", endDate: "2026-01-02" },
      { destinations: ["Goa", "Manali"], status: "completed", startDate: "2026-02-01", endDate: "2026-02-02" },
    ];
    expect(countPlacesExplored(trips, NOW)).toBe(2);
  });
  it("ignores future non-completed trips", () => {
    const trips = [{ destinations: ["Future Place"], status: "upcoming", startDate: "2026-12-01", endDate: "2026-12-05" }];
    expect(countPlacesExplored(trips, NOW)).toBe(0);
  });
});

describe("invalid dates and amounts", () => {
  it("skips invalid start dates in upcoming count", () => {
    const trips = [
      { startDate: "not-a-date", status: "upcoming" },
      { status: "upcoming" },
      { startDate: "", status: "upcoming" },
      { startDate: "2026-11-01", status: "upcoming" },
    ];
    expect(countUpcomingTrips(trips, NOW)).toBe(1);
  });
  it("treats missing/invalid budgets as 0", () => {
    const trips = [
      { plannedBudget: undefined, actualExpenses: undefined },
      { plannedBudget: "abc", actualExpenses: NaN },
      { plannedBudget: Infinity, actualExpenses: Infinity },
      { plannedBudget: -500, actualExpenses: -100 },
      { plannedBudget: 1000, actualExpenses: 400 },
    ];
    expect(getTotalPlannedBudget(trips)).toBe(1000);
    expect(getTotalActualExpenses(trips)).toBe(400);
  });
  it("toSafeAmount / parseDate helpers", () => {
    expect(toSafeAmount("18000")).toBe(18000);
    expect(toSafeAmount(NaN)).toBe(0);
    expect(parseDate("bad")).toBeNull();
    expect(parseDate("2026-11-10")).toBeInstanceOf(Date);
  });
});

describe("budget edge cases", () => {
  it("zero planned budget yields 0% utilisation (no NaN/Infinity)", () => {
    expect(calculateUtilization(0, 500)).toBe(0);
    expect(calculateUtilization(undefined, 500)).toBe(0);
    expect(getBudgetUtilization([{ plannedBudget: 0, actualExpenses: 500 }])).toBe(0);
  });
  it("overspending yields negative remaining and >100% utilisation", () => {
    expect(calculateRemainingBudget(1000, 1500)).toBe(-500);
    expect(calculateUtilization(1000, 1500)).toBe(150);
    expect(getRemainingBudget([{ plannedBudget: 1000, actualExpenses: 1500 }])).toBe(-500);
  });
  it("missing expense data counts as 0", () => {
    expect(getTotalActualExpenses([{ plannedBudget: 1000 }])).toBe(0);
    expect(calculateRemainingBudget(1000, undefined)).toBe(1000);
  });
});
