// /routes/likes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../config/db_credenciales");

// LIKE: Marcar una canción como favorita
// POST /like
router.post("/like", async (req, res) => {
  const { nombre, url, url_thumbnail, liked_by_user } = req.body;

  // Verificar que todos los datos requeridos estén presentes
  if (!nombre || !url || !url_thumbnail || !liked_by_user) {
    return res.status(400).json({ message: "Fallo el like" });
  }

  try {
    await pool.query(
      "INSERT INTO liked_songs (nombre, url_cancion, url_thumbnail, liked_by_user) VALUES (?, ?, ?, ?)",
      [nombre, url, url_thumbnail, liked_by_user]
    );

    res.status(201).json({ message: "Likeada con exito" });
  } catch (error) {
    console.error("Error al dar like:", error);
    res.status(500).json({ message: "Fallo el like" });
  }
});

// UNLIKE: Quitar like de una canción
// DELETE /unlike/:id
router.delete("/unlike/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM liked_songs WHERE cancion_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "No se encontró el like para eliminar" });
    }

    res.json({ message: "Unlike realizado con éxito" });
  } catch (error) {
    console.error("Error al quitar like:", error);
    res.status(500).json({ message: "Fallo el unlike" });
  }
});

module.exports = router;
