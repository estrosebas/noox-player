// server.js
const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan"); 
const { pool, SSL_OPTIONS, CONFIG } = require("./config/db_credenciales");
const cron = require('node-cron');
const axios = require('axios'); // Added axios import
const { createClient } = require("redis");

// Importar rutas
const usuarios = require("./routes/usuarios");
const googleAuth = require("./routes/googleAuth");
const playlist = require("./routes/playlist");
const proxyRoutes = require("./routes/proxyRoutes");
const spotifyRoutes = require("./routes/spotifyRoutes");
const youtubeRoutes = require("./routes/youtubeRoutes");
const likes = require("./routes/likes");
const nooxai = require("./routes/nooxai");
// Configurar cliente Redis
const redisClient = createClient();
redisClient.on("error", (err) => console.error("Redis Client Error:", err));
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // Registro de peticiones en consola

// Rutas con prefijo
app.use("/", usuarios);
app.use("/", googleAuth);
app.use("/", playlist);
app.use("/", proxyRoutes);
app.use("/", spotifyRoutes);
app.use("/", youtubeRoutes);
app.use("/", likes);
app.use("/", nooxai);

// Iniciar servidor HTTP o HTTPS según disponibilidad de certificados
const PORT = CONFIG.PORT || 5030;
if (Object.keys(SSL_OPTIONS).length > 0) {
  https.createServer(SSL_OPTIONS, app).listen(PORT, () => {
    console.log(`🚀 Servidor HTTPS corriendo en https://localhost:${PORT}`);
    
  });
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`⚠️ Servidor HTTP corriendo en http://localhost:${PORT}`);
    precacheSongs();
  });
}

async function precacheSongs() {
  console.clear();
  console.log("Iniciando precacheo de canciones...");

  try {
    // Consulta a la tabla 'canciones' para obtener todas las URL de las canciones
    const [rows] = await pool.query("SELECT url_cancion FROM canciones");

    const totalCanciones = rows.length;
    console.log(`Total de canciones a procesar: ${totalCanciones}`);

    if (totalCanciones === 0) {
      console.log("No hay canciones para procesar.");
      return;
    }

    let processed = 0;
    const chunkSize = 10; // Procesamos bloques de 10 canciones
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (song) => {
          processed++;
          console.log(`Procesando canción ${processed} de ${totalCanciones}`);
          const searchUrl = `https://noox.ooguy.com:${PORT}/search?url=${encodeURIComponent(song.url_cancion)}`;
          try {
            await axios.get(searchUrl);
          } catch (error) {
            console.error(`Error procesando canción ${processed}: ${error.message}`);
          }
        })
      );
    }

    console.clear();
    console.log(`✅ Precacheo completado: ${totalCanciones} canciones procesadas.`);
  } catch (error) {
    console.error("❌ Error en el precacheo de canciones:", error);
  }
}

// Ejecuta precacheSongs cada 70 minutos (70 * 60 * 1000 ms)
setInterval(precacheSongs, 70 * 60 * 1000);

// Opcionalmente, ejecuta la función al iniciar el servidor
precacheSongs();

// Tarea programada para borrar el cache de Redis cada 5 horas
cron.schedule("0 */5 * * *", async () => {
  try {
    await redisClient.flushAll();
    console.clear();
    console.log("🗑️ Cache de Redis borrada.");
  } catch (error) {
    console.error("❌ Error al borrar el cache de Redis:", error);
  }
});
