/**
 * destination-card.js — reusable card for one destination.
 * Pure DOM builder: no search/filter/favorites logic inside.
 * Interaction works through data-action attributes handled by
 * discover-events.js (delegation), so cards never wire their own app state.
 */

const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#E1F782"/><text x="50%" y="52%" font-size="40" text-anchor="middle" fill="#151515">Image unavailable</text></svg>'
  );

/** Allow only http(s) image URLs; anything else falls back. */
export function isAllowedImageUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
}

export function formatDailyBudget(dest) {
  const amount = dest?.estimatedDailyBudget?.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) return "Budget varies";
  return `${currencyFmt.format(amount)} / day (est.)`;
}

/**
 * @param {object} dest destination record
 * @param {{ favorite?: boolean }} [options]
 * @returns {HTMLElement}
 */
export function createDestinationCard(dest, options = {}) {
  const d = dest && typeof dest === "object" ? dest : {};
  const favorite = options.favorite === true;
  const name = typeof d.name === "string" && d.name.trim() ? d.name.trim() : "Unnamed destination";
  const country = typeof d.country === "string" && d.country.trim() ? d.country.trim() : "Unknown location";
  const region = typeof d.region === "string" && d.region.trim() ? d.region.trim() : "";
  const categories = Array.isArray(d.categories)
    ? d.categories.filter((c) => typeof c === "string" && c.trim())
    : [];

  const card = document.createElement("article");
  card.className = "dest-card";
  if (d.id) card.dataset.destinationId = String(d.id);

  const media = document.createElement("div");
  media.className = "dest-card__media";
  const img = document.createElement("img");
  img.className = "dest-card__img";
  img.alt = region ? `${name}, ${region}, ${country}` : `${name}, ${country}`;
  img.loading = "lazy";
  img.width = 800;
  img.height = 500;
  img.src = isAllowedImageUrl(d.image) ? d.image.trim() : FALLBACK_IMAGE;
  img.addEventListener("error", () => {
    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
  });
  media.appendChild(img);

  const body = document.createElement("div");
  body.className = "dest-card__body";

  const title = document.createElement("h3");
  title.className = "dest-card__title";
  title.textContent = name;

  const loc = document.createElement("p");
  loc.className = "dest-card__loc";
  loc.textContent = region ? `${region}, ${country}` : country;

  const desc = document.createElement("p");
  desc.className = "dest-card__desc";
  desc.textContent =
    typeof d.description === "string" && d.description.trim() ? d.description.trim() : "No description available yet.";

  body.appendChild(title);
  body.appendChild(loc);
  body.appendChild(desc);

  if (categories.length > 0) {
    const tags = document.createElement("ul");
    tags.className = "tag-list";
    tags.setAttribute("aria-label", `Categories for ${name}`);
    for (const cat of categories.slice(0, 4)) {
      const li = document.createElement("li");
      li.className = "tag";
      li.textContent = cat.trim();
      tags.appendChild(li);
    }
    body.appendChild(tags);
  }

  const budget = document.createElement("p");
  budget.className = "dest-card__budget";
  budget.textContent = formatDailyBudget(d);
  body.appendChild(budget);

  const actions = document.createElement("div");
  actions.className = "dest-card__actions";

  const fav = document.createElement("button");
  fav.type = "button";
  fav.className = "btn btn--ghost btn--small dest-card__fav" + (favorite ? " is-fav" : "");
  fav.dataset.action = "toggle-favorite";
  if (d.id) fav.dataset.destinationId = String(d.id);
  fav.setAttribute("aria-pressed", favorite ? "true" : "false");
  fav.setAttribute("aria-label", favorite ? `Remove ${name} from favorites` : `Save ${name} to favorites`);
  const star = document.createElement("span");
  star.setAttribute("aria-hidden", "true");
  star.textContent = favorite ? "★ " : "☆ ";
  const starLabel = document.createElement("span");
  starLabel.textContent = favorite ? "Saved" : "Save";
  fav.appendChild(star);
  fav.appendChild(starLabel);

  const view = document.createElement("button");
  view.type = "button";
  view.className = "btn btn--secondary btn--small";
  view.dataset.action = "view-destination";
  if (d.id) view.dataset.destinationId = String(d.id);
  view.textContent = "View details";
  view.setAttribute("aria-label", `View details for ${name}`);

  actions.appendChild(fav);
  actions.appendChild(view);

  card.appendChild(media);
  card.appendChild(body);
  card.appendChild(actions);
  return card;
}
