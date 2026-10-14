/**
 * feature-card.js — icon + heading + description + optional real link.
 */
import { el, clear } from "../utils/dom-utils.js";

/**
 * @param {{ icon?: string, iconSrc?: string, title: string, text: string, href?: string, linkLabel?: string }} feature
 */
export function createFeatureCard(feature) {
  const f = feature && typeof feature === "object" ? feature : {};
  const card = el("article", "feature-card");

  const iconWrap = el("div", "feature-card__icon");
  iconWrap.setAttribute("aria-hidden", "true");
  if (f.iconSrc) {
    const img = document.createElement("img");
    img.src = f.iconSrc;
    img.alt = "";
    img.width = 24;
    img.height = 24;
    img.addEventListener("error", () => img.remove());
    iconWrap.appendChild(img);
  } else {
    iconWrap.appendChild(el("span", null, f.icon ?? "✦"));
  }

  card.appendChild(iconWrap);
  card.appendChild(el("h3", "feature-card__title", f.title ?? "Feature"));
  card.appendChild(el("p", "feature-card__text", f.text ?? ""));
  if (f.href) {
    const link = el("a", "link-btn", f.linkLabel ?? "Learn more →");
    link.href = f.href;
    card.appendChild(link);
  }
  return card;
}

export function renderFeatureCards(mount, features) {
  if (!mount) return 0;
  clear(mount);
  const list = Array.isArray(features) ? features : [];
  for (const f of list) mount.appendChild(createFeatureCard(f));
  return list.length;
}
