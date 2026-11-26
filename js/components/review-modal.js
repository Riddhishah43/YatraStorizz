/**
 * review-modal.js — Google Reviews-style interactive rating & feedback dialog.
 * Accessible <dialog>, interactive 1-5 star rating selector, experience tags.
 * Pure DOM, zero-framework, zero-XSS.
 */
import { el, clear } from "../utils/dom-utils.js";
import { REVIEW_HIGHLIGHTS, reviewsService } from "../services/reviews-service.js";

const RATING_LABELS = {
  1: "Poor 😞",
  2: "Fair 😐",
  3: "Good 🙂",
  4: "Very Good 😊",
  5: "Excellent / Loved it! 🌟",
};

export function createReviewModal({ onSubmit = () => {} } = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "review-dialog";
  dialog.setAttribute("aria-labelledby", "review-dialog-title");

  const card = el("div", "review-dialog__card");

  // Header
  const header = el("div", "review-dialog__header");
  const title = el("h2", "review-dialog__title", "Rate & Review Your Experience");
  title.id = "review-dialog-title";
  const closeBtn = el("button", "btn btn--ghost btn--small review-dialog__close", "✕");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close review dialog");
  closeBtn.addEventListener("click", () => dialog.close());
  header.appendChild(title);
  header.appendChild(closeBtn);
  card.appendChild(header);

  // Form
  const form = document.createElement("form");
  form.className = "review-form";
  form.noValidate = true;

  // Star Rating Section
  const starSection = el("div", "rating-picker");
  const starLabel = el("p", "rating-picker__label", "Overall Rating *");
  const starsWrap = el("div", "stars-row");
  starsWrap.setAttribute("role", "radiogroup");
  starsWrap.setAttribute("aria-label", "Star rating out of 5");

  const ratingDesc = el("p", "rating-desc", "Click to rate your journey");
  let selectedRating = 5;

  const starButtons = [1, 2, 3, 4, 5].map((starVal) => {
    const btn = el("button", "star-btn", "★");
    btn.type = "button";
    btn.dataset.star = String(starVal);
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", starVal === 5 ? "true" : "false");
    btn.setAttribute("aria-label", `${starVal} star${starVal > 1 ? "s" : ""}`);

    btn.addEventListener("mouseenter", () => highlightStars(starVal));
    btn.addEventListener("mouseleave", () => highlightStars(selectedRating));
    btn.addEventListener("click", () => {
      selectedRating = starVal;
      highlightStars(selectedRating);
      ratingDesc.textContent = RATING_LABELS[starVal] || `${starVal} Stars`;
    });

    starsWrap.appendChild(btn);
    return btn;
  });

  function highlightStars(val) {
    starButtons.forEach((b, i) => {
      b.classList.toggle("is-active", i < val);
    });
  }

  highlightStars(5);
  ratingDesc.textContent = RATING_LABELS[5];

  starSection.appendChild(starLabel);
  starSection.appendChild(starsWrap);
  starSection.appendChild(ratingDesc);
  form.appendChild(starSection);

  // Destination / Place
  const destField = el("div", "field");
  const destLabel = el("label", "field__label", "Destination or Trip *");
  destLabel.setAttribute("for", "rev-destination");
  const destInput = document.createElement("input");
  destInput.type = "text";
  destInput.id = "rev-destination";
  destInput.name = "destination";
  destInput.className = "field__control";
  destInput.placeholder = "e.g. Manali, India or Kyoto, Japan";
  destInput.required = true;
  destField.appendChild(destLabel);
  destField.appendChild(destInput);
  form.appendChild(destField);

  // Author & Role Row
  const row = el("div", "field-row");
  const authorField = el("div", "field");
  const authorLabel = el("label", "field__label", "Your Name");
  authorLabel.setAttribute("for", "rev-author");
  const authorInput = document.createElement("input");
  authorInput.type = "text";
  authorInput.id = "rev-author";
  authorInput.name = "author";
  authorInput.className = "field__control";
  authorInput.placeholder = "Your name";
  authorField.appendChild(authorLabel);
  authorField.appendChild(authorInput);
  row.appendChild(authorField);

  const roleField = el("div", "field");
  const roleLabel = el("label", "field__label", "Travel Style (optional)");
  roleLabel.setAttribute("for", "rev-role");
  const roleInput = document.createElement("input");
  roleInput.type = "text";
  roleInput.id = "rev-role";
  roleInput.name = "role";
  roleInput.className = "field__control";
  roleInput.placeholder = "e.g. Solo Traveller, Family Trip, Couple";
  roleField.appendChild(roleLabel);
  roleField.appendChild(roleInput);
  row.appendChild(roleField);
  form.appendChild(row);

  // Headline Title
  const titleField = el("div", "field");
  const titleLabel = el("label", "field__label", "Review Headline");
  titleLabel.setAttribute("for", "rev-title");
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.id = "rev-title";
  titleInput.name = "title";
  titleInput.className = "field__control";
  titleInput.placeholder = "e.g. Beautiful mountain views and relaxing cafes";
  titleField.appendChild(titleLabel);
  titleField.appendChild(titleInput);
  form.appendChild(titleField);

  // Comment Feedback
  const commentField = el("div", "field");
  const commentLabel = el("label", "field__label", "Detailed Feedback & Tips *");
  commentLabel.setAttribute("for", "rev-comment");
  const commentArea = document.createElement("textarea");
  commentArea.id = "rev-comment";
  commentArea.name = "comment";
  commentArea.className = "field__control";
  commentArea.rows = 4;
  commentArea.placeholder = "Share details of your experience, food spots, tips for others, or how YaatraStorizz helped you plan…";
  commentArea.required = true;
  commentField.appendChild(commentLabel);
  commentField.appendChild(commentArea);
  form.appendChild(commentField);

  // Experience Highlights Checkbox Chips
  const chipsSection = el("div", "field");
  const chipsLabel = el("p", "field__label", "Trip Highlights (optional)");
  const chipsWrap = el("div", "chips-wrap");
  const checkBoxes = REVIEW_HIGHLIGHTS.map((tag) => {
    const chipLabel = el("label", "chip-checkbox");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = tag;
    const txt = el("span", null, tag);
    chipLabel.appendChild(cb);
    chipLabel.appendChild(txt);
    chipsWrap.appendChild(chipLabel);
    return cb;
  });
  chipsSection.appendChild(chipsLabel);
  chipsSection.appendChild(chipsWrap);
  form.appendChild(chipsSection);

  // Error message alert slot
  const errorAlert = el("p", "field__error", "");
  errorAlert.hidden = true;
  errorAlert.setAttribute("role", "alert");
  form.appendChild(errorAlert);

  // Actions
  const actions = el("div", "review-dialog__actions");
  const cancelBtn = el("button", "btn btn--ghost", "Cancel");
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", () => dialog.close());

  const submitBtn = el("button", "btn btn--primary", "Post Review ★");
  submitBtn.type = "submit";

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  // Form Submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorAlert.hidden = true;

    const dest = destInput.value.trim();
    const comment = commentArea.value.trim();

    if (!dest) {
      errorAlert.textContent = "Please provide the destination or trip name.";
      errorAlert.hidden = false;
      destInput.focus();
      return;
    }

    if (!comment || comment.length < 5) {
      errorAlert.textContent = "Please write at least a short review (5+ characters).";
      errorAlert.hidden = false;
      commentArea.focus();
      return;
    }

    const selectedTags = checkBoxes.filter((cb) => cb.checked).map((cb) => cb.value);

    const result = reviewsService.addReview({
      destination: dest,
      rating: selectedRating,
      title: titleInput.value.trim(),
      comment,
      author: authorInput.value.trim(),
      role: roleInput.value.trim(),
      tags: selectedTags,
    });

    if (!result.ok) {
      errorAlert.textContent = Object.values(result.errors || {}).join(" ");
      errorAlert.hidden = false;
      return;
    }

    dialog.close();
    form.reset();
    highlightStars(5);
    selectedRating = 5;
    onSubmit(result.review);
  });

  card.appendChild(form);
  dialog.appendChild(card);

  return {
    element: dialog,
    open: ({ destination = "", author = "" } = {}) => {
      // Pre-fill profile name if author not passed
      if (!author) {
        try {
          const raw = localStorage.getItem("yatrastorizz.profile.v1");
          if (raw) {
            const p = JSON.parse(raw);
            if (p?.name) author = p.name;
          }
        } catch {}
      }

      if (destination) destInput.value = destination;
      if (author) authorInput.value = author;
      errorAlert.hidden = true;
      if (!dialog.open) dialog.showModal();
    },
    close: () => dialog.close(),
  };
}
