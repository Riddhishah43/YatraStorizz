// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  validateProfile,
  getInitials,
  createProfileService,
  DEFAULT_PROFILE,
  PROFILE_STORAGE_KEY,
} from "../profile/js/profile-service.js";

beforeEach(() => {
  localStorage.clear();
});

describe("profile validation & initials", () => {
  it("extracts clean initials from names", () => {
    expect(getInitials("Riddhi Sen")).toBe("RS");
    expect(getInitials("Asha")).toBe("AS");
    expect(getInitials("John Middle Smith")).toBe("JS");
    expect(getInitials("")).toBe("YS");
    expect(getInitials(null)).toBe("YS");
  });

  it("validates valid profile data", () => {
    const input = {
      name: "Riddhi Sen",
      email: "riddhi@example.com",
      homeCity: "Mumbai",
      currency: "INR",
      distanceUnit: "km",
      preferredCategories: ["Mountains", "Heritage"],
      bio: "Traveller",
    };
    const { valid, errors, value } = validateProfile(input);
    expect(valid).toBe(true);
    expect(errors).toEqual({});
    expect(value.name).toBe("Riddhi Sen");
    expect(value.currency).toBe("INR");
  });

  it("rejects empty name and malformed email", () => {
    const invalid = validateProfile({ name: "   ", email: "not-an-email" });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.name).toMatch(/required/);
    expect(invalid.errors.email).toMatch(/valid email/);
  });

  it("rejects unsupported currencies and recovers", () => {
    const res = validateProfile({ name: "Test User", currency: "DOGECOIN" });
    expect(res.valid).toBe(false);
    expect(res.errors.currency).toMatch(/Currency must be one of/);
  });
});

describe("profile service persistence & backup", () => {
  it("defaults gracefully when storage is empty", () => {
    const service = createProfileService();
    const profile = service.getProfile();
    expect(profile.name).toBe(DEFAULT_PROFILE.name);
    expect(profile.currency).toBe("INR");
  });

  it("persists and reads profile updates", () => {
    const service = createProfileService();
    const updateRes = service.saveProfile({
      name: "Asha Sharma",
      email: "asha@example.com",
      currency: "USD",
      homeCity: "Bengaluru",
    });
    expect(updateRes.ok).toBe(true);

    const reloaded = service.getProfile();
    expect(reloaded.name).toBe("Asha Sharma");
    expect(reloaded.currency).toBe("USD");
  });

  it("exports all app data to a structured backup", () => {
    localStorage.setItem("yatrastorizz.trips.v1", JSON.stringify([{ id: "t1", title: "Goa" }]));
    localStorage.setItem("yatrastorizz.theme", "dark");

    const service = createProfileService();
    const backup = service.exportBackup();

    expect(backup).toBeTruthy();
    expect(backup.meta.app).toBe("YaatraStorizz");
    expect(backup.data["yatrastorizz.trips.v1"]).toEqual([{ id: "t1", title: "Goa" }]);
    expect(backup.data["yatrastorizz.theme"]).toBe("dark");
  });

  it("imports and validates backup files", () => {
    const service = createProfileService();
    const sampleBackup = JSON.stringify({
      meta: { app: "YaatraStorizz" },
      data: {
        "yatrastorizz.trips.v1": [{ id: "t9", title: "Kerala Trip" }],
        "yatrastorizz.theme": "dark",
      },
    });

    const res = service.importBackup(sampleBackup);
    expect(res.ok).toBe(true);

    expect(localStorage.getItem("yatrastorizz.theme")).toBe("dark");
    expect(JSON.parse(localStorage.getItem("yatrastorizz.trips.v1"))).toEqual([
      { id: "t9", title: "Kerala Trip" },
    ]);
  });

  it("rejects invalid or empty backup files", () => {
    const service = createProfileService();
    expect(service.importBackup("").ok).toBe(false);
    expect(service.importBackup("{ malformed json").ok).toBe(false);
    expect(service.importBackup(JSON.stringify({ wrong: true })).ok).toBe(false);
  });

  it("resets all YaatraStorizz local keys", () => {
    localStorage.setItem("yatrastorizz.trips.v1", "[]");
    localStorage.setItem("yatrastorizz.theme", "dark");
    localStorage.setItem("other.app.key", "keep");

    const service = createProfileService();
    expect(service.resetData()).toBe(true);

    expect(localStorage.getItem("yatrastorizz.trips.v1")).toBeNull();
    expect(localStorage.getItem("yatrastorizz.theme")).toBeNull();
    expect(localStorage.getItem("other.app.key")).toBe("keep");
  });
});
