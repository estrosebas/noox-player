import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Play, Trash2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import '../styles/Playlists.css';

interface PlaylistItem {
  playlist_id: number;
  nombre: string;
  descripcion: string;
  usuario_id: number;
  fecha_creacion: string;
}

interface Song {
  cancion_id: number;
  nombre: string;
  playlist_name: string;
  url_cancion: string;
  url_thumbnail: string;
}

interface PlaylistsProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelect: (song: { title: string; id: string; url: string; thumbnail: string }) => void;
}

const Playlists: React.FC<PlaylistsProps> = ({ isOpen, onClose, onSongSelect }) => {
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState('');
  const [songsModalOpen, setSongsModalOpen] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ nombre: '', descripcion: '' });

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

  const fetchPlaylists = async () => {
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

  const handlePlaylistClick = async (playlist: PlaylistItem) => {
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
    if (songs.length === 0) return;
    
    const formattedSongs = songs.map(song => ({
      title: song.nombre,
      id: song.cancion_id.toString(),
      url: song.url_cancion,
      thumbnail: song.url_thumbnail,
    }));

    localStorage.setItem('currentPlaylist', JSON.stringify(formattedSongs));
    window.dispatchEvent(new CustomEvent('playlistUpdated', { detail: formattedSongs }));
    onSongSelect(formattedSongs[0]);
    setSongsModalOpen(false);
  };

  const handleCreatePlaylist = async () => {
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
                  songs.map(song => (
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
                          onClick={() => onSongSelect({
                            title: song.nombre,
                            id: song.cancion_id.toString(),
                            url: song.url_cancion,
                            thumbnail: song.url_thumbnail
                          })}
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
      </div>
    </AnimatePresence>
  );
};

export default Playlists;