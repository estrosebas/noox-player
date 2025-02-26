import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Home, History, Settings, HelpCircle, Library, UserCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import '../styles/Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenHistory?: () => void;
  onOpenPlaylists?: () => void;
  onOpenAuth?: () => void;
  toggleSidebar: () => void;
  youtubeAPI: boolean;
  onToggleYouTubeAPI: (value: boolean) => void;
}

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onOpenHistory, 
  onOpenPlaylists,
  onOpenAuth,
  toggleSidebar,
  youtubeAPI,
  onToggleYouTubeAPI
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const sessionCookie = Cookies.get('session');
    if (sessionCookie) {
      setIsLoggedIn(true);
    }

    const intervalId = setInterval(() => {
      const sessionCookie = Cookies.get('session');
      setIsLoggedIn(!!sessionCookie);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const handleHistoryClick = () => {
    if (onOpenHistory) onOpenHistory();
    if (onClose) onClose();
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  const handlePlaylistsClick = () => {
    if (onOpenPlaylists) onOpenPlaylists();
    if (onClose) onClose();
  };

  return (
    <>
      <motion.div
        className={`sidebar ${isOpen ? 'open' : ''}`}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        initial="closed"
      >
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <a href="#" onClick={() => onClose?.()}>
                <Home size={20} />
                <span>Home</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={handleHistoryClick}>
                <History size={20} />
                <span>History</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={handlePlaylistsClick}>
                <Library size={20} />
                <span>Playlists</span>
              </a>
            </li>
            <li>
              <a href="#" onClick={handleSettingsClick}>
                <Settings size={20} />
                <span>Settings</span>
              </a>
            </li>
            <li>
              <a href="#">
                <HelpCircle size={20} />
                <span>Help</span>
              </a>
            </li>
            {window.innerWidth <= 768 && !isLoggedIn && (
              <li>
                <a href="#" onClick={() => onOpenAuth?.()}>
                  <UserCircle size={20} />
                  <span>Login</span>
                </a>
              </li>
            )}
          </ul>
        </nav>

        {showSettings && (
          <div className="sidebar-settings">
            <h3>Settings</h3>
            <div className="settings-option">
              <span>Use YouTube API</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={youtubeAPI} 
                  onChange={(e) => onToggleYouTubeAPI(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        )}
      </motion.div>
      
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
    </>
  );
};

export default Sidebar;