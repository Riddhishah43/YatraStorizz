// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  createAuthService,
  DEMO_USER,
  SESSION_KEY,
  USERS_KEY,
} from "../js/services/auth-service.js";
import { createAuthModal } from "../js/components/auth-modal.js";

beforeEach(() => {
  localStorage.clear();
});

describe("authService: session & demo management", () => {
  it("initializes with unauthenticated session when storage is empty", () => {
    const service = createAuthService();
    const session = service.getSession();
    expect(session.isAuthenticated).toBe(false);
    expect(session.user).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it("logs in as demo user Asha Sharma with instant access", () => {
    const service = createAuthService();
    const res = service.loginAsDemo();
    expect(res.ok).toBe(true);
    expect(res.user.name).toBe("Asha Sharma");
    expect(res.user.avatar).toBe("AS");
    expect(res.user.email).toBe("demo@yaatrastorizz.com");
    expect(res.user.isDemo).toBe(true);

    const session = service.getSession();
    expect(session.isAuthenticated).toBe(true);
    expect(session.user.name).toBe("Asha Sharma");

    // Also ensures profile storage is updated
    const storedProfile = JSON.parse(localStorage.getItem("yatrastorizz.profile.v1"));
    expect(storedProfile.name).toBe("Asha Sharma");
  });

  it("clears active session on logout", () => {
    const service = createAuthService();
    service.loginAsDemo();
    expect(service.isAuthenticated()).toBe(true);

    const res = service.logout();
    expect(res.ok).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getSession().user).toBeNull();
  });
});

describe("authService: registration and login", () => {
  it("validates required fields on sign up", () => {
    const service = createAuthService();

    const emptyName = service.signUp({ name: "", email: "user@test.com", password: "password123" });
    expect(emptyName.ok).toBe(false);
    expect(emptyName.error).toMatch(/name is required/i);

    const invalidEmail = service.signUp({ name: "User", email: "invalid-email", password: "password123" });
    expect(invalidEmail.ok).toBe(false);
    expect(invalidEmail.error).toMatch(/valid email/i);

    const shortPass = service.signUp({ name: "User", email: "user@test.com", password: "12" });
    expect(shortPass.ok).toBe(false);
    expect(shortPass.error).toMatch(/at least 4 characters/i);
  });

  it("successfully registers a new user, creates session, and prevents duplicate registration", () => {
    const service = createAuthService();
    const result = service.signUp({
      name: "Rohan Varma",
      email: "rohan@example.com",
      password: "secretpassword",
      homeCity: "Pune, India",
    });

    expect(result.ok).toBe(true);
    expect(result.user.name).toBe("Rohan Varma");
    expect(result.user.avatar).toBe("RV");
    expect(service.isAuthenticated()).toBe(true);

    // Duplicate check
    const dup = service.signUp({
      name: "Rohan Clone",
      email: "rohan@example.com",
      password: "anothersecret",
    });
    expect(dup.ok).toBe(false);
    expect(dup.error).toMatch(/already exists/i);
  });

  it("signs in an existing user with correct credentials and rejects incorrect password", () => {
    const service = createAuthService();
    service.signUp({
      name: "Pooja Hegde",
      email: "pooja@example.com",
      password: "travelpass",
    });
    service.logout();

    // Wrong password
    const wrong = service.signIn("pooja@example.com", "wrongpass");
    expect(wrong.ok).toBe(false);
    expect(wrong.error).toMatch(/incorrect password/i);

    // Correct password
    const success = service.signIn("pooja@example.com", "travelpass");
    expect(success.ok).toBe(true);
    expect(success.user.name).toBe("Pooja Hegde");
    expect(success.user.avatar).toBe("PH");
    expect(service.isAuthenticated()).toBe(true);
  });

  it("allows signing in with demo email directly", () => {
    const service = createAuthService();
    const res = service.signIn("demo@yaatrastorizz.com", "anypass");
    expect(res.ok).toBe(true);
    expect(res.user.name).toBe("Asha Sharma");
  });
});

describe("createAuthModal component", () => {
  it("renders accessible dialog with tabs and demo account button", () => {
    let authUser = null;
    const modal = createAuthModal({
      onAuthenticated: (u) => {
        authUser = u;
      },
    });

    expect(modal.element.tagName).toBe("DIALOG");
    expect(modal.element.classList.contains("auth-dialog")).toBe(true);

    const demoBtn = modal.element.querySelector(".auth-demo-box__btn");
    expect(demoBtn).toBeTruthy();

    demoBtn.click();
    expect(authUser).toBeTruthy();
    expect(authUser.name).toBe("Asha Sharma");
  });

  it("renders the 3 tabs: Login, Sign-In, and Try Demo Account button", () => {
    let authUser = null;
    const modal = createAuthModal({
      onAuthenticated: (u) => {
        authUser = u;
      },
    });

    // Check tabs
    const tabs = modal.element.querySelectorAll(".auth-tab");
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent).toBe("Login");
    expect(tabs[1].textContent).toBe("Sign-In");
    expect(tabs[2].textContent).toBe("Try Demo Account");

    // Clicking Try Demo Account tab button directly logs in
    tabs[2].click();
    expect(authUser).toBeTruthy();
    expect(authUser.name).toBe("Asha Sharma");
  });

  it("provides Login (email, password) and Sign-In (name, email, password, city) forms", () => {
    let authUser = null;
    const modal = createAuthModal({
      onAuthenticated: (u) => {
        authUser = u;
      },
    });

    const forms = modal.element.querySelectorAll("form.auth-form");
    expect(forms.length).toBe(2);
    const loginForm = forms[0];
    const signInForm = forms[1];

    // Login fields: email & password
    expect(loginForm.querySelector("#auth-login-email")).toBeTruthy();
    expect(loginForm.querySelector("#auth-login-password")).toBeTruthy();

    // Sign-In fields: name, email, password, home city (optional)
    expect(signInForm.querySelector("#auth-signin-name")).toBeTruthy();
    expect(signInForm.querySelector("#auth-signin-email")).toBeTruthy();
    expect(signInForm.querySelector("#auth-signin-password")).toBeTruthy();
    expect(signInForm.querySelector("#auth-signin-city")).toBeTruthy();

    // modal.open defaults to Login (both for Get Started and Sign In)
    modal.open();
    expect(loginForm.hidden).toBe(false);
    expect(signInForm.hidden).toBe(true);

    // modal.open with signup switches to Sign-In
    modal.open("signup");
    expect(signInForm.hidden).toBe(false);
    expect(loginForm.hidden).toBe(true);

    // modal.open with login keeps Login visible
    modal.open("login");
    expect(loginForm.hidden).toBe(false);
    expect(signInForm.hidden).toBe(true);

    // modal.open with signin-only (from navbar) contains only sign-in credentials with tabs hidden
    modal.open("signin-only");
    expect(signInForm.hidden).toBe(false);
    expect(loginForm.hidden).toBe(true);
    expect(modal.element.querySelector(".auth-tabs").hidden).toBe(true);

    // modal.open with demo logs in directly
    modal.open("demo");
    expect(authUser).toBeTruthy();
    expect(authUser.name).toBe("Asha Sharma");
  });
});
