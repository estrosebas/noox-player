import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import MusicPlayer from "../components/MusicPlayer";
import Settings from "../components/Settings";
import { FaCog } from "react-icons/fa";
import "../styles/Home.css";
import noox from "../assets/noox.png";

const Home = () => {
  const [, setAudioData] = useState<{ title: string; audioUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentThumbnail, setCurrentThumbnail] = useState(noox);
  const [showComponents, setShowComponents] = useState(false);
  const musicPlayerRef = useRef<any>(null);

  // Estados para configuración
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [youtubeAPI, setYoutubeAPI] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowComponents(true);
    }, 1500);
  }, []);

  // Función que hace fetch al endpoint de search y luego llama a playSong
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="container text-center mt-5"
    >
      {/* Botón de configuración */}
      <button className="settings-button" onClick={() => setIsSettingsOpen(true)}>
        <FaCog />
      </button>

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
        <div>
          <h2 className="mb-4 titulop">Noox Player</h2>
          <SearchBar fetchAudio={fetchAudio} loading={loading} youtubeAPI={youtubeAPI} />
          <img src={currentThumbnail} alt="noox-logo" className="noox-logo me-2" />
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          <MusicPlayer ref={musicPlayerRef} fetchAudio={fetchAudio} />
        </div>
      )}
    </motion.div>
  );
};

export default Home;
