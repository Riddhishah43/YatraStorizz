/**
 * features-showcase.js — the six core capabilities, rendered from data.
 * Every link points at a REAL module route (Discover/Trips/Budget/
 * Dashboard, or the Itinerary page which guides without a trip).
 */
import { renderFeatureCards } from "../../components/feature-card.js";
import { qs } from "../../utils/dom-utils.js";

export const FEATURES = Object.freeze([
  {
    iconSrc: "../assets/icons/compass.svg",
    icon: "🧭",
    title: "Discover Destinations",
    text: "Explore curated places and find inspiration for your next trip.",
    href: "../discover/discover.html",
    linkLabel: "Open Discover →",
  },
  {
    iconSrc: "../assets/icons/calendar.svg",
    icon: "🗓",
    title: "Plan Multi-Day Trips",
    text: "Organize destinations and travel dates in one calm workspace.",
    href: "../trips/trips.html",
    linkLabel: "Manage trips →",
  },
  {
    iconSrc: "../assets/icons/route.svg",
    icon: "🗺",
    title: "Build Smart Itineraries",
    text: "Arrange activities into a day-by-day plan with times and costs.",
    href: "../itinerary/trip-details.html",
    linkLabel: "See how it works →",
  },
  {
    iconSrc: "../assets/icons/wallet.svg",
    icon: "💰",
    title: "Track Travel Budgets",
    text: "Record expenses and watch your remaining funds update live.",
    href: "../budget/budget.html",
    linkLabel: "Open Budget →",
  },
  {
    iconSrc: "../assets/icons/suitcase.svg",
    icon: "🧳",
    title: "Manage Every Trip",
    text: "Keep trip details, statuses, and notes organized in one place.",
    href: "../trips/trips.html",
    linkLabel: "Manage trips →",
  },
  {
    iconSrc: "../assets/icons/sparkles.svg",
    icon: "✦",
    title: "Travel with Clarity",
    text: "Review upcoming journeys, budgets, and plans on one dashboard.",
    href: "../dashboard/dashboard.html",
    linkLabel: "Open Dashboard →",
  },
]);

/** @returns {number} rendered count */
export function initFeaturesShowcase(root = document) {
  const mount = qs(root, "#features-grid");
  if (!mount) return 0;
  return renderFeatureCards(mount, FEATURES);
}
