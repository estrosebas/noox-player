import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Para gestionar cookies
import Modal from "react-modal";
import { FaPlus, FaTimes, FaPlay, FaTrashAlt } from "react-icons/fa"; // Importamos FaTrashAlt
import Swal from "sweetalert2"; // Para utilizar SweetAlert2
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
  onSongSelect: (song: { title: string; id: string; url: string; thumbnail: string }) => void;
}

const ModalListPlaylist = ({ onSongSelect }: ModalListPlaylistProps) => {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState("");
  const [songsModalOpen, setSongsModalOpen] = useState(false);
  const [currentPlaylistName, setCurrentPlaylistName] = useState("");
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number>(0);
  
  // Modal de creación de playlist
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para abrir el modal de creación de playlist
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

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

  const handlePlaylistClick = async (playlist: PlaylistItem) => {
    setSongsError("");
    setSongs([]);
    setSongsLoading(true);
    setSongsModalOpen(true);
    setCurrentPlaylistName(playlist.nombre);
    setCurrentPlaylistId(playlist.playlist_id);
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
    }, 1000);

    return () => clearInterval(intervalId);
  }, [playlists, error]);
  const handlePlayPlaylist = () => {
    if (songs.length === 0) return;
    const formattedSongs = songs.map((song) => ({
      title: song.nombre,
      id: song.cancion_id.toString(),
      url: song.url_cancion,
      thumbnail: song.url_thumbnail,
    }));
    localStorage.setItem("currentPlaylist", JSON.stringify(formattedSongs));
    window.dispatchEvent(new CustomEvent("playlistUpdated", { detail: formattedSongs }));
    onSongSelect(formattedSongs[0]);
    setSongsModalOpen(false);
  };

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

  const handleDeletePlaylist = async () => {
    try {
      const confirmDelete = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción eliminará la playlist y todas sus canciones.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup"
        }
      });
      if (confirmDelete.isConfirmed) {
        try {
          await axios.delete(`https://noox.ooguy.com:5030/api/playlists/${currentPlaylistId}`);
          
          // SweetAlert de éxito con el fondo y la clase personalizada
          Swal.fire({
            title: "Eliminado",
            text: "La playlist ha sido eliminada",
            icon: "success",
            background: "linear-gradient(to right, #141e30, #243b55)",
            customClass: {
              popup: "custom-swal-popup"
            }
          });
          
          fetchPlaylists(); // Actualizamos la lista de playlists
          setSongsModalOpen(false); // Cerramos el modal
        } catch (err) {
          Swal.fire({
            title: "Error",
            text: "Hubo un error al eliminar la playlist",
            icon: "error",
            background: "linear-gradient(to right, #141e30, #243b55)",
            customClass: {
              popup: "custom-swal-popup"
            }
          });
        }
      }
    } catch (err) {
      Swal.fire("Error", "Hubo un error al eliminar la playlist", "error");
    }
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
        <button className="create-playlist-button" onClick={() => setIsModalOpen(true)}>
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
            <div key={playlist.playlist_id} className="playlist-item" onClick={() => handlePlaylistClick(playlist)}>
              <div className="playlist-item-title">
                <h4>{playlist.nombre}</h4>
                <p>{playlist.descripcion}</p>
              </div>
              <span className="playlist-item-date">{new Date(playlist.fecha_creacion).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
            {/* Modal para crear nueva playlist */}
            <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        overlayClassName="login-overlay"
        className="login-modal login-create-playlist"
      >
        <div className="login-container lggn">
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
      <Modal isOpen={songsModalOpen} onRequestClose={() => setSongsModalOpen(false)} overlayClassName="history-modal-overlay" className="history-modal">
        <div className="history-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="playlist-title">{currentPlaylistName}</h2>
          <div className="button-container">
            <button onClick={handlePlayPlaylist} className="btn btn-sm btn-outline-light">
              <FaPlay />
            </button>
            <button onClick={handleDeletePlaylist} className="btn btn-sm btn-outline-danger">
              <FaTrashAlt />
            </button>
            <button onClick={() => setSongsModalOpen(false)} className="close-btn">
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="history-modal-content">
          {songsLoading ? (
            <p>Cargando canciones...</p>
          ) : songsError ? (
            <p>{songsError}</p>
          ) : songs.length === 0 ? (
            <p>No hay canciones en esta playlist.</p>
          ) : (
            <ul>
              {songs.map((song) => (
                <li key={song.cancion_id} onClick={() => onSongSelect({ title: song.nombre, id: song.cancion_id.toString(), url: song.url_cancion, thumbnail: song.url_thumbnail })}>
                  <img src={song.url_thumbnail} alt={song.nombre} className="history-thumbnail" />
                  <span>{song.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {/* Modal de creación de playlist */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} overlayClassName="create-playlist-overlay" className="create-playlist-modal">
        <div className="create-playlist-container">
          <h3>Crear nueva Playlist</h3>
          {modalError && <p className="error-text">{modalError}</p>}
        </div>
      </Modal>
    </div>
  );
};

export default ModalListPlaylist;
