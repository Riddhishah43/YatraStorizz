/**
 * auth-modal.js — Sign In, First-Time Registration, and integrated Demo Account modal.
 * Pure DOM, accessible <dialog>, zero-framework, zero-XSS.
 * Offers Demo Account options directly within Sign In and Sign Up flows so
 * users can test the app before signing in or creating an account.
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

  // Header
  const header = el("div", "auth-dialog__header");
  const brand = el("span", "auth-dialog__brand", "✈ YaatraStorizz");
  const closeBtn = el("button", "btn btn--ghost btn--small auth-dialog__close", "✕");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close authentication dialog");
  closeBtn.addEventListener("click", () => safeClose());

  header.appendChild(brand);
  header.appendChild(closeBtn);
  card.appendChild(header);

  const title = el("h2", "auth-dialog__title", "Welcome to YaatraStorizz");
  title.id = "auth-dialog-title";
  const sub = el("p", "auth-dialog__sub", "Sign in to access your journeys, create a new account, or test the app first with our pre-loaded Demo Account.");
  card.appendChild(title);
  card.appendChild(sub);

  // Tabs for Sign In, Sign Up, and Demo Account
  const tabsWrap = el("div", "auth-tabs");
  const tabSignIn = el("button", "auth-tab is-active", "Sign In");
  tabSignIn.type = "button";
  const tabSignUp = el("button", "auth-tab", "New User? Create Account");
  tabSignUp.type = "button";
  const tabDemo = el("button", "auth-tab auth-tab--demo", "🚀 Try Demo Account");
  tabDemo.type = "button";

  tabsWrap.appendChild(tabSignIn);
  tabsWrap.appendChild(tabSignUp);
  tabsWrap.appendChild(tabDemo);
  card.appendChild(tabsWrap);

  const errorAlert = el("p", "field__error auth-error", "");
  errorAlert.hidden = true;
  errorAlert.setAttribute("role", "alert");
  card.appendChild(errorAlert);

  // Form Container
  const formWrap = el("div", "auth-forms");

  // ==========================================
  // --- 1. Sign In Form (With Demo Option) ---
  // ==========================================
  const signInForm = document.createElement("form");
  signInForm.className = "form-grid auth-form";
  signInForm.noValidate = true;

  const inEmailField = el("div", "field");
  const inEmailLabel = el("label", "field__label", "Email Address");
  inEmailLabel.setAttribute("for", "auth-in-email");
  const inEmailInput = document.createElement("input");
  inEmailInput.type = "email";
  inEmailInput.id = "auth-in-email";
  inEmailInput.className = "field__control";
  inEmailInput.placeholder = "you@example.com";
  inEmailInput.required = true;
  inEmailField.appendChild(inEmailLabel);
  inEmailField.appendChild(inEmailInput);
  signInForm.appendChild(inEmailField);

  const inPassField = el("div", "field");
  const inPassLabel = el("label", "field__label", "Password");
  inPassLabel.setAttribute("for", "auth-in-password");
  const inPassInput = document.createElement("input");
  inPassInput.type = "password";
  inPassInput.id = "auth-in-password";
  inPassInput.className = "field__control";
  inPassInput.placeholder = "••••••••";
  inPassInput.required = true;
  inPassField.appendChild(inPassLabel);
  inPassField.appendChild(inPassInput);
  signInForm.appendChild(inPassField);

  const inSubmitBtn = el("button", "btn btn--primary btn--block", "Sign In →");
  inSubmitBtn.type = "submit";
  signInForm.appendChild(inSubmitBtn);

  // Demo Option inside Sign In
  const inDivider = el("div", "auth-divider");
  const inDividerSpan = el("span", null, "or explore before signing in");
  inDivider.appendChild(inDividerSpan);
  signInForm.appendChild(inDivider);

  const inDemoOption = el("div", "auth-demo-option");
  const inDemoBtn = el("button", "btn btn--secondary auth-demo-box__btn", "🚀 Continue with Demo Account (Asha Sharma)");
  inDemoBtn.type = "button";
  inDemoBtn.addEventListener("click", triggerDemoLogin);

  const inDemoCaption = el(
    "p",
    "auth-demo-caption",
    "Instant access with pre-loaded trips, itineraries, and budgets — no password required."
  );
  inDemoOption.appendChild(inDemoBtn);
  inDemoOption.appendChild(inDemoCaption);
  signInForm.appendChild(inDemoOption);

  signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorAlert.hidden = true;
    const res = authService.signIn(inEmailInput.value, inPassInput.value);
    if (!res.ok) {
      errorAlert.textContent = res.error;
      errorAlert.hidden = false;
      return;
    }
    safeClose();
    onAuthenticated(res.user);
  });

  // ============================================
  // --- 2. Sign Up Form (With Demo Option) ---
  // ============================================
  const signUpForm = document.createElement("form");
  signUpForm.className = "form-grid auth-form";
  signUpForm.noValidate = true;
  signUpForm.hidden = true;

  const upNameField = el("div", "field");
  const upNameLabel = el("label", "field__label", "Full Name *");
  upNameLabel.setAttribute("for", "auth-up-name");
  const upNameInput = document.createElement("input");
  upNameInput.type = "text";
  upNameInput.id = "auth-up-name";
  upNameInput.className = "field__control";
  upNameInput.placeholder = "e.g. Riddhi Sen";
  upNameInput.required = true;
  upNameField.appendChild(upNameLabel);
  upNameField.appendChild(upNameInput);
  signUpForm.appendChild(upNameField);

  const upEmailField = el("div", "field");
  const upEmailLabel = el("label", "field__label", "Email Address *");
  upEmailLabel.setAttribute("for", "auth-up-email");
  const upEmailInput = document.createElement("input");
  upEmailInput.type = "email";
  upEmailInput.id = "auth-up-email";
  upEmailInput.className = "field__control";
  upEmailInput.placeholder = "you@example.com";
  upEmailInput.required = true;
  upEmailField.appendChild(upEmailLabel);
  upEmailField.appendChild(upEmailInput);
  signUpForm.appendChild(upEmailField);

  const upCityField = el("div", "field");
  const upCityLabel = el("label", "field__label", "Home City (optional)");
  upCityLabel.setAttribute("for", "auth-up-city");
  const upCityInput = document.createElement("input");
  upCityInput.type = "text";
  upCityInput.id = "auth-up-city";
  upCityInput.className = "field__control";
  upCityInput.placeholder = "e.g. Mumbai, India";
  upCityField.appendChild(upCityLabel);
  upCityField.appendChild(upCityInput);
  signUpForm.appendChild(upCityField);

  const upPassField = el("div", "field");
  const upPassLabel = el("label", "field__label", "Create Password *");
  upPassLabel.setAttribute("for", "auth-up-password");
  const upPassInput = document.createElement("input");
  upPassInput.type = "password";
  upPassInput.id = "auth-up-password";
  upPassInput.className = "field__control";
  upPassInput.placeholder = "At least 4 characters";
  upPassInput.required = true;
  upPassField.appendChild(upPassLabel);
  upPassField.appendChild(upPassInput);
  signUpForm.appendChild(upPassField);

  const upSubmitBtn = el("button", "btn btn--primary btn--block", "Create Account & Get Started →");
  upSubmitBtn.type = "submit";
  signUpForm.appendChild(upSubmitBtn);

  // Demo Option inside Sign Up
  const upDivider = el("div", "auth-divider");
  const upDividerSpan = el("span", null, "or test without creating an account");
  upDivider.appendChild(upDividerSpan);
  signUpForm.appendChild(upDivider);

  const upDemoOption = el("div", "auth-demo-option");
  const upDemoBtn = el("button", "btn btn--secondary auth-demo-box__btn", "🚀 Try Demo Account Before Registering");
  upDemoBtn.type = "button";
  upDemoBtn.addEventListener("click", triggerDemoLogin);

  const upDemoCaption = el(
    "p",
    "auth-demo-caption",
    "Want to see how YaatraStorizz works first? Test with demo trips, budgets, and reviews."
  );
  upDemoOption.appendChild(upDemoBtn);
  upDemoOption.appendChild(upDemoCaption);
  signUpForm.appendChild(upDemoOption);

  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorAlert.hidden = true;
    const res = authService.signUp({
      name: upNameInput.value,
      email: upEmailInput.value,
      password: upPassInput.value,
      homeCity: upCityInput.value,
    });
    if (!res.ok) {
      errorAlert.textContent = res.error;
      errorAlert.hidden = false;
      return;
    }
    safeClose();
    onAuthenticated(res.user);
  });

  // ============================================
  // --- 3. Dedicated Demo Account Tab View ---
  // ============================================
  const demoView = el("div", "auth-demo-view");
  demoView.hidden = true;

  const demoBadge = el("span", "auth-demo-view__badge", "⚡ INSTANT EVALUATION");
  const demoHead = el("h3", "auth-demo-view__title", "Explore as Asha Sharma");
  const demoDesc = el(
    "p",
    "auth-demo-view__desc",
    "Test all capabilities instantly before creating your own account. Pre-loaded with realistic journeys, itineraries, expenses, and reviews."
  );

  const featureList = el("ul", "auth-demo-features");
  const features = [
    "✈ Pre-loaded trips: Rajasthan Getaway, Kerala Backwaters & Himachal Trek",
    "📅 Interactive day-by-day itineraries with timeline re-ordering",
    "💰 Category budget breakdown and travel expense tracking",
    "⭐ Community travel ratings and Google-style review submission",
    "⚙ Complete profile and multi-currency preferences (INR, USD, EUR, GBP)",
  ];
  features.forEach((f) => {
    const li = el("li", null, f);
    featureList.appendChild(li);
  });

  const launchDemoBtn = el("button", "btn btn--primary btn--large auth-demo-box__btn", "🚀 Launch Demo Experience");
  launchDemoBtn.type = "button";
  launchDemoBtn.addEventListener("click", triggerDemoLogin);

  demoView.appendChild(demoBadge);
  demoView.appendChild(demoHead);
  demoView.appendChild(demoDesc);
  demoView.appendChild(featureList);
  demoView.appendChild(launchDemoBtn);

  // Tab switching logic
  const activateTab = (activeTab, activePanel) => {
    [tabSignIn, tabSignUp, tabDemo].forEach((t) => t.classList.remove("is-active"));
    [signInForm, signUpForm, demoView].forEach((p) => (p.hidden = true));
    activeTab.classList.add("is-active");
    activePanel.hidden = false;
    errorAlert.hidden = true;
  };

  tabSignIn.addEventListener("click", () => activateTab(tabSignIn, signInForm));
  tabSignUp.addEventListener("click", () => activateTab(tabSignUp, signUpForm));
  tabDemo.addEventListener("click", () => activateTab(tabDemo, demoView));

  formWrap.appendChild(signInForm);
  formWrap.appendChild(signUpForm);
  formWrap.appendChild(demoView);
  card.appendChild(formWrap);

  dialog.appendChild(card);

  return {
    element: dialog,
    open: (mode = "signin") => {
      errorAlert.hidden = true;
      if (mode === "signup") {
        activateTab(tabSignUp, signUpForm);
      } else if (mode === "demo") {
        activateTab(tabDemo, demoView);
      } else {
        activateTab(tabSignIn, signInForm);
      }
      safeOpen();
    },
    close: () => safeClose(),
  };
}
