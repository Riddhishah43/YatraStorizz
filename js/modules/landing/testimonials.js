/**
 * testimonials.js — real testimonials ONLY. With an empty dataset this
 * renders the "Designed for Every Kind of Trip" alternative section
 * (static trip-style scenarios, not fake endorsements).
 */
import { testimonials } from "../../data/testimonials-data.js";
import { createTestimonialCard } from "../../components/testimonial-card.js";
import { el, clear, qs } from "../../utils/dom-utils.js";

const TRIP_STYLES = Object.freeze([
  { icon: "🎒", title: "Solo escapes", text: "One bag, your pace — every stop and rupee accounted for." },
  { icon: "👨‍👩‍👧", title: "Family holidays", text: "Keep everyone's must-dos on one shared day-by-day plan." },
  { icon: "🧑‍🤝‍🧑", title: "Friends' getaways", text: "Split ideas, settle plans, and track shared spending." },
  { icon: "💼", title: "Work trips", text: "Tight schedules, clean expense records, zero chaos." },
]);

/** @returns {"testimonials"|"alternative"} which branch rendered */
export function initTestimonials(root = document) {
  const section = qs(root, "#testimonials");
  const mount = qs(root, "#testimonials-mount");
  if (!section || !mount) return "alternative";
  clear(mount);
  const valid = testimonials.filter((t) => t && t.name && t.quote);
  if (valid.length > 0) {
    const heading = qs(section, "[data-testimonials-heading]");
    if (heading) heading.textContent = "Loved by travellers";
    const grid = el("div", "testimonials-grid");
    for (const t of valid) grid.appendChild(createTestimonialCard(t));
    mount.appendChild(grid);
    return "testimonials";
  }
  const heading = qs(section, "[data-testimonials-heading]");
  if (heading) heading.textContent = "Designed for Every Kind of Trip";
  const sub = qs(section, "[data-testimonials-sub]");
  if (sub) sub.textContent = "Sample scenarios below illustrate who YatraStorizz is built for — not customer reviews.";
  const grid = el("div", "trip-styles-grid");
  for (const s of TRIP_STYLES) {
    const card = el("article", "trip-style-card");
    const icon = el("span", "trip-style-card__icon", s.icon);
    icon.setAttribute("aria-hidden", "true");
    card.appendChild(icon);
    card.appendChild(el("h3", null, s.title));
    card.appendChild(el("p", null, s.text));
    grid.appendChild(card);
  }
  mount.appendChild(grid);
  return "alternative";
}
