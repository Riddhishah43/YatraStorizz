/**
 * landing-navigation.js — mobile menu, smooth anchors, theme toggle,
 * current-section highlight. Idempotent; guards missing browser APIs
 * (IntersectionObserver) so it degrades cleanly.
 */
import { resolveTheme, setThemePreference, applyTheme } from "../../services/preferences-service.js";
import { qs, qsAll } from "../../utils/dom-utils.js";

export function initLandingNavigation({ header, panel, menuButton }) {
  if (!header || !panel || !menuButton) return () => {};

  const cleanups = [];
  const listen = (node, event, fn) => {
    node.addEventListener(event, fn);
    cleanups.push(() => node.removeEventListener(event, fn));
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuButton.textContent = open ? "✕" : "☰";
    document.body.style.overflow = open ? "hidden" : "";
    if (open) qs(panel, "a")?.focus();
  };
  const isOpen = () => !panel.hidden;

  listen(menuButton, "click", () => setOpen(!isOpen()));
  listen(document, "keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      setOpen(false);
      menuButton.focus();
    }
  });
  listen(panel, "click", (e) => {
    if (e.target.closest("a")) setOpen(false); // close after selection
  });

  // Theme toggle (delegated: navbar button carries data-action).
  listen(document, "click", (e) => {
    const t = e.target.closest?.('[data-action="theme-toggle"]');
    if (!t) return;
    const next = (resolveTheme() === "dark" ? "light" : "dark");
    applyTheme(next);
    if (!setThemePreference(next)) {
      // persistence failed — theme still applied for this session
    }
  });

  // Current-section indicator (progressive enhancement).
  try {
    if ("IntersectionObserver" in window) {
      const links = new Map(qsAll(document, "[data-nav-link]").map((a) => [a.dataset.navLink.slice(1), a]));
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            for (const a of links.values()) a.removeAttribute("aria-current");
            links.get(entry.target.id)?.setAttribute("aria-current", "true");
          }
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      for (const id of links.keys()) {
        const section = document.getElementById(id);
        if (section) io.observe(section);
      }
      cleanups.push(() => io.disconnect());
    }
  } catch {
    /* highlight is decorative; never break navigation */
  }

  return () => {
    cleanups.forEach((fn) => fn());
    document.body.style.overflow = "";
  };
}
