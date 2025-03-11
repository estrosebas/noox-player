// History Component - Displays the user's listening history
// Componente History - Muestra el historial de reproducción del usuario

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/History.css';

// Interfaces / Interfaces
export interface Song {
  title: string;      // Song title / Título de la canción
  id: string;         // Song ID / ID de la canción
  url: string;        // Song URL / URL de la canción
  thumbnail: string;  // Thumbnail URL / URL de la miniatura
}

interface HistoryProps {
  isOpen: boolean;                    // Modal open state / Estado de apertura del modal
  onClose: () => void;               // Close handler / Manejador de cierre
  onSongSelect: (song: Song) => void; // Song selection handler / Manejador de selección de canción
}

const History: React.FC<HistoryProps> = ({ isOpen, onClose, onSongSelect }) => {
  // State Management / Gestión de estados
  const [localHistory, setLocalHistory] = useState<Song[]>([]); // Local history state / Estado del historial local

  // Effects / Efectos
  useEffect(() => {
    // Load history when modal opens / Cargar historial cuando se abre el modal
    if (isOpen) {
      const storedHistory = localStorage.getItem('songHistory');
      if (storedHistory) {
        setLocalHistory(JSON.parse(storedHistory));
      } else {
        setLocalHistory([]);
      }
    }
  }, [isOpen]);

  // Event Handlers / Manejadores de eventos
  const clearHistory = () => {
    // Clear all history / Limpiar todo el historial
    localStorage.removeItem('songHistory');
    setLocalHistory([]);
  };

  // Early return if modal is closed / Retorno anticipado si el modal está cerrado
  if (!isOpen) return null;

  // Component Render / Renderizado del componente
  return (
    <AnimatePresence>
      {/* Modal Overlay / Superposición del modal */}
      <div className="history-modal-overlay" key="history-modal">
        {/* Modal Container with Animation / Contenedor del modal con animación */}
        <motion.div
          className="history-modal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {/* Modal Header / Encabezado del modal */}
          <div className="history-modal-header">
            <h2>Listening History</h2>
            <button className="close-button" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Modal Content / Contenido del modal */}
          <div className="history-modal-content">
            {localHistory.length > 0 ? (
              <>
                {/* History Actions / Acciones del historial */}
                <div className="history-actions">
                  <button className="clear-history-btn" onClick={clearHistory}>
                    Clear History
                  </button>
                </div>
                {/* History List / Lista del historial */}
                <div className="history-list">
                  {localHistory.map((song, index) => (
                    <div
                      key={`history-${song.id || index}-${index}`}
                      className="history-item"
                      onClick={() => onSongSelect(song)}
                    >
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="history-thumbnail"
                      />
                      <div className="history-item-info">
                        <h3 className="history-item-title">{song.title}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Empty History Message / Mensaje de historial vacío
              <div className="empty-history">
                <p>No songs in history yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default History;