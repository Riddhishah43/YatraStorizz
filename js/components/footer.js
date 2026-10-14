/**
 * footer.js — brand, link columns (real routes only), dynamic year.
 * Social/privacy/terms links render ONLY when configured with real URLs.
 */
import { el, clear } from "../utils/dom-utils.js";

/**
 * @param {{ productLinks?: {label:string,href:string}[], socialLinks?: {label:string,href:string}[], supportEmail?: string|null }} [config]
 */
export function createFooter(config = {}) {
  const footer = document.createElement("footer");
  footer.className = "site-footer";

  const inner = el("div", "site-footer__inner");

  const brand = el("div", "site-footer__brand");
  brand.appendChild(el("p", "site-footer__word", "✈ YatraStorizz"));
  brand.appendChild(
    el("p", "site-footer__tag", "Discover destinations, plan day-by-day itineraries, and track every rupee — in one calm workspace.")
  );
  inner.appendChild(brand);

  const cols = el("div", "site-footer__cols");
  const productLinks = Array.isArray(config.productLinks) && config.productLinks.length
    ? config.productLinks
    : [
        { label: "Discover", href: "../discover/discover.html" },
        { label: "My Trips", href: "../trips/trips.html" },
        { label: "Budget", href: "../budget/budget.html" },
        { label: "Dashboard", href: "../dashboard/dashboard.html" },
      ];
  cols.appendChild(linkColumn("Product", productLinks));
  cols.appendChild(
    linkColumn("Sections", [
      { label: "Destinations", href: "#destinations" },
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
    ])
  );
  if (Array.isArray(config.socialLinks) && config.socialLinks.length) {
    cols.appendChild(linkColumn("Follow", config.socialLinks));
  }
  if (config.supportEmail) {
    const support = el("div", "site-footer__col");
    support.appendChild(el("p", "site-footer__col-title", "Support"));
    const a = el("a", null, config.supportEmail);
    a.href = `mailto:${config.supportEmail}`;
    support.appendChild(a);
    cols.appendChild(support);
  }
  inner.appendChild(cols);

  const base = el("div", "site-footer__base");
  base.appendChild(el("p", null, `© ${new Date().getFullYear()} YatraStorizz. Student demo project.`));
  footer.appendChild(inner);
  footer.appendChild(base);
  return footer;
}

function linkColumn(title, links) {
  const col = el("div", "site-footer__col");
  col.appendChild(el("p", "site-footer__col-title", title));
  const ul = el("ul");
  for (const l of links) {
    if (!l || !l.href || !l.label) continue; // no dead links
    const li = el("li");
    const a = el("a", null, l.label);
    a.href = l.href;
    li.appendChild(a);
    ul.appendChild(li);
  }
  col.appendChild(ul);
  return col;
}

/** Render footer into a mount (replaces fallback content). */
export function renderFooter(mount, config) {
  if (!mount) return;
  clear(mount);
  mount.appendChild(createFooter(config));
}
