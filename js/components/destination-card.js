/**
 * destination-card.js — landing showcase card (DOM only, no data fetching).
 */
import { el, clear } from "../utils/dom-utils.js";

export const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#E1F782"/><text x="50%" y="52%" font-size="36" text-anchor="middle" fill="#151515">Image unavailable</text></svg>'
  );

export function isAllowedImageUrl(url) {
  return typeof url === "string" && /^(https?:\/\/|\.\.\/)/.test(url.trim());
}

/**
 * @param {object} dest { id, name, country, region?, category?, description?, image? }
 * @param {{ href?: string }} [options] card action target (Discover module)
 */
export function createDestinationCard(dest, { href = "../discover/discover.html" } = {}) {
  const d = dest && typeof dest === "object" ? dest : {};
  const name = typeof d.name === "string" && d.name.trim() ? d.name.trim() : "Unnamed place";
  const country = typeof d.country === "string" && d.country.trim() ? d.country.trim() : "";

  const card = el("article", "showcase-card");

  const media = el("div", "showcase-card__media");
  const img = document.createElement("img");
  img.className = "showcase-card__img";
  img.alt = country ? `${name}, ${country}` : name;
  img.loading = "lazy";
  img.width = 800;
  img.height = 600;
  img.src = isAllowedImageUrl(d.image) ? d.image.trim() : FALLBACK_IMAGE;
  img.addEventListener("error", () => {
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  });
  media.appendChild(img);
  card.appendChild(media);

  const body = el("div", "showcase-card__body");
  body.appendChild(el("h3", "showcase-card__title", name));
  if (country) body.appendChild(el("p", "showcase-card__loc", d.region ? `${d.region}, ${country}` : country));
  if (typeof d.description === "string" && d.description.trim()) {
    body.appendChild(el("p", "showcase-card__desc", d.description.trim()));
  }
  if (typeof d.category === "string" && d.category.trim()) {
    const tag = el("span", "badge", d.category.trim());
    body.appendChild(tag);
  }
  const link = el("a", "link-btn", `Explore in Discover →`);
  link.href = href;
  link.setAttribute("aria-label", `Explore ${name} in Discover`);
  body.appendChild(link);
  card.appendChild(body);
  return card;
}

/** Render cards or the empty state. Returns rendered count. */
export function renderDestinationCards(mount, list) {
  if (!mount) return 0;
  clear(mount);
  const items = Array.isArray(list) ? list : [];
  if (!items.length) {
    mount.appendChild(el("p", "empty-state", "Destinations are being curated — check back soon."));
    return 0;
  }
  for (const d of items) mount.appendChild(createDestinationCard(d));
  return items.length;
}
