/**
 * destination-grid.js — renders the result collection.
 * Receives already-filtered items; never decides what matches.
 */
import { createDestinationCard } from "./destination-card.js";

/**
 * Render destination cards into a mount point.
 * @param {HTMLElement} mount
 * @param {object[]} items already-searched + already-filtered destinations
 * @param {{ favoriteIds?: string[], emptyHint?: string }} [options]
 * @returns {number} rendered item count
 */
export function renderDestinationGrid(mount, items, options = {}) {
  if (!mount) return 0;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const list = Array.isArray(items) ? items : [];
  const favs = new Set(Array.isArray(options.favoriteIds) ? options.favoriteIds : []);

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-results";
    const title = document.createElement("p");
    title.className = "empty-results__title";
    title.textContent = "No destinations match your search.";
    const hint = document.createElement("p");
    hint.className = "empty-results__hint";
    hint.textContent = options.emptyHint ?? "Try a different keyword or clear your search and filters.";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "btn btn--secondary";
    reset.dataset.action = "reset-search";
    reset.textContent = "Clear search & filters";
    empty.appendChild(title);
    empty.appendChild(hint);
    empty.appendChild(reset);
    mount.appendChild(empty);
    return 0;
  }

  for (const dest of list) {
    mount.appendChild(createDestinationCard(dest, { favorite: favs.has(dest?.id) }));
  }
  return list.length;
}
