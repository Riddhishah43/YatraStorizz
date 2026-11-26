/**
 * features-showcase.js — six core capabilities of YaatraStorizz (Prompt 6).
 * All link directly to real module routes.
 */
import { renderFeatureCards } from "../../components/feature-card.js";
import { qs } from "../../utils/dom-utils.js";

export const FEATURES = Object.freeze([
  {
    iconSrc: "../assets/icons/compass.svg",
    icon: "🧭",
    title: "Destination Discovery",
    text: "Explore destinations and find places that match your interests.",
    href: "../discover/discover.html",
    linkLabel: "Explore destinations →",
  },
  {
    iconSrc: "../assets/icons/calendar.svg",
    icon: "🗓",
    title: "Smart Trip Planning",
    text: "Create trips, manage travel dates and organize destination details.",
    href: "../trips/trips.html",
    linkLabel: "Create a trip →",
  },
  {
    iconSrc: "../assets/icons/route.svg",
    icon: "🗺",
    title: "Multi-Day Itinerary",
    text: "Plan activities day by day and organize your travel schedule.",
    href: "../itinerary/trip-details.html",
    linkLabel: "View itinerary →",
  },
  {
    iconSrc: "../assets/icons/wallet.svg",
    icon: "💰",
    title: "Budget Management",
    text: "Set trip budgets, estimate expenses and track your spending.",
    href: "../budget/budget.html",
    linkLabel: "Manage budget →",
  },
  {
    iconSrc: "../assets/icons/suitcase.svg",
    icon: "🧳",
    title: "Activity Organization",
    text: "Manage activities, travel experiences and important trip details.",
    href: "../trips/trips.html",
    linkLabel: "Organize activities →",
  },
  {
    iconSrc: "../assets/icons/sparkles.svg",
    icon: "✦",
    title: "Trip Overview",
    text: "Keep your upcoming journeys and important trip information organized.",
    href: "../dashboard/dashboard.html",
    linkLabel: "Open dashboard →",
  },
]);

export function initFeaturesShowcase(root = document) {
  const mount = qs(root, "#features-grid");
  if (!mount) return 0;
  return renderFeatureCards(mount, FEATURES);
}
