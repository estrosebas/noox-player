import { useState, useEffect } from "react";
import "../styles/SearchBar.css";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface SearchBarProps {
  fetchAudio: (url: string, thumbnail: string) => void;
  loading: boolean;
  youtubeAPI: boolean;
}

const SearchBar = ({ fetchAudio, loading, youtubeAPI }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userSelected, setUserSelected] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const urlPreset = "https://www.youtube.com/watch?v=";

  useEffect(() => {
    if (query.length >= 3 && !userSelected) {
      fetchSuggestions(query);
    } else if (query.length < 3) {
      setSuggestions([]);
    }
  }, [query]);

  const fetchSuggestions = async (searchTerm: string) => {
    try {
      const response = await fetch(
        `https://noox.ooguy.com:5030/api/suggestions?query=${encodeURIComponent(
          searchTerm
        )}`,
        { headers: { "Content-Type": "application/json" } }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else {
        console.warn("Formato inesperado de respuesta:", data);
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error obteniendo sugerencias:", error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    setUserSelected(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setUserSelected(false);
  };

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      setSuggestions([]);
      const apiUrl = youtubeAPI
        ? `https://noox.ooguy.com:5030/api/yt-searchytapi?query=${encodeURIComponent(
            query
          )}`
        : `https://noox.ooguy.com:5030/api/yt-search?query=${encodeURIComponent(
            query
          )}`;
      const response = await axios.get(apiUrl);
      setVideos(response.data);
    } catch (error) {
      console.error("Error buscando videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchVideos();
    }
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <div className="search-icon-container">
          <FaSearch className="search-icon" />
        </div>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar en Noox..."
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button
          className="search-button"
          onClick={fetchVideos}
          disabled={loading}
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className="spinner-icon" />
          ) : (
            "Buscar"
          )}
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}

      {isLoading && <p className="loading-text">Cargando resultados...</p>}

      {videos.length > 0 && (
        <div className="video-list">
          {videos.map((video, index) => (
            <div
              key={index}
              className="video-item"
              onClick={() => {
                fetchAudio(urlPreset + video.id, video.thumbnail);
                setVideos([]);
              }}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="video-thumbnail"
              />
              <p className="video-title">{video.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
