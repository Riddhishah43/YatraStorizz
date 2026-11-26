/**
 * /api/health — Vercel Serverless Function
 * Checks service health, uptime, and deployment environment.
 */
export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: "ok",
    service: "YaatraStorizz API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    endpoints: [
      "/api/health",
      "/api/destinations",
      "/api/reviews",
      "/api/auth",
      "/api/trips"
    ]
  });
}
