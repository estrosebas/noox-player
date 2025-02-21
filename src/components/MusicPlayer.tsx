import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaStepForward,
  FaStepBackward,
  FaDownload,
  FaMusic,
  FaShareAlt,
  FaPlus,
  FaTimes
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/MusicPlayer.css";
import standbyImage from "../assets/standby.png";
import Playlist from "./Playlist";
import { Song } from "./HistoryModal";
import { Capacitor } from "@capacitor/core";
import NooxDownloader from "../plugins/NooxDownloader";
import Swal from "sweetalert2";
import { CapacitorMusicControls } from "capacitor-music-controls-plugin";
import Modal from "react-modal";
import axios from "axios";
import Cookies from "js-cookie";

// Interfaz para las playlists (para el modal "Agregar a Playlist")
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

interface MusicPlayerProps {
  fetchAudio: (url: string, thumbnail: string) => void;
}

const MusicPlayer = forwardRef<MusicPlayerRef, MusicPlayerProps>((props, ref) => {
  // Estados de reproducción y audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [durationTime, setDurationTime] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ahora songDetails incluye youtubeUrl (la URL que se usará para almacenar la canción en la playlist)
  const [songDetails, setSongDetails] = useState<{ 
    name: string; 
    url: string; 
    thumbnail: string; 
    youtubeUrl: string; 
  }>({
    name: "Esperando canción...",
    url: "",
    thumbnail: standbyImage,
    youtubeUrl: "",
  });

  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Estados para el historial (se actualiza en localStorage)
  const [, setSongHistory] = useState<Song[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("songHistory");
    if (storedHistory) {
      setSongHistory(JSON.parse(storedHistory));
    }
  }, []);

  const addSongToHistory = (name: string, url: string, thumbnail: string) => {
    const newSong: Song = {
      title: name,
      id: Date.now().toString(),
      url,
      thumbnail,
    };
    const stored = localStorage.getItem("songHistory");
    const history: Song[] = stored ? JSON.parse(stored) : [];
    const updated = [newSong, ...history];
    localStorage.setItem("songHistory", JSON.stringify(updated));
  };

  // Actualización de notificación con CapacitorMusicControls
  const updateMusicNotification = () => {
    if (Capacitor.getPlatform() !== "web") {
      const coverUrl = songDetails.thumbnail ? songDetails.thumbnail : "";
      const options = {
        track: songDetails.name,
        artist: "Artista desconocido",
        ticker: `Now playing ${songDetails.name}`,
        cover: coverUrl,
        isPlaying: isPlaying,
        dismissable: false,
        hasPrev: true,
        hasNext: true,
        hasClose: true,
        playIcon: "media_play",
        pauseIcon: "media_pause",
        prevIcon: "media_prev",
        nextIcon: "media_next",
        closeIcon: "media_close",
        notificationIcon: "notification",
      };

      CapacitorMusicControls.create(options)
        .then(() => {
          // Notificación creada correctamente
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
  }, [isPlaying, songDetails]);

  useEffect(() => {
    updateMusicNotification();
  }, [songDetails]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "web") {
      CapacitorMusicControls.updateIsPlaying({ isPlaying });
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (Capacitor.getPlatform() !== "web") {
        CapacitorMusicControls.destroy?.()
          .catch((err: any) => console.error("Error destruyendo music controls:", err));
      }
    };
  }, []);

  // Se modifica playSong para recibir también youtubeUrl (que se almacenará)
  useImperativeHandle(ref, () => ({
    playSong: (name: string, url: string, thumbnail: string, youtubeUrl: string) => {
      if (!name || !url) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      setSongDetails({ name, url, thumbnail, youtubeUrl });
      setIsPlaying(true);
      addSongToHistory(name, url, thumbnail);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Error playing audio:", error);
          }
          // Si es AbortError, lo ignoramos
        });
      }
    },
  }));

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
  useEffect(() => {
    const handlePlaylistUpdated = (event: CustomEvent) => {
      const newPlaylist = event.detail;
      setPlaylist(newPlaylist);
      setCurrentSongIndex(0); // Opcional: reiniciamos al primer elemento
    };
  
    window.addEventListener("playlistUpdated", handlePlaylistUpdated as EventListener);
  
    return () => {
      window.removeEventListener("playlistUpdated", handlePlaylistUpdated as EventListener);
    };
  }, []);
  
  useEffect(() => {
    const storedPlaylist = localStorage.getItem("currentPlaylist");
    if (storedPlaylist) {
      const parsedPlaylist = JSON.parse(storedPlaylist);
      // Actualizamos el estado de la playlist para la navegación
      setPlaylist(parsedPlaylist);
    }
  }, []);

  //manejo de errores nan
  const handleProgress = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    const newProgress = duration ? (currentTime / duration) * 100 : 0;
    setProgress(newProgress);
  
    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60)
        .toString()
        .padStart(2, "0");
      return `${minutes}:${seconds}`;
    };
  
    setCurrentTime(formatTime(currentTime));
    setDurationTime(formatTime(duration || 0));
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

  const handleDownload = async () => {
    if (!songDetails.url) return;

    try {
      const response = await fetch(songDetails.url);
      if (!response.ok) throw new Error("Error al descargar el archivo");
      const blob = await response.blob();

      if (Capacitor.getPlatform() === "web") {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${songDetails.name}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        Swal.fire({
          icon: "success",
          title: "Descarga iniciada",
          showConfirmButton: false,
          timer: 1500,
          background: "linear-gradient(to right, #141e30, #243b55)",
          customClass: {
            popup: "custom-swal-popup",
          },
        });
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            await NooxDownloader.download({
              url: songDetails.url,
              fileName: `${songDetails.name}.mp3`,
            });
            Swal.fire({
              icon: "success",
              title: "Descarga iniciada",
              showConfirmButton: false,
              timer: 1500,
              background: "linear-gradient(to right, #141e30, #243b55)",
              customClass: {
                popup: "custom-swal-popup",
              },
            });
          } catch (fsError) {
            console.error("Error guardando el archivo:", fsError);
            Swal.fire({
              icon: "error",
              title: "Error guardando el archivo",
              showConfirmButton: false,
              timer: 1500,
              background: "linear-gradient(to right, #141e30, #243b55)",
              customClass: {
                popup: "custom-swal-popup",
              },
            });
          }
        };
      }
    } catch (error) {
      console.error("Error en la descarga:", error);
      Swal.fire({
        icon: "error",
        title: "Error en la descarga",
        showConfirmButton: false,
        timer: 1500,
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup",
        },
      });
    }
  };

  const handleShare = () => {
    if (songDetails.url) {
      navigator.clipboard
        .writeText(songDetails.url)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        })
        .catch((err) => console.error("Error al copiar la URL:", err));
    }
  };

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: songDetails.name,
        artist: "Artista desconocido",
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

  const handleTogglePlaylist = () => {
    setIsPlaylistOpen(!isPlaylistOpen);
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

  // ========= NUEVA FUNCIONALIDAD: AGREGAR A PLAYLIST ========= //

  // Estados para el modal "Agregar a Playlist"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalPlaylists, setAddModalPlaylists] = useState<PlaylistItem[]>([]);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorAdd, setErrorAdd] = useState("");

  // Función para abrir el modal y cargar las playlists del usuario
  const handleOpenAddModal = async () => {
    setErrorAdd("");
    setLoadingAdd(true);
    setIsAddModalOpen(true);
    try {
      const sessionCookie = Cookies.get("session");
      if (!sessionCookie) {
        setErrorAdd("No hay sesión activa.");
        setLoadingAdd(false);
        return;
      }
      const userData = JSON.parse(sessionCookie);
      const response = await axios.get(
        `https://noox.ooguy.com:5030/api/playlists-by-user/${userData.usuario_id}`
      );
      setAddModalPlaylists(response.data);
    } catch (err) {
      setErrorAdd("Error al cargar tus playlists.");
    } finally {
      setLoadingAdd(false);
    }
  };

  // Función para agregar la canción actual a la playlist seleccionada
  const handleAddSongToPlaylist = async (playlistId: number) => {
    try {
      await axios.post("https://noox.ooguy.com:5030/api/canciones", {
        nombre: songDetails.name,
        // Usamos songDetails.youtubeUrl, que ahora Home debe pasar correctamente,
        // en lugar de la URL de streaming
        url_cancion: songDetails.youtubeUrl, 
        url_thumbnail: songDetails.thumbnail,
        playlist_id: playlistId,
      });
      Swal.fire({
        icon: "success",
        title: "Canción agregada a la playlist",
        showConfirmButton: false,
        timer: 1500,
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup",
        },
      });
      setIsAddModalOpen(false);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al agregar la canción",
        showConfirmButton: false,
        timer: 1500,
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup",
        },
      });
    }
  };

  // ========================================================== //

  return (
    <div className="music-player container-fluid fixed-bottom bg-dark text-white py-2">
      <div className="row align-items-center">
        {/* Thumbnail y Título con botón (+) para agregar a playlist */}
        <div className="col-md-3 d-flex align-items-center">
          <img src={songDetails.thumbnail} alt="Album Cover" className="album-thumbnail me-2" />
          <div>
            <p className="m-0 fw-bold text-truncate" style={{ maxWidth: "200px" }}>
              {songDetails.name}
            </p>
            <p className="m-0 text-secondary small">Artista desconocido</p>
          </div>
        </div>

        {/* Controles de reproducción */}
        <div className="col-md-6 d-flex flex-column align-items-center">
          <div className="d-flex align-items-center gap-2">
            <FaStepBackward onClick={handlePrevSong} className="control-icon" style={{ cursor: "pointer" }} />
            <button onClick={togglePlayPause} className="btn btn-sm btn-light rounded-circle">
              {isPlaying ? <FaPause className="text-dark" /> : <FaPlay className="text-dark" />}
            </button>
            <FaStepForward onClick={handleNextSong} className="control-icon" style={{ cursor: "pointer" }} />
          </div>
          <div className="d-flex align-items-center w-100">
            <span className="small">{currentTime}</span>
            <input type="range" value={progress} onChange={handleSeek} className="form-range mx-2 w-100" />
            <span className="small">{durationTime}</span>
          </div>
        </div>

        {/* Controles de volumen y botones adicionales */}
        <div className="col-md-3 d-flex align-items-center justify-content-end position-relative">
          <div className="volume-btn-container">
            {/* Botón para abrir el modal "Agregar a Playlist" */}
            <button
              className="btn btn-sm btn-outline-light ms-2"
              onClick={handleOpenAddModal}
              title="Agregar a Playlist"
            >
              <FaPlus />
            </button>
            <button onClick={() => setShowVolumeControl(!showVolumeControl)} className="btn btn-sm btn-outline-light ms-2">
              {volume > 0 ? <FaVolumeUp className="control-icon" /> : <FaVolumeMute className="control-icon" />}
            </button>
            {showVolumeControl && (
              <div className="volume-slider">
                <input type="range" value={volume * 100} onChange={handleVolumeChange} className="form-range" />
              </div>
            )}
          </div>
          <button onClick={handleTogglePlaylist} className="btn btn-sm btn-outline-light ms-2">
            <FaMusic />
          </button>
          <button onClick={handleDownload} className="btn btn-sm btn-outline-light ms-2">
            <FaDownload />
          </button>
          <button onClick={handleShare} className="btn btn-sm btn-outline-light ms-2 position-relative">
            <FaShareAlt />
            {shareCopied && <span className="share-tooltip">Copiado al portapapeles</span>}
          </button>
        </div>
      </div>

      {songDetails.url && (
        <audio 
          ref={audioRef} 
          src={songDetails.url} 
          onTimeUpdate={handleProgress} 
          onLoadedMetadata={handleProgress} 
          onEnded={handleNextSong}
          autoPlay 
        />
      )}
      {/* Modal de Playlist (ya existente) */}
      <Playlist isOpen={isPlaylistOpen} onClose={handleTogglePlaylist} onSongSelect={(song, fullPlaylist) => {
        setPlaylist(fullPlaylist);
        const index = fullPlaylist.findIndex((s) => s.id === song.id);
        setCurrentSongIndex(index);
        props.fetchAudio(song.url, song.thumbnail);
        setIsPlaylistOpen(false);
      }} />

      {/* Modal para Agregar Canción a una Playlist */}
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
        overlayClassName="history-modal-overlay"
        className="history-modal"
      >
        <div className="history-modal-header">
          <h2>Agregar a Playlist</h2>
          <button onClick={() => setIsAddModalOpen(false)} className="close-btn">
            <FaTimes />
          </button>
        </div>
        <div className="history-modal-content">
          {loadingAdd ? (
            <p>Cargando tus playlists...</p>
          ) : errorAdd ? (
            <p>{errorAdd}</p>
          ) : addModalPlaylists.length === 0 ? (
            <p>No se encontraron playlists.</p>
          ) : (
            <ul>
              {addModalPlaylists.map((pl) => (
                <li key={pl.playlist_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span>{pl.nombre}</span>
                  <button
                    className="btn btn-sm btn-outline-light"
                    onClick={() => handleAddSongToPlaylist(pl.playlist_id)}
                    title="Agregar esta canción a la playlist"
                  >
                    <FaPlus />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
});

export default MusicPlayer;
