// youtubeRoutes.js
require('dotenv').config();
const { pool, SSL_OPTIONS, CONFIG } = require("../config/db_credenciales");
const express = require("express");
const { exec } = require("child_process");
const { createClient } = require("redis");
const axios = require("axios");
const qs = require("qs");
const cheerio = require("cheerio");
const { ytDlpSearch } = require("../services/youtubeService");
const glob = require("glob");
const fs = require("fs");

///ytmusicapi version no oficial jiji

const YoutubeMusicApi = require('youtube-music-api');
// Inicializar YoutubeMusicApi
const api = new YoutubeMusicApi();

api.initalize().then(() => {
  console.log('YT Music API initialized!');
}).catch((err) => {
  console.error('Error initializing YT Music API:', err);
});
///////////
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
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
        audioUrl: `https://noox.ooguy.com:5030/proxy?url=${encodeURIComponent(output.url)}`,
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
  await obtenerTokenSpotify(); // Siempre obtiene un nuevo token
  const tituloLimpio = titulo.replace(/\s?\(.*?\)\s?/g, "").trim();  // Elimina el texto entre paréntesis
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
  try {
    const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(response.data);

    // Procesar cada párrafo <p> y reemplazar los <br> con saltos de línea
    const letra = $(".lyric-original p")
      .map((i, el) => {
        return $(el).html().replace(/<br\s*\/?>/g, "\n").trim(); // Reemplaza <br> por \n
      })
      .get()
      .join("\n\n"); // Doble salto de línea para separar párrafos

    return letra || "Letra no encontrada.";
  } catch (error) {
    console.error("Error haciendo scraping:", error.response?.status);
    return "Letra no encontrada.";
  }
}

function generarUrlLetras(artista, cancion) {
  artista = artista.toLowerCase().replace(/\s+/g, "-");
  cancion = cancion.toLowerCase().replace(/\s+/g, "-");
  return `https://www.letras.com/${artista}/${cancion}/`;
}

/*
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
});*/

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
function searchSong(query) {
  return api.search(query, 'song').then(result => {
    return result.content.slice(0, 10); // Limitar a los primeros 10 resultados
  }).catch((err) => {
    console.error('Error searching song:', err);
    return [];
    });
}
// Ruta para buscar canciones y obtener letras
router.get('/api/yt-searchytapi', async (req, res) => {
  const query = req.query.query;

  if (!query) {
  return res.status(400).send('Por favor ingrese el nombre de la canción');
  }

  try {
  const songs = await searchSong(query);

  if (songs.length === 0) {
    return res.status(404).send('No se encontraron resultados.');
  }

  // Formatear la respuesta con la estructura solicitada
  const response = songs.map(song => ({
    title: song.name,
    id: song.videoId,
    thumbnail: song.thumbnails ? song.thumbnails[0].url : null,
    url: `https://www.youtube.com/watch?v=${song.videoId}`
  }));

  res.json(response);

} catch (error) {
  console.error('Error handling search request:', error);
  res.status(500).send('Hubo un error al procesar la búsqueda.');
}
});


  // Función para obtener las letras de una canción
function fetchLyrics(track, artist) {
    const trackFormatted = encodeURIComponent(track.replace(' ', '-'));
    const artistFormatted = encodeURIComponent(artist.replace(' ', '-'));
    
    const url = `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&user_language=en&namespace=lyrics_synched&f_subtitle_length_max_deviation=1&subtitle_format=mxm&app_id=web-desktop-app-v1.0&usertoken=201219dbdb0f6aaba1c774bd931d0e79a28024e28db027ae72955c&q_track=${trackFormatted}&q_artist=${artistFormatted}`;
    
    return axios.get(url, {
    headers: {
      "Cookie": "AWSELB=55578B011601B1EF8BC274C33F9043CA947F99DCFF0A80541772015CA2B39C35C0F9E1C932D31725A7310BCAEB0C37431E024E2B45320B7F2C84490C2C97351FDE34690157",
      "Origin": "musixmatch.com"
    }
    }).then(response => {
    const data = response.data;
    const macroCalls = data.message.body.macro_calls;

    if (macroCalls["track.subtitles.get"]) {
      const subtitlesData = macroCalls["track.subtitles.get"].message;
      if (subtitlesData.body && subtitlesData.body.subtitle_list) {
      const subtitles = subtitlesData.body.subtitle_list;
      if (subtitles.length > 0) {
        const lyrics = JSON.parse(subtitles[0].subtitle.subtitle_body);
        return lyrics.map(line => {
        const minutes = Math.floor(line.time.minutes).toString().padStart(2, '0');
        const seconds = Math.floor(line.time.seconds).toString().padStart(2, '0');
        const hundredths = Math.floor(line.time.hundredths).toString().padStart(2, '0');
        return `[${minutes}:${seconds}.${hundredths}]${line.text}`;
        }).join('\n');
      }
      }
    }
    
    if (macroCalls["matcher.track.get"]) {
      const trackInfo = macroCalls["matcher.track.get"].message.body.track;
      if (trackInfo.instrumental) {
      return "🎵 La canción es instrumental, no tiene letra.";
      }
    }

    return "❌ No se encontró la letra.";
    }).catch(err => {
    console.error('Error fetching lyrics:', err);
    return "❌ Error en la petición de letras.";
    });
}

router.get('/lyrics', async (req, res) => {
    const { track, artist } = req.query;
  
    if (!track || !artist) {
      return res.status(400).send('Por favor ingrese el nombre de la canción y el artista');
    }
  
    try {
      const lyrics = await fetchLyrics(track, artist);
  
      if (Array.isArray(lyrics)) {
        let lyricsResponse = '';
        lyrics.forEach(line => {
          lyricsResponse += `[${line.time}] ${line.text}\n`;
        });
        res.send(lyricsResponse);
      } else {
        res.send(lyrics);
      }
    } catch (error) {
      console.error('Error handling lyrics request:', error);
      res.status(500).send('Hubo un error al obtener las letras.');
    }
});

router.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Falta la URL del video" });
  }

  // Crear un nombre temporal único para el archivo
  const tempDir = 'temp_downloads';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    // Primero obtener información del video para el nombre del archivo
    const infoCmd = `yt-dlp --cookies-from-browser firefox -j "${url}"`;
    const videoInfo = await new Promise((resolve, reject) => {
      exec(infoCmd, (error, stdout) => {
        if (error) reject(error);
        else resolve(JSON.parse(stdout));
      });
    });

    // Crear nombre de archivo seguro
    const safeTitle = videoInfo.title.replace(/[^a-z0-9]/gi, '_');
    const outputPath = `${tempDir}/${safeTitle}.mp3`;

    // Comando para descargar el audio con fragmentación
    const downloadCmd = `yt-dlp --cookies-from-browser firefox -f "ba" -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --concurrent-fragments 8 --fragment-retries 10 "${url}"`;

    // Ejecutar la descarga
    await new Promise((resolve, reject) => {
      exec(downloadCmd, (error) => {
      if (error) reject(error);
      else resolve();
      });
    });

    // Enviar el archivo
    res.download(outputPath, `${videoInfo.title}.mp3`, (err) => {
      // Eliminar el archivo después de enviarlo (o si hay error)
      fs.unlink(outputPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error eliminando archivo:', unlinkErr);
        }
      });

      if (err) {
        console.error('Error enviando archivo:', err);
      }
    });

  } catch (error) {
    console.error('Error en la descarga:', error);
    res.status(500).json({ 
      error: "Error al descargar el audio",
      details: error.message 
    });

    // Limpiar archivos temporales en caso de error
    fs.readdir(tempDir, (err, files) => {
      if (err) return;
      files.forEach(file => {
        fs.unlink(`${tempDir}/${file}`, () => {});
      });
    });
  }
});

module.exports = router;
