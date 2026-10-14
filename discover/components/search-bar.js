/**
 * search-bar.js — reusable search input.
 * Communicates outward ONLY via the bubbling "search-change" CustomEvent
 * (detail: { query }). Never touches the grid.
 *
 * @example
 * mount.addEventListener("search-change", (e) => applyQuery(e.detail.query));
 */

/**
 * @param {{ value?: string, placeholder?: string }} [options]
 * @returns {{ element: HTMLElement, setQuery: (q: string) => void, getQuery: () => string }}
 */
export function createSearchBar(options = {}) {
  const wrap = document.createElement("div");
  wrap.className = "search-bar";

  const label = document.createElement("label");
  label.className = "visually-hidden";
  label.textContent = "Search destinations";
  const inputId = `dest-search-${Math.random().toString(36).slice(2, 8)}`;
  label.setAttribute("for", inputId);

  const icon = document.createElement("span");
  icon.className = "search-bar__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "⌕";

  const input = document.createElement("input");
  input.type = "search";
  input.id = inputId;
  input.className = "search-bar__input";
  input.placeholder = options.placeholder ?? "Search by name, country, category, or keyword…";
  input.autocomplete = "off";
  if (typeof options.value === "string") input.value = options.value;

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "search-bar__clear";
  clear.dataset.action = "clear-search";
  clear.setAttribute("aria-label", "Clear search");
  clear.textContent = "✕";
  const syncClear = () => {
    clear.hidden = input.value === "";
  };
  syncClear();

  const emit = () => {
    syncClear();
    wrap.dispatchEvent(
      new CustomEvent("search-change", { detail: { query: input.value }, bubbles: true })
    );
  };

  input.addEventListener("input", emit);
  clear.addEventListener("click", () => {
    input.value = "";
    input.focus();
    emit();
  });

  wrap.appendChild(label);
  wrap.appendChild(icon);
  wrap.appendChild(input);
  wrap.appendChild(clear);

  return {
    element: wrap,
    getQuery: () => input.value,
    setQuery: (q) => {
      input.value = typeof q === "string" ? q : "";
      syncClear();
    },
  };
}
