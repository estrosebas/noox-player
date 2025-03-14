import { useState, useEffect } from 'react';
import { Play, Clock } from 'lucide-react';
import axios from 'axios';
import '../styles/Recommendation.css';

interface RecommendationItem {
  nombre: string;
  artista: string;
  videoId: string;
  url: string;
  thumbnail: string;
}

interface ChatResponse {
  chatId: string;
  message: string;
}

interface RecommendationsResponse {
  message: Record<string, RecommendationItem>;
}

interface RecommendationProps {
  fetchAudio: (url: string, thumbnail: string) => void;
}

const Recommendation = ({ fetchAudio }: RecommendationProps) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState<'initial' | 'chat' | 'response'>('initial');
  const [error, setError] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setLoadingStep('initial');
      try {
        // Get song history from localStorage
        const songHistory = JSON.parse(localStorage.getItem('songHistory') || '[]');
        const lastFiveSongs = songHistory.slice(0, 5).map((song: any) => song.title);

        if (lastFiveSongs.length === 0) {
          setError('No hay historial de canciones para generar recomendaciones.');
          setLoading(false);
          return;
        }

        // Step 1: Create chat with prompt
        setLoadingStep('chat');
        const prompt = `Usa estas canciones como ejemplo: '${lastFiveSongs.join(", ")}'. Genera 5 recomendaciones en texto plano, donde la respuesta sea un JSON válido con este formato: { "1": { "nombre": "Nombre de la canción", "artista": "Nombre del artista" }, "2": { "nombre": "Nombre de la canción", "artista": "Nombre del artista" }, ... }. No incluyas ningún otro texto.`;
        
        const chatResponse = await axios.post<ChatResponse>('https://noox.ooguy.com:5030/api/crear-chat', {
          prompt: prompt
        });

        // Wait 8 seconds with loading animation
        await delay(8000);

        // Step 2: Get recommendations using chatId
        setLoadingStep('response');
        const recommendationsResponse = await axios.post<RecommendationsResponse>(
          'https://noox.ooguy.com:5030/api/obtener-respuesta',
          {
            chatId: chatResponse.data.chatId
          }
        );

        // Convert object to array
        const recommendationsArray = Object.values(recommendationsResponse.data.message);
        setRecommendations(recommendationsArray);
      } catch (err) {
        setError('No se pudieron cargar las recomendaciones. Por favor, intenta más tarde.');
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="recommendations-section">
        <h2>Recomendaciones para ti 🎵</h2>
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">
            {loadingStep === 'initial' && 'Preparando recomendaciones...'}
            {loadingStep === 'chat' && 'Analizando tu historial musical...'}
            {loadingStep === 'response' && 'Generando recomendaciones personalizadas...'}
          </p>
          {loadingStep === 'chat' && (
            <div className="loading-progress">
              <div className="loading-progress-bar" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-section">
        <h2>Recomendaciones para ti 🎵</h2>
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-section">
      <h2>Recomendaciones para ti 🎵</h2>
      <div className="recommendations-scroll">
        <div className="recommendations-grid">
          {recommendations.map((item, index) => (
            <div
              key={item.videoId}
              className="recommendation-card"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => fetchAudio(item.url, item.thumbnail)}
            >
              <div className="recommendation-card-image">
                <img src={item.thumbnail} alt={`${item.nombre} - ${item.artista}`} loading="lazy" />
                {hoveredIndex === index && (
                  <div className="recommendation-card-overlay">
                    <button className="play-button">
                      <Play size={24} />
                    </button>
                  </div>
                )}
              </div>
              <div className="recommendation-card-content">
                <h3 className="recommendation-card-title">{item.nombre}</h3>
                <p className="recommendation-card-artist">{item.artista}</p>
                <div className="recommendation-card-meta">
                  <Clock size={14} />
                  <span>Recomendado para ti</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendation;
