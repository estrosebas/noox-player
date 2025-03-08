import { useState, useEffect, useCallback } from 'react';
import { Play, Clock } from 'lucide-react';
import axios from 'axios';
import '../styles/Trending.css';

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
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>(
    'loading'
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setStatus('loading');
      try {
        const { data: ipData } = await axios.get('https://api.ipquery.io/');
        const userIp = ipData?.ip || '';
        const { data: regionData } = await axios.get(
          `https://api.ipquery.io/${userIp}`
        );
        const region = regionData?.location?.country_code || 'PE';

        const { data } = await axios.get(
          `http://localhost:5030/api/trending-music?region=${region}`
        );
        setTrendingList(data);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };

    fetchTrending();
  }, []);

  const handleHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  if (status === 'loading') {
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

  if (status === 'error') {
    return (
      <div className="trending-container">
        <h2 className="trending-section-title">Trending on YouTube 🎵</h2>
        <div className="trending-error">
          <p>Could not load trending songs. Please try again later.</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-container">
      <h2 className="trending-section-title">Trending on YouTube 🎵</h2>
      <div className="trending-scroll">
        <div className="trending-grid">
          {trendingList.map((item, index) => (
            <div
              key={item.id}
              className="trending-card"
              onMouseEnter={() => handleHover(index)}
              onMouseLeave={() => handleHover(null)}
              onClick={() => fetchAudio(item.url, item.thumbnail)}
            >
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
