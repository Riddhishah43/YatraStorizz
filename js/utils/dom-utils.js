/**
 * dom-utils.js — tiny DOM helpers. No framework, no magic.
 */

/** Create an element with optional class and text (textContent — always safe). */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/** Query one element; null (not a throw) when missing. */
export function qs(root, selector) {
  try {
    return (root ?? document).querySelector(selector);
  } catch {
    return null;
  }
}

/** Query all as a real array. */
export function qsAll(root, selector) {
  try {
    return [...(root ?? document).querySelectorAll(selector)];
  } catch {
    return [];
  }
}

/** Clear all children safely. */
export function clear(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Attach a listener and return a cleanup function. */
export function on(node, event, handler, options) {
  if (!node || typeof handler !== "function") return () => {};
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
