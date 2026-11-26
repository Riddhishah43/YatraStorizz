/**
 * /api/trips — Vercel Serverless Function
 * Manage user trips, itineraries, and budget allocations.
 */

const SAMPLE_TRIPS = [
  {
    id: "trip-001",
    title: "Himachal High Passes & Old Manali",
    destination: "Manali, Himachal Pradesh",
    status: "Planning",
    startDate: "2026-12-15",
    endDate: "2026-12-20",
    daysCount: 5,
    budgetTotal: 25000,
    currency: "INR",
    spentSoFar: 6200,
    activities: [
      { day: 1, time: "10:00", title: "Arrive & Riverside Café Brunch", cost: 1200 },
      { day: 2, time: "09:00", title: "Solang Valley Paragliding", cost: 3500 },
      { day: 3, time: "11:00", title: "Old Manali Handloom Walk", cost: 1500 }
    ]
  },
  {
    id: "trip-002",
    title: "Kyoto Bamboo Groves & Temple Trail",
    destination: "Kyoto, Japan",
    status: "Confirmed",
    startDate: "2027-03-25",
    endDate: "2027-03-31",
    daysCount: 6,
    budgetTotal: 85000,
    currency: "INR",
    spentSoFar: 42000,
    activities: [
      { day: 1, time: "08:00", title: "Arashiyama Early Bamboo Walk", cost: 0 },
      { day: 2, time: "10:30", title: "Fushimi Inari Torii Gate Hike", cost: 0 },
      { day: 3, time: "14:00", title: "Traditional Matcha Tea Ceremony", cost: 4500 }
    ]
  }
];

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    const { id } = req.query || {};
    if (id) {
      const trip = SAMPLE_TRIPS.find((t) => t.id === id);
      if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
      }
      res.status(200).json({ trip });
      return;
    }

    res.status(200).json({
      total: SAMPLE_TRIPS.length,
      trips: SAMPLE_TRIPS
    });
    return;
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { title, destination, startDate, endDate, budgetTotal } = body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: "Trip title is required." });
      return;
    }
    if (!destination || !destination.trim()) {
      res.status(400).json({ error: "Destination is required." });
      return;
    }

    const newTrip = {
      id: `trip-${Date.now()}`,
      title: title.trim(),
      destination: destination.trim(),
      status: "Planning",
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      daysCount: 4,
      budgetTotal: Number(budgetTotal) || 20000,
      currency: "INR",
      spentSoFar: 0,
      activities: [],
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: "Trip created successfully.",
      trip: newTrip
    });
    return;
  }

  res.status(405).json({ error: "Method not allowed. Use GET or POST." });
}
