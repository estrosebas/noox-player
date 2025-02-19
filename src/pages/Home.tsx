// Home.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import MusicPlayer from "../components/MusicPlayer";
import Settings from "../components/Settings";
import Trending from "../components/Trending";
import Sidebar from "../components/Sidebar";
import HistoryModal from "../components/HistoryModal"; // Modal de historial
import { FaBars } from "react-icons/fa";
import "../styles/Home.css";
import noox from "../assets/noox.png";
import ModalListPlaylist from "../components/ModalListPlaylists"; 

const Home = () => {
  const [, setAudioData] = useState<{ title: string; audioUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setCurrentThumbnail] = useState(noox);
  const [showComponents, setShowComponents] = useState(false);
  const musicPlayerRef = useRef<any>(null);

  // Estados para configuración, sidebar y modales
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
      // Se pasa como cuarto parámetro "url" (la URL de YouTube)
      musicPlayerRef.current?.playSong(
        response.data.title,
        response.data.audioUrl,
        thumbnail,
        url
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
      <AnimatePresence>
        { !showComponents && (
          <motion.div
            className="splash-screen"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <motion.h1 className="titulop">Noox Player</motion.h1>
            <motion.img src={noox} alt="noox-logo" className="noox-logo" />
          </motion.div>
        )}
      </AnimatePresence>

      { showComponents && (
        <>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <div className="top-bar">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FaBars />
            </button>
            <SearchBar fetchAudio={fetchAudio} loading={loading} youtubeAPI={youtubeAPI} />
          </div>

          <div className="content mt-5">
            <Settings 
              isOpen={isSettingsOpen} 
              onClose={() => setIsSettingsOpen(false)} 
              youtubeAPI={youtubeAPI} 
              onToggleYouTubeAPI={setYoutubeAPI} 
            />

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            <MusicPlayer ref={musicPlayerRef} fetchAudio={fetchAudio} />
            <div className="trending-section-wrapper">
              <Trending fetchAudio={fetchAudio} />
            </div>
            <div className="playlist-section-wrapper">
            <ModalListPlaylist 
              onSongSelect={(song) => {
                // Usamos las propiedades 'url' y 'thumbnail' del objeto formateado
                fetchAudio(song.url, song.thumbnail);
              }}
            />
            </div>
          </div>

          <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSongSelect={(song) => {
              fetchAudio(song.url, song.thumbnail);
              setIsHistoryOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default Home;
