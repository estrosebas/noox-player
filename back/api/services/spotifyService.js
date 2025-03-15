const axios = require("axios");
const qs = require("qs");

const SPOTIFY_CLIENT_ID = "b53f226c71b940598fbb5fa3dc8cbd87";
const SPOTIFY_CLIENT_SECRET = "a5604f66a3f048ddbe2f41b0a2b05903";
let spotifyToken = null;

async function obtenerTokenSpotify() {
  const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" };

  try {
    const response = await axios.post("https://accounts.spotify.com/api/token", qs.stringify({ grant_type: "client_credentials" }), { headers });
    spotifyToken = response.data.access_token;
  } catch (error) {
    console.error("Error obteniendo el token de Spotify:", error.response?.data || error.message);
    return null;
  }
}

async function buscarEnSpotify(titulo) {
  await obtenerTokenSpotify();
  const tituloLimpio = titulo.replace(/.*?|.*?/g, "").trim();
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(tituloLimpio)}&type=track&limit=1`;

  try {
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${spotifyToken}` } });
    if (response.data.tracks.items.length > 0) {
      const cancion = response.data.tracks.items[0];
      return { artista: cancion.artists[0].name, nombre: cancion.name };
    }
  } catch (error) {
    console.error("Error buscando en Spotify:", error.response?.data || error.message);
  }
  return null;
}

module.exports = { buscarEnSpotify };