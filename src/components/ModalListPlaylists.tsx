import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Para gestionar cookies
import "../styles/ModalListPlaylists.css"; // Estilos del componente

interface PlaylistItem {
  playlist_id: number;
  nombre: string;
  descripcion: string;
  usuario_id: number;
  fecha_creacion: string;
}

const ModalListPlaylist = () => {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlaylists = async () => {
      // Obtener el ID del usuario desde la cookie de sesión
      const sessionCookie = Cookies.get("session");
      if (sessionCookie) {
        const userData = JSON.parse(sessionCookie);
        try {
          const response = await axios.get(
            `https://noox.ooguy.com:5030/api/playlists-by-user/${userData.usuario_id}`
          );
          setPlaylists(response.data); // Guardamos las playlists en el estado
        } catch (err) {
          setError("Error al cargar las playlists.");
        } finally {
          setLoading(false);
        }
      } else {
        setError("No hay sesión activa. Inicia sesión para ver tus playlists.");
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  return (
    <div className="playlist-container">
      <h3 className="playlist-section-title">Mis Playlists</h3>
      {loading ? (
        <p className="loading-text">Cargando playlists...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="playlist-list">
          {playlists.map((playlist) => (
            <div key={playlist.playlist_id} className="playlist-item">
              <div className="playlist-item-title">
                <h4>{playlist.nombre}</h4>
                <p>{playlist.descripcion}</p>
              </div>
              <span className="playlist-item-date">{new Date(playlist.fecha_creacion).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModalListPlaylist;
