/**
 * trip-events.js — user-interaction coordination (delegation, idempotent).
 * Search/filter/sort controls emit through the handlers; card and dialog
 * buttons route by data-action. No business logic here.
 */

/**
 * @param {{ root?: ParentNode, searchInput?: HTMLInputElement|null, statusSelect?: HTMLSelectElement|null, sortSelect?: HTMLSelectElement|null }} mounts
 * @param {{ onCreate?:()=>void, onView?:(id:string)=>void, onEdit?:(id:string)=>void, onDelete?:(id:string)=>void, onQuery?:(q:string)=>void, onViewChange?:(patch:object)=>void, onDetailsClose?:()=>void }} [handlers]
 * @returns {() => void} cleanup
 */
export function initTripEvents(mounts = {}, handlers = {}) {
  const { root = document, searchInput = null, statusSelect = null, sortSelect = null } = mounts;
  const scope = root;
  if (scope?.dataset?.tripsEventsBound === "true") return () => {};
  if (scope?.dataset) scope.dataset.tripsEventsBound = "true";

  const onClick = (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-action]") : null;
    if (!t || !scope.contains(t)) return;
    const id = t.dataset.tripId ?? t.closest("[data-trip-id]")?.dataset.tripId;
    switch (t.dataset.action) {
      case "create-trip":
        handlers.onCreate?.();
        break;
      case "view-trip":
        if (id) handlers.onView?.(id);
        break;
      case "edit-trip":
        if (id) handlers.onEdit?.(id);
        break;
      case "delete-trip":
        if (id) handlers.onDelete?.(id);
        break;
      case "details-close":
        handlers.onDetailsClose?.();
        break;
      case "form-cancel":
        break; // handled inside the form modal component
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

  const onSearch = (e) => handlers.onQuery?.(e.target.value ?? "");
  const onStatus = (e) => handlers.onViewChange?.({ status: e.target.value });
  const onSort = (e) => handlers.onViewChange?.({ sort: e.target.value });

  scope.addEventListener("click", onClick);
  searchInput?.addEventListener("input", onSearch);
  statusSelect?.addEventListener("change", onStatus);
  sortSelect?.addEventListener("change", onSort);

  return () => {
    scope.removeEventListener("click", onClick);
    searchInput?.removeEventListener("input", onSearch);
    statusSelect?.removeEventListener("change", onStatus);
    sortSelect?.removeEventListener("change", onSort);
    if (scope?.dataset) delete scope.dataset.tripsEventsBound;
  };
}
