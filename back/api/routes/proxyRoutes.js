const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Falta el parámetro 'url'");

  try {
    const range = req.headers.range;
    const headers = { "User-Agent": "Mozilla/5.0" };
    if (range) headers.Range = range;

    const response = await axios.get(url, { responseType: "stream", headers });
    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Accept-Ranges", "bytes");
    if (response.headers["content-range"]) {
      res.setHeader("Content-Range", response.headers["content-range"]);
      res.status(206);
    }
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send("Error al obtener el audio");
  }
});
module.exports = router;
