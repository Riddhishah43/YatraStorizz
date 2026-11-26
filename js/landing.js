/**
 * landing.js — composition root for the YaatraStorizz landing page.
 * Boots theme, clears mount points, mounts all sections, and coordinates navigation.
 */
import { resolveTheme, applyTheme } from "./services/preferences-service.js";
import { createNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { initLandingNavigation } from "./modules/landing/landing-navigation.js";
import { initHero } from "./modules/landing/hero.js";
import { initDestinationShowcase } from "./modules/landing/destination-showcase.js";
import { initInspiration } from "./modules/landing/inspiration.js";
import { initFeaturesShowcase } from "./modules/landing/features-showcase.js";
import { initHowItWorks } from "./modules/landing/how-it-works.js";
import { initTestimonials } from "./modules/landing/testimonials.js";
import { initNewsletter } from "./modules/landing/newsletter.js";
import { createAuthModal } from "./components/auth-modal.js";
import { authService } from "./services/auth-service.js";
import { showToast } from "./components/toast.js";
import { qs, clear } from "./utils/dom-utils.js";

function init() {
  applyTheme(resolveTheme());

  let cleanupNav = null;
  const renderNav = () => {
    if (typeof cleanupNav === "function") cleanupNav();
    const navMount = qs(document, "#nav-mount");
    if (navMount) {
      clear(navMount);
      const { header, panel, menuButton } = createNavbar({
        loginHref: "../dashboard/dashboard.html",
        ctaHref: "../trips/trips.html",
      });
      navMount.appendChild(header);
      navMount.appendChild(panel);
      cleanupNav = initLandingNavigation({ header, panel, menuButton });
    }
  };

  // Mount Navbar (clearing any static fallback to prevent double headers)
  renderNav();

  // Mount Authentication Modal (Sign In, First-Time Sign Up, Demo Account)
  const authModal = createAuthModal({
    onAuthenticated: (user) => {
      showToast(`Welcome, ${user.name}!`, "success");
      renderNav();
    },
  });
  document.body.appendChild(authModal.element);

  // Global delegation for auth triggers on landing page
  document.addEventListener("click", (e) => {
    const loginBtn = e.target.closest?.('[data-action="open-login"]');
    if (loginBtn) {
      authModal.open("signin");
      return;
    }
    const signupBtn = e.target.closest?.('[data-action="open-signup"]');
    if (signupBtn) {
      authModal.open("signup");
      return;
    }
    const logoutBtn = e.target.closest?.('[data-action="logout"]');
    if (logoutBtn) {
      authService.logout();
      showToast("Signed out successfully.", "info");
      renderNav();
      return;
    }
  });

  // Mount each section
  initHero();
  initDestinationShowcase();
  initInspiration();
  initFeaturesShowcase();
  initHowItWorks();
  initTestimonials();
  initNewsletter();

  // Mount Footer
  renderFooter(qs(document, "#footer-mount"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
