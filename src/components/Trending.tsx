import { useState, useEffect, useRef } from "react";
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

const MarqueeText: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [animationDuration, setAnimationDuration] = useState(0);

  useEffect(() => {
    const element = textRef.current;
    if (element && element.parentElement) {
      const containerWidth = element.parentElement.clientWidth;
      const distance = element.scrollWidth - containerWidth;
      setIsOverflowing(distance > 0);
      setScrollDistance(distance);
      // Velocidad en píxeles por segundo (ajusta según tu preferencia)
      const speed = 50;
      setAnimationDuration(distance / speed);
    }
  }, [text]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Si el texto desborda, definimos variables CSS para la animación
  const styleVars = isOverflowing
    ? ({
        "--scroll-distance": `${scrollDistance}px`,
        "--animation-duration": `${animationDuration}s`,
      } as React.CSSProperties)
    : {};

  return (
    <span
      ref={textRef}
      style={styleVars}
      className={`${className} ${(isOverflowing && isHovered) ? "marquee" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </span>
  );
};

const Trending = ({ fetchAudio }: TrendingProps) => {
  const [trendingList, setTrendingList] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrending = async () => {
      // Extraemos la región a partir del locale del navegador
      const userLocale = navigator.language || "es-PE";
      const region = (userLocale.split("-")[1] || "PE").toUpperCase();
      try {
        const response = await axios.get(
          `https://noox.ooguy.com:5030/api/trending-music?region=${region}`
        );
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
        <div className="trending-list">
          {trendingList.map((item) => (
            <div
              key={item.id}
              className="trending-item"
              onClick={() => fetchAudio(item.url, item.thumbnail)}
            >
              <img src={item.thumbnail} alt={item.title} className="trending-item-img" />
              <div className="trending-item-title-container">
                <MarqueeText text={item.title} className="trending-item-title" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trending;
