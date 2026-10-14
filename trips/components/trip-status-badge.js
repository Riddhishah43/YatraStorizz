/**
 * trip-status-badge.js — visual status indicator (presentation only).
 * Status calculation lives in trip-service.js (deriveTripStatus).
 */

const LABELS = Object.freeze({
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
});

/**
 * @param {unknown} status
 * @returns {HTMLElement} span with text label + status class (never color-only)
 */
export function createTripStatusBadge(status) {
  const key = typeof status === "string" ? status.trim().toLowerCase() : "";
  const label = LABELS[key] ?? "Unknown";
  const badge = document.createElement("span");
  badge.className = `status-badge status-badge--${LABELS[key] ? key : "unknown"}`;
  badge.textContent = label;
  return badge;
}
