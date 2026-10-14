/**
 * newsletter.js — HONEST demo signup. There is no mailing backend, so:
 * - valid emails are stored ONLY in localStorage (this device),
 * - the toast explicitly says no email was sent,
 * - validation errors preserve input and focus the field.
 */
import { NEWSLETTER_DEMO_KEY } from "../../services/preferences-service.js";
import { showToast } from "../../components/toast.js";
import { qs } from "../../utils/dom-utils.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Pure + unit-testable. */
export function isValidEmail(value) {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

export function initNewsletter(root = document) {
  const form = qs(root, "#newsletter-form");
  if (!form) return () => {};
  const input = qs(form, "#newsletter-email");
  const error = qs(form, "#newsletter-error");
  const button = qs(form, 'button[type="submit"]');
  let busy = false;

  const setError = (msg) => {
    if (!error) return;
    error.textContent = msg;
    error.hidden = !msg;
    input?.setAttribute("aria-invalid", msg ? "true" : "false");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (busy) return; // no duplicate submissions
    const value = input?.value ?? "";
    if (!isValidEmail(value)) {
      setError("Enter a valid email address, e.g. you@example.com.");
      input?.focus();
      return; // input preserved
    }
    busy = true;
    if (button) button.disabled = true;
    setError("");
    // Demo persistence with a labeled key — NOT email delivery.
    try {
      const raw = localStorage.getItem(NEWSLETTER_DEMO_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const emails = Array.isArray(list) ? list : [];
      const clean = value.trim().toLowerCase();
      if (!emails.includes(clean)) {
        emails.push(clean);
        localStorage.setItem(NEWSLETTER_DEMO_KEY, JSON.stringify(emails));
      }
      showToast("Saved on this device (demo) — no email was sent, no mailing list exists yet.", "success");
      form.reset();
    } catch {
      showToast("Could not save on this device — storage is unavailable.", "error");
    } finally {
      busy = false;
      if (button) button.disabled = false;
    }
  };

  form.addEventListener("submit", onSubmit);
  return () => form.removeEventListener("submit", onSubmit);
}
