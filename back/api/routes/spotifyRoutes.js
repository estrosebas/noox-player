const express = require("express");
const { buscarEnSpotify } = require("../services/spotifyService");

const router = express.Router();

router.get("/api/spotify-search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Falta el parámetro 'query'" });

  try {
    const result = await buscarEnSpotify(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error al buscar en Spotify" });
  }
});

module.exports = router;
