/**
 * itinerary-events.js — click + custom-event coordination (idempotent).
 * Drag-and-drop listeners live in drag-drop.js (bound once by the entry);
 * this module routes card/form/timeline actions to entry handlers.
 */

/**
 * @param {ParentNode} [root=document]
 * @param {{ onAddActivity?:()=>void, onEditActivity?:(id:string)=>void, onDeleteActivity?:(id:string)=>void, onMoveUp?:(id:string)=>void, onMoveDown?:(id:string)=>void, onSortMode?:(mode:string)=>void }} [handlers]
 * @returns {() => void} cleanup
 */
export function initItineraryEvents(root = document, handlers = {}) {
  const scope = root;
  if (scope?.dataset?.itineraryEventsBound === "true") return () => {};
  if (scope?.dataset) scope.dataset.itineraryEventsBound = "true";

  const onClick = (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-action]") : null;
    if (!t || !scope.contains(t)) return;
    const id = t.dataset.activityId;
    switch (t.dataset.action) {
      case "add-activity":
        handlers.onAddActivity?.();
        break;
      case "edit-activity":
        if (id) handlers.onEditActivity?.(id);
        break;
      case "delete-activity":
        if (id) handlers.onDeleteActivity?.(id);
        break;
      case "move-up":
        if (id) handlers.onMoveUp?.(id);
        break;
      case "move-down":
        if (id) handlers.onMoveDown?.(id);
        break;
      case "theme-toggle": {
        const rootEl = document.documentElement;
        const next = rootEl.dataset.theme === "dark" ? "light" : "dark";
        rootEl.dataset.theme = next;
        try {
          localStorage.setItem("yatrastorizz.theme", next);
        } catch {
          /* theme still applies for this session */
        }
        break;
      }
      default:
        break;
    }
  };

  const onChange = (e) => {
    const t = e.target instanceof Element ? e.target.closest('[data-action="timeline-sort"]') : null;
    if (t) handlers.onSortMode?.(t.value === "schedule" ? "schedule" : "manual");
  };

  scope.addEventListener("click", onClick);
  scope.addEventListener("change", onChange);
  return () => {
    scope.removeEventListener("click", onClick);
    scope.removeEventListener("change", onChange);
    if (scope?.dataset) delete scope.dataset.itineraryEventsBound;
  };
}
