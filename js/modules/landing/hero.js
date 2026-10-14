/**
 * hero.js — hero CTA wiring. Buttons are real anchors (Trips / Discover);
 * this module adds only the honest trip-count hint when trips exist.
 * No fabricated statistics, awards, or AI claims anywhere.
 */
import { qs } from "../../utils/dom-utils.js";

export function initHero() {
  let count = 0;
  try {
    const raw = localStorage.getItem("yatrastorizz.trips.v1");
    const trips = raw ? JSON.parse(raw) : [];
    count = Array.isArray(trips) ? trips.length : 0;
  } catch {
    count = 0;
  }
  // Only shown when the user genuinely has trips — never a fake stat.
  if (count > 0) {
    const hint = qs(document, "[data-hero-trips]");
    if (hint) hint.textContent = `You have ${count} trip${count === 1 ? "" : "s"} planned — pick up where you left off.`;
  }
}
