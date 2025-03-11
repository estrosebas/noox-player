// SearchBar Component - Main search interface for the music player
// Componente SearchBar - Interfaz principal de búsqueda para el reproductor de música

import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import '../styles/SearchBar.css';

// Component Props Interface / Interfaz de propiedades del componente
interface SearchBarProps {
  fetchAudio: (url: string, thumbnail: string) => void;  // Function to fetch audio / Función para obtener audio
  loading?: boolean;                                     // Loading state / Estado de carga
  youtubeAPI: boolean;                                  // Flag for YouTube API usage / Bandera para uso de API de YouTube
}

const SearchBar: React.FC<SearchBarProps> = ({ fetchAudio, youtubeAPI }) => {
  // State Management / Gestión de estados
  const [query, setQuery] = useState("");                          // Search query / Consulta de búsqueda
  const [suggestions, setSuggestions] = useState<string[]>([]);    // Search suggestions / Sugerencias de búsqueda
  const [userSelected, setUserSelected] = useState(false);         // User selection flag / Bandera de selección del usuario
  const [videos, setVideos] = useState<any[]>([]);                // Video results / Resultados de videos
  const [isLoading, setIsLoading] = useState(false);              // Loading state / Estado de carga
  
  // Constants and Refs / Constantes y Referencias
  const urlPreset = "https://www.youtube.com/watch?v=";           // YouTube URL prefix / Prefijo de URL de YouTube
  const containerRef = useRef<HTMLDivElement>(null);              // Container reference / Referencia del contenedor

  // Effects / Efectos

  // Auto-suggestion effect / Efecto de autosugerencia
  useEffect(() => {
    if (query.length >= 3 && !userSelected) {
      fetchSuggestions(query);
    } else if (query.length < 3) {
      setSuggestions([]);
    }
  }, [query]);

  // Click outside handler effect / Efecto para manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // API Functions / Funciones de API

  // Fetch search suggestions / Obtener sugerencias de búsqueda
  const fetchSuggestions = async (searchTerm: string) => {
    try {
      const response = await fetch(
        `https://noox.ooguy.com:5030/api/suggestions?query=${encodeURIComponent(searchTerm)}`,
        { headers: { "Content-Type": "application/json" } }
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else {
        console.warn("Unexpected response format:", data);
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error getting suggestions:", error);
    }
  };

  // Event Handlers / Manejadores de eventos

  // Handle suggestion click / Manejar clic en sugerencia
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    setUserSelected(true);
    fetchVideos();
  };

  // Handle input change / Manejar cambio en entrada
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setUserSelected(false);
  };

  // Fetch videos from API / Obtener videos desde la API
  const fetchVideos = async () => {
    if (!query.trim()) return;
    
    try {
      setIsLoading(true);
      setSuggestions([]);
      const apiUrl = youtubeAPI
        ? `https://noox.ooguy.com:5030/api/yt-searchytapi?query=${encodeURIComponent(query)}`
        : `https://noox.ooguy.com:5030/api/yt-search?query=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      setVideos(response.data);
    } catch (error) {
      console.error("Error searching videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press / Manejar presión de tecla
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchVideos();
    }
  };

  // Component Render / Renderizado del componente
  return (
    <div className="search-container" ref={containerRef}>
      {/* Search Input Section / Sección de entrada de búsqueda */}
      <div className="search-input-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search for songs, artists, or playlists"
          className="input-search"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button className="search-button" onClick={fetchVideos}>
          <Search size={18} />
        </button>
      </div>

      {/* Suggestions List / Lista de sugerencias */}
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Search size={16} className="suggestion-icon" />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Loading Indicator / Indicador de carga */}
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching...</p>
        </div>
      )}

      {/* Video Results / Resultados de videos */}
      {videos.length > 0 && (
        <div className="video-results">
          {videos.map((video, index) => (
            <div
              key={index}
              className="video-item"
              onClick={() => {
                fetchAudio(urlPreset + video.id, video.thumbnail);
                setVideos([]);
                setQuery("");
              }}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="video-thumbnail"
              />
              <div className="video-info">
                <h4 className="video-title">{video.title}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;