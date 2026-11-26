/**
 * /api/destinations — Vercel Serverless Function
 * Query, search, and retrieve travel destinations.
 */

const CANONICAL_DESTINATIONS = [
  {
    id: "kyoto-japan",
    name: "Kyoto",
    country: "Japan",
    region: "Kansai",
    category: "Culture",
    categories: ["Culture", "Historical Places", "Nature"],
    description: "Temple lanes, quiet bamboo groves, and centuries of living tea-ceremony tradition.",
    image: "https://picsum.photos/seed/yatrastorizz-kyoto/800/600",
    estimatedDailyBudget: { amount: 6500, currency: "INR" },
    rating: 4.9,
    reviewsCount: 342,
    idealDurationDays: 5,
    attractions: ["Fushimi Inari", "Arashiyama Bamboo Grove", "Kinkaku-ji"],
    activities: ["Tea Ceremony", "Temple Walks", "Kimono Experience"],
    bestSeasons: ["Spring", "Autumn"]
  },
  {
    id: "bali-indonesia",
    name: "Bali",
    country: "Indonesia",
    region: "Bali",
    category: "Beaches",
    categories: ["Beaches", "Nature", "Relaxation"],
    description: "Cliff temples over the surf, emerald rice terraces, and slow tropical days.",
    image: "https://picsum.photos/seed/yatrastorizz-bali/800/600",
    estimatedDailyBudget: { amount: 4200, currency: "INR" },
    rating: 4.8,
    reviewsCount: 512,
    idealDurationDays: 6,
    attractions: ["Uluwatu Temple", "Tegallalang Rice Terrace", "Seminyak Beach"],
    activities: ["Surfing", "Yoga Retreats", "Beach Sunset Lounging"],
    bestSeasons: ["Summer", "Autumn"]
  },
  {
    id: "paris-france",
    name: "Paris",
    country: "France",
    region: "Île-de-France",
    category: "City Adventures",
    categories: ["City Adventures", "Culture", "Art & Architecture"],
    description: "Cobblestone boulevards, world-class art, sidewalk bistros, and iconic river skylines.",
    image: "https://picsum.photos/seed/yatrastorizz-paris/800/600",
    estimatedDailyBudget: { amount: 8500, currency: "INR" },
    rating: 4.7,
    reviewsCount: 689,
    idealDurationDays: 4,
    attractions: ["Eiffel Tower", "Louvre Museum", "Montmartre"],
    activities: ["Museum Tours", "Seine River Cruise", "Café Hopping"],
    bestSeasons: ["Spring", "Summer", "Autumn"]
  },
  {
    id: "manali-india",
    name: "Manali",
    country: "India",
    region: "Himachal Pradesh",
    category: "Mountains",
    categories: ["Mountains", "Adventure", "Nature"],
    description: "Pine valleys, riverside retreats, and mountain passes leading to high-altitude adventure.",
    image: "https://picsum.photos/seed/yatrastorizz-manali/800/600",
    estimatedDailyBudget: { amount: 2500, currency: "INR" },
    rating: 4.8,
    reviewsCount: 428,
    idealDurationDays: 4,
    attractions: ["Solang Valley", "Old Manali", "Hadimba Temple", "Rohtang Pass"],
    activities: ["Paragliding", "Trekking", "Café Hopping"],
    bestSeasons: ["Spring", "Summer"]
  },
  {
    id: "santorini-greece",
    name: "Santorini",
    country: "Greece",
    region: "South Aegean",
    category: "Beaches",
    categories: ["Beaches", "Romantic", "Views"],
    description: "Whitewashed caldera villages, cobalt-blue domes, and dramatic Aegean sunsets.",
    image: "https://picsum.photos/seed/yatrastorizz-santorini/800/600",
    estimatedDailyBudget: { amount: 9000, currency: "INR" },
    rating: 4.9,
    reviewsCount: 295,
    idealDurationDays: 4,
    attractions: ["Oia Sunset Viewpoint", "Red Beach", "Fira Caldera"],
    activities: ["Sunset Catamaran Cruise", "Wine Tasting", "Cliff Walking"],
    bestSeasons: ["Spring", "Summer", "Autumn"]
  },
  {
    id: "jaipur-india",
    name: "Jaipur",
    country: "India",
    region: "Rajasthan",
    category: "Historical Places",
    categories: ["Historical Places", "Culture", "Heritage"],
    description: "The Pink City: grand hilltop forts, royal palaces, vibrant bazaars, and living craft traditions.",
    image: "https://picsum.photos/seed/yatrastorizz-jaipur/800/600",
    estimatedDailyBudget: { amount: 2800, currency: "INR" },
    rating: 4.7,
    reviewsCount: 380,
    idealDurationDays: 3,
    attractions: ["Amber Fort", "Hawa Mahal", "City Palace", "Nahargarh"],
    activities: ["Fort Exploration", "Bazaar Shopping", "Rajasthani Dining"],
    bestSeasons: ["Autumn", "Winter"]
  }
];

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed. Use GET." });
    return;
  }

  const { id, q, category, maxBudget, sort } = req.query || {};

  // Single ID lookup
  if (id) {
    const found = CANONICAL_DESTINATIONS.find(
      (d) => d.id.toLowerCase() === String(id).toLowerCase()
    );
    if (!found) {
      res.status(404).json({ error: "Destination not found" });
      return;
    }
    res.status(200).json({ destination: found });
    return;
  }

  let results = [...CANONICAL_DESTINATIONS];

  // Query search
  if (q && typeof q === "string" && q.trim()) {
    const term = q.trim().toLowerCase();
    results = results.filter((d) => {
      const matchName = d.name.toLowerCase().includes(term);
      const matchCountry = d.country.toLowerCase().includes(term);
      const matchRegion = d.region.toLowerCase().includes(term);
      const matchCategory = d.category.toLowerCase().includes(term);
      const matchAttraction = d.attractions?.some((a) => a.toLowerCase().includes(term));
      return matchName || matchCountry || matchRegion || matchCategory || matchAttraction;
    });
  }

  // Category filter
  if (category && typeof category === "string" && category.trim() && category !== "All") {
    const cat = category.trim().toLowerCase();
    results = results.filter(
      (d) =>
        d.category.toLowerCase() === cat ||
        d.categories?.some((c) => c.toLowerCase() === cat)
    );
  }

  // Max Budget filter
  if (maxBudget) {
    const num = Number(maxBudget);
    if (!isNaN(num) && num > 0) {
      results = results.filter((d) => d.estimatedDailyBudget.amount <= num);
    }
  }

  // Sorting
  if (sort === "budget-asc") {
    results.sort((a, b) => a.estimatedDailyBudget.amount - b.estimatedDailyBudget.amount);
  } else if (sort === "budget-desc") {
    results.sort((a, b) => b.estimatedDailyBudget.amount - a.estimatedDailyBudget.amount);
  } else if (sort === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  } else if (sort === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  res.status(200).json({
    total: results.length,
    destinations: results
  });
}
