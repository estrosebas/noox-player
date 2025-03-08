// youtubeRoutes.js
require('dotenv').config();

const express = require("express");
const { exec } = require("child_process");
const { createClient } = require("redis");
const axios = require("axios");
const qs = require("qs");
const cheerio = require("cheerio");
const { ytDlpSearch } = require("../services/youtubeService");

const SPOTIFY_CLIENT_ID = "b53f226c71b940598fbb5fa3dc8cbd87";
const SPOTIFY_CLIENT_SECRET = "a5604f66a3f048ddbe2f41b0a2b05903";
const AUTH_URL = 'https://accounts.spotify.com/api/token';

const router = express.Router();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Configurar cliente Redis
const redisClient = createClient();
redisClient.on("error", (err) => console.error("Redis Client Error:", err));

// Conectar a Redis (asincrónico)
(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Conectado a Redis correctamente.");
  } catch (err) {
    console.error("❌ Error conectando a Redis:", err);
  }
})();

/**
 * 1️⃣ Endpoint: GET /api/yt-search
 *    Búsqueda de videos usando una función externa (ytDlpSearch)
 */
router.get("/yt-search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Falta el parámetro 'query'" });

  try {
    const results = await ytDlpSearch(query);
    res.json(results);
  } catch (error) {
    console.error("Error al buscar videos con yt-dlp:", error);
    res.status(500).json({ error: "Error al buscar videos" });
  }
});

/**
 * 2️⃣ Endpoint: GET /search
 *    - Verifica si el resultado está en caché (Redis)
 *    - Si no, ejecuta yt-dlp y guarda el resultado
 */
router.get("/search", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Falta la URL del video" });
  }

  // 1. Intentar leer desde Redis
  try {
    const cachedData = await redisClient.get(url);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
  } catch (err) {
    console.error("Error al acceder a Redis:", err);
    // Si Redis falla, continuamos sin caché
  }

  // 2. Ejecutar yt-dlp si no hay caché
  const cmd = `yt-dlp --cookies-from-browser firefox -j --skip-download --format bestaudio "${url}"`;

  exec(cmd, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ejecutando yt-dlp: ${stderr}`);
      return res.status(500).json({ error: "Error al obtener el audio" });
    }

    try {
      const output = JSON.parse(stdout);
      const responseData = {
        title: output.title,
        duration: output.duration,
        autor: output.channel,
        // Ajusta la URL según tu dominio o IP
        audioUrl: `https://lcoalhost:5030/proxy?url=${encodeURIComponent(output.url)}`,
      };

      // 3. Guardar la respuesta en Redis (10 min = 600s)
      await redisClient.setEx(url, 600, JSON.stringify(responseData));

      // 4. Devolver la respuesta
      res.json(responseData);
    } catch (parseError) {
      console.error("Error parseando JSON:", parseError);
      res.status(500).json({ error: "Error procesando la respuesta" });
    }
  });
});

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
async function obtenerLetra(url) {
  console.log("[obtenerLetra] URL a scrapear:", url);
  
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        // "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" // Puedes añadir más headers si hace falta
      },
    });

    console.log("[obtenerLetra] Status code:", response.status);
    console.log("[obtenerLetra] Data length:", response.data?.length);

    // Cargar el HTML con cheerio
    const $ = cheerio.load(response.data);

    // Procesar cada párrafo <p> dentro de .lyric-original
    const letra = $(".lyric-original p")
      .map((i, el) => {
        // Logueamos parte del contenido HTML para depurar
        const htmlParrafo = $(el).html() || "";
        console.log(`[obtenerLetra] Párrafo #${i}, primeros 50 chars:`, htmlParrafo.slice(0, 50));
        
        // Reemplaza <br> por \n
        return htmlParrafo.replace(/<br\s*\/?>/g, "\n").trim();
      })
      .get()
      .join("\n\n"); // Doble salto de línea para separar párrafos

    if (!letra) {
      console.log("[obtenerLetra] No se encontró letra en la página (o .lyric-original p está vacío).");
      return "Letra no encontrada.";
    }

    console.log("[obtenerLetra] Letra encontrada, primeros 100 chars:", letra.slice(0, 100));
    return letra;
  } catch (error) {
    // Muestra todo el detalle del error
    console.error("[obtenerLetra] Error completo:", error);
    console.error("[obtenerLetra] Error Code:", error.code);
    console.error("[obtenerLetra] Error Status:", error.response?.status);
    console.error("[obtenerLetra] Error Data:", error.response?.data);

    return "Letra no encontrada.";
  }
}

function generarUrlLetras(artista, cancion) {
  artista = artista.toLowerCase().replace(/\s+/g, "-");
  cancion = cancion.toLowerCase().replace(/\s+/g, "-");
  return `https://www.letras.com/${artista}/${cancion}/`;
}
router.get("/api/yt-searchytapi", async (req, res) => {
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

router.get("/api/suggestions", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Falta el parámetro 'query'" });

  try {
    const response = await axios.get(
      `https://suggestqueries.google.com/complete/search?client=youtube&hl=es&q=${encodeURIComponent(query)}&client=chrome`
    );
    console.log(response);
    // Extraer las sugerencias del array de respuesta
    const suggestions = response.data[1].map(item => item[0]);

    res.json(response.data[1]); // Devuelve solo las sugerencias
    
  } catch (error) {
    console.error("Error obteniendo sugerencias:", error);
    res.status(500).json({ error: "Error al obtener sugerencias" });
  }
});

router.get("/api/trending-music", async (req, res) => {
  try {
    const region = req.query.region || "US";
    const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet",
        chart: "mostPopular",
        regionCode: region,
        videoCategoryId: "10", // Categoría de música en YouTube
        maxResults: 20,
        key: YOUTUBE_API_KEY
      }
    });
    // Transformar los datos en el formato deseado
    const trendingMusic = response.data.items.map(video => ({
      title: video.snippet.title,
      id: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnail: video.snippet.thumbnails.high.url
    }));

    res.json(trendingMusic);
  } catch (error) {
    console.error("Error al obtener música en tendencia:", error);
    res.status(500).json({ error: "Error al obtener datos de YouTube" });
  }
});

router.get("/letra", async (req, res) => {
  const titulo = req.query.cancion;
  if (!titulo) return res.status(400).json({ error: "Debe proporcionar el nombre de la canción" });


  const resultado = await buscarEnSpotify(titulo);
  if (!resultado) return res.status(404).json({ error: "Canción no encontrada en Spotify" });


  const urlLetras = generarUrlLetras(resultado.artista, resultado.nombre);
  const letra = await obtenerLetra(urlLetras);


  res.json({
      artista: resultado.artista,
      cancion: resultado.nombre,
      url: urlLetras,
      letra
  });
});
// Endpoint para revisar los idiomas disponibles en YouTube
router.post('/letraslrcrevisr', (req, res) => {
  const { youtube_url } = req.body;

  exec(`yt-dlp --cookies-from-browser firefox --list-subs --print-json ${youtube_url}`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Error ejecutando yt-dlp:', err);
      return res.status(500).json({ mensaje: 'Error obteniendo subtítulos' });
    }

    let data;
    try {
      const jsonStartIndex = stdout.indexOf('{');
      if (jsonStartIndex === -1) {
        throw new Error('No se encontró un objeto JSON en la respuesta');
      }
      data = JSON.parse(stdout.slice(jsonStartIndex));
    } catch (error) {
      console.error('Error parseando JSON:', error);
      return res.status(500).json({ mensaje: 'Error procesando los subtítulos' });
    }

    if (!data || !data.automatic_captions) {
      return res.status(404).json({ mensaje: 'No hay formatos disponibles' });
    }

    const captions = data.automatic_captions;
    const idiomasDisponibles = [];

    // Primero, buscamos los idiomas principales
    if (captions['es']) idiomasDisponibles.push('es');
    if (captions['en']) idiomasDisponibles.push('en');

    // Si no encontramos los idiomas principales, buscamos los subtítulos con sufijos
    if (idiomasDisponibles.length === 0) {
      Object.keys(captions).forEach(captionKey => {
        if (captionKey.includes('es-es-') || captionKey.includes('en-en-')) {
          idiomasDisponibles.push(captionKey);
        }
      });
    }

    if (idiomasDisponibles.length > 0) {
      return res.json({ idiomasDisponibles });
    } else {
      return res.status(404).json({ mensaje: 'No hay formatos disponibles' });
    }
  });
});
router.post('/letraslrc', async (req, res) => {
  const { youtube_url, idioma } = req.body;

  if (!idioma) {
    return res.status(400).json({ mensaje: 'Se requiere el idioma (es o en)' });
  }

  try {
    // Verificar si el video ya tiene un LRC guardado en la base de datos
    const [rows] = await pool.query('SELECT * FROM lrc_files WHERE youtube_url = ?', [youtube_url]);

    if (rows.length > 0) {
      // Si existe el LRC, devolverlo
      return res.json({ lrc: rows[0].lrc });
    }

    // Si no existe, procede a obtener el LRC
    exec(`yt-dlp --cookies-from-browser firefox --skip-download --sub-lang ${idioma} --write-auto-sub --convert-subs lrc ${youtube_url}`, { encoding: 'utf-8' }, async (err, stdout, stderr) => {
      if (err) {
        console.error('Error ejecutando yt-dlp:', err);
        return res.status(500).json({ mensaje: 'Error obteniendo subtítulos' });
      }

      const archivosLrc = glob.sync('*.lrc').sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);
      if (archivosLrc.length > 0) {
        const nombreArchivo = archivosLrc[0];
        const lrcData = fs.readFileSync(nombreArchivo, 'utf8');

        try {
          // Guardamos el archivo LRC en la base de datos (Insert en lugar de Update)
          const query = 'INSERT INTO lrc_files (youtube_url, lrc, titulo) VALUES (?, ?, ?)';
          await pool.query(query, [youtube_url, lrcData, nombreArchivo]);

          // Eliminar todos los archivos .lrc de la carpeta
          archivosLrc.forEach(file => {
            fs.unlinkSync(file);
          });

          res.json({ lrc: lrcData });  // Devolver el LRC recién generado
        } catch (dbErr) {
          console.error('Error al insertar en la base de datos:', dbErr);
          return res.status(500).json({ mensaje: 'Error guardando el LRC' });
        }
      } else {
        res.status(404).json({ mensaje: 'LRC no disponible' });
      }
    });
  } catch (error) {
    console.error('Error procesando la solicitud:', error);
    return res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});
async function obtenerToken() {
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  try {
    const response = await axios.post(
      AUTH_URL,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  
    return response.data.access_token;
  } catch (error) {
    console.error('Error al obtener token de Spotify:', error);
    return null;
  }
  }

module.exports = router;
