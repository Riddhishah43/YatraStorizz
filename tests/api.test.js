import { describe, it, expect } from "vitest";
import healthHandler from "../api/health.js";
import destinationsHandler from "../api/destinations.js";
import reviewsHandler from "../api/reviews.js";
import authHandler from "../api/auth.js";
import tripsHandler from "../api/trips.js";

function createMockReqRes({ method = "GET", query = {}, body = null } = {}) {
  const req = {
    method,
    query,
    body,
    headers: {}
  };

  let statusCode = 200;
  let responseData = null;
  let ended = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      ended = true;
      return this;
    },
    end() {
      ended = true;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    },
    isEnded() {
      return ended;
    }
  };

  return { req, res };
}

describe("Vercel Serverless Backend APIs", () => {
  describe("/api/health", () => {
    it("returns status 200 and healthy service metadata", () => {
      const { req, res } = createMockReqRes({ method: "GET" });
      healthHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.status).toBe("ok");
      expect(data.service).toBe("YaatraStorizz API");
      expect(data.endpoints).toContain("/api/destinations");
    });

    it("handles OPTIONS preflight gracefully", () => {
      const { req, res } = createMockReqRes({ method: "OPTIONS" });
      healthHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      expect(res.isEnded()).toBe(true);
    });
  });

  describe("/api/destinations", () => {
    it("returns list of curated destinations", () => {
      const { req, res } = createMockReqRes({ method: "GET" });
      destinationsHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.total).toBeGreaterThanOrEqual(5);
      expect(data.destinations[0].name).toBeTruthy();
    });

    it("searches destinations by query keyword", () => {
      const { req, res } = createMockReqRes({ method: "GET", query: { q: "Kyoto" } });
      destinationsHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.destinations.length).toBeGreaterThanOrEqual(1);
      expect(data.destinations[0].name).toBe("Kyoto");
    });

    it("filters destinations by category", () => {
      const { req, res } = createMockReqRes({ method: "GET", query: { category: "Mountains" } });
      destinationsHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.destinations.some((d) => d.name === "Manali")).toBe(true);
    });

    it("filters by max budget", () => {
      const { req, res } = createMockReqRes({ method: "GET", query: { maxBudget: "3000" } });
      destinationsHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.destinations.every((d) => d.estimatedDailyBudget.amount <= 3000)).toBe(true);
    });

    it("retrieves single destination by id", () => {
      const { req, res } = createMockReqRes({ method: "GET", query: { id: "bali-indonesia" } });
      destinationsHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      expect(res.getData().destination.name).toBe("Bali");
    });

    it("returns 404 for unknown destination id", () => {
      const { req, res } = createMockReqRes({ method: "GET", query: { id: "unknown-xyz" } });
      destinationsHandler(req, res);
      expect(res.getStatusCode()).toBe(404);
    });
  });

  describe("/api/reviews", () => {
    it("returns reviews and Google-style stats summary", () => {
      const { req, res } = createMockReqRes({ method: "GET" });
      reviewsHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.stats.total).toBeGreaterThanOrEqual(4);
      expect(data.stats.average).toBeGreaterThanOrEqual(4.0);
      expect(data.stats.breakdown[5]).toBeGreaterThan(0);
    });

    it("validates and accepts new review submissions", () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        body: {
          author: "Riddhi Sen",
          destination: "Manali",
          rating: 5,
          title: "Incredible mountain sunrise!",
          comment: "Solang valley paragliding was breathtaking, high recommended.",
          tags: ["Scenic Views", "Adventure & Trekking"]
        }
      });
      reviewsHandler(req, res);
      expect(res.getStatusCode()).toBe(201);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.review.author).toBe("Riddhi Sen");
      expect(data.review.avatar).toBe("RS");
    });

    it("rejects incomplete review submissions with 400", () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        body: { author: "" }
      });
      reviewsHandler(req, res);
      expect(res.getStatusCode()).toBe(400);
    });
  });

  describe("/api/auth", () => {
    it("provides 1-click demo user login", () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        body: { action: "demo" }
      });
      authHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.ok).toBe(true);
      expect(data.user.name).toBe("Asha Sharma");
      expect(data.token).toBeTruthy();
    });

    it("handles login with email and password", () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        body: {
          action: "login",
          email: "riddhi@example.com",
          password: "password123"
        }
      });
      authHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.ok).toBe(true);
      expect(data.user.email).toBe("riddhi@example.com");
    });

    it("handles signup with full name, email, password, and home city", () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        body: {
          action: "signup",
          name: "Riddhi Sen",
          email: "riddhi.sen@example.com",
          password: "mypassword",
          homeCity: "Mumbai"
        }
      });
      authHandler(req, res);
      expect(res.getStatusCode()).toBe(201);
      const data = res.getData();
      expect(data.ok).toBe(true);
      expect(data.user.name).toBe("Riddhi Sen");
      expect(data.user.homeCity).toBe("Mumbai");
    });

    it("rejects invalid signup with 400", () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        body: { action: "signup", name: "" }
      });
      authHandler(req, res);
      expect(res.getStatusCode()).toBe(400);
    });
  });

  describe("/api/trips", () => {
    it("returns list of trips", () => {
      const { req, res } = createMockReqRes({ method: "GET" });
      tripsHandler(req, res);
      expect(res.getStatusCode()).toBe(200);
      const data = res.getData();
      expect(data.total).toBeGreaterThanOrEqual(2);
      expect(data.trips[0].budgetTotal).toBeGreaterThan(0);
    });

    it("creates a new trip with calculated estimates", () => {
      const { req, res } = createMockReqRes({
        method: "POST",
        body: {
          title: "Goa Beach Retreat",
          destination: "Palolem Beach, Goa",
          budgetTotal: 30000
        }
      });
      tripsHandler(req, res);
      expect(res.getStatusCode()).toBe(201);
      const data = res.getData();
      expect(data.success).toBe(true);
      expect(data.trip.title).toBe("Goa Beach Retreat");
      expect(data.trip.budgetTotal).toBe(30000);
    });
  });
});
