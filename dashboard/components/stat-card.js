/**
 * stat-card.js — reusable overview statistic card.
 * Accepts structured data, returns a DOM element. No calculations here.
 */

/**
 * @param {{ label:string, value:string|number, icon?:string, description?:string, id?:string }} data
 * @returns {HTMLElement}
 */
export function createStatCard(data) {
  const { label, value, icon, description, id } = data ?? {};
  const card = document.createElement("article");
  card.className = "stat-card";
  if (id) card.id = id;

  const iconWrap = document.createElement("div");
  iconWrap.className = "stat-card__icon";
  iconWrap.setAttribute("aria-hidden", "true");
  const iconEl = document.createElement("span");
  iconEl.textContent = typeof icon === "string" && icon ? icon : "✈";
  iconWrap.appendChild(iconEl);

  const body = document.createElement("div");
  body.className = "stat-card__body";

  const labelEl = document.createElement("p");
  labelEl.className = "stat-card__label";
  labelEl.textContent = typeof label === "string" && label ? label : "Statistic";

  const valueEl = document.createElement("p");
  valueEl.className = "stat-card__value";
  valueEl.textContent = value === 0 || value ? String(value) : "—";

  body.appendChild(labelEl);
  body.appendChild(valueEl);

  if (typeof description === "string" && description.trim() !== "") {
    const desc = document.createElement("p");
    desc.className = "stat-card__desc";
    desc.textContent = description;
    body.appendChild(desc);
  }

  card.appendChild(iconWrap);
  card.appendChild(body);
  return card;
}
