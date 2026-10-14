/**
 * destination-modal.js — native <dialog> detail view.
 * Lookup and favorites stay in their modules; this file only renders
 * the prepared view model and manages open/close/focus.
 */
import { isAllowedImageUrl } from "./destination-card.js";

const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

let lastFocused = null;

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function sectionList(title, items) {
  if (!items.length) return null;
  const sec = el("div", "modal__section");
  sec.appendChild(el("h3", "modal__subtitle", title));
  const ul = el("ul", "modal__list");
  for (const item of items) ul.appendChild(el("li", "", item));
  sec.appendChild(ul);
  return sec;
}

/** Render prepared details into the dialog body. */
export function renderModalContent(dialog, details, favorite) {
  const body = dialog.querySelector(".modal__body");
  if (!body) return;
  while (body.firstChild) body.removeChild(body.firstChild);
  if (dialog.dataset.destinationId !== details.id) dialog.dataset.destinationId = details.id;

  if (details.image && isAllowedImageUrl(details.image)) {
    const img = document.createElement("img");
    img.className = "modal__img";
    img.src = details.image;
    img.alt = `${details.name}, ${details.country}`;
    img.addEventListener("error", () => img.remove());
    body.appendChild(img);
  }

  body.appendChild(el("h2", "modal__title", details.name));
  body.appendChild(
    el("p", "modal__loc", details.region ? `${details.region}, ${details.country}` : details.country)
  );
  body.appendChild(el("p", "modal__desc", details.description));

  if (details.categories.length) {
    const tags = el("ul", "tag-list");
    tags.setAttribute("aria-label", `Categories for ${details.name}`);
    for (const c of details.categories) tags.appendChild(el("li", "tag", c));
    body.appendChild(tags);
  }

  const facts = el("dl", "modal__facts");
  const fact = (term, value) => {
    facts.appendChild(el("dt", "", term));
    facts.appendChild(el("dd", "", value));
  };
  fact(
    "Estimated budget",
    details.dailyBudgetAmount !== null
      ? `${currencyFmt.format(details.dailyBudgetAmount)} / day / person`
      : "Not specified"
  );
  fact("Best season", details.bestSeasons.length ? details.bestSeasons.join(", ") : "Year-round");
  fact("Ideal duration", details.idealDurationDays ? `${details.idealDurationDays} days` : "Flexible");
  body.appendChild(facts);

  for (const sec of [
    sectionList("Popular attractions", details.attractions),
    sectionList("Things to do", details.activities),
    sectionList("Travel tips", details.travelTips),
  ]) {
    if (sec) body.appendChild(sec);
  }

  const actions = el("div", "modal__actions");
  const fav = el(
    "button",
    "btn btn--ghost btn--small" + (favorite ? " is-fav" : ""),
    favorite ? "★ Saved" : "☆ Save to favorites"
  );
  fav.type = "button";
  fav.dataset.action = "toggle-favorite";
  fav.dataset.destinationId = details.id;
  fav.classList.add("modal__fav");
  fav.setAttribute("aria-pressed", favorite ? "true" : "false");
  fav.setAttribute("aria-label", favorite ? `Remove ${details.name} from favorites` : `Save ${details.name} to favorites`);

  const plan = el("button", "btn btn--primary btn--small", "Plan a trip");
  plan.type = "button";
  plan.dataset.action = "plan-trip";
  plan.dataset.destinationId = details.id;
  plan.setAttribute("aria-label", `Plan a trip to ${details.name}`);

  actions.appendChild(fav);
  actions.appendChild(plan);
  body.appendChild(actions);
}

/**
 * Create the dialog shell once; entry appends it to the document.
 * @returns {HTMLDialogElement}
 */
export function createDestinationModal() {
  const dialog = document.createElement("dialog");
  dialog.className = "dest-modal";
  dialog.setAttribute("aria-labelledby", "dest-modal-title");

  const close = el("button", "btn btn--ghost btn--small modal__close", "✕ Close");
  close.type = "button";
  close.dataset.action = "modal-close";
  close.setAttribute("aria-label", "Close destination details");
  close.id = "dest-modal-title";

  const body = el("div", "modal__body");
  dialog.appendChild(close);
  dialog.appendChild(body);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeDestinationModal(dialog); // backdrop click
  });
  dialog.addEventListener("close", () => {
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
  });
  return dialog;
}

/** Open the modal for prepared details; focuses the close button. */
export function openDestinationModal(dialog, details, favorite = false) {
  if (!dialog || !details) return;
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  renderModalContent(dialog, details, favorite);
  if (!dialog.open) dialog.showModal();
  dialog.querySelector(".modal__close")?.focus();
}

export function closeDestinationModal(dialog) {
  if (dialog?.open) dialog.close();
}

/** Refresh the modal favorite button after a toggle (stays open). */
export function updateModalFavorite(dialog, details, favorite) {
  if (dialog?.open && details) renderModalContent(dialog, details, favorite);
}
