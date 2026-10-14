/**
 * drag-drop.js — native HTML Drag & Drop wiring (delegated, bound once).
 *
 * Rules: a drag starts ONLY from a [data-drag-handle]; the drop target is
 * the nearest [data-activity-id] card (insert before/after by pointer Y)
 * or the [data-drop-list] itself (append). The actual reorder always goes
 * through onMove → the shared reorderDayFlow (same op as the buttons).
 * Failed persistence restores by re-render (entry re-renders from state).
 */

/**
 * Pure helper: insertion index from pointer position over a card.
 * @param {number} itemCount cards in the day
 * @param {number} overIndex index of the card under the pointer
 * @param {boolean} after true when pointer is in the card's lower half
 */
export function calcInsertIndex(itemCount, overIndex, after) {
  if (!Number.isInteger(itemCount) || itemCount <= 0) return 0;
  const base = Math.min(Math.max(0, overIndex), itemCount - 1);
  return after ? base + 1 : base;
}

function clearIndicators(root) {
  for (const n of root.querySelectorAll(".drop-before, .drop-after, .dragging")) {
    n.classList.remove("drop-before", "drop-after", "dragging");
  }
}

/**
 * Bind delegated DnD listeners once on a stable root.
 * @param {ParentNode} root
 * @param {{ onMove: (activeId: string, toIndex: number) => void }} handlers
 */
export function initDragDrop(root, { onMove } = {}) {
  let activeId = null;

  root.addEventListener("dragstart", (e) => {
    const card = e.target instanceof Element ? e.target.closest("[data-activity-id]") : null;
    const fromHandle = e.target instanceof Element && e.target.closest("[data-drag-handle]");
    if (!card || !fromHandle || !card.dataset.activityId) {
      e.preventDefault(); // dragging from anywhere but the handle is disabled
      return;
    }
    activeId = card.dataset.activityId;
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", activeId);
    } catch {
      /* some browsers restrict dataTransfer */
    }
    requestAnimationFrame(() => card.classList.add("dragging"));
  });

  root.addEventListener("dragover", (e) => {
    if (!activeId) return;
    const list = e.target instanceof Element ? e.target.closest("[data-drop-list]") : null;
    if (!list) return;
    e.preventDefault(); // allow drop
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {
      /* ignore */
    }
    clearIndicators(root);
    const over = e.target instanceof Element ? e.target.closest("[data-activity-id]") : null;
    if (over && over.dataset.activityId !== activeId) {
      const rect = over.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      over.classList.add(after ? "drop-after" : "drop-before");
    } else {
      list.classList.add("drop-after");
    }
  });

  root.addEventListener("drop", (e) => {
    if (!activeId) return;
    const list = e.target instanceof Element ? e.target.closest("[data-drop-list]") : null;
    if (!list) {
      activeId = null;
      return;
    }
    e.preventDefault();
    const allCards = [...list.querySelectorAll("[data-activity-id]")];
    const cards = allCards.filter((c) => c.dataset.activityId !== activeId);
    const over = e.target instanceof Element ? e.target.closest("[data-activity-id]") : null;
    let toIndex = cards.length; // append (drop on empty space / list)
    if (over && over.dataset.activityId === activeId) {
      toIndex = allCards.findIndex((c) => c.dataset.activityId === activeId); // self-drop: no-op
    } else if (over) {
      const rect = over.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      const overPos = cards.findIndex((c) => c.dataset.activityId === over.dataset.activityId);
      toIndex = calcInsertIndex(cards.length + 1, overPos === -1 ? cards.length : overPos, after);
      // toIndex is in post-removal coordinates; clamp to day length - 1 range handled by reorder op
      if (toIndex > cards.length) toIndex = cards.length;
    }
    const id = activeId;
    activeId = null;
    clearIndicators(root);
    onMove?.(id, toIndex);
  });

  root.addEventListener("dragend", () => {
    activeId = null;
    clearIndicators(root);
  });
}
