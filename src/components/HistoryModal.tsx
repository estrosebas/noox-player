import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/HistoryModal.css';

export interface Song {
  title: string;
  id: string;
  url: string;
  thumbnail: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelect: (song: Song) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onSongSelect }) => {
  const [localHistory, setLocalHistory] = useState<Song[]>([]);

  useEffect(() => {
    if (isOpen) {
      const storedHistory = localStorage.getItem("songHistory");
      if (storedHistory) {
        setLocalHistory(JSON.parse(storedHistory));
      } else {
        setLocalHistory([]);
      }
    }
  }, [isOpen]);

  const clearHistory = () => {
    localStorage.removeItem("songHistory");
    setLocalHistory([]);
  };

  if (!isOpen) return null;

  return (
    <div className="history-modal-overlay">
      <div className="history-modal">
        <div className="history-modal-header">
          <h2>Historial</h2>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>
        <div className="history-modal-content">
        <button onClick={clearHistory} className="clear-history-btn">
          Borrar historial
        </button>
          {localHistory.length === 0 ? (
            <p>No hay canciones en el historial.</p>
          ) : (
            <>
              <ul>
                {localHistory.map((song) => (
                  <li key={song.id} onClick={() => onSongSelect(song)}>
                    <img src={song.thumbnail} alt={song.title} className="history-thumbnail" />
                    <span>{song.title}</span>
                  </li>
                ))}
              </ul>
              
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
