/**
 * destination-showcase.js — loads the dataset and paints the grid.
 * Data stays in js/data; cards come from the reusable component.
 */
import { getDestinations } from "../../services/destination-service.js";
import { renderDestinationCards } from "../../components/destination-card.js";
import { qs } from "../../utils/dom-utils.js";

/** @returns {number} rendered count */
export function initDestinationShowcase(root = document) {
  const mount = qs(root, "#showcase-grid");
  if (!mount) return 0;
  return renderDestinationCards(mount, getDestinations());
}
