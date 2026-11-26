/**
 * /api/auth — Vercel Serverless Function
 * Serverless authentication, demo login, and session validation for YaatraStorizz.
 */

const DEMO_USER = {
  id: "usr-demo-01",
  name: "Asha Sharma",
  email: "demo@yaatrastorizz.com",
  avatar: "AS",
  homeCity: "Bengaluru, India",
  bio: "Adventure seeker, mountain trekker, and family journey organizer.",
  isDemo: true,
  createdAt: "2026-01-01T00:00:00Z"
};

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    // Session check / demo info
    res.status(200).json({
      service: "YaatraStorizz Auth API",
      supportedActions: ["login", "signup", "demo", "verify"],
      demoUser: {
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        avatar: DEMO_USER.avatar
      }
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use GET or POST." });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { action, email, password, name, homeCity, token } = body;

  // 1. One-Click Demo User Login
  if (action === "demo") {
    res.status(200).json({
      ok: true,
      user: DEMO_USER,
      token: `ys_demo_${Buffer.from(DEMO_USER.email).toString("base64")}`,
      message: "Successfully logged in as Demo User (Asha Sharma)."
    });
    return;
  }

  // 2. Existing User Login
  if (action === "login") {
    if (!email || !email.trim()) {
      res.status(400).json({ ok: false, error: "Email address is required." });
      return;
    }
    if (!password || !password.trim()) {
      res.status(400).json({ ok: false, error: "Password is required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const initials = cleanEmail.slice(0, 2).toUpperCase();

    const user = {
      id: `usr-${Date.now()}`,
      name: cleanEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail,
      avatar: initials,
      homeCity: homeCity || "Not specified",
      isDemo: false,
      loginAt: new Date().toISOString()
    };

    res.status(200).json({
      ok: true,
      user,
      token: `ys_tok_${Buffer.from(cleanEmail).toString("base64")}`,
      message: "Login successful."
    });
    return;
  }

  // 3. New User Registration / Sign-In
  if (action === "signup" || action === "register") {
    if (!name || !name.trim()) {
      res.status(400).json({ ok: false, error: "Full Name is required." });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ ok: false, error: "Email address is required." });
      return;
    }
    if (!password || password.length < 4) {
      res.status(400).json({ ok: false, error: "Password must be at least 4 characters long." });
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const initials = cleanName.split(/\s+/).slice(0, 2).map((s) => s[0].toUpperCase()).join("");

    const newUser = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      avatar: initials || "YS",
      homeCity: homeCity ? homeCity.trim() : "",
      bio: "Traveler with YaatraStorizz.",
      isDemo: false,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      ok: true,
      user: newUser,
      token: `ys_tok_${Buffer.from(cleanEmail).toString("base64")}`,
      message: "Account created successfully."
    });
    return;
  }

  // 4. Token Verification
  if (action === "verify") {
    if (!token) {
      res.status(401).json({ ok: false, error: "Missing token." });
      return;
    }
    res.status(200).json({ ok: true, valid: true });
    return;
  }

  res.status(400).json({ ok: false, error: `Unknown action '${action}'. Expected 'login', 'signup', 'demo', or 'verify'.` });
}
