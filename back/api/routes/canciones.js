// /routes/canciones.js
const express = require("express");
const router = express.Router();
// Asegúrate de importar el pool correcto con promesas
const { pool } = require("../config/db_credenciales");

/**
 * Endpoints CRUD para la tabla de Canciones
 */

// CREATE: Agregar una nueva canción
// POST /api/canciones
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
    res.status(201).json({ 
      cancion_id: result.insertId, 
      nombre, 
      url_cancion, 
      url_thumbnail, 
      playlist_id 
    });
  } catch (error) {
    console.error("Error al crear canción:", error);
    res.status(500).json({ error: "Error al crear canción" });
  }
});

// READ: Obtener todas las canciones
// GET /api/canciones
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
// GET /api/canciones/:id
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
// PUT /api/canciones/:id
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
// DELETE /api/canciones/:id
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
