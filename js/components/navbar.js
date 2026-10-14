/**
 * navbar.js — brand, anchor links, theme toggle, CTA, mobile menu button.
 * Open/close behavior lives in modules/landing/landing-navigation.js.
 */
import { el } from "../utils/dom-utils.js";

export const NAV_LINKS = Object.freeze([
  { href: "#home", label: "Home" },
  { href: "#destinations", label: "Destinations" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#testimonials", label: "Testimonials" },
]);

export function createNavbar({ ctaHref = "../trips/trips.html" } = {}) {
  const header = el("header", "site-nav");
  const inner = el("div", "site-nav__inner");

  const brand = el("a", "site-nav__brand");
  brand.href = "#home";
  const mark = el("span", "site-nav__mark");
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "✈";
  const word = el("span", "site-nav__word", "YatraStorizz");
  brand.appendChild(mark);
  brand.appendChild(word);

  const nav = document.createElement("nav");
  nav.className = "site-nav__links";
  nav.setAttribute("aria-label", "Sections");
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

  const actions = el("div", "site-nav__actions");
  const theme = el("button", "btn btn--ghost btn--small", "◐ Theme");
  theme.type = "button";
  theme.dataset.action = "theme-toggle";
  theme.setAttribute("aria-label", "Toggle colour theme");
  const cta = el("a", "btn btn--primary btn--small", "Plan Your Trip");
  cta.href = ctaHref;
  const menu = el("button", "site-nav__menu-btn", "☰");
  menu.type = "button";
  menu.setAttribute("aria-label", "Open menu");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-controls", "mobile-menu");
  menu.dataset.action = "menu-toggle";
  actions.appendChild(theme);
  actions.appendChild(cta);
  actions.appendChild(menu);

  inner.appendChild(brand);
  inner.appendChild(nav);
  inner.appendChild(actions);
  header.appendChild(inner);

  const panel = el("div", "mobile-menu");
  panel.id = "mobile-menu";
  panel.hidden = true;
  const panelNav = document.createElement("nav");
  panelNav.setAttribute("aria-label", "Sections (mobile)");
  const pul = el("ul");
  for (const link of NAV_LINKS) {
    const li = el("li");
    const a = el("a", null, link.label);
    a.href = link.href;
    li.appendChild(a);
    pul.appendChild(li);
  }
  const pcta = el("a", "btn btn--primary", "Plan Your Trip");
  pcta.href = ctaHref;
  panelNav.appendChild(pul);
  panelNav.appendChild(pcta);
  panel.appendChild(panelNav);

  return { header, panel, menuButton: menu };
}
