import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaStepForward,
  FaStepBackward,
  FaDownload,
  FaMusic,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/MusicPlayer.css";
import standbyImage from "../assets/standby.png";
import Playlist from "./Playlist";

// Definimos la interfaz de Song (la misma que usamos en Playlist)
export interface Song {
  title: string;
  id: string;
  url: string;
  thumbnail: string;
}

interface MusicPlayerProps {
  // Recibimos la función fetchAudio desde Home para hacer el fetch y reproducir la canción
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [songDetails, setSongDetails] = useState<{ name: string; url: string; thumbnail: string }>({
    name: "Esperando canción...",
    url: "",
    thumbnail: standbyImage,
  });

  // Estados para playlist y posición actual
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);

  // Estado para mostrar el modal de Playlist
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    playSong: (name: string, url: string, thumbnail: string) => {
      if (!name || !url) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        return;
      }
      setSongDetails({ name, url, thumbnail });
      setIsPlaying(true);
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
      const seconds = Math.floor(time % 60).toString().padStart(2, "0");
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
      const downloadUrl = songDetails.url;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Error al descargar el archivo");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${songDetails.name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error en la descarga:", error);
    }
  };

  const handleTogglePlaylist = () => {
    setIsPlaylistOpen(!isPlaylistOpen);
  };

  // Función que se ejecuta cuando se selecciona una canción desde el modal Playlist
  const handleSongSelect = (song: Song, fullPlaylist: Song[]) => {
    // Guardamos el playlist completo y el índice de la canción seleccionada
    setPlaylist(fullPlaylist);
    const index = fullPlaylist.findIndex((s) => s.id === song.id);
    setCurrentSongIndex(index);
    // Usamos fetchAudio para obtener y reproducir la canción
    props.fetchAudio(song.url, song.thumbnail);
    setIsPlaylistOpen(false);
  };

  // Funciones para pasar a la siguiente o anterior canción
  const handleNextSong = () => {
    if (playlist.length === 0) return;
    let nextIndex = currentSongIndex + 1;
    if (nextIndex >= playlist.length) {
      nextIndex = 0; // Opcional: hacer loop
    }
    setCurrentSongIndex(nextIndex);
    const nextSong = playlist[nextIndex];
    props.fetchAudio(nextSong.url, nextSong.thumbnail);
  };

  const handlePrevSong = () => {
    if (playlist.length === 0) return;
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1; // Opcional: hacer loop
    }
    setCurrentSongIndex(prevIndex);
    const prevSong = playlist[prevIndex];
    props.fetchAudio(prevSong.url, prevSong.thumbnail);
  };

  return (
    <div className="music-player container-fluid fixed-bottom bg-dark text-white py-2">
      <div className="row align-items-center">
        {/* Thumbnail + Título */}
        <div className="col-md-3 d-flex align-items-center">
          <img src={songDetails.thumbnail} alt="Album Cover" className="album-thumbnail me-2" />
          <div>
            <p className="m-0 fw-bold text-truncate" style={{ maxWidth: "200px" }}>{songDetails.name}</p>
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

        {/* Controles de volumen, botón de Playlist y descarga */}
        <div className="col-md-3 d-flex align-items-center justify-content-end">
          {volume > 0 ? <FaVolumeUp className="control-icon" /> : <FaVolumeMute className="control-icon" />}
          <input type="range" value={volume * 100} onChange={handleVolumeChange} className="form-range w-50 mx-2" />
          <button onClick={handleTogglePlaylist} className="btn btn-sm btn-outline-light ms-2">
            <FaMusic />
          </button>
          <button onClick={handleDownload} className="btn btn-sm btn-outline-light ms-2">
            <FaDownload />
          </button>
        </div>
      </div>

      <audio ref={audioRef} src={songDetails.url} onTimeUpdate={handleProgress} onLoadedMetadata={handleProgress} autoPlay />

      {/* Modal de Playlist integrado en MusicPlayer */}
      <Playlist
        isOpen={isPlaylistOpen}
        onClose={handleTogglePlaylist}
        onSongSelect={handleSongSelect}
      />
    </div>
  );
});

export default MusicPlayer;
