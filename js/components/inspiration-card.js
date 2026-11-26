/**
 * inspiration-card.js — editorial magazine bento card for Travel Inspiration (Prompt 7).
 * Pure DOM creation, zero-XSS.
 */
import { el } from "../utils/dom-utils.js";
import { FALLBACK_IMAGE, isAllowedImageUrl } from "./destination-card.js";

export function createInspirationCard(item) {
  const data = item && typeof item === "object" ? item : {};
  const card = el("article", `insp-card insp-card--${data.size || "regular"}`);

  // Image wrapper
  const media = el("div", "insp-card__media");
  const img = document.createElement("img");
  img.className = "insp-card__img";
  img.alt = `${data.destination || "Destination"} — ${data.experience || "Travel"}`;
  img.loading = "lazy";
  img.src = isAllowedImageUrl(data.image) ? data.image.trim() : FALLBACK_IMAGE;
  img.addEventListener("error", () => {
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  });
  media.appendChild(img);
  card.appendChild(media);

  // Gradient overlay & editorial text content
  const overlay = el("div", "insp-card__overlay");

  const tag = el("span", "insp-card__tag", data.experience || "Inspiration");
  const title = el("h3", "insp-card__title", data.destination || "");
  const loc = el("p", "insp-card__loc", data.location || "");
  const caption = el("p", "insp-card__caption", data.caption || "");

  const cta = el("a", "insp-card__cta", "Explore Category →");
  const query = encodeURIComponent(data.query || data.category || "");
  cta.href = `../discover/discover.html?q=${query}`;
  cta.setAttribute("aria-label", `Explore ${data.experience} in Discover`);

  overlay.appendChild(tag);
  overlay.appendChild(title);
  if (data.location) overlay.appendChild(loc);
  overlay.appendChild(caption);
  overlay.appendChild(cta);

  card.appendChild(overlay);
  return card;
}
