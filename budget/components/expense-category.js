/**
 * expense-category.js — category badge + shared option helpers.
 * Canonical values live in expense-manager.js; this module renders them.
 */
import { EXPENSE_CATEGORIES, categoryLabel } from "../js/expense-manager.js";

export { EXPENSE_CATEGORIES, categoryLabel };

const ICONS = new Map(EXPENSE_CATEGORIES.map((c) => [c.value, c.icon]));

/** Badge with icon (decorative) + text label (never emoji-only). */
export function createCategoryBadge(category) {
  const key = String(category ?? "").toLowerCase();
  const badge = document.createElement("span");
  badge.className = `cat-badge cat-badge--${ICONS.has(key) ? key : "other"}`;
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = `${ICONS.get(key) ?? "📦"} `;
  const label = document.createElement("span");
  label.textContent = categoryLabel(key);
  badge.appendChild(icon);
  badge.appendChild(label);
  return badge;
}

/** <option> list for selects (form + filters share these values). */
export function getCategoryOptions(includeAll = false) {
  const opts = EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }));
  return includeAll ? [{ value: "all", label: "All categories" }, ...opts] : opts;
}
