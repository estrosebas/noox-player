import { useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { motion } from "framer-motion";
import "../styles/Playlist.css";

Modal.setAppElement("#root");

interface Song {
  title: string;
  id: string;
  url: string;
  thumbnail: string;
}

interface PlaylistProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelect: (song: Song, fullPlaylist: Song[]) => void;
}

const Playlist = ({ isOpen, onClose, onSongSelect }: PlaylistProps) => {
  const [source, setSource] = useState<"spotify" | "youtube" | "local">("youtube");
  const [inputValue, setInputValue] = useState("");
  const [playlistData, setPlaylistData] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const importPlaylist = async () => {
    if (source === "youtube") {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `https://noox.ooguy.com:5030/api/youtube-playlist?url=${encodeURIComponent(inputValue)}`
        );
        setPlaylistData(response.data);
        localStorage.setItem("youtubePlaylist", JSON.stringify(response.data));
      } catch (err) {
        console.error(err);
        setError("Error al importar la playlist");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Importación para esta fuente no está implementada");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="playlist-modal"
      overlayClassName="playlist-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="playlist-container">
          <h3>Selecciona una fuente</h3>
          <div className="playlist-buttons">
            <button
              onClick={() => {
                setSource("youtube");
                setPlaylistData([]);
                setInputValue("");
                setError("");
              }}
            >
              YouTube
            </button>
            <button
              onClick={() => {
                setSource("spotify");
                setPlaylistData([]);
                setInputValue("");
                setError("");
              }}
            >
              Spotify
            </button>
            <button
              onClick={() => {
                setSource("local");
                setPlaylistData([]);
                setInputValue("");
                setError("");
              }}
            >
              Local
            </button>
          </div>

          {source === "spotify" && (
            <input
              type="text"
              placeholder="URL de Spotify"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          )}

          {source === "youtube" && (
            <div className="import-section">
              <input
                type="text"
                placeholder="URL de YouTube"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button onClick={importPlaylist} className="import-button">
                {loading ? "Importando..." : "Importar Playlist"}
              </button>
            </div>
          )}

          {source === "local" && <input type="file" accept="audio/*" />}

          {error && <div className="error">{error}</div>}

          {playlistData.length > 0 && (
            <div className="playlist-items">
              {playlistData.map((song, index) => (
                <div
                  key={index}
                  className="playlist-item"
                  onClick={() => {
                    onSongSelect(song, playlistData);
                    onClose();
                  }}
                >
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="playlist-item-thumbnail"
                  />
                  <span className="playlist-item-title">{song.title}</span>
                </div>
              ))}
            </div>
          )}

          <button className="playlist-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default Playlist;
