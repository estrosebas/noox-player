// Trending Component - Displays trending music from YouTube based on user's region
// Componente Trending - Muestra música en tendencia de YouTube según la región del usuario

import { useState, useEffect } from 'react';
import { Play, Clock } from 'lucide-react';
import axios from 'axios';
import '../styles/Trending.css';

// Interfaces / Interfaces
interface TrendingItem {
  title: string;      // Song title / Título de la canción
  id: string;        // Unique identifier / Identificador único
  url: string;       // YouTube URL / URL de YouTube
  thumbnail: string; // Thumbnail image URL / URL de la imagen miniatura
}

interface TrendingProps {
  fetchAudio: (url: string, thumbnail: string) => void;  // Function to fetch and play audio / Función para obtener y reproducir audio
}

const Trending = ({ fetchAudio }: TrendingProps) => {
  // State Management / Gestión de estados
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([]);     // List of trending songs / Lista de canciones en tendencia
  const [loading, setLoading] = useState(true);                             // Loading state / Estado de carga
  const [error, setError] = useState('');                                   // Error message / Mensaje de error
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);    // Index of hovered card / Índice de la tarjeta sobre la que está el cursor

  // Effects / Efectos
  useEffect(() => {
    // Fetch trending songs based on user's region / Obtener canciones en tendencia según la región del usuario
    const fetchTrending = async () => {
      setLoading(true);
      try {
        // Get user's IP and region / Obtener IP y región del usuario
        const ipResponse = await axios.get('https://api.ipquery.io/');
        const userIp = ipResponse.data;
        const regionResponse = await axios.get(
          `https://api.ipquery.io/${userIp}`
        );
        const region = regionResponse.data.location.country_code || 'PE';

        // Fetch trending songs for the region / Obtener canciones en tendencia para la región
        const response = await axios.get(
          `https://noox.ooguy.com:5030/api/trending-music?region=${region}`
        );
        setTrendingList(response.data);
      } catch (err) {
        setError('Could not load trending songs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  // Loading State UI / Interfaz de estado de carga
  if (loading) {
    return (
      <div className="trending-container">
        <h2 className="trending-section-title">Trending on YouTube 🎵</h2>
        <div className="trending-loading">
          <div className="trending-loading-pulse"></div>
          <p>Loading trending songs...</p>
        </div>
      </div>
    );
  }

  // Error State UI / Interfaz de estado de error
  if (error) {
    return (
      <div className="trending-container">
        <h2 className="trending-section-title">Trending on YouTube 🎵</h2>
        <div className="trending-error">
          <p>{error}</p>
          <button
            className="btn-retry"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main UI - Grid of trending songs / Interfaz principal - Cuadrícula de canciones en tendencia
  return (
    <div className="trending-container">
      <h2 className="trending-section-title">Trending on YouTube 🎵</h2>
      <div className="trending-scroll">
        <div className="trending-grid">
          {trendingList.map((item, index) => (
            <div
              key={item.id}
              className="trending-card"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => fetchAudio(item.url, item.thumbnail)}
            >
              {/* Song Thumbnail with Play Overlay / Miniatura de la canción con superposición de reproducción */}
              <div className="trending-card-image">
                <img src={item.thumbnail} alt={item.title} loading="lazy" />
                {hoveredIndex === index && (
                  <div className="trending-card-overlay">
                    <button className="play-button">
                      <Play size={24} />
                    </button>
                  </div>
                )}
              </div>
              {/* Song Information / Información de la canción */}
              <div className="trending-card-content">
                <h3 className="trending-card-title">{item.title}</h3>
                <div className="trending-card-meta">
                  <Clock size={14} />
                  <span>Now trending</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trending;