import { describe, it, expect } from "vitest";
import {
  reorderDayActivities,
  moveActivityToDate,
  normalizeDayOrder,
} from "../js/activity-manager.js";
import { calcInsertIndex } from "../js/drag-drop.js";
import { createItineraryService, createMemoryAdapter } from "../js/itinerary-service.js";

// The shared reorder operation (used identically by drag-and-drop and the
// up/down buttons) is unit-tested here without simulated browser events.
const day = () => [
  { id: "a", title: "A", date: "2026-11-10", order: 0 },
  { id: "b", title: "B", date: "2026-11-10", order: 1 },
  { id: "c", title: "C", date: "2026-11-10", order: 2 },
  { id: "d", title: "D", date: "2026-11-10", order: 3 },
];

describe("reorderDayActivities", () => {
  it("moves the first activity down", () => {
    const r = reorderDayActivities(day(), "a", 2);
    expect(r.ok).toBe(true);
    expect(r.activities.map((x) => x.id)).toEqual(["b", "c", "a", "d"]);
  });
  it("moves the last activity up", () => {
    const r = reorderDayActivities(day(), "d", 0);
    expect(r.ok).toBe(true);
    expect(r.activities.map((x) => x.id)).toEqual(["d", "a", "b", "c"]);
  });
  it("moves to an arbitrary position and normalizes order values", () => {
    const r = reorderDayActivities(day(), "b", 3);
    expect(r.activities.map((x) => x.id)).toEqual(["a", "c", "d", "b"]);
    expect(r.activities.map((x) => x.order)).toEqual([0, 1, 2, 3]);
  });
  it("tolerates scrambled input orders", () => {
    const messy = [
      { id: "a", order: 30 },
      { id: "b", order: 10 },
      { id: "c", order: 20 },
    ];
    const r = reorderDayActivities(messy, "a", 0);
    expect(r.activities.map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(r.activities.map((x) => x.order)).toEqual([0, 1, 2]);
  });
  it("handles single-item and same-position moves", () => {
    expect(reorderDayActivities([{ id: "a", order: 0 }], "a", 0).activities.map((x) => x.id)).toEqual(["a"]);
    const r = reorderDayActivities(day(), "b", 1);
    expect(r.ok).toBe(true);
    expect(r.activities.map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
  });
  it("rejects empty days, unknown ids, invalid positions", () => {
    expect(reorderDayActivities([], "a", 0)).toMatchObject({ ok: false, error: "empty-day" });
    expect(reorderDayActivities(day(), "zzz", 0)).toMatchObject({ ok: false, error: "unknown-activity" });
    expect(reorderDayActivities(day(), "a", -1)).toMatchObject({ ok: false, error: "invalid-position" });
    expect(reorderDayActivities(day(), "a", 4)).toMatchObject({ ok: false, error: "invalid-position" });
    expect(reorderDayActivities(day(), "a", 1.5)).toMatchObject({ ok: false, error: "invalid-position" });
  });
  it("preserves every id and never duplicates", () => {
    for (let i = 0; i < 4; i++) {
      const r = reorderDayActivities(day(), "c", i);
      expect(r.ok).toBe(true);
      expect([...r.activities.map((x) => x.id)].sort()).toEqual(["a", "b", "c", "d"]);
    }
  });
  it("does not mutate the input array", () => {
    const input = day();
    const snapshot = JSON.parse(JSON.stringify(input));
    reorderDayActivities(input, "a", 3);
    expect(input).toEqual(snapshot);
  });
});

describe("normalizeDayOrder", () => {
  it("sorts by order and reassigns 0..n-1", () => {
    const r = normalizeDayOrder([{ id: "b", order: 5 }, { id: "a" }, { id: "c", order: 5 }]);
    expect(r.map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect(r.map((x) => x.order)).toEqual([0, 1, 2]);
  });
});

describe("moveActivityToDate (cross-day)", () => {
  it("moves to the end of the target day and renumbers both days", () => {
    const all = [
      ...day(),
      { id: "e", title: "E", date: "2026-11-11", order: 0 },
    ];
    const r = moveActivityToDate(all, "a", "2026-11-11");
    expect(r.ok).toBe(true);
    const moved = r.activities.find((x) => x.id === "a");
    expect(moved.date).toBe("2026-11-11");
    expect(moved.order).toBe(1);
    const source = r.activities.filter((x) => x.date === "2026-11-10");
    expect(source.map((x) => x.order)).toEqual([0, 1, 2]);
  });
  it("rejects unknown ids", () => {
    expect(moveActivityToDate(day(), "zzz", "2026-11-11")).toMatchObject({ ok: false, error: "unknown-activity" });
  });
});

describe("service reorder persistence", () => {
  it("reorderDay persists and restores on failure", () => {
    const s = createItineraryService({ adapter: createMemoryAdapter() });
    const ids = ["A", "B", "C"].map(
      (t) => s.createActivity("trip-001", { title: t, date: "2026-11-10" }).activity.id
    );
    const ok = s.reorderDay("trip-001", "2026-11-10", ids[0], 2);
    expect(ok.ok).toBe(true);
    expect(ok.activities.map((x) => x.title)).toEqual(["B", "C", "A"]);
    expect(s.reorderDay("trip-001", "2026-11-10", "act-nope", 0).ok).toBe(false);
    // failed move leaves persisted order intact (getActivities returns
    // storage order, so sort by the persisted `order` field to verify)
    const stored = s.getActivities("trip-001").sort((x, y) => x.order - y.order);
    expect(stored.map((x) => x.title)).toEqual(["B", "C", "A"]);
  });
});

describe("calcInsertIndex (drop math)", () => {
  it("computes before/after positions", () => {
    expect(calcInsertIndex(4, 0, false)).toBe(0);
    expect(calcInsertIndex(4, 0, true)).toBe(1);
    expect(calcInsertIndex(4, 3, true)).toBe(4);
    expect(calcInsertIndex(0, 0, false)).toBe(0);
  });
});
