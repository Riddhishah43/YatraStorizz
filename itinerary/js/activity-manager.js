/**
 * activity-manager.js — activity business operations (DOM-free).
 *
 * Home of the ONE canonical reorder operation used by drag-and-drop,
 * move-up/down buttons, and any future keyboard reorder interaction.
 * Flows coordinate validation + service; they never render.
 */
import {
  validateActivityInput,
  detectOverlaps,
  timeToMinutes,
  isValidTime,
} from "./activity-validation.js";
import { getActivitiesForDate } from "./itinerary-days.js";

/** Sort a day's list by `order` (missing order sorts last, stable). */
export function normalizeDayOrder(dayActivities) {
  const list = Array.isArray(dayActivities) ? [...dayActivities] : [];
  list.sort((a, b) => {
    const ao = typeof a?.order === "number" && Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b?.order === "number" && Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });
  return list.map((a, i) => ({ ...a, order: i }));
}

function renumber(list) {
  return list.map((a, i) => ({ ...a, order: i }));
}

/**
 * THE canonical reorder: move one activity to a destination position
 * within its day. Pure — input untouched.
 * @param {object[]} dayActivities only the moving day's items, any order
 * @param {string} activeId
 * @param {number} toIndex 0-based position in the reordered day
 * @returns {{ ok: boolean, activities?: object[], error?: string }}
 */
export function reorderDayActivities(dayActivities, activeId, toIndex) {
  const list = Array.isArray(dayActivities) ? [...dayActivities] : [];
  if (list.length === 0) return { ok: false, error: "empty-day" };
  if (typeof activeId !== "string" || !activeId) return { ok: false, error: "unknown-activity" };
  const from = list.findIndex((a) => a?.id === activeId);
  if (from === -1) return { ok: false, error: "unknown-activity" };
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= list.length) {
    return { ok: false, error: "invalid-position" };
  }
  const ordered = normalizeDayOrder(list);
  const current = ordered.findIndex((a) => a.id === activeId);
  const [moved] = ordered.splice(current, 1);
  ordered.splice(toIndex, 0, moved);
  const ids = new Set(ordered.map((a) => a.id));
  if (ids.size !== ordered.length) return { ok: false, error: "duplicate-activity" };
  return { ok: true, activities: renumber(ordered) };
}

/**
 * Move one activity to another date (cross-day). Pure.
 * The activity lands at the END of the target day; both days renumbered.
 * @returns {{ ok: boolean, activities?: object[], error?: string }}
 */
export function moveActivityToDate(allActivities, activityId, newDate) {
  const list = Array.isArray(allActivities) ? [...allActivities] : [];
  const i = list.findIndex((a) => a?.id === activityId);
  if (i === -1) return { ok: false, error: "unknown-activity" };
  const moving = { ...list[i], date: newDate };
  const rest = list.filter((_, j) => j !== i);
  const targetDay = normalizeDayOrder(rest.filter((a) => a.date === newDate));
  moving.order = targetDay.length;
  const sourceDay = normalizeDayOrder(rest.filter((a) => a.date === list[i].date));
  const others = rest.filter((a) => a.date !== newDate && a.date !== list[i].date);
  return { ok: true, activities: [...others, ...sourceDay, ...targetDay, moving] };
}

/**
 * Timeline sequencing. "manual" follows the stored order sequence;
 * "schedule" sorts by startTime (unscheduled last, stable by order).
 * Pure and deterministic either way.
 */
export function sortActivitiesForTimeline(dayActivities, mode = "manual") {
  const list = normalizeDayOrder(dayActivities);
  if (mode !== "schedule") return list;
  return [...list].sort((a, b) => {
    const at = isValidTime(a.startTime) ? timeToMinutes(a.startTime) : Number.MAX_SAFE_INTEGER;
    const bt = isValidTime(b.startTime) ? timeToMinutes(b.startTime) : Number.MAX_SAFE_INTEGER;
    return at - bt || a.order - b.order;
  });
}

/** Sum of finite, non-negative estimated costs for a day. */
export function getDayCostTotal(dayActivities) {
  let total = 0;
  for (const a of Array.isArray(dayActivities) ? dayActivities : []) {
    const c = a?.estimatedCost;
    if (typeof c === "number" && Number.isFinite(c) && c >= 0) total += c;
  }
  return Math.round(total * 100) / 100;
}

/** Warnings for a candidate against its day (overlaps only, never errors). */
export function getScheduleWarnings(dayActivities, candidate) {
  return detectOverlaps(dayActivities, candidate).map((hit) => ({
    message: `Overlaps with “${hit.title}”. Saved as a warning — times were not changed.`,
    conflictingIds: [hit.activityId],
  }));
}

/* ---- flows: validate → service, returning predictable results ---- */

export function createActivityFlow(service, trip, values) {
  const bounds = { tripStart: trip?.startDate, tripEnd: trip?.endDate };
  const checked = validateActivityInput(values, bounds);
  if (!checked.valid) return { ok: false, errors: checked.errors };
  const existing = getActivitiesForDate(service.getActivities(trip.id), checked.value.date);
  const warnings = getScheduleWarnings(existing, checked.value);
  const created = service.createActivity(trip.id, checked.value);
  if (!created.ok) return created;
  return { ok: true, activity: created.activity, warnings };
}

export function updateActivityFlow(service, trip, activityId, values) {
  const bounds = { tripStart: trip?.startDate, tripEnd: trip?.endDate };
  const checked = validateActivityInput(values, bounds);
  if (!checked.valid) return { ok: false, errors: checked.errors };
  const existing = getActivitiesForDate(service.getActivities(trip.id), checked.value.date)
    .filter((a) => a.id !== activityId);
  const warnings = getScheduleWarnings(existing, { ...checked.value, id: activityId });
  const updated = service.updateActivity(trip.id, activityId, checked.value);
  if (!updated.ok) return updated;
  return { ok: true, activity: updated.activity, warnings };
}

export function moveActivityDayFlow(service, trip, activityId, newDate) {
  const bounds = { tripStart: trip?.startDate, tripEnd: trip?.endDate };
  const current = service.getActivity(trip.id, activityId);
  if (!current) return { ok: false, error: "not-found" };
  const checked = validateActivityInput({ ...current, date: newDate }, bounds);
  if (!checked.valid) return { ok: false, errors: checked.errors };
  return service.moveActivityToDay(trip.id, activityId, newDate);
}

export function reorderDayFlow(service, tripId, date, activeId, toIndex) {
  return service.reorderDay(tripId, date, activeId, toIndex);
}
