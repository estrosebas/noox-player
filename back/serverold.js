const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const https = require("https");
const axios = require("axios");

const app = express();
const PORT = 5030;
const SPOTIFY_CLIENT_ID = 'inserte su clave aqui';
const SPOTIFY_CLIENT_SECRET = 'inserte su clave aqui';
const YOUTUBE_API_KEY = 'inserte su clave aqui';

// Cargar certificados SSL
const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/noox.ooguy.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/noox.ooguy.com/fullchain.pem"),
};

app.use(cors({ 
  origin: "*", 
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", 
  allowedHeaders: "Content-Type"
}));

app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

app.use(express.json());


/**
 * funciones de conversion de playlist
 */
// Obtener token de Spotify
async function getSpotifyToken() {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
}

// Obtener canciones de una playlist de Spotify
async function getSpotifyPlaylist(playlistId) {
  const token = await getSpotifyToken();
  const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.items.map(item => item.track.name);
}

// Buscar canción en YouTube
async function searchYouTube(songName) {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part: 'snippet',
      q: songName,
      key: YOUTUBE_API_KEY,
      maxResults: 1,
      type: 'video',
    },
  });
  return response.data.items.length > 0 ? response.data.items[0].id.videoId : null;
}


/**
 * 1️⃣ Endpoint para obtener sugerencias de búsqueda de YouTube
 */
app.get("/api/suggestions", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Falta el parámetro 'query'" });

  try {
    const response = await axios.get(
      `https://suggestqueries.google.com/complete/search?client=youtube&hl=es&q=${encodeURIComponent(query)}&client=chrome`
    );
    // Extraer las sugerencias del array de respuesta
    const suggestions = response.data[1].map(item => item[0]);

    res.json(response.data[1]); // Devuelve solo las sugerencias
  } catch (error) {
    console.error("Error obteniendo sugerencias:", error);
    res.status(500).json({ error: "Error al obtener sugerencias" });
  }
});

/**
 * 2️⃣ Endpoint para buscar videos en YouTube con yt-dlp
 */
app.get("/api/yt-search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Falta el parámetro 'query'" });

  try {
    exec(`yt-dlp "ytsearch5:${query}" --print "%(title)s | %(id)s | %(url)s" --cookies-from-browser firefox `, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error ejecutando yt-dlp: ${stderr}`);
        return res.status(500).json({ error: "Error al buscar videos" });
      }

      const results = stdout
        .trim()
        .split("\n")
        .map((line) => {
          const [title, id, url] = line.split(" | ");
          return { title, id, url, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
        });

      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: "Error al ejecutar yt-dlp" });
  }
});

/**
 * 3️⃣ Endpoint para obtener información de un video y su audio con yt-dlp
 */
app.get("/search", async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ error: "Falta la URL del video" });

  try {
    exec(
      `yt-dlp --cookies-from-browser firefox -j --format bestaudio/best "${url}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error ejecutando yt-dlp: ${stderr}`);
          return res.status(500).json({ error: "Error al obtener el audio" });
        }

        try {
          const output = JSON.parse(stdout);
          res.json({
            title: output.title,
            duration: output.duration,
            audioUrl: `https://noox.ooguy.com:${PORT}/proxy?url=${encodeURIComponent(output.url)}`, // Enlace proxificado
          });
        } catch (parseError) {
          console.error("Error parseando JSON:", parseError);
          res.status(500).json({ error: "Error procesando la respuesta" });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Error al ejecutar yt-dlp" });
  }
});

/**
     * Makes a GET request to the specified URL and returns the response as a stream.
     * The request includes a custom User-Agent header.
     */
app.get("/api/download", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Falta el parámetro 'url'" });

  const filePath = "./temp_audio.webm"; // Ruta donde se guardará el archivo temporal

  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });

    // Crear un flujo de escritura en el archivo
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      // Enviar el archivo al usuario
      res.download(filePath, "audio.webm", (err) => {
        if (!err) {
          // Eliminar el archivo después de enviarlo
          fs.unlinkSync(filePath);
        }
      });
    });

    writer.on("error", (err) => {
      console.error("Error al escribir el archivo:", err);
      res.status(500).json({ error: "Error al descargar el archivo" });
    });

  } catch (error) {
    console.error("Error al descargar el archivo:", error.message);
    res.status(500).json({ error: "Error al obtener el archivo" });
  }
});

/**
 * 4️⃣ Endpoint para retransmitir el audio y evitar 403
 */
app.get("/proxy", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send("Falta el parámetro 'url'");
  
    try {
      const range = req.headers.range; // Obtener el encabezado Range
      const headers = { "User-Agent": "Mozilla/5.0" };
  
      if (range) {
        headers.Range = range; // Pasar el encabezado Range a la solicitud
      }
  
      const response = await axios.get(url, {
        responseType: "stream",
        headers: headers,
      });
  
      // Reenviar los encabezados originales para soportar el seeking
      res.setHeader("Content-Type", response.headers["content-type"]);
      res.setHeader("Accept-Ranges", "bytes");
  
      if (response.headers["content-range"]) {
        res.setHeader("Content-Range", response.headers["content-range"]);
        res.status(206); // Respuesta parcial
      }
  
      response.data.pipe(res); // Transmitir los datos al cliente
    } catch (error) {
      console.error("Error en el proxy:", error);
      res.status(500).send("Error al obtener el audio");
    }
  });
  /**
   * endpoint de conversion de playlist
   */
  app.get("/playlist", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Falta el parámetro 'url'" });
  
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) return res.status(400).json({ error: "URL de playlist no válida" });
    
    const playlistId = match[1];
    try {
      const songs = await getSpotifyPlaylist(playlistId);
      const youtubeResults = await Promise.all(songs.map(song => searchYouTube(song)));
      
      res.json(songs.map((song, index) => ({ song, youtubeId: youtubeResults[index] })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error procesando la solicitud" });
    }
  });

  app.get("/api/yt-searchytapi", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Falta el parámetro 'query'" });
  
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          key: YOUTUBE_API_KEY,
          maxResults: 5,
          type: 'video',
        },
      });
  
      const results = response.data.items.map(video => ({
        title: video.snippet.title,
        id: video.id.videoId,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${video.id.videoId}/hqdefault.jpg`
      }));
  
      res.json(results);
    } catch (error) {
      console.error(`Error en la búsqueda de YouTube API: ${error}`);
      res.status(500).json({ error: "Error al buscar videos en YouTube API" });
    }
  });
  
  /**
   * api de cargar youtube playlists 
   */
  app.get("/api/youtube-playlist", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Falta el parámetro 'url'" });
  
    try {
      exec(
        `yt-dlp --flat-playlist --cookies-from-browser firefox -j "${url}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Error ejecutando yt-dlp: ${stderr}`);
            return res.status(500).json({ error: "Error al obtener la playlist" });
          }
  
          // Dividir por líneas y convertir cada línea en JSON
          const videos = stdout
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line))
            .map((video) => ({
              title: video.title,
              id: video.id,
              url: `https://www.youtube.com/watch?v=${video.id}`,
              thumbnail: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
            }));
  
          res.json(videos);
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Error al ejecutar yt-dlp" });
    }
  });
  
/**
 * api para musica en tendencia
 */

app.get("/api/trending-music", async (req, res) => {
  try {
      const region = req.query.region || "US";
      const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: {
              part: "snippet,statistics",
              chart: "mostPopular",
              regionCode: region,
              videoCategoryId: "10",
              maxResults: 10,
              key: YOUTUBE_API_KEY
          }
      });
      
      res.json(response.data);
  } catch (error) {
      console.error("Error al obtener música en tendencia:", error);
      res.status(500).json({ error: "Error al obtener datos de YouTube" });
  }
});
// Crear el servidor HTTPS
https.createServer(options, app).listen(PORT, () => {
  console.log(`Servidor corriendo en https://noox.ooguy.com:${PORT}`);
});
