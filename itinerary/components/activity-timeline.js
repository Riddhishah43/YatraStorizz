/**
 * activity-timeline.js — renders one day's activities in ORDER PROVIDED.
 * Sorting decisions live in activity-manager.js; drop targets are the
 * cards (insert before/after) and the list itself (append).
 */
import { createActivityCard } from "./activity-card.js";

/**
 * @param {HTMLElement} mount
 * @param {object[]} activities already sequenced for display
 * @param {{ date?: string, sortMode?: "manual"|"schedule", conflicts?: Set<string> }} [options]
 * @returns {number} rendered count
 */
export function renderActivityTimeline(mount, activities, options = {}) {
  if (!mount) return 0;
  const { date = "", sortMode = "manual", conflicts = new Set() } = options;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  mount.className = "activity-timeline";
  if (date) mount.dataset.date = date;

  const head = document.createElement("div");
  head.className = "timeline__head";
  const label = document.createElement("label");
  label.className = "timeline__sort-label";
  const selectId = "timeline-sort";
  label.setAttribute("for", selectId);
  label.textContent = "Order:";
  const select = document.createElement("select");
  select.id = selectId;
  select.className = "timeline__sort";
  select.dataset.action = "timeline-sort";
  for (const [value, text] of [["manual", "My sequence"], ["schedule", "By time"]]) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = text;
    if (value === sortMode) o.selected = true;
    select.appendChild(o);
  }
  head.appendChild(label);
  head.appendChild(select);
  mount.appendChild(head);

  const list = document.createElement("div");
  list.className = "timeline__list";
  list.dataset.dropList = "true";

  const items = Array.isArray(activities) ? activities : [];
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-results";
    const t = document.createElement("p");
    t.className = "empty-results__title";
    t.textContent = "No activities planned for this day yet.";
    const h = document.createElement("p");
    h.className = "empty-results__hint";
    h.textContent = "Add the first activity to start shaping your day.";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--primary btn--small";
    btn.dataset.action = "add-activity";
    btn.textContent = "Add activity";
    empty.appendChild(t);
    empty.appendChild(h);
    empty.appendChild(btn);
    list.appendChild(empty);
  } else {
    items.forEach((a, i) => {
      list.appendChild(createActivityCard(a, { index: i, total: items.length, conflict: conflicts.has(a?.id) }));
    });
  }

  mount.appendChild(list);
  return items.length;
}
