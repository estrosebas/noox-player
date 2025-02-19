import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Para gestionar cookies
import Modal from "react-modal";
import { FaPlus, FaTimes } from "react-icons/fa";
import "../styles/ModalListPlaylists.css";

// Configuramos el elemento raíz para react-modal (ajustar el selector según tu proyecto)
Modal.setAppElement("#root");

interface PlaylistItem {
  playlist_id: number;
  nombre: string;
  descripcion: string;
  usuario_id: number;
  fecha_creacion: string;
}

export interface Song {
  cancion_id: number;
  nombre: string;
  playlist_name: string;
  url_cancion: string;
  url_thumbnail: string;
}

interface ModalListPlaylistProps {
  // Callback que se invoca cuando se selecciona una canción para reproducirla
  onSongSelect: (song: {
    title: string;
    id: string;
    url: string;
    thumbnail: string;
  }) => void;
}

const ModalListPlaylist = ({ onSongSelect }: ModalListPlaylistProps) => {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estados para el modal de creación de playlist
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [modalError, setModalError] = useState("");

  // Estados para el modal de canciones de la playlist
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState("");
  const [songsModalOpen, setSongsModalOpen] = useState(false);
  // Estado para almacenar el nombre de la playlist seleccionada
  const [currentPlaylistName, setCurrentPlaylistName] = useState("");

  // Función para cargar las playlists del usuario
  const fetchPlaylists = async () => {
    const sessionCookie = Cookies.get("session");
    if (sessionCookie) {
      const userData = JSON.parse(sessionCookie);
      try {
        const response = await axios.get(
          `https://noox.ooguy.com:5030/api/playlists-by-user/${userData.usuario_id}`
        );
        setPlaylists(response.data);
        setError("");
      } catch (err) {
        setError("Error al cargar las playlists.");
      } finally {
        setLoading(false);
      }
    } else {
      setPlaylists([]);
      setError("No hay sesión activa. Inicia sesión para ver tus playlists.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto que revisa cada 3 segundos la cookie para detectar si hay sesión activa
  useEffect(() => {
    const intervalId = setInterval(() => {
      const sessionCookie = Cookies.get("session");
      if (!sessionCookie) {
        if (playlists.length > 0 || error === "") {
          setPlaylists([]);
          setError("No hay sesión activa. Inicia sesión para ver tus playlists.");
        }
      } else {
        if (error === "No hay sesión activa. Inicia sesión para ver tus playlists.") {
          fetchPlaylists();
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [playlists, error]);

  // Función para crear nueva playlist
  const handleCreatePlaylist = async () => {
    setModalError("");
    if (!newPlaylistName.trim() || !newPlaylistDescription.trim()) {
      setModalError("Todos los campos son requeridos.");
      return;
    }
    const sessionCookie = Cookies.get("session");
    if (!sessionCookie) {
      setModalError("No hay sesión activa.");
      return;
    }
    const userData = JSON.parse(sessionCookie);
    try {
      const response = await axios.post(
        "https://noox.ooguy.com:5030/api/playlists",
        {
          nombre: newPlaylistName,
          descripcion: newPlaylistDescription,
          usuario_id: userData.usuario_id,
        }
      );
      // Se agrega la nueva playlist a la lista (se asume que response.data contiene el objeto creado)
      setPlaylists([...playlists, response.data]);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setIsModalOpen(false);
    } catch (err) {
      setModalError("Error al crear la playlist.");
    }
  };

  // Función para manejar el clic en una playlist y cargar sus canciones
  const handlePlaylistClick = async (playlist: PlaylistItem) => {
    setSongsError("");
    setSongs([]);
    setSongsLoading(true);
    setSongsModalOpen(true);
    // Guardamos el nombre de la playlist para mostrarlo en el modal
    setCurrentPlaylistName(playlist.nombre);
    try {
      const response = await axios.get(
        `https://noox.ooguy.com:5030/api/songsbyplaylist/${playlist.playlist_id}`
      );
      setSongs(response.data);
    } catch (err) {
      setSongsError("Error al cargar las canciones.");
    } finally {
      setSongsLoading(false);
    }
  };

  // Función para formatear la playlist y reproducirla (guarda en localStorage y reproduce la 1ª canción)
  const handlePlayPlaylist = () => {
    if (songs.length === 0) return;
    // Formateamos la respuesta para que el reproductor la maneje:
    const formattedSongs = songs.map((song) => ({
      title: song.nombre,
      id: song.cancion_id.toString(),
      url: song.url_cancion,
      thumbnail: song.url_thumbnail,
    }));
    // Guardamos (sobrescribiendo) en localStorage la playlist formateada con la clave "currentPlaylist"
    localStorage.setItem("currentPlaylist", JSON.stringify(formattedSongs));
    // Disparamos un evento personalizado para notificar que se ha actualizado la playlist
    window.dispatchEvent(
      new CustomEvent("playlistUpdated", { detail: formattedSongs })
    );
    // Iniciamos la reproducción llamando a onSongSelect con la primera canción
    onSongSelect(formattedSongs[0]);
    // Cerramos el modal de canciones
    setSongsModalOpen(false);
  };

  return (
    <div className="playlist-container">
      <div
        className="playlist-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 className="playlist-section-title">Mis Playlists</h3>
        <button
          className="create-playlist-button"
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus />
        </button>
      </div>
      {loading ? (
        <p className="loading-text">Cargando playlists...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="playlist-list">
          {playlists.map((playlist) => (
            <div
              key={playlist.playlist_id}
              className="playlist-item"
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="playlist-item-title">
                <h4>{playlist.nombre}</h4>
                <p>{playlist.descripcion}</p>
              </div>
              <span className="playlist-item-date">
                {new Date(playlist.fecha_creacion).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear nueva playlist */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        overlayClassName="login-overlay"
        className="login-modal"
      >
        <div className="login-container">
          {Cookies.get("session") ? (
            <>
              <h3>Crear Playlist</h3>
              <input
                type="text"
                placeholder="Nombre de la playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Descripción"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
              />
              {modalError && <p className="error">{modalError}</p>}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                <button className="login-button" onClick={handleCreatePlaylist}>
                  Crear
                </button>
                <button
                  className="login-close"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>Inicia sesión</h3>
              <p>Inicia sesión para poder crear playlist.</p>
              <button
                className="login-close"
                onClick={() => setIsModalOpen(false)}
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Modal para mostrar las canciones de una playlist */}
      <Modal
        isOpen={songsModalOpen}
        onRequestClose={() => setSongsModalOpen(false)}
        overlayClassName="history-modal-overlay"
        className="history-modal"
      >
        <div className="history-modal-header">
          <h2>{currentPlaylistName}</h2>
          <button onClick={() => setSongsModalOpen(false)} className="close-btn">
            <FaTimes />
          </button>
        </div>
        <div className="history-modal-content">
          {songsLoading ? (
            <p>Cargando canciones...</p>
          ) : songsError ? (
            <p>{songsError}</p>
          ) : songs.length === 0 ? (
            <p>No hay canciones en esta playlist.</p>
          ) : (
            <>
              {/* Botón para reproducir toda la playlist */}
              <button onClick={handlePlayPlaylist} className="play-playlist-button">
                Play Playlist
              </button>
              <ul>
                {songs.map((song) => (
                  <li
                    key={song.cancion_id}
                    onClick={() => {
                      // Si se selecciona una canción individual, se podría formatear también
                      const formattedSong = {
                        title: song.nombre,
                        id: song.cancion_id.toString(),
                        url: song.url_cancion,
                        thumbnail: song.url_thumbnail,
                      };
                      onSongSelect(formattedSong);
                      setSongsModalOpen(false);
                    }}
                  >
                    <img
                      src={song.url_thumbnail}
                      alt={song.nombre}
                      className="history-thumbnail"
                    />
                    <span>{song.nombre}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ModalListPlaylist;
