/**
 * trip-service.js — trip data access + CRUD (adapter-style persistence).
 *
 * Dates use calendar-date semantics: "YYYY-MM-DD" is parsed as a LOCAL
 * calendar day (never UTC-shifted), so trip boundaries are stable across
 * timezones. Statuses are DERIVED at read time, never mutated in storage
 * just because the date changed. An explicit "cancelled" always wins.
 *
 * Usage:
 *   const service = createTripService(); // localStorage-backed
 *   const testSvc = createTripService({ adapter: createMemoryAdapter(), now: "2026-10-14" });
 */

import { validateTripInput, KNOWN_STATUSES } from "./trip-validation.js";

const DEFAULT_STORAGE_KEY = "yatrastorizz.trips.v1";

/** Centralized unique-ID generation (never the trip title). */
export function generateTripId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `trip-${Date.now().toString(36)}-${rand}`;
}

/** Parse "YYYY-MM-DD" as a local calendar day. Null when invalid. */
export function parseCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function startOfLocalDay(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

function resolveNow(now) {
  const raw = typeof now === "function" ? now() : now === undefined ? new Date() : now;
  const dt = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
}

/**
 * Derive the display status for a trip at a reference date.
 * Cancelled (stored) always wins. Unknown/missing stored status falls
 * back to date rules. Boundary days count as ongoing.
 */
export function deriveTripStatus(trip, now) {
  const stored = typeof trip?.status === "string" ? trip.status.trim().toLowerCase() : "";
  if (stored === "cancelled") return "cancelled";
  const ref = startOfLocalDay(resolveNow(now)).getTime();
  const start = parseCalendarDate(trip?.startDate);
  const end = parseCalendarDate(trip?.endDate);
  if (!start || !end) {
    return KNOWN_STATUSES.includes(stored) ? stored : "upcoming";
  }
  const s = startOfLocalDay(start).getTime();
  const e = startOfLocalDay(end).getTime();
  if (ref < s) return "upcoming";
  if (ref > e) return "completed";
  return "ongoing";
}

/** Inclusive duration in days (same-day trip = 1). 0 when dates invalid. */
export function calculateTripDuration(startDate, endDate) {
  const s = parseCalendarDate(startDate);
  const e = parseCalendarDate(endDate);
  if (!s || !e) return 0;
  const days = Math.round((startOfLocalDay(e) - startOfLocalDay(s)) / 86400000) + 1;
  return Number.isFinite(days) && days >= 1 ? days : 0;
}

/**
 * localStorage adapter. getStorage is lazy so importing this module in
 * Node (tests) never throws. All failures degrade to [] / false.
 */
export function createLocalStorageAdapter(key = DEFAULT_STORAGE_KEY, getStorage = () => globalThis.localStorage) {
  return {
    load() {
      try {
        const storage = getStorage();
        const raw = storage?.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((t) => t && typeof t === "object") : [];
      } catch {
        return [];
      }
    },
    save(trips) {
      try {
        getStorage()?.setItem(key, JSON.stringify(trips));
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** In-memory adapter for tests and previews. */
export function createMemoryAdapter(seed = []) {
  let data = Array.isArray(seed) ? seed.map((t) => ({ ...t })) : [];
  return {
    load: () => data.map((t) => ({ ...t })),
    save: (trips) => {
      data = trips.map((t) => ({ ...t }));
      return true;
    },
  };
}

const copy = (t) => ({ ...t, destinations: Array.isArray(t.destinations) ? t.destinations.map((d) => ({ ...d })) : [] });

/**
 * @param {{ adapter?: {load,save}, now?: Date|string|number|(()=>Date|string|number) }} [options]
 */
export function createTripService(options = {}) {
  const adapter = options.adapter ?? createLocalStorageAdapter();
  const nowOf = () => resolveNow(options.now);
  const stamp = () => nowOf().toISOString();

  return {
    /** All trips (defensive copies), oldest first. */
    getAll() {
      return adapter.load().map(copy);
    },

    /** One trip by ID, or null. */
    getById(id) {
      if (typeof id !== "string" || !id) return null;
      const found = adapter.load().find((t) => t.id === id);
      return found ? copy(found) : null;
    },

    /** Validate + insert. Never trusts caller objects (stores a copy). */
    create(input) {
      const { valid, errors, value } = validateTripInput(input);
      if (!valid) return { ok: false, errors };
      const trip = { ...value, id: generateTripId(), createdAt: stamp(), updatedAt: stamp() };
      const all = adapter.load();
      all.push(trip);
      if (!adapter.save(all)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, trip: copy(trip) };
    },

    /** Validate + replace by ID. Preserves id + createdAt; bumps updatedAt. */
    update(id, input) {
      if (typeof id !== "string" || !id) return { ok: false, error: "not-found" };
      const all = adapter.load();
      const i = all.findIndex((t) => t.id === id);
      if (i === -1) return { ok: false, error: "not-found" };
      const { valid, errors, value } = validateTripInput(input);
      if (!valid) return { ok: false, errors };
      const next = { ...value, id, createdAt: all[i].createdAt ?? stamp(), updatedAt: stamp() };
      all[i] = next;
      if (!adapter.save(all)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, trip: copy(next) };
    },

    /** Delete by ID. Missing ID is "not-found", never a silent success. */
    remove(id) {
      if (typeof id !== "string" || !id) return { ok: false, error: "not-found" };
      const all = adapter.load();
      const next = all.filter((t) => t.id !== id);
      if (next.length === all.length) return { ok: false, error: "not-found" };
      if (!adapter.save(next)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, id };
    },
  };
}
