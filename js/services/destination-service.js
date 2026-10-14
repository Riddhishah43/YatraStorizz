/**
 * destination-service.js — single read interface for landing destinations.
 * Local dataset today; swap the loader for an API later without touching UI.
 */
import { destinations } from "../data/destinations-data.js";

function valid(d) {
  return d && typeof d === "object" && typeof d.id === "string" && d.id && typeof d.name === "string" && d.name.trim();
}

/** All valid destinations (fresh copies). */
export function getDestinations() {
  return destinations.filter(valid).map((d) => ({ ...d }));
}

/** One destination by id, or null. */
export function getDestinationById(id) {
  if (typeof id !== "string" || !id) return null;
  const found = destinations.find((d) => valid(d) && d.id === id);
  return found ? { ...found } : null;
}
