/**
 * reorder-controls.js — accessible up/down buttons (non-drag alternative).
 * Emits via data-action="move-up|move-down" (handled by itinerary-events.js)
 * using the SAME reorder operation as drag-and-drop (see activity-manager).
 */

/**
 * @param {{ activityId: string, title: string, index: number, total: number }} options
 * @returns {HTMLElement}
 */
export function createReorderControls({ activityId, title, index, total }) {
  const wrap = document.createElement("div");
  wrap.className = "reorder-controls";
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", `Reorder ${title}`);

  const up = document.createElement("button");
  up.type = "button";
  up.className = "btn btn--ghost btn--small";
  up.dataset.action = "move-up";
  up.dataset.activityId = activityId;
  up.disabled = index <= 0;
  up.textContent = "↑";
  up.setAttribute("aria-label", `Move ${title} up`);

  const down = document.createElement("button");
  down.type = "button";
  down.className = "btn btn--ghost btn--small";
  down.dataset.action = "move-down";
  down.dataset.activityId = activityId;
  down.disabled = index >= total - 1;
  down.textContent = "↓";
  down.setAttribute("aria-label", `Move ${title} down`);

  wrap.appendChild(up);
  wrap.appendChild(down);
  return wrap;
}
