import { describe, it, expect } from "vitest";
import { validateTripInput, normalizeTripInput } from "../js/trip-validation.js";
import {
  createTripService,
  createMemoryAdapter,
  createLocalStorageAdapter,
  deriveTripStatus,
  calculateTripDuration,
  parseCalendarDate,
} from "../js/trip-service.js";
import { applyView, getTripStats } from "../js/trip-list.js";
import { getTripDetailsView } from "../js/trip-details.js";

// Fixed reference: Wednesday 2026-10-14 (deterministic, never the real clock).
const NOW = "2026-10-14";

const validInput = {
  title: "Rajasthan Getaway",
  destinations: "Jaipur, Udaipur",
  startDate: "2026-11-10",
  endDate: "2026-11-15",
  plannedBudget: 18000,
  currency: "INR",
  description: "Historic cities.",
  companions: "Asha, Ravi",
  notes: "Book early.",
};

function svc(seed = []) {
  return createTripService({ adapter: createMemoryAdapter(seed), now: NOW });
}

describe("validation", () => {
  it("accepts a valid trip and normalizes it", () => {
    const { valid, errors, value } = validateTripInput(validInput);
    expect(valid).toBe(true);
    expect(errors).toEqual({});
    expect(value.destinations).toEqual([
      { name: "Jaipur", country: "" },
      { name: "Udaipur", country: "" },
    ]);
    expect(value.companions).toEqual(["Asha", "Ravi"]);
    expect(value.status).toBeUndefined(); // absent → auto
  });
  it("rejects missing required fields", () => {
    const { valid, errors } = validateTripInput({});
    expect(valid).toBe(false);
    expect(errors.title).toMatch(/required/);
    expect(errors.destinations).toMatch(/destination/);
    expect(errors.startDate).toMatch(/required/);
    expect(errors.endDate).toMatch(/required/);
    expect(errors.plannedBudget).toMatch(/required/);
  });
  it("rejects invalid date ranges and malformed dates", () => {
    const reversed = validateTripInput({ ...validInput, startDate: "2026-11-15", endDate: "2026-11-10" });
    expect(reversed.valid).toBe(false);
    expect(reversed.errors.endDate).toMatch(/earlier/);
    expect(validateTripInput({ ...validInput, startDate: "2026-13-01" }).errors.startDate).toMatch(/valid date/);
    expect(validateTripInput({ ...validInput, endDate: "2026-02-30" }).errors.endDate).toMatch(/valid date/);
  });
  it("accepts zero budget, rejects negative/NaN/Infinity", () => {
    expect(validateTripInput({ ...validInput, plannedBudget: 0 }).valid).toBe(true);
    expect(validateTripInput({ ...validInput, plannedBudget: -5 }).errors.plannedBudget).toMatch(/negative/);
    expect(validateTripInput({ ...validInput, plannedBudget: "abc" }).errors.plannedBudget).toMatch(/valid number/);
    expect(validateTripInput({ ...validInput, plannedBudget: Infinity }).errors.plannedBudget).toMatch(/valid number/);
  });
  it("accepts numeric-string budgets and array destinations", () => {
    const { valid, value } = validateTripInput({
      ...validInput,
      plannedBudget: "18000",
      destinations: [{ name: "Jaipur", country: "India" }],
    });
    expect(valid).toBe(true);
    expect(value.plannedBudget).toBe(18000);
  });
  it("is DOM-free and input-safe", () => {
    expect(() => validateTripInput(null)).not.toThrow();
    expect(() => normalizeTripInput("garbage")).not.toThrow();
  });
});

describe("service CRUD", () => {
  it("creates a valid trip with generated id + timestamps", () => {
    const s = svc();
    const res = s.create(validInput);
    expect(res.ok).toBe(true);
    expect(res.trip.id).toMatch(/^trip-/);
    expect(res.trip.createdAt).toBeTruthy();
    expect(res.trip.updatedAt).toBeTruthy();
    expect(s.getAll().length).toBe(1);
  });
  it("rejects invalid data without storing anything", () => {
    const s = svc();
    const res = s.create({ ...validInput, title: "  " });
    expect(res.ok).toBe(false);
    expect(res.errors.title).toBeTruthy();
    expect(s.getAll()).toEqual([]);
  });
  it("retrieves by id and returns null for unknown ids", () => {
    const s = svc();
    const { trip } = s.create(validInput);
    expect(s.getById(trip.id)?.title).toBe("Rajasthan Getaway");
    expect(s.getById("trip-nope")).toBeNull();
    expect(s.getById("")).toBeNull();
  });
  it("updates in place, preserving id and createdAt", () => {
    const s = svc();
    const { trip } = s.create(validInput);
    const res = s.update(trip.id, { ...validInput, title: "Renamed", plannedBudget: 20000 });
    expect(res.ok).toBe(true);
    expect(res.trip.id).toBe(trip.id);
    expect(res.trip.createdAt).toBe(trip.createdAt);
    expect(res.trip.title).toBe("Renamed");
    expect(s.getAll().length).toBe(1); // no duplicate created
  });
  it("handles update of unknown ids and invalid edits", () => {
    const s = svc();
    expect(s.update("trip-nope", validInput)).toMatchObject({ ok: false, error: "not-found" });
    const { trip } = s.create(validInput);
    const bad = s.update(trip.id, { ...validInput, endDate: "2020-01-01" });
    expect(bad.ok).toBe(false);
    expect(s.getById(trip.id).endDate).toBe("2026-11-15"); // unchanged
  });
  it("deletes by id and reports unknown ids", () => {
    const s = svc();
    const { trip } = s.create(validInput);
    expect(s.remove("trip-nope")).toMatchObject({ ok: false, error: "not-found" });
    expect(s.remove(trip.id).ok).toBe(true);
    expect(s.getAll()).toEqual([]);
  });
  it("returns copies so callers cannot mutate stored state", () => {
    const s = svc();
    const { trip } = s.create(validInput);
    trip.title = "Hacked";
    expect(s.getById(trip.id).title).toBe("Rajasthan Getaway");
  });
});

describe("status derivation", () => {
  const base = { startDate: "2026-11-10", endDate: "2026-11-15" };
  it("derives upcoming / ongoing / completed from dates", () => {
    expect(deriveTripStatus({ ...base }, NOW)).toBe("upcoming");
    expect(deriveTripStatus({ startDate: "2026-10-10", endDate: "2026-10-20" }, NOW)).toBe("ongoing");
    expect(deriveTripStatus({ startDate: "2026-09-01", endDate: "2026-09-05" }, NOW)).toBe("completed");
  });
  it("treats boundary days as ongoing", () => {
    expect(deriveTripStatus({ startDate: "2026-10-14", endDate: "2026-10-20" }, NOW)).toBe("ongoing");
    expect(deriveTripStatus({ startDate: "2026-10-10", endDate: "2026-10-14" }, NOW)).toBe("ongoing");
  });
  it("cancelled stays cancelled even for future dates", () => {
    expect(deriveTripStatus({ ...base, status: "cancelled" }, NOW)).toBe("cancelled");
    expect(deriveTripStatus({ ...base, status: "CANCELLED" }, NOW)).toBe("cancelled");
  });
  it("ignores stored date-statuses and recomputes from dates", () => {
    // stored "upcoming" on a past trip still reports completed
    expect(deriveTripStatus({ startDate: "2026-09-01", endDate: "2026-09-05", status: "upcoming" }, NOW)).toBe("completed");
  });
  it("handles invalid dates safely", () => {
    expect(deriveTripStatus({ startDate: "bad", endDate: "" }, NOW)).toBe("upcoming");
  });
});

describe("durations and calendar parsing", () => {
  it("uses inclusive calendar days without timezone shift", () => {
    expect(calculateTripDuration("2026-11-10", "2026-11-15")).toBe(6);
    expect(calculateTripDuration("2026-11-10", "2026-11-10")).toBe(1);
    expect(calculateTripDuration("bad", "2026-11-10")).toBe(0);
    expect(parseCalendarDate("2026-02-30")).toBeNull();
  });
});

describe("list view: search / filter / sort / stats", () => {
  const trips = [
    { id: "a", title: "Goa Escape", destinations: [{ name: "Goa", country: "" }], startDate: "2026-12-01", endDate: "2026-12-05", createdAt: "2026-10-01T00:00:00Z" },
    { id: "b", title: "Alps Trek", destinations: [{ name: "Zermatt", country: "" }], startDate: "2026-09-01", endDate: "2026-09-05", createdAt: "2026-10-02T00:00:00Z" },
    { id: "c", title: "Diwali at Home", destinations: [{ name: "Jaipur", country: "" }], startDate: "2026-10-13", endDate: "2026-10-16", createdAt: "2026-10-03T00:00:00Z", status: "cancelled" },
  ];
  it("searches titles and destinations case-insensitively", () => {
    expect(applyView(trips, { query: "goa" }, NOW).map((t) => t.id)).toEqual(["a"]);
    expect(applyView(trips, { query: "  ZERMATT " }, NOW).map((t) => t.id)).toEqual(["b"]);
  });
  it("filters by derived status", () => {
    expect(applyView(trips, { status: "upcoming" }, NOW).map((t) => t.id)).toEqual(["a"]);
    expect(applyView(trips, { status: "completed" }, NOW).map((t) => t.id)).toEqual(["b"]);
    expect(applyView(trips, { status: "cancelled" }, NOW).map((t) => t.id)).toEqual(["c"]);
  });
  it("sorts by start date, creation date, and title", () => {
    expect(applyView(trips, { sort: "startDate" }, NOW).map((t) => t.id)).toEqual(["b", "c", "a"]);
    expect(applyView(trips, { sort: "createdAt" }, NOW).map((t) => t.id)).toEqual(["c", "b", "a"]);
    expect(applyView(trips, { sort: "title" }, NOW).map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
  it("derives stats from data", () => {
    expect(getTripStats(trips, NOW)).toMatchObject({ total: 3, upcoming: 1, ongoing: 0, completed: 1, cancelled: 1 });
    expect(getTripStats([], NOW).total).toBe(0);
  });
  it("never mutates the input array", () => {
    const snapshot = JSON.parse(JSON.stringify(trips));
    applyView(trips, { query: "a", sort: "title" }, NOW);
    expect(trips).toEqual(snapshot);
  });
});

describe("details view model", () => {
  it("prepares display text and nulls unknown trips", () => {
    expect(getTripDetailsView(null, NOW)).toBeNull();
    const v = getTripDetailsView(
      { id: "a", title: "Goa", destinations: [{ name: "Goa", country: "" }], startDate: "2026-12-01", endDate: "2026-12-05", plannedBudget: 12000, currency: "INR" },
      NOW
    );
    expect(v.status).toBe("upcoming");
    expect(v.durationDays).toBe(5);
    expect(v.destinationsText).toBe("Goa");
  });
});

describe("storage adapter", () => {
  it("loads [] on malformed JSON and false on save failure", () => {
    const badLoad = createLocalStorageAdapter("k", () => ({ getItem: () => "{broken", setItem: () => {} }));
    expect(badLoad.load()).toEqual([]);
    const badSave = createLocalStorageAdapter("k", () => ({
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    }));
    expect(badSave.save([])).toBe(false);
    const s = createTripService({ adapter: badSave, now: NOW });
    expect(s.create(validInput)).toMatchObject({ ok: false, error: "storage-unavailable" });
  });
  it("round-trips through a fake storage", () => {
    const store = {};
    const fake = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = String(v)) };
    const s = createTripService({ adapter: createLocalStorageAdapter("k", () => fake), now: NOW });
    expect(s.create(validInput).ok).toBe(true);
    expect(s.getAll().length).toBe(1);
  });
});
