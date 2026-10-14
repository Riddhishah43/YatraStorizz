// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getDestinations, getDestinationById } from "../js/services/destination-service.js";
import {
  getThemePreference,
  setThemePreference,
  resolveTheme,
} from "../js/services/preferences-service.js";
import { createDestinationCard, renderDestinationCards, FALLBACK_IMAGE } from "../js/components/destination-card.js";
import { createFeatureCard } from "../js/components/feature-card.js";
import { showToast } from "../js/components/toast.js";
import { createFooter } from "../js/components/footer.js";
import { initLandingNavigation } from "../js/modules/landing/landing-navigation.js";
import { initTestimonials } from "../js/modules/landing/testimonials.js";
import { isValidEmail } from "../js/modules/landing/newsletter.js";
import { el, qs, clear, on } from "../js/utils/dom-utils.js";

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("destination-service", () => {
  it("returns curated records as copies", () => {
    const all = getDestinations();
    expect(all.length).toBeGreaterThanOrEqual(6);
    expect(all[0].id).toBeTruthy();
    all[0].name = "Hacked";
    expect(getDestinations()[0].name).not.toBe("Hacked");
  });
  it("finds by id and nulls unknown ids", () => {
    expect(getDestinationById("kyoto-japan")?.name).toBe("Kyoto");
    expect(getDestinationById("nope")).toBeNull();
    expect(getDestinationById("")).toBeNull();
  });
});

describe("destination-card", () => {
  it("renders structured data with link and badge", () => {
    const card = createDestinationCard({
      id: "x", name: "Kyoto", country: "Japan", region: "Kansai",
      category: "Culture", description: "Temples.", image: "../assets/images/destinations/kyoto.svg",
    });
    expect(card.querySelector("h3")?.textContent).toBe("Kyoto");
    expect(card.querySelector("img")?.alt).toContain("Kyoto");
    expect(card.querySelector("a")?.getAttribute("href")).toContain("discover");
  });
  it("renders user text safely (no HTML injection)", () => {
    const card = createDestinationCard({ id: "x", name: '<script>alert("x")</script>', country: "Japan" });
    // No executable element may exist; property-assigned attributes/text are inert strings.
    expect(card.querySelector("script")).toBeNull();
    expect(card.querySelector("h3")?.textContent).toContain('<script>alert("x")</script>');
  });
  it("falls back on missing or broken images", () => {
    const missing = createDestinationCard({ id: "x", name: "Nowhere", country: "Noland" });
    expect(missing.querySelector("img")?.src).toContain("data:image/svg+xml");
    const broken = createDestinationCard({ id: "y", name: "B", country: "C", image: "https://example.com/404.jpg" });
    const img = broken.querySelector("img");
    img?.dispatchEvent(new Event("error"));
    expect(img?.src).toContain("data:image/svg+xml");
    expect(FALLBACK_IMAGE.startsWith("data:image/svg+xml")).toBe(true);
  });
  it("renders an empty state for empty datasets", () => {
    const mount = document.createElement("div");
    expect(renderDestinationCards(mount, [])).toBe(0);
    expect(mount.textContent).toMatch(/curated/i);
  });
});

describe("feature-card", () => {
  it("renders icon, title, text, and optional link", () => {
    const withLink = createFeatureCard({ icon: "🧭", title: "Discover", text: "Explore.", href: "../discover/discover.html" });
    expect(withLink.querySelector("a")).toBeTruthy();
    const plain = createFeatureCard({ title: "T", text: "x" });
    expect(plain.querySelector("a")).toBeNull();
  });
});

describe("preferences-service", () => {
  it("defaults to system and round-trips explicit choices", () => {
    expect(getThemePreference()).toBe("system");
    expect(setThemePreference("dark")).toBe(true);
    expect(getThemePreference()).toBe("dark");
    expect(["light", "dark"]).toContain(resolveTheme());
  });
  it("rejects invalid values and recovers from corrupt storage", () => {
    expect(setThemePreference("neon")).toBe(false);
    localStorage.setItem("yatrastorizz.theme", "garbage!!");
    expect(getThemePreference()).toBe("system");
  });
});

describe("newsletter validation", () => {
  it("accepts reasonable emails and rejects the rest", () => {
    expect(isValidEmail("you@example.com")).toBe(true);
    expect(isValidEmail("  you@example.com  ")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe("toast", () => {
  it("announces via live region, escapes text, and dismisses", () => {
    const dismiss = showToast('<b>hi</b>', "success", { duration: 0 });
    const region = document.querySelector(".toast-region");
    expect(region?.getAttribute("aria-live")).toBe("polite");
    const toast = region?.querySelector(".toast--success");
    expect(toast?.textContent).toContain("<b>hi</b>");
    expect(toast?.innerHTML).not.toContain("<b>hi</b>");
    dismiss();
    expect(region?.querySelector(".toast")).toBeNull();
  });
  it("defaults unknown types to info", () => {
    showToast("hello", "mystery", { duration: 0 });
    expect(document.querySelector(".toast--info")).toBeTruthy();
  });
});

describe("landing-navigation", () => {
  function build() {
    const header = el("header");
    const panel = el("div");
    panel.id = "mobile-menu";
    panel.hidden = true;
    const btn = document.createElement("button");
    btn.setAttribute("aria-expanded", "false");
    const link = document.createElement("a");
    link.href = "#home";
    link.textContent = "Home";
    panel.appendChild(link);
    document.body.append(header, panel, btn);
    return { header, panel, menuButton: btn, link };
  }
  it("toggles the menu, closes on link and Escape", () => {
    const parts = build();
    initLandingNavigation(parts);
    parts.menuButton.click();
    expect(parts.panel.hidden).toBe(false);
    expect(parts.menuButton.getAttribute("aria-expanded")).toBe("true");
    parts.link.click();
    expect(parts.panel.hidden).toBe(true);
    parts.menuButton.click();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(parts.panel.hidden).toBe(true);
  });
  it("is a no-op with missing parts", () => {
    expect(() => initLandingNavigation({})).not.toThrow();
  });
});

describe("testimonials fallback", () => {
  it("renders the alternative section when no verified testimonials exist", () => {
    const section = el("section");
    section.id = "testimonials";
    const heading = el("h2", null, "Testimonials");
    heading.setAttribute("data-testimonials-heading", "");
    const sub = el("p");
    sub.setAttribute("data-testimonials-sub", "");
    const mount = el("div");
    mount.id = "testimonials-mount";
    section.append(heading, sub, mount);
    document.body.appendChild(section);
    expect(initTestimonials()).toBe("alternative");
    expect(heading.textContent).toBe("Designed for Every Kind of Trip");
    expect(mount.querySelectorAll(".trip-style-card").length).toBe(4);
    expect(mount.textContent).not.toMatch(/5 stars|★★★★★/);
  });
});

describe("footer", () => {
  it("uses the current year and only configured links", () => {
    const footer = createFooter({});
    expect(footer.textContent).toContain(String(new Date().getFullYear()));
    expect(footer.querySelectorAll("a[href]").length).toBeGreaterThan(0);
    expect(footer.textContent).not.toMatch(/twitter\.com|facebook\.com/);
  });
});

describe("dom-utils", () => {
  it("creates safe elements and cleans up listeners", () => {
    const node = el("p", "x", "<b>safe</b>");
    expect(node.innerHTML).not.toContain("<b>");
    expect(qs(document, ".missing")).toBeNull();
    const host = el("div");
    host.appendChild(el("span"));
    clear(host);
    expect(host.children.length).toBe(0);
    let n = 0;
    const off = on(host, "click", () => (n += 1));
    host.dispatchEvent(new Event("click"));
    off();
    host.dispatchEvent(new Event("click"));
    expect(n).toBe(1);
  });
});
