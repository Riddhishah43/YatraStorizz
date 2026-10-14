/**
 * discover-events.js — event coordination only.
 * One delegated click listener + two bubbled custom-event listeners
 * ("search-change" from search-bar, "filters-change" from filter-panel).
 * Idempotent: repeated init calls do not double-bind.
 */

function showStatus(root, message) {
  const region =
    root instanceof Document ? root.getElementById("discover-status") : root.querySelector?.("#discover-status");
  if (!region) return;
  while (region.firstChild) region.removeChild(region.firstChild);
  region.textContent = message;
}

export { showStatus };

/**
 * @param {ParentNode} [root=document]
 * @param {{ onQuery?:(q:string)=>void, onFilters?:(f:object)=>void, onClearFilters?:()=>void, onResetAll?:()=>void, onToggleFavorite?:(id:string)=>void, onViewDestination?:(id:string, opener:HTMLElement)=>void, onPlanTrip?:(id:string)=>void, onToggleSavedOnly?:()=>void }} [handlers]
 * @returns {() => void} cleanup
 */
export function initDiscoverEvents(root = document, handlers = {}) {
  const scope = root;
  if (scope?.dataset?.discoverEventsBound === "true") return () => {};
  if (scope?.dataset) scope.dataset.discoverEventsBound = "true";

  const onSearchChange = (e) => {
    if (e?.detail && typeof e.detail.query === "string") handlers.onQuery?.(e.detail.query);
  };
  const onFiltersChange = (e) => {
    if (e?.detail && e.detail.filters && typeof e.detail.filters === "object") {
      handlers.onFilters?.(e.detail.filters);
    }
  };

  const onClick = (e) => {
    const t = e.target instanceof Element ? e.target.closest("[data-action]") : null;
    if (!t || !scope.contains(t)) return;
    const action = t.dataset.action;
    const id = t.dataset.destinationId ?? t.closest("[data-destination-id]")?.dataset.destinationId;

    switch (action) {
      case "toggle-favorite":
        if (id) handlers.onToggleFavorite?.(id);
        break;
      case "view-destination":
        if (id) handlers.onViewDestination?.(id, t);
        break;
      case "clear-filters":
        handlers.onClearFilters?.();
        break;
      case "clear-search":
      case "reset-search":
        handlers.onResetAll?.();
        break;
      case "plan-trip":
        handlers.onPlanTrip?.(id ?? "");
        break;
      case "toggle-saved":
        handlers.onToggleSavedOnly?.();
        break;
      case "modal-close":
        document.querySelector("dialog.dest-modal")?.close();
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

  scope.addEventListener("search-change", onSearchChange);
  scope.addEventListener("filters-change", onFiltersChange);
  scope.addEventListener("click", onClick);
  return () => {
    scope.removeEventListener("search-change", onSearchChange);
    scope.removeEventListener("filters-change", onFiltersChange);
    scope.removeEventListener("click", onClick);
    if (scope?.dataset) delete scope.dataset.discoverEventsBound;
  };
}
