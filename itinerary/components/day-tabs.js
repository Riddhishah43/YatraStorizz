/**
 * day-tabs.js — day navigation (presentation only).
 * Reports selection via onSelect callback. Arrow keys move between days.
 */

const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

function formatDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? dateStr : dayFmt.format(dt);
}

/**
 * @param {{ days: {dayNumber:number,date:string}[], selectedDate: string, counts?: Record<string,number>, onSelect?: (date:string)=>void }} options
 * @returns {HTMLElement} nav element
 */
export function createDayTabs({ days = [], selectedDate = "", counts = {}, onSelect } = {}) {
  const nav = document.createElement("nav");
  nav.className = "day-tabs";
  nav.setAttribute("aria-label", "Itinerary days");

  const list = document.createElement("div");
  list.className = "day-tabs__list";
  list.setAttribute("role", "tablist");

  const buttons = [];
  for (const day of days) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-tab" + (day.date === selectedDate ? " day-tab--selected" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", day.date === selectedDate ? "true" : "false");
    btn.dataset.date = day.date;

    const num = document.createElement("span");
    num.className = "day-tab__num";
    num.textContent = `Day ${day.dayNumber}`;
    const date = document.createElement("span");
    date.className = "day-tab__date";
    date.textContent = formatDay(day.date);
    const count = document.createElement("span");
    count.className = "day-tab__count";
    const n = counts[day.date] ?? 0;
    count.textContent = n === 1 ? "1 activity" : `${n} activities`;

    btn.appendChild(num);
    btn.appendChild(date);
    btn.appendChild(count);
    btn.addEventListener("click", () => onSelect?.(day.date));
    buttons.push(btn);
    list.appendChild(btn);
  }

  // Arrow-key navigation between tabs (roving via focus + select).
  list.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = buttons.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    onSelect?.(buttons[next].dataset.date);
  });

  nav.appendChild(list);
  return nav;
}
