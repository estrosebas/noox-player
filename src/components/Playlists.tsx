// Playlists Component - Manages user playlists and playlist operations
// Componente Playlists - Gestiona las listas de reproducción del usuario y sus operaciones

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Play, Trash2, Download } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import '../styles/Playlists.css';

// Interfaces / Interfaces
interface PlaylistItem {
  playlist_id: number;      // Playlist identifier / Identificador de la lista
  nombre: string;          // Playlist name / Nombre de la lista
  descripcion: string;     // Playlist description / Descripción de la lista
  usuario_id: number;      // User identifier / Identificador del usuario
  fecha_creacion: string;  // Creation date / Fecha de creación
}

interface Song {
  cancion_id: number;      // Song identifier / Identificador de la canción
  nombre: string;          // Song name / Nombre de la canción
  playlist_name: string;   // Playlist name / Nombre de la lista
  url_cancion: string;     // Song URL / URL de la canción
  url_thumbnail: string;   // Thumbnail URL / URL de la miniatura
}

interface PlaylistsProps {
  isOpen: boolean;         // Modal visibility state / Estado de visibilidad del modal
  onClose: () => void;     // Close handler / Manejador de cierre
  onSongSelect: (song: { title: string; id: string; url: string; thumbnail: string }) => void;  // Song selection handler / Manejador de selección de canción
}

const Playlists: React.FC<PlaylistsProps> = ({ isOpen, onClose, onSongSelect }) => {
  // State Management / Gestión de estados
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);              // Playlists list / Lista de playlists
  const [loading, setLoading] = useState(true);                                // Loading state / Estado de carga
  const [error, setError] = useState('');                                      // Error message / Mensaje de error
  const [songs, setSongs] = useState<Song[]>([]);                             // Songs list / Lista de canciones
  const [songsLoading, setSongsLoading] = useState(false);                    // Songs loading state / Estado de carga de canciones
  const [songsError, setSongsError] = useState('');                           // Songs error message / Mensaje de error de canciones
  const [songsModalOpen, setSongsModalOpen] = useState(false);                // Songs modal state / Estado del modal de canciones
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistItem | null>(null);  // Current playlist / Lista actual
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);          // Create modal state / Estado del modal de creación
  const [newPlaylist, setNewPlaylist] = useState({ nombre: '', descripcion: '' });  // New playlist data / Datos de nueva lista
  
  // Import States / Estados de importación
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);          // Import modal state / Estado del modal de importación
  const [source, setSource] = useState<"spotify" | "youtube" | "local">("youtube");  // Import source / Fuente de importación
  const [inputValue, setInputValue] = useState("");                           // Input value / Valor de entrada
  const [importedPlaylistData, setImportedPlaylistData] = useState<any[]>([]);  // Imported data / Datos importados
  const [importLoading, setImportLoading] = useState(false);                  // Import loading state / Estado de carga de importación
  const [importError, setImportError] = useState("");                         // Import error / Error de importación
  const [importPlaylistName, setImportPlaylistName] = useState("");          // Import name / Nombre de importación
  const [importPlaylistDescription, setImportPlaylistDescription] = useState("");  // Import description / Descripción de importación

  // Fetch playlists when modal opens or user logs in/out
  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }

    // Set up interval to check for session changes
    const intervalId = setInterval(() => {
      const sessionCookie = Cookies.get('session');
      if (!sessionCookie && playlists.length > 0) {
        // User logged out, clear playlists
        setPlaylists([]);
        setError('Please log in to view your playlists');
      } else if (sessionCookie && playlists.length === 0) {
        // User logged in, fetch playlists
        fetchPlaylists();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  // API Functions / Funciones de API
  const fetchPlaylists = async () => {
    // Fetch user playlists / Obtener listas del usuario
    const sessionCookie = Cookies.get('session');
    if (!sessionCookie) {
      setError('Please log in to view your playlists');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = JSON.parse(sessionCookie);
      const response = await axios.get(
        `https://noox.ooguy.com:5030/api/playlists-by-user/${userData.usuario_id}`
      );
      setPlaylists(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading playlists:', err);
      setError('Error loading playlists');
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers / Manejadores de eventos
  const handlePlaylistClick = async (playlist: PlaylistItem) => {
    // Handle playlist selection / Manejar selección de lista
    setCurrentPlaylist(playlist);
    setSongsError('');
    setSongs([]);
    setSongsLoading(true);
    setSongsModalOpen(true);

    try {
      const response = await axios.get(
        `https://noox.ooguy.com:5030/api/songsbyplaylist/${playlist.playlist_id}`
      );
      setSongs(response.data);

      // Cache songs
      response.data.forEach((song: Song) => {
        fetch(`https://noox.ooguy.com:5030/search?url=${encodeURIComponent(song.url_cancion)}`)
          .catch(err => console.error('Error caching song:', err));
      });
    } catch (err) {
      setSongsError('Error loading songs');
    } finally {
      setSongsLoading(false);
    }
  };

  const handlePlayPlaylist = () => {
    // Play entire playlist / Reproducir lista completa
    if (songs.length === 0) return;
    
    const formattedSongs = songs.map(song => ({
      title: song.nombre,
      id: song.cancion_id.toString(),
      url: song.url_cancion,
      thumbnail: song.url_thumbnail,
    }));

    // Guardar en localStorage y disparar evento personalizado
    const playlistData = { playlist: formattedSongs, currentIndex: 0 };
    localStorage.setItem('currentPlaylistData', JSON.stringify(playlistData));
    window.dispatchEvent(new CustomEvent('playlistUpdated', { detail: playlistData }));
    
    onSongSelect(formattedSongs[0]);
    setSongsModalOpen(false);
  };

  const handleSelectSong = (song: Song, index: number) => {
    // Handle individual song selection / Manejar selección de canción individual
    const formattedSongs = songs.map(s => ({
      title: s.nombre,
      id: s.cancion_id.toString(),
      url: s.url_cancion,
      thumbnail: s.url_thumbnail,
    }));
    
    // Guardar en localStorage y disparar evento personalizado
    const playlistData = { playlist: formattedSongs, currentIndex: index };
    localStorage.setItem('currentPlaylistData', JSON.stringify(playlistData));
    window.dispatchEvent(new CustomEvent('playlistUpdated', { detail: playlistData }));
    
    onSongSelect({
      title: song.nombre,
      id: song.cancion_id.toString(),
      url: song.url_cancion,
      thumbnail: song.url_thumbnail
    });
    setSongsModalOpen(false);
  };

  const handleCreatePlaylist = async () => {
    // Create new playlist / Crear nueva lista
    if (!newPlaylist.nombre.trim() || !newPlaylist.descripcion.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all fields',
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: { popup: 'custom-swal-popup' }
      });
      return;
    }

    const sessionCookie = Cookies.get('session');
    if (!sessionCookie) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please log in to create playlists',
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: { popup: 'custom-swal-popup' }
      });
      return;
    }

    try {
      const userData = JSON.parse(sessionCookie);
      const response = await axios.post('https://noox.ooguy.com:5030/api/playlists', {
        nombre: newPlaylist.nombre,
        descripcion: newPlaylist.descripcion,
        usuario_id: userData.usuario_id,
      });

      // Add the new playlist to the list
      setPlaylists(prev => [...prev, response.data]);

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Playlist created successfully',
        timer: 1500,
        showConfirmButton: false,
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: { popup: 'custom-swal-popup' }
      });

      setNewPlaylist({ nombre: '', descripcion: '' });
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Error creating playlist:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error creating playlist',
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: { popup: 'custom-swal-popup' }
      });
    }
  };

  const handleDeleteSong = async (songId: number) => {
    // Delete song from playlist / Eliminar canción de la lista
    const result = await Swal.fire({
      title: 'Delete Song',
      text: 'Are you sure you want to remove this song from the playlist?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: 'linear-gradient(to right, #141e30, #243b55)',
      customClass: { popup: 'custom-swal-popup' }
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`https://noox.ooguy.com:5030/api/canciones/${songId}`);
        setSongs(songs.filter(song => song.cancion_id !== songId));
        
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Song removed from playlist',
          timer: 1500,
          showConfirmButton: false,
          background: 'linear-gradient(to right, #141e30, #243b55)',
          customClass: { popup: 'custom-swal-popup' }
        });
      } catch (err) {
        console.error('Error deleting song:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error removing song',
          background: 'linear-gradient(to right, #141e30, #243b55)',
          customClass: { popup: 'custom-swal-popup' }
        });
      }
    }
  };

  const handleDeletePlaylist = async () => {
    // Delete entire playlist / Eliminar lista completa
    if (!currentPlaylist) return;

    const result = await Swal.fire({
      title: 'Delete Playlist',
      text: 'Are you sure you want to delete this playlist? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      background: 'linear-gradient(to right, #141e30, #243b55)',
      customClass: { popup: 'custom-swal-popup' }
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`https://noox.ooguy.com:5030/api/playlists/${currentPlaylist.playlist_id}`);
        setPlaylists(playlists.filter(p => p.playlist_id !== currentPlaylist.playlist_id));
        setSongsModalOpen(false);
        
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Playlist deleted successfully',
          timer: 1500,
          showConfirmButton: false,
          background: 'linear-gradient(to right, #141e30, #243b55)',
          customClass: { popup: 'custom-swal-popup' }
        });
      } catch (err) {
        console.error('Error deleting playlist:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error deleting playlist',
          background: 'linear-gradient(to right, #141e30, #243b55)',
          customClass: { popup: 'custom-swal-popup' }
        });
      }
    }
  };

  // Import Functions / Funciones de importación
  const importPlaylist = async () => {
    // Import playlist from external source / Importar lista desde fuente externa
    if (!inputValue.trim()) {
      setImportError("Please enter a valid URL");
      return;
    }

    if (source === "youtube") {
      setImportLoading(true);
      setImportError("");
      try {
        const response = await axios.get(
          `https://noox.ooguy.com:5030/api/youtube-playlist?url=${encodeURIComponent(inputValue)}`
        );
        setImportedPlaylistData(response.data);
        
        // Auto-fill playlist name if available
        if (response.data.length > 0 && response.data[0].playlistTitle) {
          setImportPlaylistName(response.data[0].playlistTitle);
        }
      } catch (err) {
        console.error(err);
        setImportError("Error importing playlist");
      } finally {
        setImportLoading(false);
      }
    } else {
      setImportError("Import for this source is not yet implemented");
    }
  };

  const handleImportPlaylist = async () => {
    // Process imported playlist / Procesar lista importada
    if (!importPlaylistName || !importPlaylistDescription) {
      setImportError("Please enter a name and description for the playlist");
      return;
    }

    if (importedPlaylistData.length === 0) {
      setImportError("No songs to import");
      return;
    }

    const sessionCookie = Cookies.get("session");
    if (!sessionCookie) {
      setImportError("Please log in to create playlists");
      return;
    }

    try {
      setImportLoading(true);
      const userData = JSON.parse(sessionCookie);
      
      // Create the playlist
      const playlistResponse = await axios.post(
        "https://noox.ooguy.com:5030/api/playlists",
        {
          nombre: importPlaylistName,
          descripcion: importPlaylistDescription,
          usuario_id: userData.usuario_id,
        }
      );

      const playlistId = playlistResponse.data.playlist_id;
      
      // Add songs to the playlist
      const songRequests = importedPlaylistData.map((song) =>
        axios.post("https://noox.ooguy.com:5030/api/canciones", {
          nombre: song.title,
          url_cancion: song.url,
          url_thumbnail: song.thumbnail,
          playlist_id: playlistId,
        })
      );

      await Promise.all(songRequests);
      
      // Refresh playlists
      fetchPlaylists();
      
      // Reset import form
      setImportedPlaylistData([]);
      setInputValue("");
      setImportPlaylistName("");
      setImportPlaylistDescription("");
      setIsImportModalOpen(false);
      
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Playlist imported successfully',
        timer: 1500,
        showConfirmButton: false,
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: { popup: 'custom-swal-popup' }
      });
    } catch (err) {
      console.error(err);
      setImportError("Error creating playlist");
    } finally {
      setImportLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="playlists-modal-overlay">
        <motion.div
          className="playlists-modal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="playlists-modal-header">
            <h2>Your Playlists</h2>
            <div className="header-actions">
              <button className="create-playlist-button" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={20} />
                New Playlist
              </button>
              <button className="import-playlist-button" onClick={() => setIsImportModalOpen(true)}>
                <Download size={20} />
                Import Playlist
              </button>
              <button className="action-button" onClick={onClose}>
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="playlists-modal-content">
            {loading ? (
              <div className="loading-state">Loading playlists...</div>
            ) : error ? (
              <div className="error-state">{error}</div>
            ) : playlists.length === 0 ? (
              <div className="empty-state">No playlists yet</div>
            ) : (
              <div className="playlists-list">
                {playlists.map(playlist => (
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
          </div>
        </motion.div>

        {/* Songs Modal */}
        {songsModalOpen && currentPlaylist && (
          <div className="playlists-modal-overlay">
            <motion.div
              className="songs-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="songs-header">
                <h2>{currentPlaylist.nombre}</h2>
                <div className="songs-header-actions">
                  <button className="action-button" onClick={handlePlayPlaylist}>
                    <Play size={20} />
                  </button>
                  <button className="action-button danger" onClick={handleDeletePlaylist}>
                    <Trash2 size={20} />
                  </button>
                  <button className="action-button" onClick={() => setSongsModalOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="songs-list">
                {songsLoading ? (
                  <div className="loading-state">Loading songs...</div>
                ) : songsError ? (
                  <div className="error-state">{songsError}</div>
                ) : songs.length === 0 ? (
                  <div className="empty-state">No songs in this playlist</div>
                ) : (
                  songs.map((song, index) => (
                    <div key={song.cancion_id} className="song-item">
                      <img
                        src={song.url_thumbnail}
                        alt={song.nombre}
                        className="song-thumbnail"
                      />
                      <div className="song-info">
                        <h3 className="song-title">{song.nombre}</h3>
                      </div>
                      <div className="song-actions">
                        <button
                          className="action-button"
                          onClick={() => handleSelectSong(song, index)}
                        >
                          <Play size={16} />
                        </button>
                        <button
                          className="action-button danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSong(song.cancion_id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Playlist Modal */}
        {isCreateModalOpen && (
          <div className="playlists-modal-overlay">
            <motion.div
              className="playlists-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="playlists-modal-header">
                <h2>Create New Playlist</h2>
                <button className="action-button" onClick={() => setIsCreateModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="playlists-modal-content">
                <div className="form-group">
                  <label htmlFor="nombre">Name</label>
                  <input
                    type="text"
                    id="nombre"
                    value={newPlaylist.nombre}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, nombre: e.target.value })}
                    placeholder="Playlist name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="descripcion">Description</label>
                  <input
                    type="text"
                    id="descripcion"
                    value={newPlaylist.descripcion}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, descripcion: e.target.value })}
                    placeholder="Playlist description"
                  />
                </div>

                <button className="btn-primary" onClick={handleCreatePlaylist}>
                  Create Playlist
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Import Playlist Modal */}
        {isImportModalOpen && (
          <div className="playlists-modal-overlay">
            <motion.div
              className="playlists-modal import-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="playlists-modal-header">
                <h2>Import Playlist</h2>
                <button className="action-button" onClick={() => setIsImportModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="playlists-modal-content">
                <div className="source-selector">
                  <h3>Select Source</h3>
                  <div className="source-buttons">
                    <button 
                      className={`source-button ${source === 'youtube' ? 'active' : ''}`}
                      onClick={() => {
                        setSource("youtube");
                        setImportedPlaylistData([]);
                        setInputValue("");
                        setImportError("");
                      }}
                    >
                      YouTube
                    </button>
                    <button 
                      className={`source-button ${source === 'spotify' ? 'active' : ''}`}
                      onClick={() => {
                        setSource("spotify");
                        setImportedPlaylistData([]);
                        setInputValue("");
                        setImportError("");
                      }}
                    >
                      Spotify
                    </button>
                    <button 
                      className={`source-button ${source === 'local' ? 'active' : ''}`}
                      onClick={() => {
                        setSource("local");
                        setImportedPlaylistData([]);
                        setInputValue("");
                        setImportError("");
                      }}
                    >
                      Local
                    </button>
                  </div>
                </div>

                {source === "youtube" && (
                  <div className="import-section">
                    <div className="form-group">
                      <label htmlFor="playlistUrl">YouTube Playlist URL</label>
                      <div className="input-with-button">
                        <input
                          type="text"
                          id="playlistUrl"
                          placeholder="https://www.youtube.com/playlist?list=..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button 
                          className="import-button" 
                          onClick={importPlaylist}
                          disabled={importLoading}
                        >
                          {importLoading ? "Importing..." : "Import"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {importError && <div className="error-state">{importError}</div>}

                {importedPlaylistData.length > 0 && (
                  <>
                    <div className="form-group">
                      <label htmlFor="importPlaylistName">Playlist Name</label>
                      <input
                        type="text"
                        id="importPlaylistName"
                        value={importPlaylistName}
                        onChange={(e) => setImportPlaylistName(e.target.value)}
                        placeholder="Enter playlist name"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="importPlaylistDescription">Description</label>
                      <input
                        type="text"
                        id="importPlaylistDescription"
                        value={importPlaylistDescription}
                        onChange={(e) => setImportPlaylistDescription(e.target.value)}
                        placeholder="Enter playlist description"
                      />
                    </div>

                    <div className="imported-songs">
                      <h3>Songs to Import ({importedPlaylistData.length})</h3>
                      <div className="imported-songs-list">
                        {importedPlaylistData.slice(0, 5).map((song, index) => (
                          <div key={index} className="imported-song-item">
                            <img
                              src={song.thumbnail}
                              alt={song.title}
                              className="imported-song-thumbnail"
                            />
                            <span className="imported-song-title">{song.title}</span>
                          </div>
                        ))}
                        {importedPlaylistData.length > 5 && (
                          <div className="more-songs">
                            +{importedPlaylistData.length - 5} more songs
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      className="btn-primary" 
                      onClick={handleImportPlaylist}
                      disabled={importLoading}
                    >
                      {importLoading ? "Creating Playlist..." : "Create Playlist"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default Playlists;