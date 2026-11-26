/**
 * /api/reviews — Vercel Serverless Function
 * Fetch and post traveler reviews with Google Reviews style ratings & breakdowns.
 */

const STARTER_REVIEWS = [
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
    verified: true
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
    verified: true
  },
  {
    id: "rev-03",
    destination: "Udaipur & Jaipur",
    rating: 5,
    title: "Royal heritage, rooftop dinners, and seamless itineraries",
    comment: "Splitting days between lake cruises and fort explorations was effortless with the drag-and-drop itinerary tool. The expense breakdown prevented any unexpected shocks.",
    author: "Meera Patel",
    avatar: "MP",
    role: "Cultural Explorer",
    tags: ["Cultural Heritage", "Scenic Views", "Great Food"],
    travelDate: "November 2026",
    createdAt: "2026-11-10T09:15:00Z",
    verified: true
  },
  {
    id: "rev-04",
    destination: "Bali, Indonesia",
    rating: 4,
    title: "Great beach sunsets and rice terraces",
    comment: "Loved the curated beach cafes and cliffside temples in Uluwatu. The budget tracker made currency conversion to INR super handy.",
    author: "Karan Johar",
    avatar: "KJ",
    role: "Adventure Seeker",
    tags: ["Scenic Views", "Easy Transport"],
    travelDate: "September 2026",
    createdAt: "2026-09-21T16:00:00Z",
    verified: true
  }
];

function calculateStats(reviewsList) {
  const total = reviewsList.length;
  if (total === 0) {
    return {
      total: 0,
      average: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const r of reviewsList) {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
    breakdown[star] = (breakdown[star] || 0) + 1;
    sum += Number(r.rating) || 5;
  }

  const average = Number((sum / total).toFixed(1));

  return {
    total,
    average,
    breakdown
  };
}

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    const { destination, minRating } = req.query || {};
    let list = [...STARTER_REVIEWS];

    if (destination && typeof destination === "string") {
      const term = destination.toLowerCase().trim();
      list = list.filter((r) => r.destination.toLowerCase().includes(term));
    }

    if (minRating) {
      const min = Number(minRating);
      if (!isNaN(min)) {
        list = list.filter((r) => r.rating >= min);
      }
    }

    const stats = calculateStats(list);

    res.status(200).json({
      stats,
      reviews: list
    });
    return;
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { author, destination, rating, title, comment, tags } = body;

    if (!author || !author.trim()) {
      res.status(400).json({ error: "Author name is required." });
      return;
    }
    if (!destination || !destination.trim()) {
      res.status(400).json({ error: "Destination name is required." });
      return;
    }
    if (!title || !title.trim()) {
      res.status(400).json({ error: "Review title is required." });
      return;
    }
    if (!comment || !comment.trim()) {
      res.status(400).json({ error: "Review comment is required." });
      return;
    }

    const initials = author.trim().split(/\s+/).slice(0, 2).map((s) => s[0].toUpperCase()).join("");
    const newReview = {
      id: `rev-${Date.now()}`,
      author: author.trim(),
      avatar: initials || "YS",
      destination: destination.trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      title: title.trim(),
      comment: comment.trim(),
      tags: Array.isArray(tags) ? tags : ["Verified Traveler"],
      role: "Verified Traveler",
      travelDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      createdAt: new Date().toISOString(),
      verified: true
    };

    res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: newReview
    });
    return;
  }

  res.status(405).json({ error: "Method not allowed. Use GET or POST." });
}
