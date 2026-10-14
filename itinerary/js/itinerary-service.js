/**
 * itinerary-service.js — itinerary data access + persistence (adapter-style).
 *
 * Storage shape: { [tripId]: { tripId, activities: [...] } } under
 * "yatrastorizz.itineraries.v1". ordering (`order`) is consistent per day.
 * Service never validates trip ranges (the manager does that with the
 * trip); it validates identifiers and record shapes at its boundary.
 */
import { reorderDayActivities, normalizeDayOrder, moveActivityToDate } from "./activity-manager.js";

const DEFAULT_STORAGE_KEY = "yatrastorizz.itineraries.v1";

export function generateActivityId() {
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLocalStorageAdapter(key = DEFAULT_STORAGE_KEY, getStorage = () => globalThis.localStorage) {
  const readAll = () => {
    try {
      const raw = getStorage()?.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };
  return {
    load: (tripId) => {
      const all = readAll();
      const entry = all[tripId];
      if (!entry || typeof entry !== "object" || !Array.isArray(entry.activities)) return [];
      return entry.activities.filter((a) => a && typeof a === "object");
    },
    save: (tripId, activities) => {
      try {
        const all = readAll();
        all[tripId] = { tripId, activities };
        getStorage()?.setItem(key, JSON.stringify(all));
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function createMemoryAdapter(seed = {}) {
  const data = {};
  for (const [k, v] of Object.entries(seed && typeof seed === "object" ? seed : {})) {
    data[k] = Array.isArray(v?.activities) ? v.activities.map((a) => ({ ...a })) : [];
  }
  return {
    load: (tripId) => (data[tripId] ?? []).map((a) => ({ ...a })),
    save: (tripId, activities) => {
      data[tripId] = activities.map((a) => ({ ...a }));
      return true;
    },
  };
}

const copy = (a) => ({ ...a });

/**
 * @param {{ adapter?: {load, save} }} [options]
 */
export function createItineraryService(options = {}) {
  const adapter = options.adapter ?? createLocalStorageAdapter();

  const persist = (tripId, activities) => adapter.save(tripId, activities);

  return {
    /** All activities for a trip (copies), in stored order. */
    getActivities(tripId) {
      if (typeof tripId !== "string" || !tripId) return [];
      return adapter.load(tripId).map(copy);
    },

    getActivity(tripId, activityId) {
      if (typeof activityId !== "string" || !activityId) return null;
      const found = adapter.load(tripId).find((a) => a.id === activityId);
      return found ? copy(found) : null;
    },

    /** Insert a NORMALIZED activity value (see activity-validation.js). */
    createActivity(tripId, value) {
      if (typeof tripId !== "string" || !tripId) return { ok: false, error: "invalid-trip" };
      if (!value || typeof value !== "object" || !value.title || !value.date) {
        return { ok: false, error: "invalid-activity" };
      }
      const all = adapter.load(tripId);
      const dayMax = all.filter((a) => a.date === value.date).reduce((m, a) => Math.max(m, typeof a.order === "number" ? a.order : -1), -1);
      const activity = { ...value, id: generateActivityId(), order: dayMax + 1 };
      all.push(activity);
      if (!persist(tripId, all)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, activity: copy(activity) };
    },

    /** Replace by ID, preserving id/order unless the date moved days. */
    updateActivity(tripId, activityId, value) {
      if (typeof activityId !== "string" || !activityId) return { ok: false, error: "not-found" };
      const all = adapter.load(tripId);
      const i = all.findIndex((a) => a.id === activityId);
      if (i === -1) return { ok: false, error: "not-found" };
      if (!value || typeof value !== "object" || !value.title || !value.date) {
        return { ok: false, error: "invalid-activity" };
      }
      const movedDay = value.date !== all[i].date;
      const next = { ...value, id: activityId, order: all[i].order };
      if (movedDay) {
        const targetMax = all.filter((a) => a.date === value.date && a.id !== activityId)
          .reduce((m, a) => Math.max(m, typeof a.order === "number" ? a.order : -1), -1);
        next.order = targetMax + 1;
      }
      all[i] = next;
      if (!persist(tripId, all)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, activity: copy(next), movedDay };
    },

    deleteActivity(tripId, activityId) {
      if (typeof activityId !== "string" || !activityId) return { ok: false, error: "not-found" };
      const all = adapter.load(tripId);
      const target = all.find((a) => a.id === activityId);
      if (!target) return { ok: false, error: "not-found" };
      const rest = all.filter((a) => a.id !== activityId);
      // renumber only the affected day; unrelated days untouched
      const day = normalizeDayOrder(rest.filter((a) => a.date === target.date));
      const dayIds = new Map(day.map((a) => [a.id, a.order]));
      const merged = rest.map((a) => (dayIds.has(a.id) ? { ...a, order: dayIds.get(a.id) } : a));
      if (!persist(tripId, merged)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, id: activityId, date: target.date };
    },

    /** Reorder within one day via the canonical operation. */
    reorderDay(tripId, date, activeId, toIndex) {
      const all = adapter.load(tripId);
      const day = all.filter((a) => a.date === date);
      const result = reorderDayActivities(day, activeId, toIndex);
      if (!result.ok) return result;
      const orderOf = new Map(result.activities.map((a) => [a.id, a.order]));
      const merged = all.map((a) => (a.date === date ? { ...a, order: orderOf.get(a.id) } : a));
      if (!persist(tripId, merged)) return { ok: false, error: "storage-unavailable" };
      // restore pre-drop order on failure is handled by the caller re-rendering;
      // persist() failing leaves in-memory state replaced on next load.
      return { ok: true, activities: result.activities.map(copy) };
    },

    /** Cross-day move: updates date, appends to target day, renumbers both. */
    moveActivityToDay(tripId, activityId, newDate) {
      const all = adapter.load(tripId);
      const result = moveActivityToDate(all, activityId, newDate);
      if (!result.ok) return result;
      if (!persist(tripId, result.activities)) return { ok: false, error: "storage-unavailable" };
      return { ok: true, activity: copy(result.activities.find((a) => a.id === activityId)) };
    },
  };
}
