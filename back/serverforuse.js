const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const https = require("https");
const axios = require("axios");
const play = require('play-dl');
const cheerio = require("cheerio");
const qs = require("querystring");
const glob = require('glob');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const { spawn } = require("child_process");
const cron = require('node-cron');


const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = ''; // Reemplaza con tu Client ID de Google
const client = new OAuth2Client(CLIENT_ID);


const supabase = require("./supabaseClient");

// Importa y configura el cliente de Redis
const { createClient } = require('redis');
const redisClient = createClient(); // Usa opciones si es necesario (host, puerto, etc.)

// Manejo de errores
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Conecta al servidor Redis
redisClient.connect().catch(console.error);
/*
const cache = {}; 
// Estructura esperada de cada entrada en 'cache':
//  cache[url] = {
//    response: { title, duration, audioUrl }, // objeto a devolver
//    timestamp: 123456789 // Date.now()
//  };
*/
// Intervalo de expiración (en milisegundos) - 10 minutos = 600,000 ms
const CACHE_EXPIRATION_MS = 10 * 60 * 1000;

const app = express();
const PORT = 5030;
const SPOTIFY_CLIENT_ID = '';
const SPOTIFY_CLIENT_SECRET = '';
const YOUTUBE_API_KEY = '';
let spotifyToken = null;


// Requiere el módulo mysql2
const mysql = require("mysql2");
// Crea un pool de conexiones (configura host, usuario, contraseña y base de datos según corresponda)
const pool = mysql.createPool({
  host: "localhost",
  user: "srestro",
  password: "Estroganzo18050516@bffa",
  database: "noox-music",
  waitForConnections: true,
  connectionLimit: 500,
  queueLimit: 0,
}).promise();


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
 * obtener la cookie de firefox
 */
function getFirefoxCookiesForYouTube() {
  return new Promise((resolve, reject) => {
    // Ruta al directorio de Firefox para la versión snap en Linux
    const firefoxDir = path.join(os.homedir(), 'snap', 'firefox', 'common', '.mozilla', 'firefox');
    // Utilizamos la carpeta de perfil que encontraste
    const profileFolder = '8ktser85.estrosebas';
    const cookiesPath = path.join(firefoxDir, profileFolder, 'cookies.sqlite');

    // Copiar cookies.sqlite a un directorio temporal para evitar bloqueo
    const tmpCookiesPath = path.join(os.tmpdir(), 'cookies.sqlite.tmp');
    fs.copyFile(cookiesPath, tmpCookiesPath, (err) => {
      if (err) {
        return reject(new Error('No se pudo copiar cookies.sqlite: ' + err.message));
      }
      // Abrir la base de datos desde el archivo temporal
      let db = new sqlite3.Database(tmpCookiesPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          return reject(new Error('No se pudo abrir cookies.sqlite (tmp): ' + err.message));
        }
        // Consulta las cookies para youtube.com
        const query = "SELECT name, value FROM moz_cookies WHERE host LIKE '%youtube.com%'";
        db.all(query, (err, rows) => {
          if (err) {
            db.close();
            return reject(new Error('Error al consultar las cookies: ' + err.message));
          }
          const cookieString = rows.map(row => `${row.name}=${row.value}`).join('; ');
          db.close();
          resolve(cookieString);
        });
      });
    });
  });
}
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
// Obtener Token de Spotify
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


// Buscar canción en Spotify
// Buscar canción en Spotify
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



// Generar URL de la letra en letras.com
function generarUrlLetras(artista, cancion) {
  artista = artista.toLowerCase().replace(/\s+/g, "-");
  cancion = cancion.toLowerCase().replace(/\s+/g, "-");
  return `https://www.letras.com/${artista}/${cancion}/`;
}


// Obtener letra desde letras.com
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
 *//*
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
});*/

/**
     * Makes a GET request to the specified URL and returns the response as a stream.
     * The request includes a custom User-Agent header.
     */
app.get("/api/download", (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Falta la URL del video" });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "download-"));
  const outputTemplate = path.join(tmpDir, "%(title)s.%(ext)s");
  const args = [
    "--cookies-from-browser", "firefox",
    "-f", "bestaudio",
    "--concurrent-fragments", "5",
    "-x",
    "--audio-format", "mp3",
    "-o", outputTemplate,
    url
  ];

  const ytDlp = spawn("yt-dlp", args);

  ytDlp.on("error", (err) => {
    return res.status(500).json({ error: "Error al iniciar yt-dlp" });
  });

  ytDlp.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "Error al descargar y convertir el audio" });
    }

    fs.readdir(tmpDir, (err, files) => {
      if (err || files.length === 0) {
        return res.status(500).json({ error: "No se generó el archivo de audio" });
      }
      const downloadedFile = path.join(tmpDir, files[0]);

      res.download(downloadedFile, files[0], (err) => {
        fs.unlink(downloadedFile, () => {
          fs.rmdir(tmpDir, () => {});
        });
      });
    });
  });
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
  


//api login auth google
//v2
// Ruta para manejar la autenticación con Google
app.post('/api/google-login', async (req, res) => {
  const { token } = req.body;  // Token enviado desde el frontend

  if (!token) {
    return res.status(400).send('Token no proporcionado');
  }

  try {
    // Verificar el token de Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Debe coincidir con el Client ID de la consola de Google
    });

    // Extraer los datos del usuario del token
    const payload = ticket.getPayload();
    const userData = {
      nombre: payload.name,
      correo: payload.email,
      google_id: payload.sub,  // Google ID único
    };

    // Verificar si el usuario ya existe en la base de datos por google_id
    const [results] = await pool.query('SELECT * FROM usuarios WHERE google_id = ?', [userData.google_id]);

    if (results.length > 0) {
      // Si el usuario ya existe, retornamos los datos del usuario
      return res.status(200).json({ usuario: results[0] });
    } else {
      // Si el usuario no existe, lo insertamos en la base de datos
      const query = 'INSERT INTO usuarios (nombre, correo, google_id) VALUES (?, ?, ?)';
      const [result] = await pool.query(query, [userData.nombre, userData.correo, userData.google_id]);

      // Devuelve los datos del usuario recién creado
      const newUser = {
        usuario_id: result.insertId,
        nombre: userData.nombre,
        correo: userData.correo,
        google_id: userData.google_id
      };

      return res.status(200).json({ usuario: newUser });
    }

  } catch (error) {
    console.error("Error de Google Auth:", error);
    res.status(500).send('Error de autenticación');
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

/**
 * Endpoints CRUD para la tabla de Usuarios
 */

// CREATE: Agregar un nuevo usuario
app.post("/api/usuarios", async (req, res) => {
  const { nombre, correo, contrasena } = req.body;
  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)",
      [nombre, correo, contrasena]
    );
    res.status(201).json({ usuario_id: result.insertId, nombre, correo });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// READ: Obtener todos los usuarios
app.get("/api/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// READ: Obtener un usuario por ID
app.get("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE usuario_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// UPDATE: Actualizar un usuario
app.put("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, contrasena } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE usuarios SET nombre = ?, correo = ?, contrasena = ? WHERE usuario_id = ?",
      [nombre, correo, contrasena, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ usuario_id: id, nombre, correo });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// DELETE: Eliminar un usuario
app.delete("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM usuarios WHERE usuario_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

/**
 * Endpoints CRUD para la tabla de Playlists
 */

// CREATE: Agregar una nueva playlist
app.post("/api/playlists", async (req, res) => {
  const { nombre, descripcion, usuario_id } = req.body;
  if (!nombre || !usuario_id) {
    return res.status(400).json({ error: "Faltan datos requeridos (nombre y usuario_id)" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO playlists (nombre, descripcion, usuario_id) VALUES (?, ?, ?)",
      [nombre, descripcion || null, usuario_id]
    );
    res.status(201).json({ playlist_id: result.insertId, nombre, descripcion, usuario_id });
  } catch (error) {
    console.error("Error al crear playlist:", error);
    res.status(500).json({ error: "Error al crear playlist" });
  }
});

// READ: Obtener todas las playlists
app.get("/api/playlists", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM playlists");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener playlists:", error);
    res.status(500).json({ error: "Error al obtener playlists" });
  }
});

// READ: Obtener una playlist por ID
app.get("/api/playlists/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM playlists WHERE playlist_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Playlist no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener playlist:", error);
    res.status(500).json({ error: "Error al obtener playlist" });
  }
});

// UPDATE: Actualizar una playlist
app.put("/api/playlists/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, usuario_id } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE playlists SET nombre = ?, descripcion = ?, usuario_id = ? WHERE playlist_id = ?",
      [nombre, descripcion || null, usuario_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Playlist no encontrada" });
    }
    res.json({ playlist_id: id, nombre, descripcion, usuario_id });
  } catch (error) {
    console.error("Error al actualizar playlist:", error);
    res.status(500).json({ error: "Error al actualizar playlist" });
  }
});

// DELETE: Eliminar una playlist
app.delete("/api/playlists/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM playlists WHERE playlist_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Playlist no encontrada" });
    }
    res.json({ message: "Playlist eliminada" });
  } catch (error) {
    console.error("Error al eliminar playlist:", error);
    res.status(500).json({ error: "Error al eliminar playlist" });
  }
});

/**
 * Endpoints CRUD para la tabla de Canciones
 */

// CREATE: Agregar una nueva canción
app.post("/api/canciones", async (req, res) => {
  const { nombre, url_cancion, url_thumbnail, playlist_id } = req.body;
  if (!nombre || !url_cancion || !url_thumbnail || !playlist_id) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO canciones (nombre, url_cancion, url_thumbnail, playlist_id) VALUES (?, ?, ?, ?)",
      [nombre, url_cancion, url_thumbnail, playlist_id]
    );
    res.status(201).json({ cancion_id: result.insertId, nombre, url_cancion, url_thumbnail, playlist_id });
  } catch (error) {
    console.error("Error al crear canción:", error);
    res.status(500).json({ error: "Error al crear canción" });
  }
});

// READ: Obtener todas las canciones
app.get("/api/canciones", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM canciones");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener canciones:", error);
    res.status(500).json({ error: "Error al obtener canciones" });
  }
});

// READ: Obtener una canción por ID
app.get("/api/canciones/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM canciones WHERE cancion_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Canción no encontrada" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener canción:", error);
    res.status(500).json({ error: "Error al obtener canción" });
  }
});

// UPDATE: Actualizar una canción
app.put("/api/canciones/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, url_cancion, url_thumbnail, playlist_id } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE canciones SET nombre = ?, url_cancion = ?, url_thumbnail = ?, playlist_id = ? WHERE cancion_id = ?",
      [nombre, url_cancion, url_thumbnail, playlist_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Canción no encontrada" });
    }
    res.json({ cancion_id: id, nombre, url_cancion, url_thumbnail, playlist_id });
  } catch (error) {
    console.error("Error al actualizar canción:", error);
    res.status(500).json({ error: "Error al actualizar canción" });
  }
});

// DELETE: Eliminar una canción
app.delete("/api/canciones/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM canciones WHERE cancion_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Canción no encontrada" });
    }
    res.json({ message: "Canción eliminada" });
  } catch (error) {
    console.error("Error al eliminar canción:", error);
    res.status(500).json({ error: "Error al eliminar canción" });
  }
});
// 1️⃣ Endpoint para loguearse
app.post("/api/login", async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  }

  try {
    // Buscar usuario por correo
    const [user] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
    
    if (user.length === 0) {
      return res.status(404).json({ error: "Correo incorrecto" });
    }

    // Validar la contraseña (puedes usar una librería como bcrypt para comparar hashes)
    if (user[0].contrasena !== contrasena) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Si todo es correcto, devuelve el usuario
    res.json({ message: "Login exitoso", usuario: user[0] });
  } catch (error) {
    console.error("Error al hacer login:", error);
    res.status(500).json({ error: "Error al hacer login" });
  }
});

// 2️⃣ Endpoint para listar todas las playlists de un usuario
app.get("/api/playlists-by-user/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;

  try {
    // Buscar todas las playlists del usuario
    const [playlists] = await pool.query("SELECT * FROM playlists WHERE usuario_id = ?", [usuario_id]);

    if (playlists.length === 0) {
      return res.status(404).json({ error: "No se encontraron playlists para este usuario" });
    }

    res.json(playlists);
  } catch (error) {
    console.error("Error al obtener playlists del usuario:", error);
    res.status(500).json({ error: "Error al obtener playlists del usuario" });
  }
});

app.get("/api/songsbyplaylist/:playlistId", async (req, res) => {
  const { playlistId } = req.params;
  try {
    // Realizamos el inner join entre 'canciones' y 'playlists'
    const [rows] = await pool.query(
      `SELECT 
         c.cancion_id, 
         c.nombre, 
         c.url_cancion, 
         c.url_thumbnail, 
         p.nombre AS playlist_name
       FROM canciones c
       INNER JOIN playlists p ON c.playlist_id = p.playlist_id
       WHERE c.playlist_id = ?`,
      [playlistId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener las canciones:", error);
    res.status(500).json({ error: "Error al obtener las canciones." });
  }
});



app.get("/search", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Falta la URL del video" });
  }

  try {
    // 1. Verificar si la respuesta está en caché en Redis
    const cachedData = await redisClient.get(url);
    if (cachedData) {
      // Si existe en caché, retornamos la respuesta parseada
      return res.json(JSON.parse(cachedData));
    }
  } catch (err) {
    console.error("Error al acceder a Redis:", err);
    // Podrías continuar sin caché si Redis falla
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
        audioUrl: `https://noox.ooguy.com:${PORT}/proxy?url=${encodeURIComponent(output.url)}`,
      };

      // 3. Guardar la respuesta en Redis con expiración de 10 minutos (600 segundos)
      await redisClient.setEx(url, 600, JSON.stringify(responseData));

      // 4. Devolver la respuesta
      res.json(responseData);
    } catch (parseError) {
      console.error("Error parseando JSON:", parseError);
      res.status(500).json({ error: "Error procesando la respuesta" });
    }
  });
});
app.get("/letra", async (req, res) => {
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
//////////////////////////////////////////
//////metodos para letras lrc     ////////
//////////////////////////////////////////

// Función para obtener el token de Spotify
async function obtenerToken() {
  const SPOTIFY_CLIENT_ID = 'b53f226c71b940598fbb5fa3dc8cbd87';
  const SPOTIFY_CLIENT_SECRET = 'a5604f66a3f048ddbe2f41b0a2b05903';
  const AUTH_URL = 'https://accounts.spotify.com/api/token';

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


// Endpoint para revisar los idiomas disponibles en YouTube
app.post('/letraslrcrevisr', (req, res) => {
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


// Endpoint para obtener y guardar el LRC en la base de datos
//
// Endpoint para obtener y guardar el LRC en la base de datos
app.post('/letraslrc', async (req, res) => {
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
////////////////////////////////////////////////////////////////
///----------TAREAS ASINCRONICAS DE REDIS -----------///////////
////////////////////////////////////////////////////////////////
async function precacheSongs() {
  console.clear();
  console.log("Iniciando precacheo de canciones...");

  try {
    // Consulta a la tabla 'canciones' para obtener todas las URL de las canciones
    const [rows] = await pool.query("SELECT url_cancion FROM canciones");
    const totalCanciones = rows.length;
    console.log(`Total de canciones a procesar: ${totalCanciones}`);

    let processed = 0;
    const chunkSize = 10; // Procesamos bloques de 10 canciones
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      // Procesa el bloque de 10 canciones en paralelo
      await Promise.all(
        chunk.map(async (song) => {
          processed++;
          console.log(`Procesando canción ${processed} de ${totalCanciones}`);
          const searchUrl = `https://noox.ooguy.com:${PORT}/search?url=${encodeURIComponent(song.url_cancion)}`;
          try {
            await axios.get(searchUrl);
          } catch (error) {
            console.error(`Error procesando canción ${processed}:`, error.message);
          }
        })
      );
    }

    console.clear();
    console.log(`Precacheo completado: ${totalCanciones} canciones procesadas.`);
  } catch (error) {
    console.error("Error en el precacheo de canciones:", error);
  }
}


// Ejecuta precacheSongs cada 70 minutos (70 * 60 * 1000 ms)
setInterval(precacheSongs, 70 * 60 * 1000);
// Opcionalmente, ejecuta la función al iniciar el servidor
precacheSongs();

// Tarea programada para borrar el cache de Redis cada 5 horas
cron.schedule('0 */5 * * *', async () => {
  try {
    await redisClient.flushAll();
    console.clear();
    console.log("Cache de Redis borrada.");
  } catch (error) {
    console.error("Error al borrar el cache de Redis:", error);
  }
});
// Crear el servidor HTTPS
https.createServer(options, app).listen(PORT, () => {
  console.log(`Servidor corriendo en https://noox.ooguy.com:${PORT}`);
  precacheSongs();
});
