// Home.tsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import MusicPlayer from "../components/MusicPlayer";
import Settings from "../components/Settings";
import Trending from "../components/Trending";
import Sidebar from "../components/Sidebar";
import HistoryModal from "../components/HistoryModal"; // Importa el modal de historial
import { FaCog, FaBars } from "react-icons/fa";
import "../styles/Home.css";
import noox from "../assets/noox.png";

const Home = () => {
  const [, setAudioData] = useState<{ title: string; audioUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setCurrentThumbnail] = useState(noox);
  const [showComponents, setShowComponents] = useState(false);
  const musicPlayerRef = useRef<any>(null);

  // Estados para configuración, sidebar y modal de historial
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [youtubeAPI, setYoutubeAPI] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowComponents(true);
    }, 1500);
  }, []);

  // Función que hace fetch y llama a playSong
  const fetchAudio = async (url: string, thumbnail: string) => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `https://noox.ooguy.com:5030/search?url=${encodeURIComponent(url)}`
      );
      
      setAudioData({ title: response.data.title, audioUrl: response.data.audioUrl });
      setCurrentThumbnail(thumbnail);
      
      musicPlayerRef.current?.playSong(
        response.data.title,
        response.data.audioUrl,
        thumbnail
      );
    } catch (error) {
      console.error("Error al obtener el audio:", error);
      setError("Error al obtener el audio. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Sidebar con la nueva propiedad onOpenHistory */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Top Navigation Bar */}
      <div className="top-bar">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FaBars />
        </button>

        <SearchBar fetchAudio={fetchAudio} loading={loading} youtubeAPI={youtubeAPI} />

        <button
          className="settings-button"
          onClick={() => setIsSettingsOpen(true)}
        >
          <FaCog />
        </button>
      </div>

      <motion.div className="content mt-5">
        {/* Modal de configuración */}
        <Settings 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          youtubeAPI={youtubeAPI} 
          onToggleYouTubeAPI={setYoutubeAPI} 
        />

        {!showComponents ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="intro"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="mb-4 titulop"
            >
              Noox Player
            </motion.h1>
            <motion.img
              src={noox}
              alt="noox-logo"
              className="noox-logo"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5 }}
            />
          </motion.div>
        ) : (
          <div className="main-content">
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <MusicPlayer ref={musicPlayerRef} fetchAudio={fetchAudio} />
            <div className="trending-section-wrapper">
              <Trending fetchAudio={fetchAudio} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal de Historial (se renderiza en Home para que no sobrecargue el MusicPlayer) */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSongSelect={(song) => {
          fetchAudio(song.url, song.thumbnail);
          setIsHistoryOpen(false);
        }}
        // Puedes pasar un arreglo vacío; en el modal puedes cargar el historial desde localStorage o bien levantar el estado en Home
      />
    </div>
  );
};

export default Home;
