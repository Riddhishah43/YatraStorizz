/**
 * toast.js — accessible notifications. Live region, text+icon status,
 * dismiss button, auto-expire. Never renders sensitive form content —
 * callers pass the display string.
 */

let region = null;

function ensureRegion() {
  if (region && document.contains(region)) return region;
  region = document.createElement("div");
  region.className = "toast-region";
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  document.body.appendChild(region);
  return region;
}

const ICONS = Object.freeze({ success: "✓", error: "✕", info: "ℹ" });

/**
 * @param {string} message plain text (rendered via textContent)
 * @param {"success"|"error"|"info"} [type]
 * @param {{ duration?: number }} [options]
 * @returns {() => void} dismiss function
 */
export function showToast(message, type = "info", { duration = 4500 } = {}) {
  const host = ensureRegion();
  const toast = document.createElement("div");
  toast.className = `toast toast--${ICONS[type] ? type : "info"}`;

  const icon = document.createElement("span");
  icon.className = "toast__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = ICONS[type] ?? ICONS.info;

  const text = document.createElement("p");
  text.className = "toast__text";
  text.textContent = String(message ?? "");

  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast__close";
  close.setAttribute("aria-label", "Dismiss notification");
  close.textContent = "✕";

  let timer = null;
  const dismiss = () => {
    if (timer) clearTimeout(timer);
    toast.remove();
  };
  close.addEventListener("click", dismiss);
  if (duration > 0) timer = setTimeout(dismiss, duration);

  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(close);
  host.appendChild(toast);
  return dismiss;
}
