import { useState } from "react";
import Cookies from "js-cookie";
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
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");

  const importPlaylist = async () => {
    if (source === "youtube") {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `https://noox.ooguy.com:5030/api/youtube-playlist?url=${encodeURIComponent(inputValue)}`
        );
        setPlaylistData(response.data);
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

  const handleCreatePlaylist = async () => {
    if (!playlistName || !playlistDescription) {
      setError("Por favor, ingresa un nombre y descripción para la playlist.");
      return;
    }

    // Obtén el usuario_id desde la cookie (suponiendo que ya se guarda en cookies)
    const sessionCookie = Cookies.get("session");
    if (!sessionCookie) {
      setError("No hay sesión activa.");
      return;
    }
    const userData = JSON.parse(sessionCookie);
    const usuarioId = userData.usuario_id;

    // 1. Crear la playlist
    try {
      const playlistResponse = await axios.post(
        "https://noox.ooguy.com:5030/api/playlists",
        {
          nombre: playlistName,
          descripcion: playlistDescription,
          usuario_id: usuarioId,
        }
      );

      const playlistId = playlistResponse.data.playlist_id; // Asegúrate de que el backend devuelve el id de la playlist creada
      console.log("Playlist creada con ID:", playlistId);
      // 2. Crear las canciones asociadas a la playlist
      const songRequests = playlistData.map((song) =>
        axios.post("https://noox.ooguy.com:5030/api/canciones", {
          nombre: song.title,
          url_cancion: song.url,
          url_thumbnail: song.thumbnail,
          playlist_id: playlistId,
        })
      );

      // Esperar a que todas las canciones se creen
      await Promise.all(songRequests);
      setPlaylistData([]); // Limpiar la lista de canciones después de guardarlas

      // Cerrar el modal o realizar cualquier otra acción
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al crear la playlist.");
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

          {/* Ingresar el nombre y la descripción de la playlist */}
          {playlistData.length > 0 && (
            <div className="playlist-form">
              <input
                type="text"
                placeholder="Nombre de la Playlist"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Descripción breve"
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
              />
              
            </div>
          )}
          <button className="confirm-button playlist-create" onClick={handleCreatePlaylist}>
                Crear Playlist
          </button>
          <button className="playlist-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default Playlist;
