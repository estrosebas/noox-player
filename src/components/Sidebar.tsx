// Sidebar Component - Navigation and settings sidebar for the application
// Componente Sidebar - Barra lateral de navegación y configuración para la aplicación

import React, { useState, useEffect } from 'react';
import { X, Home, History, Settings, HelpCircle, Library, UserCircle, ChevronLeft } from 'lucide-react';
import Cookies from 'js-cookie';
import '../styles/Sidebar.css';

// Interfaces / Interfaces
interface SidebarProps {
  isOpen: boolean;                                    // Sidebar open state / Estado de apertura de la barra lateral
  onClose?: () => void;                              // Close handler / Manejador de cierre
  onOpenHistory?: () => void;                        // History modal handler / Manejador del modal de historial
  onOpenPlaylists?: () => void;                      // Playlists modal handler / Manejador del modal de listas de reproducción
  onOpenAuth?: () => void;                           // Auth modal handler / Manejador del modal de autenticación
  toggleSidebar: () => void;                         // Sidebar toggle handler / Manejador de alternar la barra lateral
  youtubeAPI: boolean;                               // YouTube API state / Estado de la API de YouTube
  onToggleYouTubeAPI: (value: boolean) => void;      // YouTube API toggle handler / Manejador de alternar la API de YouTube
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
  // State Management / Gestión de estados
  const [isLoggedIn, setIsLoggedIn] = useState(false);          // Login state / Estado de inicio de sesión
  const [showSettings, setShowSettings] = useState(false);       // Settings visibility / Visibilidad de configuración
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);  // Mobile view state / Estado de vista móvil

  // Effects / Efectos
  useEffect(() => {
    // Check session and handle window resize / Verificar sesión y manejar redimensionamiento de ventana
    const sessionCookie = Cookies.get('session');
    if (sessionCookie) {
      setIsLoggedIn(true);
    }

    // Periodic session check / Verificación periódica de sesión
    const intervalId = setInterval(() => {
      const sessionCookie = Cookies.get('session');
      setIsLoggedIn(!!sessionCookie);
    }, 3000);

    // Window resize handler / Manejador de redimensionamiento de ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup / Limpieza
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Event Handlers / Manejadores de eventos
  const handleHistoryClick = () => {
    // Open history modal and close sidebar / Abrir modal de historial y cerrar barra lateral
    if (onOpenHistory) onOpenHistory();
    if (onClose) onClose();
  };

  const handleSettingsClick = () => {
    // Toggle settings visibility / Alternar visibilidad de configuración
    setShowSettings(!showSettings);
  };

  const handlePlaylistsClick = () => {
    // Open playlists modal and close sidebar / Abrir modal de listas y cerrar barra lateral
    if (onOpenPlaylists) onOpenPlaylists();
    if (onClose) onClose();
  };

  // Utility Functions / Funciones utilitarias
  const getSidebarClass = () => {
    // Determine sidebar class based on state / Determinar clase de la barra lateral según el estado
    if (!isOpen) {
      return isMobile ? 'closed' : 'collapsed';
    }
    return isMobile ? 'open' : '';
  };

  // Component Render / Renderizado del componente
  return (
    <>
      {/* Sidebar Container / Contenedor de la barra lateral */}
      <div className={`sidebar ${getSidebarClass()}`}>
        {/* Sidebar Header / Encabezado de la barra lateral */}
        <div className="sidebar-header">
          <h2>Noox Music</h2>
          {isMobile ? (
            <button className="close-btn" onClick={toggleSidebar}>
              <X size={24} />
            </button>
          ) : null}
        </div>

        {/* Desktop Toggle Button / Botón de alternar para escritorio */}
        {!isMobile && (
          <button className="toggle-btn" onClick={toggleSidebar} title={isOpen ? "Collapse sidebar" : "Expand sidebar"}>
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Navigation Menu / Menú de navegación */}
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
            {/* Mobile Login Button / Botón de inicio de sesión móvil */}
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

        {/* Settings Panel / Panel de configuración */}
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
      
      {/* Mobile Overlay / Superposición móvil */}
      {isOpen && isMobile && <div className="sidebar-overlay" onClick={toggleSidebar} />}
    </>
  );
};

export default Sidebar;