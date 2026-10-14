/**
 * activity-summary.js — reusable recent-activity feed.
 * Accepts activity data, returns an element. Sorts a copy
 * most-recent-first; renders an empty state when there is nothing to show.
 */

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function parseTime(v) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d?.getTime?.()) ? null : d;
}

function activityLabel(type) {
  const map = {
    trip_created: "Trip created",
    destination_added: "Destination added",
    itinerary_updated: "Itinerary updated",
    budget_modified: "Budget modified",
    trip_completed: "Trip completed",
  };
  return map[type] ?? "Activity";
}

/**
 * @param {unknown} activities
 * @param {{ limit?: number }} [options]
 * @returns {HTMLElement}
 */
export function createActivitySummary(activities, options = {}) {
  const { limit = 5 } = options;
  const wrap = document.createElement("div");
  wrap.className = "activity";

  const list = Array.isArray(activities) ? [...activities] : [];
  list.sort((a, b) => {
    const ta = parseTime(a?.timestamp);
    const tb = parseTime(b?.timestamp);
    return (tb?.getTime() ?? 0) - (ta?.getTime() ?? 0);
  });
  const n = Number.isFinite(Number(limit)) ? Math.max(0, Math.floor(Number(limit))) : 5;
  const items = list.slice(0, n);

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No recent activity yet. Plan a trip to get started.";
    wrap.appendChild(empty);
    return wrap;
  }

  const ul = document.createElement("ul");
  ul.className = "activity__list";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "activity__item";

    const badge = document.createElement("span");
    badge.className = "activity__badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = "•";

    const body = document.createElement("div");
    body.className = "activity__body";

    const label = document.createElement("p");
    label.className = "activity__label";
    label.textContent = activityLabel(item?.type);

    const desc = document.createElement("p");
    desc.className = "activity__desc";
    desc.textContent =
      typeof item?.description === "string" && item.description.trim()
        ? item.description.trim()
        : "Activity recorded.";

    const time = document.createElement("time");
    time.className = "activity__time";
    const parsed = parseTime(item?.timestamp);
    if (parsed) {
      time.dateTime = parsed.toISOString();
      time.textContent = timeFmt.format(parsed);
    } else {
      time.textContent = "Unknown time";
    }

    body.appendChild(label);
    body.appendChild(desc);
    body.appendChild(time);
    li.appendChild(badge);
    li.appendChild(body);
    ul.appendChild(li);
  }

  wrap.appendChild(ul);
  return wrap;
}
