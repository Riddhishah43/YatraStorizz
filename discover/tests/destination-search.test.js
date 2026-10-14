import { describe, it, expect } from "vitest";
import {
  normalizeQuery,
  getSearchableText,
  matchesQuery,
  searchDestinations,
} from "../js/destination-search.js";
import { applyFilters, createDefaultFilters } from "../js/destination-filters.js";

/** Small predictable fixture — no network, no images involved. */
const fixtures = [
  {
    id: "place-001",
    name: "Manali",
    country: "India",
    region: "Himachal Pradesh",
    description: "Mountain valleys and adventure sports.",
    categories: ["Mountains", "Adventure", "Nature"],
    estimatedDailyBudget: { amount: 2500, currency: "INR" },
    bestSeasons: ["Spring", "Summer"],
    attractions: ["Solang Valley"],
    activities: ["Paragliding"],
  },
  {
    id: "place-002",
    name: "Jaipur",
    country: "India",
    region: "Rajasthan",
    description: "Pink City forts and palaces.",
    categories: ["Historical Places", "Cultural Experiences"],
    estimatedDailyBudget: { amount: 2800, currency: "INR" },
    bestSeasons: ["Winter"],
    attractions: ["Amber Fort"],
    activities: ["Heritage walks"],
  },
  {
    id: "place-003",
    name: "Kyoto",
    country: "Japan",
    region: "Kansai",
    description: "Temples and gardens.",
    categories: ["Cultural Experiences", "Historical Places"],
    estimatedDailyBudget: { amount: 10000, currency: "INR" },
    bestSeasons: ["Spring", "Autumn"],
    attractions: ["Fushimi Inari"],
    activities: ["Tea ceremony"],
  },
  {
    // Missing most optional fields — must not throw.
    id: "place-004",
    name: "Mystery Cove",
    country: "Nowhere",
  },
];

describe("query normalization", () => {
  it("trims, collapses whitespace, lowercases", () => {
    expect(normalizeQuery("  MaNaLi   Valley ")).toBe("manali valley");
    expect(normalizeQuery("   ")).toBe("");
    expect(normalizeQuery(null)).toBe("");
    expect(normalizeQuery(undefined)).toBe("");
  });
});

describe("empty queries", () => {
  it("returns all valid records for empty / whitespace queries", () => {
    expect(searchDestinations(fixtures, "").map((d) => d.id)).toEqual([
      "place-001",
      "place-002",
      "place-003",
      "place-004",
    ]);
    expect(searchDestinations(fixtures, "   ").length).toBe(4);
  });
  it("returns a new array, not the input reference", () => {
    expect(searchDestinations(fixtures, "")).not.toBe(fixtures);
  });
});

describe("matching", () => {
  it("is case-insensitive", () => {
    expect(searchDestinations(fixtures, "KYOTO").map((d) => d.id)).toEqual(["place-003"]);
  });
  it("supports partial names", () => {
    expect(searchDestinations(fixtures, "jaip").map((d) => d.id)).toEqual(["place-002"]);
  });
  it("matches country and region", () => {
    expect(searchDestinations(fixtures, "japan").map((d) => d.id)).toEqual(["place-003"]);
    expect(searchDestinations(fixtures, "rajasthan").map((d) => d.id)).toEqual(["place-002"]);
  });
  it("matches categories and description keywords", () => {
    expect(searchDestinations(fixtures, "adventure").map((d) => d.id)).toEqual(["place-001"]);
    expect(searchDestinations(fixtures, "temples").map((d) => d.id)).toEqual(["place-003"]);
  });
  it("requires every token to match (AND semantics)", () => {
    expect(searchDestinations(fixtures, "india mountains").map((d) => d.id)).toEqual(["place-001"]);
    expect(searchDestinations(fixtures, "india japan")).toEqual([]);
  });
  it("returns [] when nothing matches", () => {
    expect(searchDestinations(fixtures, "antarctica")).toEqual([]);
  });
});

describe("robustness", () => {
  it("handles empty datasets and non-array input", () => {
    expect(searchDestinations([], "goa")).toEqual([]);
    expect(searchDestinations(null, "goa")).toEqual([]);
  });
  it("skips invalid records", () => {
    const list = [null, "nope", 42, fixtures[0]];
    expect(searchDestinations(list, "").map((d) => d.id)).toEqual(["place-001"]);
    expect(searchDestinations(list, "manali").map((d) => d.id)).toEqual(["place-001"]);
  });
  it("handles destinations with missing optional fields", () => {
    expect(() => searchDestinations(fixtures, "mystery")).not.toThrow();
    expect(searchDestinations(fixtures, "mystery").map((d) => d.id)).toEqual(["place-004"]);
    expect(getSearchableText(fixtures[3])).toContain("mystery cove");
    expect(matchesQuery(fixtures[3], "nowhere")).toBe(true);
  });
  it("does not mutate the input dataset", () => {
    const snapshot = JSON.parse(JSON.stringify(fixtures));
    searchDestinations(fixtures, "india");
    applyFilters(searchDestinations(fixtures, "india"), { ...createDefaultFilters(), season: "Winter" });
    expect(fixtures).toEqual(snapshot);
  });
});

describe("search + filter composition", () => {
  it("search then filters narrows correctly", () => {
    const searched = searchDestinations(fixtures, "india");
    expect(searched.length).toBe(2);
    const filtered = applyFilters(searched, { ...createDefaultFilters(), categories: ["Adventure"] });
    expect(filtered.map((d) => d.id)).toEqual(["place-001"]);
  });
  it("filters then search works the same set-wise", () => {
    const filtered = applyFilters(fixtures, { ...createDefaultFilters(), country: "India" });
    const searched = searchDestinations(filtered, "forts");
    expect(searched.map((d) => d.id)).toEqual(["place-002"]);
  });
});
