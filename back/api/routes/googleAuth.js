// /routes/googleAuth.js
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
// Asegúrate de que 'pool' apunte a tu conexión MySQL (pool) real:
const { pool } = require("../config/db_credenciales"); 

// Tu verdadero Client ID de Google (no una API Key de YouTube)
const CLIENT_ID = "131317178402-b96jr7cg0pp88ordmgv68hsfr4rvedhd.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const router = express.Router();

/**
 * 1️⃣ Google Login
 * POST /api/auth/google-login
 */
router.post("/api/google-login", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).send("Token no proporcionado");
  }

  try {
    // Verificar el token de Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, // Debe coincidir con tu Client ID
    });

    const payload = ticket.getPayload();
    const userData = {
      nombre: payload.name,
      correo: payload.email,
      google_id: payload.sub, // Google ID único
    };

    // Verificar si el usuario ya existe
    const [results] = await pool.query("SELECT * FROM usuarios WHERE google_id = ?", [userData.google_id]);
    if (results.length > 0) {
      // Usuario ya existe
      return res.status(200).json({ usuario: results[0] });
    } else {
      // Usuario no existe, crearlo
      const query = "INSERT INTO usuarios (nombre, correo, google_id) VALUES (?, ?, ?)";
      const [result] = await pool.query(query, [userData.nombre, userData.correo, userData.google_id]);
      const newUser = {
        usuario_id: result.insertId,
        nombre: userData.nombre,
        correo: userData.correo,
        google_id: userData.google_id,
      };
      return res.status(200).json({ usuario: newUser });
    }
  } catch (error) {
    console.error("Error de Google Auth:", error);
    res.status(500).send("Error de autenticación");
  }
});

/**
 * 2️⃣ Login Normal
 * POST /api/auth/login
 */
router.post("/ap1/login", async (req, res) => {
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

    // Validar la contraseña (en producción, usar bcrypt)
    if (user[0].contrasena !== contrasena) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Éxito
    res.json({ message: "Login exitoso", usuario: user[0] });
  } catch (error) {
    console.error("Error al hacer login:", error);
    res.status(500).json({ error: "Error al hacer login" });
  }
});

module.exports = router;
