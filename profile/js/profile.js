/**
 * profile.js — composition root for the Profile & Settings page.
 * Pure DOM, zero-framework, accessible and reactive.
 */
import {
  createProfileService,
  getInitials,
  TRAVEL_CATEGORIES,
} from "./profile-service.js";
import { initSubpageNav } from "../../js/services/subpage-nav.js";

const service = createProfileService();

function showToast(message) {
  const region = document.getElementById("status-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  region.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function getStoredTripsCount() {
  try {
    const raw = localStorage.getItem("yatrastorizz.trips.v1");
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function syncPreview(profile) {
  const initials = getInitials(profile.name);

  // Nav avatar badge
  const navAvatar = document.getElementById("nav-avatar");
  if (navAvatar) navAvatar.textContent = initials;

  // Sidebar preview card
  const previewAvatar = document.getElementById("preview-avatar");
  if (previewAvatar) previewAvatar.textContent = initials;

  const previewName = document.getElementById("preview-name");
  if (previewName) previewName.textContent = profile.name || "Traveller";

  const previewEmail = document.getElementById("preview-email");
  if (previewEmail) previewEmail.textContent = profile.email || "No email provided";

  const previewCity = document.getElementById("preview-city");
  if (previewCity) {
    previewCity.textContent = profile.homeCity ? `📍 ${profile.homeCity}` : "📍 Anywhere";
  }

  const previewBio = document.getElementById("preview-bio");
  if (previewBio) {
    previewBio.textContent = profile.bio || "No travel persona description provided yet.";
  }

  const statTrips = document.getElementById("stat-trips");
  if (statTrips) statTrips.textContent = String(getStoredTripsCount());

  const statCurrency = document.getElementById("stat-currency");
  if (statCurrency) statCurrency.textContent = `${profile.currency}`;
}

function populateForms(profile) {
  // 1. Profile form
  const nameInput = document.getElementById("profile-name");
  if (nameInput) nameInput.value = profile.name || "";

  const emailInput = document.getElementById("profile-email");
  if (emailInput) emailInput.value = profile.email || "";

  const cityInput = document.getElementById("profile-city");
  if (cityInput) cityInput.value = profile.homeCity || "";

  const bioInput = document.getElementById("profile-bio");
  if (bioInput) bioInput.value = profile.bio || "";

  // 2. Preferences form
  const currSelect = document.getElementById("pref-currency");
  if (currSelect) currSelect.value = profile.currency || "INR";

  const distSelect = document.getElementById("pref-distance");
  if (distSelect) distSelect.value = profile.distanceUnit || "km";

  // Category chips
  const chipsMount = document.getElementById("category-chips");
  if (chipsMount) {
    chipsMount.innerHTML = "";
    const selected = new Set(profile.preferredCategories || []);
    for (const cat of TRAVEL_CATEGORIES) {
      const label = document.createElement("label");
      label.className = "category-chip";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "category";
      input.value = cat;
      input.checked = selected.has(cat);
      const span = document.createElement("span");
      span.textContent = cat;
      label.appendChild(input);
      label.appendChild(span);
      chipsMount.appendChild(label);
    }
  }
}

function initEvents() {
  // Theme toggle
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="theme-toggle"]');
    if (!btn) return;
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("yatrastorizz.theme", next);
    } catch {}
  });

  // Profile Form Submit
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const current = service.getProfile();
      const name = document.getElementById("profile-name")?.value.trim() ?? "";
      const email = document.getElementById("profile-email")?.value.trim() ?? "";
      const homeCity = document.getElementById("profile-city")?.value.trim() ?? "";
      const bio = document.getElementById("profile-bio")?.value.trim() ?? "";

      const nameError = document.getElementById("name-error");
      const emailError = document.getElementById("email-error");
      if (nameError) nameError.hidden = true;
      if (emailError) emailError.hidden = true;

      const result = service.saveProfile({
        ...current,
        name,
        email,
        homeCity,
        bio,
      });

      if (!result.ok) {
        if (result.errors?.name && nameError) {
          nameError.textContent = result.errors.name;
          nameError.hidden = false;
        }
        if (result.errors?.email && emailError) {
          emailError.textContent = result.errors.email;
          emailError.hidden = false;
        }
        return;
      }

      syncPreview(result.profile);
      showToast("Profile details updated successfully!");
    });
  }

  // Preferences Form Submit
  const prefsForm = document.getElementById("preferences-form");
  if (prefsForm) {
    prefsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const current = service.getProfile();
      const currency = document.getElementById("pref-currency")?.value ?? "INR";
      const distanceUnit = document.getElementById("pref-distance")?.value ?? "km";

      const chips = document.querySelectorAll('#category-chips input[type="checkbox"]:checked');
      const preferredCategories = Array.from(chips).map((c) => c.value);

      const result = service.saveProfile({
        ...current,
        currency,
        distanceUnit,
        preferredCategories,
      });

      if (result.ok) {
        syncPreview(result.profile);
        showToast("Travel preferences saved!");
      }
    });
  }

  // Data Export (.json)
  const btnExport = document.getElementById("btn-export");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const backup = service.exportBackup();
      if (!backup) {
        showToast("Could not generate backup file.");
        return;
      }
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `yaatrastorizz-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Backup file downloaded successfully!");
    });
  }

  // Data Import Trigger & Handler
  const fileImport = document.getElementById("file-import");
  const btnImportTrigger = document.getElementById("btn-import-trigger");
  if (btnImportTrigger && fileImport) {
    btnImportTrigger.addEventListener("click", () => fileImport.click());
    fileImport.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        const result = service.importBackup(content);
        if (result.ok) {
          showToast("Data restored successfully! Refreshing view…");
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showToast(`Import failed: ${result.error}`);
        }
      };
      reader.readAsText(file);
      fileImport.value = "";
    });
  }

  // Data Reset
  const btnReset = document.getElementById("btn-reset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Are you sure you want to reset all YaatraStorizz local data? This will clear all custom trips and restore clean demo defaults."
      );
      if (!confirmed) return;
      service.resetData();
      showToast("Workspace reset to default. Reloading…");
      setTimeout(() => window.location.reload(), 1000);
    });
  }
}

function init() {
  initSubpageNav();
  const profile = service.getProfile();
  populateForms(profile);
  syncPreview(profile);
  initEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
