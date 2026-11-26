/**
 * how-it-works.js — four steps reflecting YaatraStorizz workflow (Prompt 5).
 */
import { el, clear, qs } from "../../utils/dom-utils.js";

const STEPS = Object.freeze([
  {
    num: "01",
    title: "Discover",
    text: "Explore destinations and find places that match your travel interests.",
    href: "../discover/discover.html",
  },
  {
    num: "02",
    title: "Create Your Trip",
    text: "Choose your destination, set travel dates and create your travel plan.",
    href: "../trips/trips.html",
  },
  {
    num: "03",
    title: "Build Your Itinerary",
    text: "Organize activities, experiences and places across different travel days.",
    href: "../trips/trips.html",
  },
  {
    num: "04",
    title: "Manage Your Budget",
    text: "Track estimated costs and expenses to keep your journey within budget.",
    href: "../budget/budget.html",
  },
]);

export function initHowItWorks(root = document) {
  const mount = qs(root, "#steps-list");
  if (!mount) return 0;
  clear(mount);
  const ol = el("ol", "steps");
  for (const s of STEPS) {
    const li = el("li", "step");
    li.appendChild(el("span", "step__num", s.num));
    const body = el("div", "step__body");
    body.appendChild(el("h3", "step__title", s.title));
    body.appendChild(el("p", "step__text", s.text));
    const link = el("a", "link-btn", "Open feature →");
    link.href = s.href;
    link.setAttribute("aria-label", `${s.title}: open the relevant page`);
    body.appendChild(link);
    li.appendChild(body);
    ol.appendChild(li);
  }
  mount.appendChild(ol);
  return STEPS.length;
}
