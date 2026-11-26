/**
 * footer.js — brand, multi-column navigation, social links, dynamic year & Back-to-Top (Prompt 10).
 * Semantic HTML, pure DOM, zero-XSS.
 */
import { el, clear } from "../utils/dom-utils.js";

export function createFooter(config = {}) {
  const footer = document.createElement("footer");
  footer.className = "site-footer";

  const inner = el("div", "site-footer__inner");

  // Brand Column
  const brand = el("div", "site-footer__brand");
  const brandTitle = el("p", "site-footer__word", "✈ YaatraStorizz");
  const brandDesc = el(
    "p",
    "site-footer__tag",
    "Plan better journeys, discover new places and turn every trip into a story."
  );
  brand.appendChild(brandTitle);
  brand.appendChild(brandDesc);
  inner.appendChild(brand);

  // Link Columns
  const cols = el("div", "site-footer__cols");

  // 1. Explore Column
  cols.appendChild(
    linkColumn("Explore", [
      { label: "Discover Destinations", href: "../discover/discover.html" },
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Travel Inspiration", href: "#inspiration" },
    ])
  );

  // 2. Plan Your Journey Column
  cols.appendChild(
    linkColumn("Plan Your Journey", [
      { label: "Create a Trip", href: "../trips/trips.html" },
      { label: "My Trips", href: "../trips/trips.html" },
      { label: "Budget Planner", href: "../budget/budget.html" },
      { label: "Dashboard", href: "../dashboard/dashboard.html" },
      { label: "Profile & Settings", href: "../profile/profile.html" },
    ])
  );

  // 3. Company Column
  cols.appendChild(
    linkColumn("Company", [
      { label: "About Us", href: "#testimonials" },
      { label: "Contact", href: "mailto:support@yaatrastorizz.demo" },
      { label: "Privacy Policy", href: "#home" },
      { label: "Terms & Conditions", href: "#home" },
    ])
  );

  // 4. Social Links (clean and valid)
  const socialLinks = Array.isArray(config.socialLinks) && config.socialLinks.length
    ? config.socialLinks
    : [
        { label: "Instagram", href: "https://instagram.com" },
        { label: "LinkedIn", href: "https://linkedin.com" },
        { label: "GitHub", href: "https://github.com" },
      ];
  cols.appendChild(linkColumn("Social", socialLinks));

  inner.appendChild(cols);
  footer.appendChild(inner);

  // Bottom Bar: Dynamic Copyright & Back-to-Top
  const base = el("div", "site-footer__base");
  const year = new Date().getFullYear();
  const copy = el("p", "site-footer__copy", `© ${year} YaatraStorizz. All rights reserved.`);

  const backToTop = el("a", "site-footer__top", "Back to top ↑");
  backToTop.href = "#home";
  backToTop.setAttribute("aria-label", "Scroll back to the top of the page");

  base.appendChild(copy);
  base.appendChild(backToTop);
  footer.appendChild(base);

  return footer;
}

function linkColumn(title, links) {
  const col = el("div", "site-footer__col");
  col.appendChild(el("p", "site-footer__col-title", title));
  const ul = el("ul");
  for (const l of links) {
    if (!l || !l.href || !l.label) continue;
    const li = el("li");
    const a = el("a", null, l.label);
    a.href = l.href;
    if (l.href.startsWith("http")) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
    li.appendChild(a);
    ul.appendChild(li);
  }
  col.appendChild(ul);
  return col;
}

export function renderFooter(mount, config) {
  if (!mount) return;
  clear(mount);
  mount.appendChild(createFooter(config));
}
