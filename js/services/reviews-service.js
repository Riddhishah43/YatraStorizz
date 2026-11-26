/**
 * reviews-service.js — travel reviews & ratings management.
 * Persistent in localStorage under "yatrastorizz.reviews.v1".
 * Calculates Google Reviews-style 1-5 star ratings, breakdowns, and highlights.
 */

export const REVIEWS_STORAGE_KEY = "yatrastorizz.reviews.v1";

export const REVIEW_HIGHLIGHTS = Object.freeze([
  "Scenic Views",
  "Family-Friendly",
  "Budget-Friendly",
  "Great Food",
  "Cultural Heritage",
  "Peaceful Escape",
  "Adventure & Trekking",
  "Easy Transport",
]);

export const DEFAULT_STARTER_REVIEWS = Object.freeze([
  {
    id: "rev-01",
    destination: "Himachal Valley",
    rating: 5,
    title: "Breathtaking mountain passes and peaceful stays",
    comment: "Being able to see day-by-day activities alongside my remaining budget in rupees made my two-week Himachal trip completely stress-free. Solang valley trek was the highlight!",
    author: "Aarav Sharma",
    avatar: "AS",
    role: "Solo Backpacker",
    tags: ["Scenic Views", "Adventure & Trekking", "Budget-Friendly"],
    travelDate: "October 2026",
    createdAt: "2026-10-14T10:00:00Z",
    verified: true,
    isDemo: true,
  },
  {
    id: "rev-02",
    destination: "Kyoto, Japan",
    rating: 5,
    title: "Serene bamboo groves and temple walks",
    comment: "Walking through Arashiyama early in the morning was unforgettable. YaatraStorizz helped us schedule temple visits before the tour buses arrived. Highly recommend buying an IC travel card.",
    author: "Priya & Rohan",
    avatar: "PR",
    role: "Couple Travel",
    tags: ["Cultural Heritage", "Peaceful Escape", "Great Food"],
    travelDate: "November 2026",
    createdAt: "2026-11-02T14:30:00Z",
    verified: true,
    isDemo: true,
  },
  {
    id: "rev-03",
    destination: "Jaipur, India",
    rating: 5,
    title: "Rich heritage, amazing food, and warm hospitality",
    comment: "Planning Jaipur with kids requires strict schedules and budget caps. YaatraStorizz kept all our stops and tickets in one calm place. Amber Fort and City Palace are must-visits!",
    author: "The Sen Family",
    avatar: "SF",
    role: "Family Vacation",
    tags: ["Cultural Heritage", "Family-Friendly", "Great Food"],
    travelDate: "September 2026",
    createdAt: "2026-09-20T09:15:00Z",
    verified: true,
    isDemo: true,
  },
  {
    id: "rev-04",
    destination: "Manali, India",
    rating: 5,
    title: "Crisp pine air and cozy river cafes in Old Manali",
    comment: "Old Manali has incredible cafes and quiet trails. We reshuffled our days on the fly using the itinerary timeline. Be sure to check weather alerts before heading up to Rohtang Pass.",
    author: "Karan Mehta",
    avatar: "KM",
    role: "Weekend Explorer",
    tags: ["Scenic Views", "Peaceful Escape", "Adventure & Trekking"],
    travelDate: "August 2026",
    createdAt: "2026-08-18T16:45:00Z",
    verified: true,
    isDemo: true,
  },
  {
    id: "rev-05",
    destination: "Bali, Indonesia",
    rating: 4,
    title: "Lush rice terraces and vibrant sunset beaches",
    comment: "Ubud was peaceful and magical. Renting a scooter made it easy to get around the rice fields. Food was delicious and very affordable.",
    author: "Ananya Roy",
    avatar: "AR",
    role: "Digital Nomad",
    tags: ["Scenic Views", "Budget-Friendly", "Peaceful Escape"],
    travelDate: "July 2026",
    createdAt: "2026-07-22T11:00:00Z",
    verified: true,
    isDemo: true,
  },
]);

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createReviewsService({
  storageKey = REVIEWS_STORAGE_KEY,
  getStorage = storage,
} = {}) {
  const readAll = () => {
    try {
      const s = getStorage();
      const raw = s?.getItem(storageKey);
      if (!raw) {
        return [...DEFAULT_STARTER_REVIEWS];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((r) => r && typeof r === "object");
      }
      return [...DEFAULT_STARTER_REVIEWS];
    } catch {
      return [...DEFAULT_STARTER_REVIEWS];
    }
  };

  const writeAll = (items) => {
    try {
      getStorage()?.setItem(storageKey, JSON.stringify(items));
      return true;
    } catch {
      return false;
    }
  };

  return {
    getAllReviews(filter = {}) {
      let list = readAll();
      if (filter.destination) {
        const query = filter.destination.toLowerCase().trim();
        list = list.filter((r) => r.destination?.toLowerCase().includes(query));
      }
      if (filter.minRating) {
        list = list.filter((r) => Number(r.rating) >= filter.minRating);
      }
      return list;
    },

    getRatingSummary(destination = "") {
      const list = destination
        ? readAll().filter((r) => r.destination?.toLowerCase().includes(destination.toLowerCase().trim()))
        : readAll();

      const total = list.length;
      if (total === 0) {
        return {
          average: 5.0,
          total: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
      }

      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let sum = 0;
      for (const r of list) {
        const stars = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
        distribution[stars] = (distribution[stars] || 0) + 1;
        sum += stars;
      }

      const average = Number((sum / total).toFixed(1));
      return {
        average,
        total,
        distribution,
      };
    },

    addReview(input = {}) {
      const errors = {};
      const rating = Number(input.rating);
      if (!rating || rating < 1 || rating > 5) {
        errors.rating = "Please select a star rating between 1 and 5.";
      }

      const destination = typeof input.destination === "string" ? input.destination.trim() : "";
      if (!destination) {
        errors.destination = "Destination or trip name is required.";
      }

      const comment = typeof input.comment === "string" ? input.comment.trim() : "";
      if (!comment || comment.length < 5) {
        errors.comment = "Review comment must be at least 5 characters.";
      }

      if (Object.keys(errors).length > 0) {
        return { ok: false, errors };
      }

      const author = typeof input.author === "string" && input.author.trim() ? input.author.trim() : "Traveller";
      const parts = author.split(/\s+/).filter(Boolean);
      const avatar = parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

      const newReview = {
        id: `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        destination,
        rating: Math.round(rating),
        title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : `${destination} Experience`,
        comment,
        author,
        avatar,
        role: input.role || "Traveller",
        tags: Array.isArray(input.tags) ? input.tags : [],
        travelDate: input.travelDate || "Recently",
        createdAt: new Date().toISOString(),
        verified: true,
        isDemo: false,
      };

      const all = readAll();
      all.unshift(newReview);
      writeAll(all);

      return { ok: true, review: newReview };
    },

    deleteReview(id) {
      if (!id) return false;
      const all = readAll().filter((r) => r.id !== id);
      return writeAll(all);
    },
  };
}

export const reviewsService = createReviewsService();
