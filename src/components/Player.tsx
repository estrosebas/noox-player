import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Share2, Plus, Volume2, VolumeX, X, Repeat, Youtube, Mic,  Loader2, Check  } from 'lucide-react';
import Modal from 'react-modal';
import Cookies from 'js-cookie';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import '../styles/Player.css';

// Import the CapacitorMusicControls plugin
// We need to use dynamic import to avoid issues with web platform
let CapacitorMusicControls: any = null;
if (Capacitor.getPlatform() !== 'web') {
  import('capacitor-music-controls-plugin').then(module => {
    CapacitorMusicControls = module.CapacitorMusicControls;
  }).catch(err => {
    console.error('Error importing CapacitorMusicControls:', err);
  });
}

interface PlaylistItem {
  playlist_id: number;
  nombre: string;
  descripcion: string;
  usuario_id: number;
  fecha_creacion: string;
}

export interface MusicPlayerRef {
  playSong: (name: string, url: string, thumbnail: string, youtubeUrl: string, author?: string, newPlaylist?: any[]) => void;
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
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [wasPlayingBeforeModal, setWasPlayingBeforeModal] = useState(false);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [, setLyrics] = useState<{artista: string, cancion: string, letra: string} | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLInputElement | null>(null);
  const volumeSliderRef = useRef<HTMLInputElement | null>(null);
  //si es necesario definiser lyrics

  // Estados para la canción actual y playlist
  const [songDetails, setSongDetails] = useState({
    name: 'No track playing',
    url: '',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
    youtubeUrl: '',
    author: 'Unknown Artist'
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

  ///estados para el lrc
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [loadingLanguages, setLoadingLanguages] = useState<boolean>(false);
  // Estado para almacenar la letra en formato LRC sin procesar
  // Estado para almacenar la letra parseada: array de { time, text }
  const [parsedLyrics, setParsedLyrics] = useState<Array<{ time: number; text: string }>>([]);
  // Estado para la línea activa según el tiempo actual
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  // Para tener el tiempo en segundos (además del formato mm:ss)
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'normal' | 'synced'>('normal');
  const [normalLyrics, setNormalLyrics] = useState<string | null>(null);
  const [loadingNormalLyrics, setLoadingNormalLyrics] = useState<boolean>(false);

  const [previousSongUrl, setPreviousSongUrl] = useState<string | null>(null);
  //const [loading, setLoading] = useState(false);
  // Actualización de notificación con CapacitorMusicControls
  const updateMusicNotification = () => {
    if (Capacitor.getPlatform() !== "web" && CapacitorMusicControls) {
      const coverUrl = songDetails.thumbnail ? songDetails.thumbnail : "";
      const options = {
        track: songDetails.name,
        artist: songDetails.author || "Unknown Artist",
        ticker: `Now playing ${songDetails.name}`,
        cover: coverUrl,
        isPlaying: isPlaying,
        dismissable: false,
        hasPrev: true,
        hasNext: true,
        hasClose: true,
        hasRepeat: true,
        hasYoutube: true,
        playIcon: "media_play",
        pauseIcon: "media_pause",
        prevIcon: "media_prev",
        nextIcon: "media_next",
        closeIcon: "media_close",
        repeatIcon: "media_repeat",
        youtubeIcon: "media_youtube",
        notificationIcon: "notification",
      };

      CapacitorMusicControls.create(options)
        .then(() => {
          // Notificación creada correctamente
          console.log('Music notification created');
        })
        .catch((err: any) => {
          console.error("Error en CapacitorMusicControls.create:", err);
        });
    }
  };
  
  useEffect(() => {
    const handleControlsEvent = (action: any) => {
      console.log("controlsNotification event:", action);
      switch (action.message) {
        case "music-controls-play":
          if (!isPlaying) togglePlayPause();
          break;
        case "music-controls-pause":
          if (isPlaying) togglePlayPause();
          break;
        case "music-controls-next":
          handleNextSong();
          break;
        case "music-controls-previous":
          handlePrevSong();
          break;
        case "music-controls-repeat":
          toggleRepeat();
          break;
        case "music-controls-youtube":
          openYoutubeModal();
          break;
        case "music-controls-destroy":
          break;
        default:
          break;
      }
    };

    if (Capacitor.getPlatform() === "android") {
      document.addEventListener("controlsNotification", (event: any) => {
        handleControlsEvent(event);
      });
    }

    return () => {
      if (Capacitor.getPlatform() === "android") {
        document.removeEventListener("controlsNotification", handleControlsEvent);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    updateMusicNotification();
  }, [songDetails]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "web" && CapacitorMusicControls) {
      CapacitorMusicControls.updateIsPlaying({ isPlaying });
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (Capacitor.getPlatform() !== "web" && CapacitorMusicControls) {
        CapacitorMusicControls.destroy?.()
          .catch((err: any) => console.error("Error destruyendo music controls:", err));
      }
    };
  }, []);

  // Browser Media Session API
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songDetails.name,
        artist: songDetails.author || "Unknown Artist",
        album: "",
        artwork: [
          { src: songDetails.thumbnail, sizes: "96x96", type: "image/png" },
          { src: songDetails.thumbnail, sizes: "128x128", type: "image/png" },
          { src: songDetails.thumbnail, sizes: "192x192", type: "image/png" },
          { src: songDetails.thumbnail, sizes: "256x256", type: "image/png" },
          { src: songDetails.thumbnail, sizes: "384x384", type: "image/png" },
          { src: songDetails.thumbnail, sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        if (!isPlaying) togglePlayPause();
      });
      
      navigator.mediaSession.setActionHandler("pause", () => {
        if (isPlaying) togglePlayPause();
      });
      
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handleNextSong();
      });
      
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        handlePrevSong();
      });
    }
  }, [songDetails, isPlaying]);

  useEffect(() => {
    if (currentSongIndex !== -1 && playlist.length > 0) {
      const song = playlist[currentSongIndex];
      props.fetchAudio(song.url, song.thumbnail);
    }
  }, [currentSongIndex]);

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

  // Efecto para actualizar la variable CSS del volumen
  useEffect(() => {
    if (volumeSliderRef.current) {
      volumeSliderRef.current.style.setProperty('--volume-percent', `${volume * 100}%`);
    }
  }, [volume]);

  
  // Helper function to add song to history
  const addSongToHistory = (name: string, url: string, thumbnail: string, author?: string) => {
    // Guardar en historial
    const newSong = { title: name, url, thumbnail, author };
    const history = JSON.parse(localStorage.getItem('songHistory') || '[]');
    localStorage.setItem('songHistory', JSON.stringify([newSong, ...history]));
  };
  useEffect(() => {
  const storedPlaylistData = localStorage.getItem('currentPlaylistData');
  if (storedPlaylistData) {
    const parsedData = JSON.parse(storedPlaylistData);
    console.log("Loaded playlist from localStorage:", parsedData);

    if (parsedData.playlist && parsedData.playlist.length > 0) {
      setPlaylist(parsedData.playlist);
      setCurrentSongIndex(parsedData.currentIndex || 0);
    }
  }
}, []);

  useImperativeHandle(ref, () => ({
    playSong: (name: string, url: string, thumbnail: string, youtubeUrl: string, author?: string, newPlaylist?: any[]) => {
      if (!name || !url) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      
      setSongDetails({ 
        name, 
        url, 
        thumbnail, 
        youtubeUrl, 
        author: author || 'Unknown Artist' 
      });
      
      if (newPlaylist && newPlaylist.length > 0) {
        setPlaylist(newPlaylist);
        const songIndex = newPlaylist.findIndex(song => song.url === url);
        setCurrentSongIndex(songIndex >= 0 ? songIndex : 0);
      }
      
      setIsPlaying(true);
      addSongToHistory(name, youtubeUrl, thumbnail, author);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Error playing audio:", error);
          }
          // Si es AbortError, lo ignoramos
        });
      }
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
    setCurrentTimeSeconds(currentTime);
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
  const updateCurrentIndexInStorage = (newIndex: number) => {
    const storedPlaylistData = localStorage.getItem('currentPlaylistData');
    if (storedPlaylistData) {
      const parsedData = JSON.parse(storedPlaylistData);
      parsedData.currentIndex = newIndex;
      localStorage.setItem('currentPlaylistData', JSON.stringify(parsedData));
    }
  };
  const handleNextSong = () => {
    const storedPlaylistData = localStorage.getItem('currentPlaylistData');
    if (storedPlaylistData) {
      const parsedData = JSON.parse(storedPlaylistData);
      const updatedPlaylist = parsedData.playlist;
      const latestIndex = parsedData.currentIndex;  // 🛑 Cargar el índice más reciente
  
      if (updatedPlaylist.length === 0) {
        console.log("No hay canciones en la playlist");
        return;
      }
  
      let nextIndex = latestIndex + 1;  // 🛑 Usar el índice más reciente en vez de `currentSongIndex`
      if (nextIndex >= updatedPlaylist.length) nextIndex = 0;
  
      console.log("Next song index:", nextIndex, "Song:", updatedPlaylist[nextIndex]);
      setPlaylist(updatedPlaylist);
      setCurrentSongIndex(nextIndex);
      updateCurrentIndexInStorage(nextIndex);
    }
  };
  const handlePrevSong = () => {
    const storedPlaylistData = localStorage.getItem('currentPlaylistData');
    if (storedPlaylistData) {
      const parsedData = JSON.parse(storedPlaylistData);
      const updatedPlaylist = parsedData.playlist;
      const latestIndex = parsedData.currentIndex;  // 🛑 Cargar el índice más reciente
  
      if (updatedPlaylist.length === 0) {
        console.log("No hay canciones en la playlist");
        return;
      }
  
      let prevIndex = latestIndex - 1;  // 🛑 Usar el índice más reciente en vez de `currentSongIndex`
      if (prevIndex < 0) prevIndex = updatedPlaylist.length - 1;
  
      console.log("Previous song index:", prevIndex, "Song:", updatedPlaylist[prevIndex]);
      setPlaylist(updatedPlaylist);
      setCurrentSongIndex(prevIndex);
      updateCurrentIndexInStorage(prevIndex);
    }
  };
  const [status, setStatus] = useState('idle');
  const handleDownload = () => {
    if (!songDetails.url || status === 'loading') return;
    setStatus('loading');
    const downloadUrl = `https://noox.ooguy.com:5030/api/download?url=${encodeURIComponent(songDetails.youtubeUrl)}`;
    
    // Inicia la descarga creando y clickeando un enlace temporal
    const link = document.createElement('a');
    link.href = downloadUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Simula la finalización del proceso (por ejemplo, 2 segundos después)
    setTimeout(() => {
      setStatus('success');
      // Vuelve al estado inactivo después de mostrar el éxito por 2 segundos
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }, 2000);
  };

  const renderIcon = () => {
    switch(status) {
      case 'loading':
        return <Loader2 size={20} className="spinner" />;
      case 'success':
        return <Check size={20} className="success" />;
      default:
        return <Download size={20} />;
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

  const toggleRepeat = () => {
    setIsRepeatEnabled(!isRepeatEnabled);
    if (audioRef.current) {
      audioRef.current.loop = !isRepeatEnabled;
    }
    
    // Update notification for mobile
    if (Capacitor.getPlatform() !== "web" && CapacitorMusicControls) {
      CapacitorMusicControls.updateIsRepeat({ isRepeat: !isRepeatEnabled });
    }
  };

  const openYoutubeModal = () => {
    // Save current playing state
    setWasPlayingBeforeModal(isPlaying);
    
    // Pause the audio if it's playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    setIsYoutubeModalOpen(true);
  };

  const closeYoutubeModal = () => {
    setIsYoutubeModalOpen(false);
    
    // Resume playback if it was playing before
    if (wasPlayingBeforeModal && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error("Error resuming playback:", err);
      });
      setIsPlaying(true);
    }
  };

  const fetchNormalLyrics = async () => {
    if (!songDetails.name) return;
    
    setLoadingNormalLyrics(true);
    setNormalLyrics(null);
    
    try {
      const response = await axios.get(
        `https://noox.ooguy.com:5030/letra?cancion=${encodeURIComponent(songDetails.name)}`
      );
      setNormalLyrics(response.data.letra); // Adjust according to your API response structure
    } catch (error) {
      console.error('Error fetching normal lyrics:', error);
    } finally {
      setLoadingNormalLyrics(false);
    }
  };
  
  const openLyricsModal = async () => {
    if (!songDetails.name) return;
    
    setIsLyricsModalOpen(true);
    setActiveTab('normal');
    
    // Fetch normal lyrics first
    fetchNormalLyrics();
  };
  
  const handleSyncLyrics = async () => {
    if (!selectedLanguage) return;
    setLoadingLyrics(true);
  
    try {
      const response = await axios.post(
        'https://noox.ooguy.com:5030/letraslrc',
        { youtube_url: songDetails.youtubeUrl, idioma: selectedLanguage }
      );
      const lrc = response.data.lrc;
      setLyrics(lrc);
  
      // Parseamos el LRC para combinar líneas con timestamps idénticos
      const parsed = parseLRC(lrc);
      setParsedLyrics(parsed);
  
    } catch (error) {
      console.error('Error fetching lyrics:', error);
    } finally {
      setLoadingLyrics(false);
    }
  };
  
  
  const closeLyricsModal = () => {
    setIsLyricsModalOpen(false);
  };

  const getYoutubeEmbedUrl = () => {
    if (!songDetails.youtubeUrl) return '';
    
    // Extract video ID from YouTube URL
    const videoIdMatch = songDetails.youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) return '';
    
    const videoId = videoIdMatch[1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&origin=${window.location.origin}`;
  };

  const handleSongEnd = () => {
    if (isRepeatEnabled) {
      // If repeat is enabled, the audio element's loop property will handle it
      return;
    }
    handleNextSong();
  };
  const parseLRC = (lrc: string) => {
    // "linesByTime" usaremos un objeto para agrupar por timestamp
    const linesByTime: Record<number, string> = {};
  
    // Dividimos el LRC en líneas
    const lines = lrc.split('\n');
  
    for (const line of lines) {
      // Usamos expresión regular para capturar el timestamp y el texto
      const match = line.match(/\[(\d{2}:\d{2}(?:\.\d{2,3})?)\](.*)/);
      if (match) {
        const timeString = match[1];  // Ej: "00:21.03"
        const textPart = match[2].trim(); // Ej: "♪ FALL APART"
  
        // Convertimos el string de tiempo a un número en segundos
        const [minutes, seconds] = timeString.split(':');
        const timeInSeconds = parseInt(minutes, 10) * 60 + parseFloat(seconds);
  
        // Si ya hay texto para ese timestamp, concatenamos
        if (linesByTime[timeInSeconds] !== undefined) {
          linesByTime[timeInSeconds] += ' ' + textPart;
        } else {
          linesByTime[timeInSeconds] = textPart;
        }
      }
    }
  
    // Convertimos "linesByTime" en un array de objetos { time, text }
    const parsedArray = Object.keys(linesByTime)
      .map(key => {
        const time = parseFloat(key);
        const text = linesByTime[time];
        return { time, text };
      })
      // Ordenamos por tiempo ascendente
      .sort((a, b) => a.time - b.time);
  
    return parsedArray;
  };
  useEffect(() => {
    if (!parsedLyrics.length) return;
    let index = parsedLyrics.length - 1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTimeSeconds < parsedLyrics[i].time) {
        index = i - 1;
        break;
      }
    }
    if (index < 0) index = 0;
    setActiveLineIndex(index);
  }, [currentTimeSeconds, parsedLyrics]);
  
  const handleSyncedLyricsClick = () => {
    setActiveTab('synced');
  
    // Realizar el fetch cada vez que se haga clic en "Synced Lyrics"
    if (availableLanguages.length === 0 || songDetails.youtubeUrl !== previousSongUrl) {
      setLoadingLanguages(true);
      axios.post(
        'https://noox.ooguy.com:5030/letraslrcrevisr',
        { youtube_url: songDetails.youtubeUrl }
      )
      .then(response => {
        setAvailableLanguages(response.data.idiomasDisponibles);
        setPreviousSongUrl(songDetails.youtubeUrl); // Actualizamos la URL para evitar fetch redundante
      })
      .catch(error => {
        console.error('Error fetching available languages:', error);
      })
      .finally(() => {
        setLoadingLanguages(false);
      });
    }
  };
  useEffect(() => {
    // Si la canción actual ha cambiado, realizamos el fetch para actualizar las letras sincronizadas
    if (songDetails.youtubeUrl !== previousSongUrl) {
      setPreviousSongUrl(songDetails.youtubeUrl); // Actualizamos la URL para evitar fetch redundante
      
      // Realizamos el fetch solo si la URL de YouTube ha cambiado
      setLoadingLanguages(true);
      axios.post(
        'https://noox.ooguy.com:5030/letraslrcrevisr',
        { youtube_url: songDetails.youtubeUrl }
      )
      .then(response => {
        setAvailableLanguages(response.data.idiomasDisponibles);
      })
      .catch(error => {
        console.error('Error fetching available languages:', error);
      })
      .finally(() => {
        setLoadingLanguages(false);
      });
    }
  }, [songDetails.youtubeUrl]); 
  
  return (
    <div className="player">
      <div className="track-info">
        <img src={songDetails.thumbnail} alt="Album Cover" className="track-image" />
        <div className="track-details">
          {/* Contenedor con ancho máximo para el título */}
          <div className="track-title-container">
            <h4 ref={titleRef} className="track-title">{songDetails.name}</h4>
          </div>
          <p className="track-artist">{songDetails.author}</p>
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
          <button 
            onClick={openYoutubeModal} 
            className="control-button"
            title="Watch on YouTube"
            disabled={!songDetails.youtubeUrl}
          >
            <Youtube size={20} />
          </button>
          <button onClick={() => { console.log("Prev button clicked"); handlePrevSong(); }} className="control-button">
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlayPause} className="play-button">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button onClick={() => { console.log("Next button clicked"); handleNextSong(); }} className="control-button">
            <SkipForward size={20} />
          </button>
          <button 
            onClick={toggleRepeat} 
            className={`control-button ${isRepeatEnabled ? 'active' : ''}`}
            title={isRepeatEnabled ? "Disable repeat" : "Enable repeat"}
          >
            <Repeat size={20} />
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
              ref={volumeSliderRef}
              type="range"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="volume-slider"
              min="0"
              max="100"
            />
          )}
        </div>
        <button 
          onClick={openLyricsModal} 
          className="control-button" 
          title="View Lyrics"
          disabled={!songDetails.name || songDetails.name === 'No track playing'}
        >
          <Mic size={20} />
        </button>
        <button onClick={handleOpenAddModal} className="control-button" title="Add to Playlist">
          <Plus size={20} />
        </button>
        <button onClick={handleDownload} className="control-button" title="Download">
          {renderIcon()}
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
          <button className="mobile-action-item" onClick={openLyricsModal} disabled={!songDetails.name || songDetails.name === 'No track playing'}>
            <Mic size={20} />
            <span>View Lyrics</span>
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
            ref={volumeSliderRef}
            type="range"
            value={volume * 100}
            onChange={handleVolumeChange}
            className="volume-slider"
            min="0"
            max="100"
          />
        </div>
      )}
       {/* addto playlist  Modal */}
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

      {/* YouTube Modal */}
      <Modal
        isOpen={isYoutubeModalOpen}
        onRequestClose={closeYoutubeModal}
        className="youtube-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h3>Watch on YouTube</h3>
          <button onClick={closeYoutubeModal} className="modal-close">
            <X size={20} />
          </button>
        </div>
        <div className="youtube-iframe-container">
          {songDetails.youtubeUrl && (
            <iframe
              src={getYoutubeEmbedUrl()}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </div>
      </Modal>

      {/* Lyrics Modal */}
      <Modal
        isOpen={isLyricsModalOpen}
        onRequestClose={closeLyricsModal}
        className="lyrics-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h3>Lyrics</h3>
          <button onClick={closeLyricsModal} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="lyrics-tabs">
          <button 
            className={`tab-button ${activeTab === 'normal' ? 'active' : ''}`}
            onClick={() => setActiveTab('normal')}
          >
            Standard Lyrics
          </button>
          <button 
            className={`tab-button ${activeTab === 'synced' ? 'active' : ''}`}
            onClick={handleSyncedLyricsClick}
          >
            Synced Lyrics
          </button>
        </div>

        <div className="lyrics-content">
          {activeTab === 'normal' ? (
            // Normal lyrics tab content
            <div className="normal-lyrics-container">
              {loadingNormalLyrics ? (
                <div className="lyrics-loading">
                  <div className="lyrics-spinner"></div>
                  <p>Loading lyrics...</p>
                </div>
              ) : normalLyrics ? (
                <div className="lyrics-display">
                  <div className="lyrics-text">
                    {normalLyrics.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="lyrics-not-found">
                  <p>No lyrics found for this song.</p>
                </div>
              )}
            </div>
          ) : (
            // Synchronized lyrics tab content
            <div className="synced-lyrics-container">
              {loadingLanguages ? (
                <div className="lyrics-loading">
                  <div className="lyrics-spinner"></div>
                  <p>Loading available languages...</p>
                </div>
              ) : (
                <div className="sync-lyrics-controls">
                  {availableLanguages.length > 0 && (
                    <div className="language-selector">
                      <label htmlFor="language-select">Select Language:</label>
                      <select
                        id="language-select"
                        value={selectedLanguage || ''}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                      >
                        <option value="">--Select Language--</option>
                        {availableLanguages.map((language, index) => (
                          <option key={index} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button 
                    className="sync-button"
                    onClick={handleSyncLyrics} 
                    disabled={!selectedLanguage}
                  >
                    Sync Lyrics
                  </button>
                </div>
              )}

              {loadingLyrics ? (
                <div className="lyrics-loading">
                  <div className="lyrics-spinner"></div>
                  <p>Loading synchronized lyrics...</p>
                </div>
              ) : parsedLyrics.length > 0 ? (
                <div className="lyrics-display synced">
                  <div className="lyrics-text">
                    {parsedLyrics.map((line, index) => (
                      <p key={index} className={index === activeLineIndex ? 'active' : ''}>
                        {line.text}
                      </p>
                    ))}
                  </div>
                </div>
              ) : availableLanguages.length > 0 ? (
                <div className="lyrics-instructions">
                  <p>Please select a language and click "Sync Lyrics" to view synchronized lyrics.</p>
                </div>
              ) : (
                <div className="lyrics-not-found">
                  <p>No synchronized lyrics available for this song.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>



      <audio
        ref={audioRef}
        onTimeUpdate={handleProgress}
        onLoadedMetadata={handleProgress}
        onEnded={handleSongEnd}
        loop={isRepeatEnabled}
      />
    </div>
  );
});

export default Player;