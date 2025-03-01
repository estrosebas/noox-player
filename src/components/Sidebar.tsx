import React, { useState, useEffect } from 'react';
import { X, Home, History, Settings, HelpCircle, Library, UserCircle, ChevronLeft } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const sessionCookie = Cookies.get('session');
    if (sessionCookie) {
      setIsLoggedIn(true);
    }

    const intervalId = setInterval(() => {
      const sessionCookie = Cookies.get('session');
      setIsLoggedIn(!!sessionCookie);
    }, 3000);

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
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

  // Determine sidebar class based on isOpen and screen size
  const getSidebarClass = () => {
    if (!isOpen) {
      return isMobile ? 'closed' : 'collapsed';
    }
    
    return isMobile ? 'open' : '';
  };

  return (
    <>
      <div className={`sidebar ${getSidebarClass()}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          {isMobile ? (
            <button className="close-btn" onClick={toggleSidebar}>
              <X size={24} />
            </button>
          ) : null}
        </div>

        {/* Toggle button for desktop only */}
        {!isMobile && (
          <button className="toggle-btn" onClick={toggleSidebar} title={isOpen ? "Collapse sidebar" : "Expand sidebar"}>
            <ChevronLeft size={20} />
          </button>
        )}

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
            {isMobile && !isLoggedIn && (
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
      </div>
      
      {isOpen && isMobile && <div className="sidebar-overlay" onClick={toggleSidebar} />}
    </>
  );
};

export default Sidebar;