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
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/MusicPlayer.css";
import standbyImage from "../assets/standby.png";
import Playlist from "./Playlist";
import { Song } from "./HistoryModal";
import { Capacitor,  } from '@capacitor/core';
import NooxDownloader from "../plugins/NooxDownloader";


interface MusicPlayerProps {
  fetchAudio: (url: string, thumbnail: string) => void;
}

export interface MusicPlayerRef {
  playSong: (name: string, url: string, thumbnail: string) => void;
}

const MusicPlayer = forwardRef<MusicPlayerRef, MusicPlayerProps>((props, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [durationTime, setDurationTime] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [songDetails, setSongDetails] = useState<{ name: string; url: string; thumbnail: string }>({
    name: "Esperando canción...",
    url: "",
    thumbnail: standbyImage,
  });

  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);

  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Estados para el historial (no usado directamente, ya se actualiza en localStorage)
  const [, setSongHistory] = useState<Song[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("songHistory");
    if (storedHistory) {
      setSongHistory(JSON.parse(storedHistory));
    }
  }, []);

  // Función para agregar canción al historial (lee y actualiza directamente localStorage)
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

  useImperativeHandle(ref, () => ({
    playSong: (name: string, url: string, thumbnail: string) => {
      if (!name || !url) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
      setSongDetails({ name, url, thumbnail });
      setIsPlaying(true);
      addSongToHistory(name, url, thumbnail);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
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

  const handleProgress = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    setProgress((currentTime / duration) * 100);

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
        // 🖥 Método para Web/Tauri
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${songDetails.name}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        // 📱 Método para Android/iOS con Capacitor
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
  
          try {
            await NooxDownloader.download({
              url: songDetails.url,
              fileName: `${songDetails.name}.mp3`,
            });
            alert("Descarga iniciada...");
          } catch (fsError) {
            console.error("Error guardando el archivo:", fsError);
            alert("Error guardando el archivo.");
          }
        };
      }
    } catch (error) {
      console.error("Error en la descarga:", error);
      alert("Error en la descarga.");
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

  const handleTogglePlaylist = () => {
    setIsPlaylistOpen(!isPlaylistOpen);
  };

  const handleSongSelect = (song: Song, fullPlaylist: Song[]) => {
    setPlaylist(fullPlaylist);
    const index = fullPlaylist.findIndex((s) => s.id === song.id);
    setCurrentSongIndex(index);
    props.fetchAudio(song.url, song.thumbnail);
    setIsPlaylistOpen(false);
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

  return (
    <div className="music-player container-fluid fixed-bottom bg-dark text-white py-2">
      <div className="row align-items-center">
        {/* Thumbnail y Título */}
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
        {/* Controles de volumen y botones adicionales */}
        <div className="col-md-3 d-flex align-items-center justify-content-end position-relative">
          <div className="volume-btn-container">
            <button
              onClick={() => setShowVolumeControl(!showVolumeControl)}
              className="btn btn-sm btn-outline-light ms-2"
            >
              {volume > 0 ? <FaVolumeUp className="control-icon" /> : <FaVolumeMute className="control-icon" />}
            </button>
            {showVolumeControl && (
              <div className="volume-slider">
                <input
                  type="range"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="form-range"
                />
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
            {shareCopied && (
              <span className="share-tooltip">Copiado al portapapeles</span>
            )}
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={songDetails.url}
        onTimeUpdate={handleProgress}
        onLoadedMetadata={handleProgress}
        autoPlay
      />

      {/* Modal de Playlist */}
      <Playlist isOpen={isPlaylistOpen} onClose={handleTogglePlaylist} onSongSelect={handleSongSelect} />
    </div>
  );
});

export default MusicPlayer;
