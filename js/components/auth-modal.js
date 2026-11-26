/**
 * auth-modal.js — Clean 3-tab Authentication Modal.
 * Layout:
 * - "Get Started" opens the 3 tabs:
 *    1. "Login" (active by default): Email Address + Password + Login button.
 *    2. "Sign-In": Full Name + Email Address + Password + Home City (optional) + Sign-In button.
 *    3. "Try Demo Account": Single-click button that logs in immediately as demo user.
 * - Navbar "Sign In" opens directly with only the Sign-In credentials (tabs hidden).
 */
import { el } from "../utils/dom-utils.js";
import { authService } from "../services/auth-service.js";

export function createAuthModal({ onAuthenticated = () => {} } = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "auth-dialog";
  dialog.setAttribute("aria-labelledby", "auth-dialog-title");

  const card = el("div", "auth-dialog__card");

  const safeClose = () => {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  };

  const safeOpen = () => {
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  };

  const triggerDemoLogin = () => {
    const res = authService.loginAsDemo();
    if (res.ok) {
      safeClose();
      onAuthenticated(res.user);
    }
  };

  // Header: Brand & Close Button
  const header = el("div", "auth-dialog__header");
  const brand = el("span", "auth-dialog__brand", "✈ YaatraStorizz");
  const closeBtn = el("button", "btn btn--ghost btn--small auth-dialog__close", "✕");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close authentication dialog");
  closeBtn.addEventListener("click", () => safeClose());
  header.appendChild(brand);
  header.appendChild(closeBtn);
  card.appendChild(header);

  // Dynamic Title & Subtitle based on active tab (defaults to Login)
  const title = el("h2", "auth-dialog__title", "Login");
  title.id = "auth-dialog-title";
  const sub = el("p", "auth-dialog__sub", "Welcome back! Enter your email and password to log in.");
  card.appendChild(title);
  card.appendChild(sub);

  // Exactly 3 Tabs: Login, Sign-In, and Try Demo Account button
  const tabsWrap = el("div", "auth-tabs");

  const tabLogin = el("button", "auth-tab is-active", "Login");
  tabLogin.type = "button";
  tabLogin.setAttribute("aria-label", "Login for existing accounts");

  const tabSignIn = el("button", "auth-tab", "Sign-In");
  tabSignIn.type = "button";
  tabSignIn.setAttribute("aria-label", "Sign-In for creating a new account");

  const tabDemo = el("button", "auth-tab auth-tab--demo auth-demo-box__btn", "Try Demo Account");
  tabDemo.type = "button";
  tabDemo.setAttribute("aria-label", "Try Demo Account - Log in immediately as demo user");

  tabsWrap.appendChild(tabLogin);
  tabsWrap.appendChild(tabSignIn);
  tabsWrap.appendChild(tabDemo);
  card.appendChild(tabsWrap);

  const errorAlert = el("p", "field__error auth-error", "");
  errorAlert.hidden = true;
  errorAlert.setAttribute("role", "alert");
  card.appendChild(errorAlert);

  // Forms Container
  const formWrap = el("div", "auth-forms");

  // ==============================================================
  // --- TAB 1: LOGIN FORM (Users who already have an account) ---
  // Fields: Email Address, Password
  // ==============================================================
  const loginForm = document.createElement("form");
  loginForm.className = "form-grid auth-form";
  loginForm.noValidate = true;
  loginForm.hidden = false;
  loginForm.style.display = "flex";

  const loginEmailField = el("div", "field");
  const loginEmailLabel = el("label", "field__label", "Email Address");
  loginEmailLabel.setAttribute("for", "auth-login-email");
  const loginEmailInput = document.createElement("input");
  loginEmailInput.type = "email";
  loginEmailInput.id = "auth-login-email";
  loginEmailInput.className = "field__control";
  loginEmailInput.placeholder = "name@example.com";
  loginEmailInput.autocomplete = "email";
  loginEmailInput.required = true;
  loginEmailField.appendChild(loginEmailLabel);
  loginEmailField.appendChild(loginEmailInput);
  loginForm.appendChild(loginEmailField);

  const loginPassField = el("div", "field");
  const loginPassLabel = el("label", "field__label", "Password");
  loginPassLabel.setAttribute("for", "auth-login-password");
  const loginPassInput = document.createElement("input");
  loginPassInput.type = "password";
  loginPassInput.id = "auth-login-password";
  loginPassInput.className = "field__control";
  loginPassInput.placeholder = "Enter your password";
  loginPassInput.autocomplete = "current-password";
  loginPassInput.required = true;
  loginPassField.appendChild(loginPassLabel);
  loginPassField.appendChild(loginPassInput);
  loginForm.appendChild(loginPassField);

  const loginSubmitBtn = el("button", "btn btn--primary btn--block", "Login");
  loginSubmitBtn.type = "submit";
  loginForm.appendChild(loginSubmitBtn);

  // Switcher to Sign-In
  const loginSwitch = el("p", "auth-switch", "Don't have an account?");
  const loginSwitchBtn = el("button", "auth-switch__btn", "Sign-In");
  loginSwitchBtn.type = "button";
  loginSwitchBtn.addEventListener("click", () => showSignInTab({ hideTabs: false }));
  loginSwitch.appendChild(loginSwitchBtn);
  loginForm.appendChild(loginSwitch);

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorAlert.hidden = true;
    const res = authService.signIn(loginEmailInput.value, loginPassInput.value);
    if (!res.ok) {
      errorAlert.textContent = res.error;
      errorAlert.hidden = false;
      return;
    }
    safeClose();
    onAuthenticated(res.user);
  });

  // ==========================================================
  // --- TAB 2: SIGN-IN FORM (Users creating a new account) ---
  // Fields: Full Name, Email Address, Password, Home City (optional)
  // ==========================================================
  const signInForm = document.createElement("form");
  signInForm.className = "form-grid auth-form";
  signInForm.noValidate = true;
  signInForm.hidden = true;
  signInForm.style.display = "none";

  const signinNameField = el("div", "field");
  const signinNameLabel = el("label", "field__label", "Full Name");
  signinNameLabel.setAttribute("for", "auth-signin-name");
  const signinNameInput = document.createElement("input");
  signinNameInput.type = "text";
  signinNameInput.id = "auth-signin-name";
  signinNameInput.className = "field__control";
  signinNameInput.placeholder = "e.g. Riddhi Sen";
  signinNameInput.autocomplete = "name";
  signinNameInput.required = true;
  signinNameField.appendChild(signinNameLabel);
  signinNameField.appendChild(signinNameInput);
  signInForm.appendChild(signinNameField);

  const signinEmailField = el("div", "field");
  const signinEmailLabel = el("label", "field__label", "Email Address");
  signinEmailLabel.setAttribute("for", "auth-signin-email");
  const signinEmailInput = document.createElement("input");
  signinEmailInput.type = "email";
  signinEmailInput.id = "auth-signin-email";
  signinEmailInput.className = "field__control";
  signinEmailInput.placeholder = "name@example.com";
  signinEmailInput.autocomplete = "email";
  signinEmailInput.required = true;
  signinEmailField.appendChild(signinEmailLabel);
  signinEmailField.appendChild(signinEmailInput);
  signInForm.appendChild(signinEmailField);

  const signinPassField = el("div", "field");
  const signinPassLabel = el("label", "field__label", "Password");
  signinPassLabel.setAttribute("for", "auth-signin-password");
  const signinPassInput = document.createElement("input");
  signinPassInput.type = "password";
  signinPassInput.id = "auth-signin-password";
  signinPassInput.className = "field__control";
  signinPassInput.placeholder = "At least 4 characters";
  signinPassInput.autocomplete = "new-password";
  signinPassInput.required = true;
  signinPassField.appendChild(signinPassLabel);
  signinPassField.appendChild(signinPassInput);
  signInForm.appendChild(signinPassField);

  const signinCityField = el("div", "field");
  const signinCityLabel = el("label", "field__label", "Home City (optional)");
  signinCityLabel.setAttribute("for", "auth-signin-city");
  const signinCityInput = document.createElement("input");
  signinCityInput.type = "text";
  signinCityInput.id = "auth-signin-city";
  signinCityInput.className = "field__control";
  signinCityInput.placeholder = "e.g. Mumbai, India";
  signinCityInput.autocomplete = "address-level2";
  signinCityField.appendChild(signinCityLabel);
  signinCityField.appendChild(signinCityInput);
  signInForm.appendChild(signinCityField);

  const signinSubmitBtn = el("button", "btn btn--primary btn--block", "Sign-In (Create Account)");
  signinSubmitBtn.type = "submit";
  signInForm.appendChild(signinSubmitBtn);

  // Switcher to Login
  const signinSwitch = el("p", "auth-switch", "Already have an account?");
  const signinSwitchBtn = el("button", "auth-switch__btn", "Login");
  signinSwitchBtn.type = "button";
  signinSwitchBtn.addEventListener("click", () => showLoginTab({ hideTabs: false }));
  signinSwitch.appendChild(signinSwitchBtn);
  signInForm.appendChild(signinSwitch);

  signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorAlert.hidden = true;
    const res = authService.signUp({
      name: signinNameInput.value,
      email: signinEmailInput.value,
      password: signinPassInput.value,
      homeCity: signinCityInput.value,
    });
    if (!res.ok) {
      errorAlert.textContent = res.error;
      errorAlert.hidden = false;
      return;
    }
    safeClose();
    onAuthenticated(res.user);
  });

  // Tab activation helpers
  const showLoginTab = ({ hideTabs = false } = {}) => {
    tabsWrap.hidden = hideTabs;
    tabsWrap.style.display = hideTabs ? "none" : "grid";
    tabLogin.classList.add("is-active");
    tabSignIn.classList.remove("is-active");
    loginForm.hidden = false;
    loginForm.style.display = "flex";
    signInForm.hidden = true;
    signInForm.style.display = "none";
    errorAlert.hidden = true;
    title.textContent = hideTabs ? "Login" : "Login";
    sub.textContent = "Welcome back! Enter your email and password to log in.";
    card.scrollTop = 0;
    setTimeout(() => {
      try { loginEmailInput.focus(); } catch (e) {}
    }, 50);
  };

  const showSignInTab = ({ hideTabs = false } = {}) => {
    tabsWrap.hidden = hideTabs;
    tabsWrap.style.display = hideTabs ? "none" : "grid";
    tabSignIn.classList.add("is-active");
    tabLogin.classList.remove("is-active");
    signInForm.hidden = false;
    signInForm.style.display = "flex";
    loginForm.hidden = true;
    loginForm.style.display = "none";
    errorAlert.hidden = true;
    title.textContent = "Sign-In";
    sub.textContent = hideTabs
      ? "Enter your details to sign in."
      : "Fill in your details to create a new account.";
    card.scrollTop = 0;
    setTimeout(() => {
      try { signinNameInput.focus(); } catch (e) {}
    }, 50);
  };

  tabLogin.addEventListener("click", () => showLoginTab({ hideTabs: false }));
  tabSignIn.addEventListener("click", () => showSignInTab({ hideTabs: false }));
  tabDemo.addEventListener("click", triggerDemoLogin);

  formWrap.appendChild(loginForm);
  formWrap.appendChild(signInForm);
  card.appendChild(formWrap);

  dialog.appendChild(card);

  return {
    element: dialog,
    open: (mode = "get-started") => {
      errorAlert.hidden = true;
      if (mode === "signin-only" || mode === "navbar-signin" || mode === "signin") {
        // Opened from navbar "Sign In": contains ONLY sign-in credentials (tabs hidden)
        showSignInTab({ hideTabs: true });
      } else if (mode === "login-only") {
        showLoginTab({ hideTabs: true });
      } else if (mode === "signup" || mode === "create-account") {
        showSignInTab({ hideTabs: false });
      } else if (mode === "demo") {
        triggerDemoLogin();
        return;
      } else {
        // Opened from "Get Started": presents the 3 tabs with Login as default
        showLoginTab({ hideTabs: false });
      }
      safeOpen();
    },
    close: () => safeClose(),
  };
}
