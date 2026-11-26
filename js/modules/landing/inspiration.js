/**
 * inspiration.js — Travel Inspiration section renderer (Prompt 7).
 */
import { INSPIRATION_ITEMS } from "../../data/inspiration-data.js";
import { createInspirationCard } from "../../components/inspiration-card.js";
import { clear, qs } from "../../utils/dom-utils.js";

export function initInspiration(root = document) {
  const mount = qs(root, "#inspiration-mount");
  if (!mount) return 0;
  clear(mount);
  for (const item of INSPIRATION_ITEMS) {
    mount.appendChild(createInspirationCard(item));
  }
  return INSPIRATION_ITEMS.length;
}
