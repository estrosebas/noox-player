const express = require("express");
const router = express.Router();
const { pool } = require("../config/db_credenciales");

// CREATE: Agregar un usuario
// POST /api/usuarios
router.post("/api/usuarios", async (req, res) => {
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
// GET /api/usuarios
router.get("/api/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// READ: Obtener un usuario por ID
// GET /api/usuarios/:id
router.get("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE usuario_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado}" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// UPDATE: Actualizar un usuario
// PUT /api/usuarios/:id
router.put("/api/usuarios/:id", async (req, res) => {
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
// DELETE /api/usuarios/:id
router.delete("/api/usuarios/:id", async (req, res) => {
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

//  Endpoint para listar todas las playlists de un usuario
// GET /api/usuarios/playlists-by-user/:usuario_id
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

// Endpoint para listar canciones de una playlist
// GET /api/usuarios/songsbyplaylist/:playlistId
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

module.exports = router;
