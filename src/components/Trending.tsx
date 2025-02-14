import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Trending.css";

interface TrendingItem {
  title: string;
  id: string;
  url: string;
  thumbnail: string;
}

interface TrendingProps {
  fetchAudio: (url: string, thumbnail: string) => void;
}

const Trending = ({ fetchAudio }: TrendingProps) => {
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await axios.get("https://noox.ooguy.com:5030/api/trending-music?region=PE");
        setTrendingList(response.data);
      } catch (err) {
        setError("No se pudieron cargar las tendencias. Intenta más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <div className="trending-container">
      <h3 className="trending-section-title">Tendencias en YouTube 🎵</h3>
      {loading ? (
        <p className="loading-text">Cargando tendencias...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="trending-cards">
          {trendingList.map((item) => (
            <div
              key={item.id}
              className="trending-card"
              onClick={() => fetchAudio(item.url, item.thumbnail)}
            >
              <img src={item.thumbnail} alt={item.title} className="trending-card-img" />
              <p className="trending-card-title">{item.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;
