/**
 * subpage-nav.js — top navigation and session synchronization for YaatraStorizz subpages
 * (Dashboard, Trips, Discover, Budget, Itinerary, Profile).
 * Manages active session avatar, Log Out action, and theme toggling.
 */
import { authService } from "./auth-service.js";

export function initSubpageNav() {
  const session = authService.getSession();

  // 1. Update avatars if user is authenticated
  if (session.isAuthenticated && session.user) {
    const initials = session.user.avatar || "YS";
    const avatarElements = document.querySelectorAll("#nav-avatar, #dash-avatar, .avatar");
    avatarElements.forEach((el) => {
      // Avoid overwriting large profile preview avatar if managed separately
      if (el.id !== "preview-avatar") {
        el.textContent = initials;
      }
      el.setAttribute("title", `${session.user.name} (${session.user.email})`);
    });

    const greeting = document.getElementById("dashboard-greeting");
    if (greeting && session.user.name) {
      greeting.textContent = `Welcome back, ${session.user.name.split(" ")[0]}!`;
    }
  }

  // 2. Global click handling for Logout and Theme on subpages
  document.addEventListener("click", (e) => {
    const logoutBtn = e.target.closest?.('[data-action="logout"]');
    if (logoutBtn) {
      e.preventDefault();
      authService.logout();
      window.location.href = "../index.html";
      return;
    }

    const themeBtn = e.target.closest?.('[data-action="theme-toggle"]');
    if (themeBtn) {
      try {
        const root = document.documentElement;
        const current = root.dataset.theme === "dark" ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem("yatrastorizz.theme", next);
      } catch {}
    }
  });
}
