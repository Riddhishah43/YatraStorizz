/**
 * testimonials.js — accessible traveller stories slider (Prompt 8 & Reviews).
 * Pure DOM, accessible keyboard & button controls, Google Reviews rating summary,
 * and interactive "Write a Review" dialog.
 */
import { reviewsService } from "../../services/reviews-service.js";
import { createTestimonialCard } from "../../components/testimonial-card.js";
import { createReviewModal } from "../../components/review-modal.js";
import { el, clear, qs } from "../../utils/dom-utils.js";

let modalInstance = null;

export function initTestimonials(root = document) {
  const section = qs(root, "#testimonials");
  const mount = qs(root, "#testimonials-mount");
  if (!section || !mount) return "none";
  clear(mount);

  const heading = qs(section, "[data-testimonials-heading]");
  if (heading) heading.textContent = "Stories From Happy Travellers";
  const sub = qs(section, "[data-testimonials-sub]");
  if (sub) {
    sub.textContent = "Every journey is different. Here's what travellers love about planning with YaatraStorizz.";
  }

  // Ensure Review Modal is mounted on body
  if (!modalInstance && typeof document !== "undefined") {
    modalInstance = createReviewModal({
      onSubmit: () => {
        initTestimonials(root);
      },
    });
    document.body.appendChild(modalInstance.element);
  }

  // Google Reviews Summary Bar
  const summary = reviewsService.getRatingSummary();
  const summaryBar = el("div", "reviews-summary-bar");

  const scoreWrap = el("div", "reviews-summary-bar__score");
  const scoreNum = el("span", "score-val", `${summary.average.toFixed(1)}`);
  const starsWrap = el("span", "score-stars", "★".repeat(Math.round(summary.average)));
  const countDesc = el(
    "span",
    "score-count",
    `Overall Rating · Based on ${summary.total} traveller experiences`
  );
  scoreWrap.appendChild(scoreNum);
  scoreWrap.appendChild(starsWrap);
  scoreWrap.appendChild(countDesc);

  const writeBtn = el("button", "btn btn--primary btn--small reviews-summary-bar__btn", "★ Write a Review");
  writeBtn.type = "button";
  writeBtn.addEventListener("click", () => {
    modalInstance?.open();
  });

  summaryBar.appendChild(scoreWrap);
  summaryBar.appendChild(writeBtn);
  mount.appendChild(summaryBar);

  const items = reviewsService.getAllReviews();
  if (items.length === 0) {
    mount.appendChild(el("p", "empty-state", "No traveller stories available yet. Be the first to review!"));
    return "empty";
  }

  // Slider container
  const slider = el("div", "slider");
  slider.setAttribute("role", "region");
  slider.setAttribute("aria-label", "Traveller stories carousel");
  slider.setAttribute("tabindex", "0");

  const track = el("div", "slider__track");
  const cards = items.map((t) => {
    const slide = el("div", "slider__slide");
    slide.appendChild(createTestimonialCard(t));
    track.appendChild(slide);
    return slide;
  });
  slider.appendChild(track);

  // Controls (Prev / Next & Dots)
  const controls = el("div", "slider__controls");

  const prevBtn = el("button", "btn btn--ghost btn--small slider__btn", "← Previous");
  prevBtn.type = "button";
  prevBtn.setAttribute("aria-label", "Previous story");

  const dotsWrap = el("div", "slider__dots");
  dotsWrap.setAttribute("role", "tablist");
  dotsWrap.setAttribute("aria-label", "Story selection");

  const dots = items.map((_, i) => {
    const dot = el("button", "slider__dot", "");
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to story ${i + 1}`);
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  const nextBtn = el("button", "btn btn--ghost btn--small slider__btn", "Next →");
  nextBtn.type = "button";
  nextBtn.setAttribute("aria-label", "Next story");

  controls.appendChild(prevBtn);
  controls.appendChild(dotsWrap);
  controls.appendChild(nextBtn);
  slider.appendChild(controls);

  mount.appendChild(slider);

  let currentIndex = 0;

  function goTo(index) {
    if (index < 0) currentIndex = items.length - 1;
    else if (index >= items.length) currentIndex = 0;
    else currentIndex = index;

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === currentIndex);
      dot.setAttribute("aria-selected", i === currentIndex ? "true" : "false");
    });
  }

  prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
  nextBtn.addEventListener("click", () => goTo(currentIndex + 1));

  // Keyboard navigation when focused
  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(currentIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(currentIndex + 1);
    }
  });

  goTo(0);
  return "slider";
}
