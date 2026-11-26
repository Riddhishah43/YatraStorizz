/**
 * profile-service.js — user profile, preferences, and data backup layer.
 * Zero-framework, pure JS ES module with storage adapter support.
 */

export const PROFILE_STORAGE_KEY = "yatrastorizz.profile.v1";

export const DEFAULT_PROFILE = Object.freeze({
  name: "Riddhi Sen",
  email: "riddhi@yaatrastorizz.demo",
  bio: "Solo backpacker, culture enthusiast, and mindful traveller.",
  homeCity: "Mumbai, India",
  currency: "INR",
  distanceUnit: "km",
  preferredCategories: ["Mountains", "Heritage", "Beaches"],
  theme: "system",
});

export const SUPPORTED_CURRENCIES = Object.freeze([
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" },
]);

export const TRAVEL_CATEGORIES = Object.freeze([
  "Mountains",
  "Beaches",
  "Heritage",
  "Adventure",
  "Cities",
  "Nature",
  "Culinary",
]);

/**
 * Extract 1-2 letter uppercase initials from a name string.
 * Falls back to "YS" if empty.
 */
export function getInitials(name) {
  if (typeof name !== "string" || !name.trim()) return "YS";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Validate profile input fields. Returns { valid, errors, value }.
 */
export function validateProfile(input = {}) {
  const errors = {};
  const data = typeof input === "object" && input !== null ? input : {};

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 60) {
    errors.name = "Name must be 60 characters or less.";
  }

  const email = typeof data.email === "string" ? data.email.trim() : "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const currency = typeof data.currency === "string" ? data.currency.trim().toUpperCase() : "INR";
  const validCurrencies = SUPPORTED_CURRENCIES.map((c) => c.code);
  if (!validCurrencies.includes(currency)) {
    errors.currency = `Currency must be one of: ${validCurrencies.join(", ")}`;
  }

  const distanceUnit = data.distanceUnit === "mi" ? "mi" : "km";

  const preferredCategories = Array.isArray(data.preferredCategories)
    ? data.preferredCategories.filter((c) => TRAVEL_CATEGORIES.includes(c))
    : [...DEFAULT_PROFILE.preferredCategories];

  const bio = typeof data.bio === "string" ? data.bio.trim().slice(0, 250) : "";
  const homeCity = typeof data.homeCity === "string" ? data.homeCity.trim().slice(0, 80) : "";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      name,
      email,
      bio,
      homeCity,
      currency,
      distanceUnit,
      preferredCategories,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Storage adapter factory for profile persistence.
 */
export function createProfileService({
  storageKey = PROFILE_STORAGE_KEY,
  getStorage = () => (typeof localStorage !== "undefined" ? localStorage : null),
} = {}) {
  return {
    getProfile() {
      try {
        const raw = getStorage()?.getItem(storageKey);
        if (!raw) return { ...DEFAULT_PROFILE };
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_PROFILE, ...parsed };
        }
      } catch {
        /* fallback to defaults */
      }
      return { ...DEFAULT_PROFILE };
    },

    saveProfile(data) {
      const { valid, errors, value } = validateProfile(data);
      if (!valid) return { ok: false, errors };
      try {
        getStorage()?.setItem(storageKey, JSON.stringify(value));
        return { ok: true, profile: value };
      } catch {
        return { ok: false, error: "storage-unavailable" };
      }
    },

    exportBackup() {
      const s = getStorage();
      if (!s) return null;
      const backup = {
        meta: {
          app: "YaatraStorizz",
          version: "1.0.0",
          exportedAt: new Date().toISOString(),
        },
        data: {},
      };
      const keys = [
        "yatrastorizz.trips.v1",
        "yatrastorizz.budgets.v1",
        "yatrastorizz.itineraries.v1",
        "yatrastorizz.favorites.v1",
        PROFILE_STORAGE_KEY,
        "yatrastorizz.theme",
      ];
      for (const k of keys) {
        const val = s.getItem(k);
        if (val !== null) {
          try {
            backup.data[k] = JSON.parse(val);
          } catch {
            backup.data[k] = val;
          }
        }
      }
      return backup;
    },

    importBackup(jsonString) {
      if (typeof jsonString !== "string" || !jsonString.trim()) {
        return { ok: false, error: "Empty or invalid backup file." };
      }
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== "object" || !parsed.data) {
          return { ok: false, error: "File does not match YaatraStorizz backup format." };
        }
        const s = getStorage();
        if (!s) return { ok: false, error: "Storage is not available." };

        for (const [key, val] of Object.entries(parsed.data)) {
          if (key.startsWith("yatrastorizz.")) {
            s.setItem(key, typeof val === "object" ? JSON.stringify(val) : String(val));
          }
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "JSON parsing failed. Ensure file is valid JSON." };
      }
    },

    resetData() {
      const s = getStorage();
      if (!s) return false;
      try {
        const toRemove = [];
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k && k.startsWith("yatrastorizz.")) toRemove.push(k);
        }
        for (const k of toRemove) s.removeItem(k);
        return true;
      } catch {
        return false;
      }
    },
  };
}
