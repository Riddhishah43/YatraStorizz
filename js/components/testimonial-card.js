/**
 * testimonial-card.js — quote card. Only rendered for REAL, consented
 * testimonials. Sample/fallback content never uses this component.
 */
import { el } from "../utils/dom-utils.js";

/** @param {{ name: string, context?: string, quote: string }} t */
export function createTestimonialCard(t) {
  const card = el("figure", "testimonial-card");
  const quote = el("blockquote", "testimonial-card__quote", t?.quote ?? "");
  const cap = document.createElement("figcaption");
  cap.className = "testimonial-card__who";
  const avatar = el("span", "testimonial-card__avatar", initials(t?.name));
  avatar.setAttribute("aria-hidden", "true");
  const who = el("div");
  who.appendChild(el("p", "testimonial-card__name", t?.name ?? "Anonymous traveller"));
  if (t?.context) who.appendChild(el("p", "testimonial-card__context", t.context));
  cap.appendChild(avatar);
  cap.appendChild(who);
  card.appendChild(quote);
  card.appendChild(cap);
  return card;
}

function initials(name) {
  if (typeof name !== "string" || !name.trim()) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
