import { Router } from "express";
import { searchTracks } from "../lib/spotify.js";

const router = Router();

// GET /api/spotify/search?q=
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: "q parameter required" });
    }

    const tracks = await searchTracks(q);
    return res.json({ tracks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Search failed" });
  }
});

export default router;
