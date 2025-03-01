import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/History.css';

export interface Song {
  title: string;
  id: string;
  url: string;
  thumbnail: string;
}

interface HistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSongSelect: (song: Song) => void;
}

const History: React.FC<HistoryProps> = ({ isOpen, onClose, onSongSelect }) => {
  const [localHistory, setLocalHistory] = useState<Song[]>([]);

  useEffect(() => {
    if (isOpen) {
      const storedHistory = localStorage.getItem('songHistory');
      if (storedHistory) {
        setLocalHistory(JSON.parse(storedHistory));
      } else {
        setLocalHistory([]);
      }
    }
  }, [isOpen]);

  const clearHistory = () => {
    localStorage.removeItem('songHistory');
    setLocalHistory([]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="history-modal-overlay" key="history-modal">
        <motion.div
          className="history-modal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="history-modal-header">
            <h2>Listening History</h2>
            <button className="close-button" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="history-modal-content">
            {localHistory.length > 0 ? (
              <>
                <div className="history-actions">
                  <button className="clear-history-btn" onClick={clearHistory}>
                    Clear History
                  </button>
                </div>
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