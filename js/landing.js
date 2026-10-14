/**
 * landing.js — entry point. Initializes theme first (the <head> snippet
 * already set it pre-paint; this confirms + wires persistence), then
 * mounts every section module. Coordination only.
 */
import { resolveTheme, applyTheme } from "./services/preferences-service.js";
import { createNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { initLandingNavigation } from "./modules/landing/landing-navigation.js";
import { initHero } from "./modules/landing/hero.js";
import { initDestinationShowcase } from "./modules/landing/destination-showcase.js";
import { initFeaturesShowcase } from "./modules/landing/features-showcase.js";
import { initHowItWorks } from "./modules/landing/how-it-works.js";
import { initTestimonials } from "./modules/landing/testimonials.js";
import { initNewsletter } from "./modules/landing/newsletter.js";
import { qs } from "./utils/dom-utils.js";

function init() {
  applyTheme(resolveTheme());

  const navMount = qs(document, "#nav-mount");
  if (navMount) {
    const { header, panel, menuButton } = createNavbar({ ctaHref: "../trips/trips.html" });
    navMount.appendChild(header);
    navMount.appendChild(panel);
    initLandingNavigation({ header, panel, menuButton });
  }

  initHero();
  initDestinationShowcase();
  initFeaturesShowcase();
  initHowItWorks();
  initTestimonials();
  initNewsletter();
  renderFooter(qs(document, "#footer-mount"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
