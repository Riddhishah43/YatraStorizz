import { describe, it, expect } from "vitest";
import {
  generateTripDays,
  calculateTripDurationDays,
  isDateInTrip,
  getDayNumber,
  getActivitiesForDate,
} from "../js/itinerary-days.js";
import {
  validateActivityInput,
  detectOverlaps,
} from "../js/activity-validation.js";
import {
  createItineraryService,
  createMemoryAdapter,
} from "../js/itinerary-service.js";
import {
  createActivityFlow,
  updateActivityFlow,
  moveActivityDayFlow,
  sortActivitiesForTimeline,
  getDayCostTotal,
  normalizeDayOrder,
} from "../js/activity-manager.js";

const TRIP = { id: "trip-001", title: "Rajasthan Getaway", startDate: "2026-11-10", endDate: "2026-11-12" };
// Nov 10 → Nov 12 = three days (inclusive).

function memService(seed = {}) {
  return createItineraryService({ adapter: createMemoryAdapter(seed) });
}

const fort = {
  title: "Visit Amber Fort",
  date: "2026-11-10",
  startTime: "09:00",
  endTime: "11:30",
  location: "Amer, Jaipur",
  category: "Sightseeing",
  estimatedCost: 500,
  currency: "INR",
  notes: "Arrive early.",
};

describe("day generation", () => {
  it("generates inclusive calendar days with numbers", () => {
    expect(generateTripDays("2026-11-10", "2026-11-12")).toEqual([
      { dayNumber: 1, date: "2026-11-10" },
      { dayNumber: 2, date: "2026-11-11" },
      { dayNumber: 3, date: "2026-11-12" },
    ]);
  });
  it("handles single-day trips and invalid ranges", () => {
    expect(generateTripDays("2026-11-10", "2026-11-10")).toEqual([{ dayNumber: 1, date: "2026-11-10" }]);
    expect(generateTripDays("2026-11-12", "2026-11-10")).toEqual([]);
    expect(generateTripDays("bad", "2026-11-10")).toEqual([]);
    expect(calculateTripDurationDays("2026-11-10", "2026-11-12")).toBe(3);
    expect(calculateTripDurationDays("2026-11-12", "2026-11-10")).toBe(0);
  });
  it("checks trip membership and day numbers", () => {
    expect(isDateInTrip("2026-11-11", "2026-11-10", "2026-11-12")).toBe(true);
    expect(isDateInTrip("2026-11-13", "2026-11-10", "2026-11-12")).toBe(false);
    expect(getDayNumber("2026-11-12", "2026-11-10", "2026-11-12")).toBe(3);
    expect(getDayNumber("2026-11-09", "2026-11-10", "2026-11-12")).toBeNull();
  });
});

describe("activity validation", () => {
  const bounds = { tripStart: "2026-11-10", tripEnd: "2026-11-12" };
  it("accepts a valid activity", () => {
    const r = validateActivityInput(fort, bounds);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual({});
  });
  it("requires title and date", () => {
    const r = validateActivityInput({ ...fort, title: "  ", date: "" }, bounds);
    expect(r.valid).toBe(false);
    expect(r.errors.title).toMatch(/required/);
    expect(r.errors.date).toMatch(/required/);
  });
  it("rejects dates outside the trip", () => {
    expect(validateActivityInput({ ...fort, date: "2026-11-09" }, bounds).errors.date).toMatch(/before/);
    expect(validateActivityInput({ ...fort, date: "2026-11-13" }, bounds).errors.date).toMatch(/after/);
  });
  it("rejects end <= start and overnight spans explicitly", () => {
    const r = validateActivityInput({ ...fort, startTime: "22:00", endTime: "01:00" }, bounds);
    expect(r.valid).toBe(false);
    expect(r.errors.endTime).toMatch(/Overnight/);
    expect(validateActivityInput({ ...fort, startTime: "10:00", endTime: "10:00" }, bounds).valid).toBe(false);
  });
  it("rejects bad time formats and negative costs", () => {
    expect(validateActivityInput({ ...fort, startTime: "9am" }, bounds).errors.startTime).toMatch(/HH:MM/);
    expect(validateActivityInput({ ...fort, estimatedCost: -5 }, bounds).errors.estimatedCost).toMatch(/negative/);
    expect(validateActivityInput({ ...fort, estimatedCost: NaN }, bounds).errors.estimatedCost).toMatch(/valid number/);
  });
  it("allows unscheduled activities (no times)", () => {
    const { title, date } = fort;
    expect(validateActivityInput({ title, date }, bounds).valid).toBe(true);
  });
});

describe("overlap detection", () => {
  const day = [
    { id: "a", title: "Fort", startTime: "09:00", endTime: "11:30" },
    { id: "b", title: "Lunch", startTime: "12:00", endTime: "13:00" },
    { id: "c", title: "Free evening" }, // unscheduled never conflicts
  ];
  it("finds clock overlaps, ignores self and unscheduled", () => {
    expect(detectOverlaps(day, { startTime: "10:00", endTime: "12:30" }).map((h) => h.activityId)).toEqual(["a", "b"]);
    expect(detectOverlaps(day, { id: "a", startTime: "09:30", endTime: "10:00" })).toEqual([]);
    expect(detectOverlaps(day, {})).toEqual([]);
  });
  it("touching edges do not overlap", () => {
    expect(detectOverlaps(day, { startTime: "11:30", endTime: "12:00" })).toEqual([]);
  });
});

describe("service CRUD", () => {
  it("loads empty for unknown trips", () => {
    expect(memService().getActivities("trip-zzz")).toEqual([]);
    expect(memService().getActivity("trip-zzz", "act-zzz")).toBeNull();
  });
  it("creates with id + order, scoped per day", () => {
    const s = memService();
    const r1 = s.createActivity("trip-001", { ...fort });
    const r2 = s.createActivity("trip-001", { ...fort, title: "Lunch", startTime: "12:00", endTime: "13:00" });
    const r3 = s.createActivity("trip-001", { ...fort, title: "Next day", date: "2026-11-11" });
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
    expect([r1.activity.order, r2.activity.order]).toEqual([0, 1]);
    expect(r3.activity.order).toBe(0); // new day restarts
    expect(new Set([r1.activity.id, r2.activity.id, r3.activity.id]).size).toBe(3);
  });
  it("updates in place, preserving id; reorders to end on day move", () => {
    const s = memService();
    const { activity } = s.createActivity("trip-001", { ...fort });
    const res = s.updateActivity("trip-001", activity.id, { ...fort, title: "Fort at dawn" });
    expect(res.ok).toBe(true);
    expect(res.activity.id).toBe(activity.id);
    expect(res.movedDay).toBe(false);
    const moved = s.updateActivity("trip-001", activity.id, { ...fort, date: "2026-11-11" });
    expect(moved.ok && moved.movedDay).toBe(true);
    expect(moved.activity.order).toBe(0);
  });
  it("handles unknown ids and invalid shapes", () => {
    const s = memService();
    expect(s.updateActivity("trip-001", "act-nope", { ...fort })).toMatchObject({ ok: false, error: "not-found" });
    expect(s.deleteActivity("trip-001", "act-nope")).toMatchObject({ ok: false, error: "not-found" });
    expect(s.createActivity("", { ...fort })).toMatchObject({ ok: false, error: "invalid-trip" });
    expect(s.createActivity("trip-001", { title: "", date: "" })).toMatchObject({ ok: false, error: "invalid-activity" });
  });
  it("deletes one activity and renumbers only its day", () => {
    const s = memService();
    const a = s.createActivity("trip-001", { ...fort }).activity;
    const b = s.createActivity("trip-001", { ...fort, title: "B" }).activity;
    const c = s.createActivity("trip-001", { ...fort, title: "C", date: "2026-11-11" }).activity;
    expect(s.deleteActivity("trip-001", a.id)).toMatchObject({ ok: true, date: "2026-11-10" });
    const rest = s.getActivities("trip-001");
    expect(rest.map((x) => x.id).sort()).toEqual([b.id, c.id].sort());
    expect(rest.find((x) => x.id === b.id).order).toBe(0);
    expect(rest.find((x) => x.id === c.id).order).toBe(0); // other day untouched
  });
  it("retrieves one day and handles empty days", () => {
    const s = memService();
    s.createActivity("trip-001", { ...fort });
    expect(getActivitiesForDate(s.getActivities("trip-001"), "2026-11-10").length).toBe(1);
    expect(getActivitiesForDate(s.getActivities("trip-001"), "2026-11-11")).toEqual([]);
  });
});

describe("manager flows", () => {
  it("create flow validates bounds and returns warnings without blocking", () => {
    const s = memService();
    s.createActivity("trip-001", { ...fort });
    const res = createActivityFlow(s, TRIP, { ...fort, title: "Brunch", startTime: "10:30", endTime: "12:00" });
    expect(res.ok).toBe(true);
    expect(res.warnings.length).toBe(1);
    expect(res.warnings[0].message).toMatch(/Overlap/);
    const bad = createActivityFlow(s, TRIP, { ...fort, date: "2026-12-01" });
    expect(bad.ok).toBe(false);
    expect(bad.errors.date).toMatch(/after/);
  });
  it("update flow preserves id and unrelated activities", () => {
    const s = memService();
    const a = s.createActivity("trip-001", { ...fort }).activity;
    const b = s.createActivity("trip-001", { ...fort, title: "B" }).activity;
    const res = updateActivityFlow(s, TRIP, a.id, { ...fort, title: "A2" });
    expect(res.ok).toBe(true);
    expect(res.activity.id).toBe(a.id);
    expect(s.getActivity("trip-001", b.id).title).toBe("B");
    expect(s.getActivity("trip-001", b.id).order).toBe(1);
  });
  it("cross-day move updates date and both orderings", () => {
    const s = memService();
    const a = s.createActivity("trip-001", { ...fort }).activity;
    s.createActivity("trip-001", { ...fort, title: "B" });
    const res = moveActivityDayFlow(s, TRIP, a.id, "2026-11-11");
    expect(res.ok).toBe(true);
    expect(res.activity.date).toBe("2026-11-11");
    expect(getActivitiesForDate(s.getActivities("trip-001"), "2026-11-10").length).toBe(1);
  });
  it("timeline sorting and day totals", () => {
    const day = [
      { id: "a", title: "B-late", startTime: "15:00", order: 0, estimatedCost: 100 },
      { id: "b", title: "A-early", startTime: "09:00", order: 1, estimatedCost: 200 },
      { id: "c", title: "Free", order: 2 },
    ];
    expect(sortActivitiesForTimeline(day, "manual").map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(sortActivitiesForTimeline(day, "schedule").map((x) => x.id)).toEqual(["b", "a", "c"]);
    expect(getDayCostTotal(day)).toBe(300);
    expect(getDayCostTotal([{ estimatedCost: -5 }, {}])).toBe(0);
    expect(normalizeDayOrder([{ id: "x", order: 9 }, { id: "y" }]).map((x) => x.order)).toEqual([0, 1]);
  });
});
