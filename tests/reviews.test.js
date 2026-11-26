// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  createReviewsService,
  REVIEWS_STORAGE_KEY,
  DEFAULT_STARTER_REVIEWS,
} from "../js/services/reviews-service.js";

beforeEach(() => {
  localStorage.clear();
});

describe("reviews service: retrieval & ratings", () => {
  it("returns default starter reviews when storage is uninitialized", () => {
    const service = createReviewsService();
    const all = service.getAllReviews();
    expect(all.length).toBeGreaterThanOrEqual(4);
    expect(all[0].destination).toBeTruthy();
    expect(all[0].rating).toBeGreaterThanOrEqual(1);
  });

  it("calculates accurate Google-style average rating and star distribution", () => {
    const service = createReviewsService();
    const summary = service.getRatingSummary();
    expect(summary.total).toBe(DEFAULT_STARTER_REVIEWS.length);
    expect(summary.average).toBeGreaterThanOrEqual(4.0);
    expect(summary.average).toBeLessThanOrEqual(5.0);
    expect(summary.distribution[5]).toBeGreaterThan(0);
  });

  it("filters reviews by destination substring", () => {
    const service = createReviewsService();
    const kyotoReviews = service.getAllReviews({ destination: "Kyoto" });
    expect(kyotoReviews.length).toBeGreaterThanOrEqual(1);
    expect(kyotoReviews.every((r) => r.destination.toLowerCase().includes("kyoto"))).toBe(true);

    const none = service.getAllReviews({ destination: "NonExistentPlaceXYZ" });
    expect(none.length).toBe(0);
  });
});

describe("reviews service: submission & validation", () => {
  it("submits a valid review and persists it to storage", () => {
    const service = createReviewsService();
    const res = service.addReview({
      destination: "Santorini, Greece",
      rating: 5,
      title: "Magical sunsets in Oia",
      comment: "The whitewashed houses and Aegean views were breathtaking. Loved every minute of our stay!",
      author: "Riddhi Sen",
      tags: ["Scenic Views", "Peaceful Escape"],
      travelDate: "September 2026",
    });

    expect(res.ok).toBe(true);
    expect(res.review.id).toMatch(/^rev-/);
    expect(res.review.avatar).toBe("RS");
    expect(res.review.rating).toBe(5);

    // Verify it is now at the top of the list
    const updated = service.getAllReviews();
    expect(updated[0].destination).toBe("Santorini, Greece");
    expect(updated[0].author).toBe("Riddhi Sen");
  });

  it("rejects invalid ratings and too-short comments", () => {
    const service = createReviewsService();

    // Missing destination
    const noDest = service.addReview({ rating: 5, comment: "Great place to visit" });
    expect(noDest.ok).toBe(false);
    expect(noDest.errors.destination).toBeTruthy();

    // Invalid rating
    const badRating = service.addReview({ destination: "Paris", rating: 6, comment: "Great!" });
    expect(badRating.ok).toBe(false);
    expect(badRating.errors.rating).toMatch(/between 1 and 5/);

    // Too short comment
    const shortComment = service.addReview({ destination: "Paris", rating: 4, comment: "Hi" });
    expect(shortComment.ok).toBe(false);
    expect(shortComment.errors.comment).toMatch(/at least 5 characters/);
  });

  it("deletes a review by id", () => {
    const service = createReviewsService();
    const all = service.getAllReviews();
    const targetId = all[0].id;

    expect(service.deleteReview(targetId)).toBe(true);
    const after = service.getAllReviews();
    expect(after.find((r) => r.id === targetId)).toBeUndefined();
  });
});
