import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import '../styles/SearchBar.css';

interface SearchBarProps {
  fetchAudio: (url: string, thumbnail: string) => void;
  loading?: boolean;
  youtubeAPI: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ fetchAudio, youtubeAPI }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [userSelected, setUserSelected] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const urlPreset = "https://www.youtube.com/watch?v=";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 3 && !userSelected) {
      fetchSuggestions(query);
    } else if (query.length < 3) {
      setSuggestions([]);
    }
  }, [query]);

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

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    setUserSelected(true);
    fetchVideos();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setUserSelected(false);
  };

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchVideos();
    }
  };

  return (
    <div className="search-container" ref={containerRef}>
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

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching...</p>
        </div>
      )}

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