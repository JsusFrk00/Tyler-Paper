const express = require("express");
const cors = require("cors");
const { createClient } = require("redis");

const app = express();
app.use(express.json({ limit: "10mb" })); // allow images in base64
app.use(cors());

const REDIS_KEY = "newspaper:content";
const API_SECRET = process.env.API_SECRET;

// Connect to Render Key Value (Redis)
const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err));
redis.connect();

// GET /api/newspaper — returns current newspaper content
app.get("/api/newspaper", async (req, res) => {
  try {
    const data = await redis.get(REDIS_KEY);
    if (!data) return res.json(null);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load newspaper" });
  }
});

// POST /api/newspaper — saves newspaper content (requires API_SECRET header)
app.post("/api/newspaper", async (req, res) => {
  const secret = req.headers["x-api-secret"];
  if (!API_SECRET || secret !== API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await redis.set(REDIS_KEY, JSON.stringify(req.body));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save newspaper" });
  }
});

// Health check
app.get("/", (req, res) => res.send("Newspaper API is running."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
