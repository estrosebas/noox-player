import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Share2, Plus, Volume2, VolumeX, X } from 'lucide-react';
import Modal from 'react-modal';
import Cookies from 'js-cookie';
import axios from 'axios';
import '../styles/Player.css';

interface PlaylistItem {
  playlist_id: number;
  nombre: string;
  descripcion: string;
  usuario_id: number;
  fecha_creacion: string;
}

export interface MusicPlayerRef {
  playSong: (name: string, url: string, thumbnail: string, youtubeUrl: string) => void;
}

interface PlayerProps {
  fetchAudio: (url: string, thumbnail: string) => void;
}

const Player = forwardRef<MusicPlayerRef, PlayerProps>((props, ref) => {
  // Estados de reproducción
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [durationTime, setDurationTime] = useState('0:00');
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showMobileVolumeControl, setShowMobileVolumeControl] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLInputElement | null>(null);

  // Estados para la canción actual y playlist
  const [songDetails, setSongDetails] = useState({
    name: 'No track playing',
    url: '',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
    youtubeUrl: '',
  });
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [shareCopied, setShareCopied] = useState(false);

  // Estados para el modal de playlists
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistError, setPlaylistError] = useState('');

  // Ref para el título y verificar desbordamiento
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedPlaylist = localStorage.getItem('currentPlaylist');
      if (storedPlaylist) {
        setPlaylist(JSON.parse(storedPlaylist));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Efecto para activar la animación en el título si éste desborda
  useEffect(() => {
    if (titleRef.current) {
      const element = titleRef.current;
      const overflow = element.scrollWidth - element.clientWidth;
      if (overflow > 0) {
        const duration = overflow * 0.03; // Ajusta la velocidad (0.03s por píxel)
        element.style.setProperty('--overflow', `${overflow}px`);
        element.style.setProperty('--scroll-duration', `${duration}s`);
        element.classList.add("scrolling");
      } else {
        element.classList.remove("scrolling");
        element.style.removeProperty('--overflow');
        element.style.removeProperty('--scroll-duration');
      }
    }
  }, [songDetails.name]);

  // Efecto para actualizar la variable CSS del progreso
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.setProperty('--progress-percent', `${progress}%`);
    }
  }, [progress]);

  useImperativeHandle(ref, () => ({
    playSong: (name: string, url: string, thumbnail: string, youtubeUrl: string) => {
      if (!url) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      setSongDetails({ name, url, thumbnail, youtubeUrl });
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(error => {
          if (error.name !== 'AbortError') {
            console.error('Error playing audio:', error);
          }
        });
      }
      // Guardar en historial
      const newSong = { title: name, url: youtubeUrl, thumbnail };
      const history = JSON.parse(localStorage.getItem('songHistory') || '[]');
      localStorage.setItem('songHistory', JSON.stringify([newSong, ...history]));
    }
  }));

  const handleProgress = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    const progressValue = duration ? (currentTime / duration) * 100 : 0;
    setProgress(progressValue);

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60).toString().padStart(2, '0');
      return `${minutes}:${seconds}`;
    };

    setCurrentTime(formatTime(currentTime));
    setDurationTime(formatTime(duration || 0));
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (parseFloat(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newVolume = parseFloat(e.target.value) / 100;
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const toggleVolumeControl = () => {
    // En móvil, mostrar el control de volumen móvil
    if (window.innerWidth <= 768) {
      setShowMobileVolumeControl(!showMobileVolumeControl);
      setShowMobileActions(false); // Cerrar el menú de acciones si está abierto
    } else {
      // En desktop, mostrar el control de volumen normal
      setShowVolumeControl(!showVolumeControl);
    }
  };

  const handleNextSong = () => {
    if (playlist.length === 0) return;
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= playlist.length) nextIndex = 0;
    setCurrentSongIndex(nextIndex);
    const nextSong = playlist[nextIndex];
    props.fetchAudio(nextSong.url, nextSong.thumbnail);
  };

  const handlePrevSong = () => {
    if (playlist.length === 0) return;
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    setCurrentSongIndex(prevIndex);
    const prevSong = playlist[prevIndex];
    props.fetchAudio(prevSong.url, prevSong.thumbnail);
  };

  const handleDownload = async () => {
    if (!songDetails.url) return;
    try {
      const response = await fetch(songDetails.url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${songDetails.name}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleShare = () => {
    if (songDetails.youtubeUrl) {
      navigator.clipboard.writeText(songDetails.youtubeUrl)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        })
        .catch(err => console.error('Error copying URL:', err));
    }
  };

  const handleOpenAddModal = async () => {
    setPlaylistError('');
    setLoadingPlaylists(true);
    setIsAddModalOpen(true);
    try {
      const sessionCookie = Cookies.get('session');
      if (!sessionCookie) {
        setPlaylistError('Please log in to add songs to playlists');
        return;
      }
      const userData = JSON.parse(sessionCookie);
      const response = await axios.get(
        `https://noox.ooguy.com:5030/api/playlists-by-user/${userData.usuario_id}`
      );
      setPlaylists(response.data);
    } catch (err) {
      setPlaylistError('Error loading playlists');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      await axios.post('https://noox.ooguy.com:5030/api/canciones', {
        nombre: songDetails.name,
        url_cancion: songDetails.youtubeUrl,
        url_thumbnail: songDetails.thumbnail,
        playlist_id: playlistId,
      });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding song to playlist:', err);
    }
  };

  return (
    <div className="player">
      <div className="track-info">
        <img src={songDetails.thumbnail} alt="Album Cover" className="track-image" />
        <div className="track-details">
          {/* Contenedor con ancho máximo para el título */}
          <div className="track-title-container">
            <h4 ref={titleRef} className="track-title">{songDetails.name}</h4>
          </div>
          <p className="track-artist">Unknown Artist</p>
        </div>
        <div className="track-mobile-controls">
          <button 
            className="control-button mobile-more"
            onClick={() => setShowMobileActions(!showMobileActions)}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="player-controls">
        <div className="control-buttons">
          <button onClick={handlePrevSong} className="control-button">
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlayPause} className="play-button">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button onClick={handleNextSong} className="control-button">
            <SkipForward size={20} />
          </button>
        </div>
        <div className="progress-container">
          <span className="time">{currentTime}</span>
          <input
            ref={progressBarRef}
            type="range"
            value={progress}
            onChange={handleSeek}
            className="progress-bar"
            step="0.1"
            min="0"
            max="100"
          />
          <span className="time">{durationTime}</span>
        </div>
      </div>

      <div className="player-actions">
        <div className="volume-control">
          <button onClick={toggleVolumeControl} className="control-button">
            {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          {showVolumeControl && (
            <input
              type="range"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="volume-slider"
              min="0"
              max="100"
            />
          )}
        </div>
        <button onClick={handleOpenAddModal} className="control-button" title="Add to Playlist">
          <Plus size={20} />
        </button>
        <button onClick={handleDownload} className="control-button" title="Download">
          <Download size={20} />
        </button>
        <button onClick={handleShare} className="control-button" title="Share">
          <Share2 size={20} />
          {shareCopied && <span className="share-tooltip">Copied to clipboard!</span>}
        </button>
      </div>

      {showMobileActions && (
        <div className="mobile-actions-menu">
          <button className="mobile-action-item" onClick={toggleVolumeControl}>
            <Volume2 size={20} />
            <span>Volume</span>
          </button>
          <button className="mobile-action-item" onClick={handleOpenAddModal}>
            <Plus size={20} />
            <span>Add to Playlist</span>
          </button>
          <button className="mobile-action-item" onClick={handleDownload}>
            <Download size={20} />
            <span>Download</span>
          </button>
          <button className="mobile-action-item" onClick={handleShare}>
            <Share2 size={20} />
            <span>Share</span>
          </button>
        </div>
      )}

      {/* Mobile Volume Control */}
      {showMobileVolumeControl && (
        <div className="mobile-volume-control">
          <div className="volume-label">
            {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>Volume</span>
          </div>
          <input
            type="range"
            value={volume * 100}
            onChange={handleVolumeChange}
            className="volume-slider"
            min="0"
            max="100"
          />
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h3>Add to Playlist</h3>
          <button onClick={() => setIsAddModalOpen(false)} className="modal-close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          {loadingPlaylists ? (
            <p>Loading playlists...</p>
          ) : playlistError ? (
            <p className="error">{playlistError}</p>
          ) : (
            <ul className="playlist-list">
              {playlists.map(playlist => (
                <li key={playlist.playlist_id} className="playlist-item">
                  <span>{playlist.nombre}</span>
                  <button
                    onClick={() => handleAddToPlaylist(playlist.playlist_id)}
                    className="btn-add"
                  >
                    <Plus size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <audio
        ref={audioRef}
        onTimeUpdate={handleProgress}
        onLoadedMetadata={handleProgress}
        onEnded={handleNextSong}
      />
    </div>
  );
});

export default Player;