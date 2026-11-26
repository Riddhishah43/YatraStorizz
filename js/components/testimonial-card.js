/**
 * testimonial-card.js — quote card for traveller stories (Prompt 8).
 * Pure DOM, zero-XSS.
 */
import { el } from "../utils/dom-utils.js";

export function createTestimonialCard(t) {
  const card = el("figure", "testimonial-card");

  const badgeText = t?.isDemo === false ? "Verified Traveller" : "Demo Scenario";
  const badge = el("span", "testimonial-card__badge", badgeText);
  badge.setAttribute("title", t?.isDemo === false ? "Genuine traveller feedback" : "Illustrative user journey for development demo");

  // Star Rating Display (Google Review style)
  const ratingVal = Math.max(1, Math.min(5, Math.round(Number(t?.rating) || 5)));
  const ratingWrap = el("div", "testimonial-card__rating");
  ratingWrap.setAttribute("aria-label", `${ratingVal} out of 5 stars`);
  const starsSpan = el("span", "stars", "★".repeat(ratingVal) + "☆".repeat(5 - ratingVal));
  const ratingNum = el("span", "rating-num", `${ratingVal}.0`);
  ratingWrap.appendChild(starsSpan);
  ratingWrap.appendChild(ratingNum);

  if (t?.destination) {
    const destPill = el("span", "testimonial-card__dest", `📍 ${t.destination}`);
    ratingWrap.appendChild(destPill);
  }

  const quoteText = t?.quote || t?.comment || "";
  const quote = el("blockquote", "testimonial-card__quote", `“${quoteText}”`);

  const cap = document.createElement("figcaption");
  cap.className = "testimonial-card__who";

  const authorName = t?.name || t?.author || "Anonymous traveller";
  const avatar = el("span", "testimonial-card__avatar", t?.avatar || initials(authorName));
  avatar.setAttribute("aria-hidden", "true");

  const who = el("div");
  who.appendChild(el("p", "testimonial-card__name", authorName));
  const roleText = [t?.role, t?.tripContext || t?.travelDate].filter(Boolean).join(" · ");
  if (roleText) {
    who.appendChild(el("p", "testimonial-card__context", roleText));
  }

  cap.appendChild(avatar);
  cap.appendChild(who);

  card.appendChild(badge);
  card.appendChild(ratingWrap);
  card.appendChild(quote);

  // Highlight tags if present
  if (Array.isArray(t?.tags) && t.tags.length > 0) {
    const tagsWrap = el("div", "testimonial-card__tags");
    for (const tag of t.tags) {
      tagsWrap.appendChild(el("span", "highlight-chip", tag));
    }
    card.appendChild(tagsWrap);
  }

  card.appendChild(cap);
  return card;
}

function initials(name) {
  if (typeof name !== "string" || !name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
