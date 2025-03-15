const express = require("express");
const router = express.Router();
const { pool } = require("../config/db_credenciales");

// CREATE: Agregar una nueva playlist
// POST /api/playlist
router.post("/api/playlists", async (req, res) => {
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
// GET /api/playlist
router.get("/api/playlist", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM playlists");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener playlists:", error);
    res.status(500).json({ error: "Error al obtener playlists" });
  }
});

// READ: Obtener una playlist por ID
// GET /api/playlist/:id
router.get("/api/playlist/:id", async (req, res) => {
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
// PUT /api/playlist/:id
router.put("/api/playlist/:id", async (req, res) => {
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
// DELETE /api/playlist/:id
router.delete("/api/playlist/:id", async (req, res) => {
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

// GET /api/playlist/songsbyplaylist/:playlistId
router.get("/api/songsbyplaylist/:playlistId", async (req, res) => {
  const { playlistId } = req.params;
  try {
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

// GET /api/playlist/playlists-by-user/:usuario_id
router.get("/api/playlists-by-user/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;
  try {
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
router.get("/api/youtube-playlist", async (req, res) => {
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
 * Endpoints CRUD para la tabla de Canciones
 */

// CREATE: Agregar una nueva canción
router.post("/api/canciones", async (req, res) => {
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
router.get("/api/canciones", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM canciones");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener canciones:", error);
    res.status(500).json({ error: "Error al obtener canciones" });
  }
});

// READ: Obtener una canción por ID
router.get("/api/canciones/:id", async (req, res) => {
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
router.put("/api/canciones/:id", async (req, res) => {
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
router.delete("/api/canciones/:id", async (req, res) => {
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
module.exports = router;
