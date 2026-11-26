/**
 * auth-service.js — client-side authentication, session management,
 * and demo account orchestration for YaatraStorizz.
 * Zero-framework, pure JS ES module with localStorage persistence.
 */

export const SESSION_KEY = "yatrastorizz.session.v1";
export const USERS_KEY = "yatrastorizz.users.v1";

export const DEMO_USER = Object.freeze({
  name: "Asha Sharma",
  email: "demo@yaatrastorizz.com",
  avatar: "AS",
  homeCity: "Bengaluru, India",
  bio: "Adventure seeker, mountain trekker, and family journey organizer.",
  isDemo: true,
});

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getInitials(name) {
  if (typeof name !== "string" || !name.trim()) return "YS";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function createAuthService({
  sessionKey = SESSION_KEY,
  usersKey = USERS_KEY,
  getStorage = storage,
} = {}) {
  const getSession = () => {
    try {
      const s = getStorage();
      const raw = s?.getItem(sessionKey);
      if (!raw) return { isAuthenticated: false, user: null };
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.user) {
        return { isAuthenticated: true, user: parsed.user };
      }
      return { isAuthenticated: false, user: null };
    } catch {
      return { isAuthenticated: false, user: null };
    }
  };

  const setSession = (user) => {
    try {
      const s = getStorage();
      s?.setItem(sessionKey, JSON.stringify({ isAuthenticated: true, user, loginTime: new Date().toISOString() }));
      return true;
    } catch {
      return false;
    }
  };

  const getUsers = () => {
    try {
      const s = getStorage();
      const raw = s?.getItem(usersKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveUsers = (users) => {
    try {
      getStorage()?.setItem(usersKey, JSON.stringify(users));
      return true;
    } catch {
      return false;
    }
  };

  return {
    getSession,

    isAuthenticated() {
      return getSession().isAuthenticated;
    },

    getCurrentUser() {
      return getSession().user;
    },

    signIn(email = "", password = "") {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { ok: false, error: "Please enter your email address." };
      }
      if (!password || password.length < 4) {
        return { ok: false, error: "Password must be at least 4 characters." };
      }

      // Check if matching demo email or password
      if (cleanEmail === "demo@yaatrastorizz.com" || cleanEmail === "demo") {
        return this.loginAsDemo();
      }

      // Check registered users in storage
      const users = getUsers();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        // If not registered yet, guide them to Sign Up
        return { ok: false, error: "Account not found. If this is your first time, please click 'Create Account' below or explore with our Demo Account." };
      }

      if (user.password !== password) {
        return { ok: false, error: "Incorrect password. Please try again." };
      }

      const sessionUser = {
        name: user.name,
        email: user.email,
        avatar: user.avatar || getInitials(user.name),
        homeCity: user.homeCity || "India",
        bio: user.bio || "",
        isDemo: false,
      };

      setSession(sessionUser);
      // Sync profile storage
      try {
        getStorage()?.setItem("yatrastorizz.profile.v1", JSON.stringify({
          name: sessionUser.name,
          email: sessionUser.email,
          homeCity: sessionUser.homeCity,
          bio: sessionUser.bio,
          currency: "INR",
          distanceUnit: "km",
        }));
      } catch {}

      return { ok: true, user: sessionUser };
    },

    signUp({ name = "", email = "", password = "", homeCity = "", bio = "" } = {}) {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName) {
        return { ok: false, error: "Full Name is required for registration." };
      }
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { ok: false, error: "Please enter a valid email address." };
      }
      if (!password || password.length < 4) {
        return { ok: false, error: "Password must be at least 4 characters long." };
      }

      const users = getUsers();
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { ok: false, error: "An account with this email already exists. Please Sign In." };
      }

      const avatar = getInitials(cleanName);
      const newUser = {
        id: `usr-${Date.now().toString(36)}`,
        name: cleanName,
        email: cleanEmail,
        password,
        avatar,
        homeCity: homeCity.trim() || "India",
        bio: bio.trim() || "Excited traveller exploring new horizons.",
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      const sessionUser = {
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        homeCity: newUser.homeCity,
        bio: newUser.bio,
        isDemo: false,
      };

      setSession(sessionUser);

      // Seed starter profile
      try {
        getStorage()?.setItem("yatrastorizz.profile.v1", JSON.stringify({
          name: sessionUser.name,
          email: sessionUser.email,
          homeCity: sessionUser.homeCity,
          bio: sessionUser.bio,
          currency: "INR",
          distanceUnit: "km",
        }));
      } catch {}

      return { ok: true, user: sessionUser };
    },

    loginAsDemo() {
      setSession(DEMO_USER);
      try {
        const s = getStorage();
        s?.setItem("yatrastorizz.profile.v1", JSON.stringify({
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          homeCity: DEMO_USER.homeCity,
          bio: DEMO_USER.bio,
          currency: "INR",
          distanceUnit: "km",
        }));
      } catch {}

      return { ok: true, user: DEMO_USER };
    },

    logout() {
      try {
        getStorage()?.removeItem(sessionKey);
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },
  };
}

export const authService = createAuthService();
