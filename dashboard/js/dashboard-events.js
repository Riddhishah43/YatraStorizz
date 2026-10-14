/**
 * dashboard-events.js — user interaction only.
 * Delegated click handling; idempotent binding; no rendering here.
 * Unknown / unimplemented destinations surface an honest status message
 * instead of faking success.
 */

/**
 * Show a polite status message in the dashboard toast region (if present).
 * @param {ParentNode} root
 * @param {string} message
 */
export function showStatus(root, message) {
  const region = root instanceof Document ? root.getElementById("dashboard-status") : root.querySelector?.("#dashboard-status");
  if (!region) return;
  while (region.firstChild) region.removeChild(region.firstChild);
  region.textContent = message;
}

/**
 * Register dashboard event listeners (idempotent).
 * @param {ParentNode} [root=document]
 * @param {{ onPlanTrip?:()=>void, onViewTrip?:(id:string)=>void, onViewAllTrips?:()=>void, onQuickAction?:(action:string)=>void }} [handlers]
 * @returns {() => void} cleanup function that removes the listener
 */
export function initDashboardEvents(root = document, handlers = {}) {
  const scope = root instanceof Document ? root : root;
  if (scope?.dataset?.eventsBound === "true") return () => {};
  if (scope?.dataset) scope.dataset.eventsBound = "true";

  const onClick = (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-action]") : null;
    if (!target || !scope.contains(target)) return;
    const action = target.dataset.action;
    const tripId = target.dataset.tripId ?? target.closest("[data-trip-id]")?.dataset.tripId;

    switch (action) {
      case "plan-trip":
      case "create-trip":
        if (handlers.onPlanTrip) handlers.onPlanTrip();
        else showStatus(scope, "Trip creation is not connected yet — this demo does not create trips.");
        break;
      case "view-trip":
        if (tripId && handlers.onViewTrip) handlers.onViewTrip(tripId);
        else showStatus(scope, tripId ? `Trip “${tripId}” preview is not connected yet.` : "Trip preview is not available.");
        break;
      case "view-all-trips":
        if (handlers.onViewAllTrips) handlers.onViewAllTrips();
        else showStatus(scope, "The full trips list is not connected yet.");
        break;
      case "quick-explore":
      case "quick-saved":
      case "quick-itineraries":
        if (handlers.onQuickAction) handlers.onQuickAction(action);
        else showStatus(scope, "That section is not connected yet in this demo.");
        break;
      case "theme-toggle":
        toggleTheme(scope);
        break;
      default:
        break;
    }
  };

  scope.addEventListener("click", onClick);
  return () => scope.removeEventListener("click", onClick);
}

/** Toggle light/dark theme via data-theme on <html>, persisted to localStorage. */
function toggleTheme(scope) {
  const doc = scope instanceof Document ? scope : scope.ownerDocument ?? document;
  const root = doc.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("yatrastorizz.theme", next);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}
