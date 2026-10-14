/**
 * preferences-service.js — theme + display preferences.
 * Shared key "yatrastorizz.theme" with the app modules. Malformed or
 * unavailable storage degrades to "system" (follows the OS).
 */

export const THEME_KEY = "yatrastorizz.theme";
export const NEWSLETTER_DEMO_KEY = "yatrastorizz.newsletter.demo";

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getThemePreference() {
  const raw = storage()?.getItem(THEME_KEY);
  return raw === "light" || raw === "dark" ? raw : "system";
}

/** Persist explicit choice. Returns false when storage is unavailable. */
export function setThemePreference(theme) {
  if (theme !== "light" && theme !== "dark") return false;
  try {
    storage()?.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

export function systemPrefersDark() {
  try {
    return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

/** Resolve the effective theme: explicit choice, else system. */
export function resolveTheme() {
  const pref = getThemePreference();
  if (pref === "light" || pref === "dark") return pref;
  return systemPrefersDark() ? "dark" : "light";
}

export function applyTheme(theme) {
  try {
    document.documentElement.dataset.theme = theme;
  } catch {
    /* non-DOM environment (tests import pure paths only) */
  }
}
