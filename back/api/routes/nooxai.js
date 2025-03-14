const express = require('express');
const axios = require('axios');
const router = express.Router();

// URL base y configuración de la API
const base_url = "https://api.distribute.ai";
const api_key = "7068d9d1788306ff0f2432b1f79c9f94"; // Reemplázalo con tu token correcto
const headers = {
  "Content-Type": "application/json",
  "Authorization": api_key
};
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
// Endpoint para crear el chat
router.post('/api/crear-chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    const payload = {
      model: "Llama-3.1 8B",
      messages: [
        {
          role: "system",
          content: prompt,
          name: "NooxAI"
        }
      ],
      reasoning_effort: "medium",
      metadata: {},
      frequency_penalty: 0,
      max_completion_tokens: 256,
      n: 1,
      modalities: ["text"],
      presence_penalty: 0,
      seed: Math.floor(Math.random() * 1000000),
      service_tier: "default",
      stop: ["text"],
      temperature: 1,
      top_p: 1,
      tools: [
        {
          type: "function",
          function: {
            description: "text",
            name: "text",
            parameters: {},
            strict: false
          }
        }
      ],
      tool_choice: "none",
      parallel_tool_calls: true
    };

    const response = await axios.post(`${base_url}/async/chat/create`, payload, { headers });

    if (response.status === 200) {
      const chatId = response.data.id;
      return res.json({ chatId, message: "Chat creado exitosamente." });
    } else {
      return res.status(response.status).json({ error: "Error al crear el chat." });
    }
  } catch (error) {
    console.error("Error en /crear-chat:", error);
    return res.status(500).json({ error: "Error en el servidor al crear el chat." });
  }
});

// Endpoint para obtener la respuesta del chat
router.post('/api/obtener-respuesta', async (req, res) => {
  try {
    const { chatId } = req.body;
    const payload = { id: chatId };

    const response = await axios.post(`${base_url}/async/chat/result`, payload, { headers });

    if (response.status === 200) {
      if (response.data.choices && response.data.choices.length > 0) {
        // Get the plain text message
        let plainText = response.data.choices[0].message.content;
        
        // Try to parse the text to JSON
        let recommendations;
        try {
          recommendations = JSON.parse(plainText);
        } catch (err) {
          return res.status(400).json({ 
            error: "No se pudo convertir la respuesta a JSON", 
            raw: plainText 
          });
        }

        // Search each song using the new API and get the first result
        const enhancedRecommendations = {};
        
        for (const [key, song] of Object.entries(recommendations)) {
          try {
            const searchQuery = `${song.nombre} ${song.artista}`;
            const ytResponse = await axios.get(`https://noox.ooguy.com:5030/api/yt-searchytapi`, {
              params: { query: searchQuery },
            });

            if (ytResponse.data && ytResponse.data.length > 0) {
              const video = ytResponse.data[0]; // Take the first result
              enhancedRecommendations[key] = {
                ...song,
                videoId: video.id,
                url: video.url,
                thumbnail: video.thumbnail,
              };
            } else {
              enhancedRecommendations[key] = song; // Keep original if no result
            }
          } catch (error) {
            console.error(`Error searching for song ${song.nombre}:`, error);
            enhancedRecommendations[key] = song; // Keep original if search fails
          }
        }

        return res.json({ message: enhancedRecommendations });
      } else {
        return res.json({ message: "No se encontraron mensajes en la respuesta." });
      }
    } else {
      return res.status(response.status).json({ error: "Error al obtener la respuesta." });
    }
  } catch (error) {
    console.error("Error en /api/obtener-respuesta:", error);
    return res.status(500).json({ error: "Error en el servidor al obtener la respuesta." });
  }
});

module.exports = router;
