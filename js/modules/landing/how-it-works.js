/**
 * how-it-works.js — four honest steps with links to real pages.
 */
import { el, clear, qs } from "../../utils/dom-utils.js";

const STEPS = Object.freeze([
  { n: 1, title: "Discover", text: "Browse destinations and save the places that call to you.", href: "../discover/discover.html" },
  { n: 2, title: "Create Your Trip", text: "Choose dates, add destinations, and set a budget.", href: "../trips/trips.html" },
  { n: 3, title: "Build Your Itinerary", text: "Arrange activities across each travel day.", href: "../trips/trips.html" },
  { n: 4, title: "Track Your Budget", text: "Record expenses and monitor spending by category.", href: "../budget/budget.html" },
]);

export function initHowItWorks(root = document) {
  const mount = qs(root, "#steps-list");
  if (!mount) return 0;
  clear(mount);
  const ol = el("ol", "steps");
  for (const s of STEPS) {
    const li = el("li", "step");
    li.appendChild(el("span", "step__num", String(s.n)));
    const body = el("div", "step__body");
    body.appendChild(el("h3", "step__title", s.title));
    body.appendChild(el("p", "step__text", s.text));
    const link = el("a", "link-btn", "Open →");
    link.href = s.href;
    link.setAttribute("aria-label", `${s.title}: open the relevant page`);
    body.appendChild(link);
    li.appendChild(body);
    ol.appendChild(li);
  }
  mount.appendChild(ol);
  return STEPS.length;
}
