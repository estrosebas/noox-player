import { motion } from "framer-motion";
import Modal from "react-modal";
import "../styles/Settings.css";

Modal.setAppElement("#root");

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeAPI: boolean;
  onToggleYouTubeAPI: (value: boolean) => void;
}

const Settings = ({ isOpen, onClose, youtubeAPI, onToggleYouTubeAPI }: SettingsProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="settings-modal"
      overlayClassName="settings-overlay"
    >
      {/* Envolvemos el contenido en un motion.div para animar la entrada */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}   // Estado inicial
        animate={{ opacity: 1, scale: 1 }}     // Estado final
        transition={{ duration: 0.3 }}         // Duración de la animación
      >
        <div className="settings-container">
          <h3>Configuración</h3>
          <div className="settings-option">
            <span>Usar YouTube API</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={youtubeAPI} 
                onChange={(e) => onToggleYouTubeAPI(e.target.checked)} 
              />
              <span className="slider round"></span>
            </label>
            <span className="switch-text">{youtubeAPI ? "Activado" : "Desactivado"}</span>
          </div>
          <button className="settings-close" onClick={onClose}>Cerrar</button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default Settings;
