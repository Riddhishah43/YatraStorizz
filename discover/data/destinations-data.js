/**
 * destinations-data.js — canonical destination dataset (single source of truth).
 *
 * Budget convention: `estimatedDailyBudget` is the estimated cost
 * PER PERSON PER DAY in the given currency. All entries use INR so
 * budget filters compare like with like. Never mix per-trip totals here.
 *
 * Images use deterministic picsum seeds (real, working URLs). Cards and
 * the modal fall back gracefully if an image fails to load.
 */

export const destinations = [
  {
    id: "place-001",
    name: "Manali",
    country: "India",
    region: "Himachal Pradesh",
    description: "A Himalayan town of pine valleys, riverside cafés, and easy access to high-altitude adventure.",
    image: "https://picsum.photos/seed/yatrastorizz-manali/800/600",
    categories: ["Mountains", "Adventure", "Nature"],
    estimatedDailyBudget: { amount: 2500, currency: "INR" },
    bestSeasons: ["Spring", "Summer"],
    idealDurationDays: 4,
    attractions: ["Solang Valley", "Old Manali", "Hadimba Temple"],
    activities: ["Paragliding", "Hiking", "Sightseeing"],
    travelTips: ["Carry warm layers even in summer.", "Book Solang activities a day ahead."],
  },
  {
    id: "place-002",
    name: "Palolem Beach, Goa",
    country: "India",
    region: "Goa",
    description: "A calm, crescent-shaped beach known for silent-noise parties, dolphin trips, and laid-back shacks.",
    image: "https://picsum.photos/seed/yatrastorizz-palolem/800/600",
    categories: ["Beaches", "Nature"],
    estimatedDailyBudget: { amount: 3000, currency: "INR" },
    bestSeasons: ["Autumn", "Winter"],
    idealDurationDays: 3,
    attractions: ["Palolem Beach", "Butterfly Island", "Cotigao Wildlife Sanctuary"],
    activities: ["Kayaking", "Dolphin watching", "Beach hopping"],
    travelTips: ["Visit November to February for the best weather."],
  },
  {
    id: "place-003",
    name: "Jaipur",
    country: "India",
    region: "Rajasthan",
    description: "The Pink City: hill forts, royal palaces, bazaars, and a living craft tradition.",
    image: "https://picsum.photos/seed/yatrastorizz-jaipur/800/600",
    categories: ["Historical Places", "Cultural Experiences", "Cities"],
    estimatedDailyBudget: { amount: 2800, currency: "INR" },
    bestSeasons: ["Autumn", "Winter"],
    idealDurationDays: 3,
    attractions: ["Amber Fort", "Hawa Mahal", "City Palace"],
    activities: ["Heritage walks", "Shopping", "Food trails"],
    travelTips: ["Start fort visits early to avoid crowds and heat."],
  },
  {
    id: "place-004",
    name: "Alleppey Backwaters",
    country: "India",
    region: "Kerala",
    description: "Slow houseboat cruises through palm-fringed canals, lagoons, and village life.",
    image: "https://picsum.photos/seed/yatrastorizz-alleppey/800/600",
    categories: ["Nature", "Cultural Experiences"],
    estimatedDailyBudget: { amount: 3500, currency: "INR" },
    bestSeasons: ["Monsoon", "Winter"],
    idealDurationDays: 3,
    attractions: ["Vembanad Lake", "Marari Beach", "Kumarakom Bird Sanctuary"],
    activities: ["Houseboat stay", "Village cycling", "Ayurvedic massage"],
    travelTips: ["Overnight houseboats include meals — confirm before booking."],
  },
  {
    id: "place-005",
    name: "Rishikesh",
    country: "India",
    region: "Uttarakhand",
    description: "Yoga capital on the Ganges with white-water rafting, cliff jumps, and Himalayan treks nearby.",
    image: "https://picsum.photos/seed/yatrastorizz-rishikesh/800/600",
    categories: ["Adventure", "Mountains", "Nature"],
    estimatedDailyBudget: { amount: 1800, currency: "INR" },
    bestSeasons: ["Spring", "Autumn"],
    idealDurationDays: 4,
    attractions: ["Laxman Jhula", "Triveni Ghat", "Neer Garh Waterfall"],
    activities: ["River rafting", "Yoga retreats", "Bungee jumping"],
    travelTips: ["Rafting seasons follow river levels — check with operators."],
  },
  {
    id: "place-006",
    name: "Santorini",
    country: "Greece",
    region: "Aegean Islands",
    description: "Whitewashed villages over a volcanic caldera, famous for sunsets, wineries, and blue domes.",
    image: "https://picsum.photos/seed/yatrastorizz-santorini/800/600",
    categories: ["Beaches", "Cultural Experiences", "Cities"],
    estimatedDailyBudget: { amount: 12000, currency: "INR" },
    bestSeasons: ["Spring", "Summer"],
    idealDurationDays: 4,
    attractions: ["Oia", "Red Beach", "Akrotiri ruins"],
    activities: ["Catamaran sailing", "Wine tasting", "Caldera hikes"],
    travelTips: ["Stay in Imerovigli for caldera views at lower prices than Oia."],
  },
  {
    id: "place-007",
    name: "Kyoto",
    country: "Japan",
    region: "Kansai",
    description: "Temples, tea houses, and gardens — Japan's old capital at its best in cherry-blossom and maple seasons.",
    image: "https://picsum.photos/seed/yatrastorizz-kyoto/800/600",
    categories: ["Cultural Experiences", "Historical Places", "Cities"],
    estimatedDailyBudget: { amount: 10000, currency: "INR" },
    bestSeasons: ["Spring", "Autumn"],
    idealDurationDays: 5,
    attractions: ["Fushimi Inari", "Arashiyama Bamboo Grove", "Kinkaku-ji"],
    activities: ["Tea ceremony", "Temple visits", "Kimono walks"],
    travelTips: ["Reserve popular temples and restaurants well in advance in peak seasons."],
  },
  {
    id: "place-008",
    name: "Banff",
    country: "Canada",
    region: "Alberta",
    description: "Turquoise lakes, glaciers, and wildlife in the heart of the Canadian Rockies.",
    image: "https://picsum.photos/seed/yatrastorizz-banff/800/600",
    categories: ["Mountains", "Nature", "Adventure", "Wildlife"],
    estimatedDailyBudget: { amount: 15000, currency: "INR" },
    bestSeasons: ["Summer", "Winter"],
    idealDurationDays: 5,
    attractions: ["Lake Louise", "Moraine Lake", "Banff Gondola"],
    activities: ["Canoeing", "Skiing", "Wildlife spotting"],
    travelTips: ["Shuttle bookings are required for Moraine Lake access."],
  },
  {
    id: "place-009",
    name: "Maasai Mara",
    country: "Kenya",
    region: "Narok County",
    description: "Savannah grasslands hosting the Great Migration and year-round big-cat sightings.",
    image: "https://picsum.photos/seed/yatrastorizz-mara/800/600",
    categories: ["Wildlife", "Nature", "Adventure"],
    estimatedDailyBudget: { amount: 25000, currency: "INR" },
    bestSeasons: ["Summer", "Autumn"],
    idealDurationDays: 4,
    attractions: ["Mara River crossings", "Olare Motorogi Conservancy"],
    activities: ["Game drives", "Hot-air balloon safari", "Maasai village visits"],
    travelTips: ["July to October offers the best migration viewing."],
  },
  {
    id: "place-010",
    name: "Paris",
    country: "France",
    region: "Île-de-France",
    description: "Museums, monuments, and neighbourhoods made for walking — a classic city break.",
    image: "https://picsum.photos/seed/yatrastorizz-paris/800/600",
    categories: ["Cities", "Cultural Experiences", "Historical Places"],
    estimatedDailyBudget: { amount: 14000, currency: "INR" },
    bestSeasons: ["Spring", "Autumn"],
    idealDurationDays: 5,
    attractions: ["Eiffel Tower", "Louvre", "Montmartre"],
    activities: ["Museum hopping", "Seine cruise", "Café culture"],
    travelTips: ["Museum passes save time and money on a packed itinerary."],
  },
  {
    id: "place-011",
    name: "Uluwatu, Bali",
    country: "Indonesia",
    region: "Bali",
    description: "Cliff-top temples, surf breaks, and beach clubs on Bali's Bukit Peninsula.",
    image: "https://picsum.photos/seed/yatrastorizz-uluwatu/800/600",
    categories: ["Beaches", "Nature", "Cultural Experiences", "Adventure"],
    estimatedDailyBudget: { amount: 4500, currency: "INR" },
    bestSeasons: ["Spring", "Summer", "Autumn"],
    idealDurationDays: 6,
    attractions: ["Uluwatu Temple", "Padang Padang Beach", "Nyang Nyang Beach"],
    activities: ["Surfing", "Sunset kecak dance", "Cliff walks"],
    travelTips: ["Dry season (April–October) has the most reliable surf."],
  },
  {
    id: "place-012",
    name: "Zermatt",
    country: "Switzerland",
    region: "Valais",
    description: "A car-free alpine village beneath the Matterhorn with world-class skiing and summer trails.",
    image: "https://picsum.photos/seed/yatrastorizz-zermatt/800/600",
    categories: ["Mountains", "Adventure"],
    estimatedDailyBudget: { amount: 20000, currency: "INR" },
    bestSeasons: ["Winter", "Summer"],
    idealDurationDays: 5,
    attractions: ["Matterhorn Glacier Paradise", "Gornergrat Railway"],
    activities: ["Skiing", "Mountain biking", "Glacier hiking"],
    travelTips: ["The Gornergrat railway runs year-round and books out early."],
  },
];

/**
 * Validate the dataset: required fields present, IDs unique.
 * Returns { valid, errors }. Entry point logs warnings in dev.
 * @param {unknown} list
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDestinations(list) {
  const errors = [];
  if (!Array.isArray(list)) return { valid: false, errors: ["Dataset is not an array."] };
  const seen = new Set();
  list.forEach((d, i) => {
    if (!d || typeof d !== "object") {
      errors.push(`Record ${i} is not an object.`);
      return;
    }
    if (typeof d.id !== "string" || !d.id) errors.push(`Record ${i} has no id.`);
    else if (seen.has(d.id)) errors.push(`Duplicate id "${d.id}".`);
    else seen.add(d.id);
    if (typeof d.name !== "string" || !d.name.trim()) errors.push(`Record ${d.id ?? i} has no name.`);
    if (typeof d.country !== "string" || !d.country.trim()) errors.push(`Record ${d.id ?? i} has no country.`);
  });
  return { valid: errors.length === 0, errors };
}
