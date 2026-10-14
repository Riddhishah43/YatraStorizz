/**
 * filter-panel.js — accessible filter controls (presentation only).
 * Emits outward via bubbling "filters-change" CustomEvent
 * (detail: { filters }). Filtering math lives in destination-filters.js.
 */
import { CATEGORIES, SEASONS, BUDGET_OPTIONS } from "../js/destination-filters.js";

function uniqueCountries(destinations) {
  const set = new Set();
  for (const d of Array.isArray(destinations) ? destinations : []) {
    if (d && typeof d.country === "string" && d.country.trim()) set.add(d.country.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function labeledSelect(id, labelText, options) {
  const label = document.createElement("label");
  label.className = "filter__label";
  label.setAttribute("for", id);
  label.textContent = labelText;
  const select = document.createElement("select");
  select.id = id;
  select.className = "filter__select";
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    select.appendChild(o);
  }
  return { label, select };
}

/** Read current control values into a filter-state object. */
export function readFilterPanel(root) {
  const categories = [...root.querySelectorAll('input[name="category"]:checked')].map((el) => el.value);
  const country = root.querySelector('[data-filter="country"]')?.value ?? "";
  const budgetRaw = root.querySelector('[data-filter="maxBudget"]')?.value ?? "";
  const season = root.querySelector('[data-filter="season"]')?.value ?? "";
  return {
    categories,
    country,
    maxDailyBudget: budgetRaw === "" ? null : Number(budgetRaw),
    season,
  };
}

/** Reflect a filter state back onto rendered controls (e.g. after clear-all). */
export function syncFilterPanel(root, filters = {}) {
  const cats = new Set(
    Array.isArray(filters.categories) ? filters.categories.map((c) => String(c).toLowerCase()) : []
  );
  for (const box of root.querySelectorAll('input[name="category"]')) {
    box.checked = cats.has(String(box.value).toLowerCase());
  }
  const country = root.querySelector('[data-filter="country"]');
  if (country) country.value = typeof filters.country === "string" ? filters.country : "";
  const budget = root.querySelector('[data-filter="maxBudget"]');
  if (budget) budget.value = filters.maxDailyBudget === null || filters.maxDailyBudget === undefined ? "" : String(filters.maxDailyBudget);
  const season = root.querySelector('[data-filter="season"]');
  if (season) season.value = typeof filters.season === "string" ? filters.season : "";
}

/**
 * @param {{ destinations?: object[], filters?: object }} [options]
 * @returns {HTMLElement} panel root (listens: change → emits filters-change)
 */
export function createFilterPanel(options = {}) {
  const panel = document.createElement("section");
  panel.className = "filter-panel";
  panel.setAttribute("aria-label", "Destination filters");

  const heading = document.createElement("h2");
  heading.className = "filter-panel__title";
  heading.textContent = "Filters";
  panel.appendChild(heading);

  const catGroup = document.createElement("fieldset");
  catGroup.className = "filter__group";
  const legend = document.createElement("legend");
  legend.textContent = "Categories";
  catGroup.appendChild(legend);
  for (const cat of CATEGORIES) {
    const item = document.createElement("label");
    item.className = "check";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.name = "category";
    box.value = cat;
    const text = document.createElement("span");
    text.textContent = cat;
    item.appendChild(box);
    item.appendChild(text);
    catGroup.appendChild(item);
  }
  panel.appendChild(catGroup);

  const countryField = labeledSelect(
    "filter-country",
    "Country or region",
    [{ value: "", label: "All countries" }, ...uniqueCountries(options.destinations).map((c) => ({ value: c, label: c }))]
  );
  countryField.select.dataset.filter = "country";
  panel.appendChild(countryField.label);
  panel.appendChild(countryField.select);

  const budgetField = labeledSelect("filter-budget", "Daily budget (per person)", BUDGET_OPTIONS);
  budgetField.select.dataset.filter = "maxBudget";
  panel.appendChild(budgetField.label);
  panel.appendChild(budgetField.select);

  const seasonField = labeledSelect(
    "filter-season",
    "Best season",
    [{ value: "", label: "Any season" }, ...SEASONS.map((s) => ({ value: s, label: s }))]
  );
  seasonField.select.dataset.filter = "season";
  panel.appendChild(seasonField.label);
  panel.appendChild(seasonField.select);

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "btn btn--secondary btn--small";
  clear.dataset.action = "clear-filters";
  clear.textContent = "Clear all filters";
  panel.appendChild(clear);

  if (options.filters) syncFilterPanel(panel, options.filters);

  panel.addEventListener("change", () => {
    panel.dispatchEvent(
      new CustomEvent("filters-change", { detail: { filters: readFilterPanel(panel) }, bubbles: true })
    );
  });

  return panel;
}
