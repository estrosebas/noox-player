const mysql = require("mysql2/promise");
const fs = require("fs");
const { createClient } = require('redis');

const redisClient = createClient(); // Usa opciones si es necesario (host, puerto, etc.)

// Configuración de la base de datos
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "noox-music",
  waitForConnections: true,
  connectionLimit: 500,
  queueLimit: 0,
};

// Crear pool de conexiones
const pool = mysql.createPool(DB_CONFIG);

// Verificar conexión inicial
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error al conectar con la base de datos:", err.message);
    process.exit(1); // Detener el servidor si no se puede conectar
  } else {
    console.log("✅ Conexión a MySQL establecida.");
    connection.release(); // Liberar la conexión
  }
});

// Cargar certificados SSL (si existen)
let SSL_OPTIONS = {};
const keyPath = "/etc/letsencrypt/live/noox.ooguy.com/privkey.pem";
const certPath = "/etc/letsencrypt/live/noox.ooguy.com/fullchain.pem";

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  SSL_OPTIONS = {
    key: fs.readFileSync(keyPath, "utf8"),
    cert: fs.readFileSync(certPath, "utf8"),
  };
  console.log("🔒 Certificados SSL cargados.");
} else {
  console.warn("⚠️ Certificados SSL no encontrados. El servidor usará HTTP.");
}

// Configuración de APIs y autenticación
const CONFIG = {
  GOOGLE_CLIENT_ID: "131317178402-b96jr7cg0pp88ordmgv68hsfr4rvedhd.apps.googleusercontent.com",
  SPOTIFY_CLIENT_ID: "b53f226c71b940598fbb5fa3dc8cbd87",
  SPOTIFY_CLIENT_SECRET: "a5604f66a3f048ddbe2f41b0a2b05903",
  YOUTUBE_API_KEY: "AIzaSyCs42WnWuVeoVTp-I1Vrr_Iloj0VUmhi7c",
  CACHE_EXPIRATION_MS: 10 * 60 * 1000, // 10 minutos
  PORT: 5030,
};



// Exportar configuración y conexión
module.exports = { pool, SSL_OPTIONS, CONFIG };
