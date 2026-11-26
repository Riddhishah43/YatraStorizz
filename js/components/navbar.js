/**
 * navbar.js — brand, anchor links, theme toggle, Log In, Get Started CTA, and mobile drawer.
 * Follows Prompt 2 requirements.
 */
import { el } from "../utils/dom-utils.js";
import { authService } from "../services/auth-service.js";

export const NAV_LINKS = Object.freeze([
  { href: "#home", label: "Home" },
  { href: "#destinations", label: "Explore" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#testimonials", label: "About" },
]);

export function createNavbar({
  loginHref = "../dashboard/dashboard.html",
  ctaHref = "../trips/trips.html",
} = {}) {
  const header = el("header", "site-nav");
  const inner = el("div", "site-nav__inner");

  // Brand
  const brand = el("a", "site-nav__brand");
  brand.href = "#home";
  brand.setAttribute("aria-label", "YaatraStorizz Home");
  const mark = el("span", "site-nav__mark", "✈");
  mark.setAttribute("aria-hidden", "true");
  const word = el("span", "site-nav__word", "YaatraStorizz");
  brand.appendChild(mark);
  brand.appendChild(word);

  // Center navigation
  const nav = document.createElement("nav");
  nav.className = "site-nav__links";
  nav.setAttribute("aria-label", "Primary");
  const ul = el("ul");
  for (const link of NAV_LINKS) {
    const li = el("li");
    const a = el("a", null, link.label);
    a.href = link.href;
    a.dataset.navLink = link.href;
    li.appendChild(a);
    ul.appendChild(li);
  }
  nav.appendChild(ul);

  // Right side actions: Theme toggle, Sign In / Log Out, Avatar, Mobile menu toggle
  const actions = el("div", "site-nav__actions");

  const theme = el("button", "btn btn--ghost btn--small", "◐ Theme");
  theme.type = "button";
  theme.dataset.action = "theme-toggle";
  theme.setAttribute("aria-label", "Toggle colour theme");
  actions.appendChild(theme);

  const session = authService.getSession();

  if (session.isAuthenticated && session.user) {
    const dashLink = el("a", "link-btn site-nav__dash", "Dashboard");
    dashLink.href = loginHref;

    const avatar = el("a", "avatar", session.user.avatar || "YS");
    avatar.href = "../profile/profile.html";
    avatar.setAttribute("aria-label", `${session.user.name}'s Profile`);

    const logoutBtn = el("button", "btn btn--ghost btn--small", "Log Out");
    logoutBtn.type = "button";
    logoutBtn.dataset.action = "logout";
    logoutBtn.setAttribute("aria-label", "Log out of session");

    actions.appendChild(dashLink);
    actions.appendChild(avatar);
    actions.appendChild(logoutBtn);
  } else {
    const login = el("button", "link-btn site-nav__login", "Sign In");
    login.type = "button";
    login.dataset.action = "open-login";
    login.setAttribute("aria-label", "Sign In or use Demo Account");

    const cta = el("button", "btn btn--primary btn--small", "Get Started");
    cta.type = "button";
    cta.dataset.action = "open-signup";
    cta.setAttribute("aria-label", "Get Started with YaatraStorizz");

    actions.appendChild(login);
    actions.appendChild(cta);
  }

  const menu = el("button", "site-nav__menu-btn", "☰");
  menu.type = "button";
  menu.setAttribute("aria-label", "Open navigation menu");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-controls", "mobile-menu");
  menu.dataset.action = "menu-toggle";
  actions.appendChild(menu);

  inner.appendChild(brand);
  inner.appendChild(nav);
  inner.appendChild(actions);
  header.appendChild(inner);

  // Mobile drawer panel
  const panel = el("div", "mobile-menu");
  panel.id = "mobile-menu";
  panel.hidden = true;
  const panelNav = document.createElement("nav");
  panelNav.setAttribute("aria-label", "Mobile Navigation");
  const pul = el("ul");
  for (const link of NAV_LINKS) {
    const li = el("li");
    const a = el("a", null, link.label);
    a.href = link.href;
    li.appendChild(a);
    pul.appendChild(li);
  }
  panelNav.appendChild(pul);

  const panelActions = el("div", "mobile-menu__actions");
  if (session.isAuthenticated && session.user) {
    const pdash = el("a", "btn btn--secondary", "Dashboard");
    pdash.href = loginHref;
    const plogout = el("button", "btn btn--ghost btn--danger", "Log Out");
    plogout.type = "button";
    plogout.dataset.action = "logout";
    panelActions.appendChild(pdash);
    panelActions.appendChild(plogout);
  } else {
    const plogin = el("button", "btn btn--secondary", "Sign In / Demo");
    plogin.type = "button";
    plogin.dataset.action = "open-login";
    const pcta = el("button", "btn btn--primary", "Create Account");
    pcta.type = "button";
    pcta.dataset.action = "open-signup";
    panelActions.appendChild(plogin);
    panelActions.appendChild(pcta);
  }
  panelNav.appendChild(panelActions);
  panel.appendChild(panelNav);

  return { header, panel, menuButton: menu };
}
