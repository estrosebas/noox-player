import { useState, useRef, useEffect } from 'react';
import { UserCircle, Menu } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Player from '../../components/Player';
import Auth from '../../components/Auth';
import SearchBar from '../../components/SearchBar';
import History from '../../components/History';
import Playlists from '../../components/Playlists';
import Trending from '../../components/Trending';

function Home() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [youtubeAPI, setYoutubeAPI] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const playerRef = useRef<any>(null);

  // Helper function to manage modals
  const openModal = (modalName: string) => {
    // Close any open modal before opening a new one
    setActiveModal(modalName);
  };

  const closeAllModals = () => {
    setActiveModal(null);
  };

  const toggleSidebar = () => {
    setIsTransitioning(true);
    setIsSidebarOpen(!isSidebarOpen);

    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Match this with your CSS transition duration
  };

  // Update app container class when sidebar state changes
  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      if (!isSidebarOpen && isMobile) {
        // Mobile: completely hide sidebar
        appContainer.classList.add('sidebar-closed');
        appContainer.classList.remove('sidebar-collapsed');
      } else if (!isSidebarOpen && !isMobile) {
        // Desktop: collapse sidebar to icon-only
        appContainer.classList.add('sidebar-collapsed');
        appContainer.classList.remove('sidebar-closed');
      } else if (isSidebarOpen && !isMobile) {
        // Desktop: full sidebar
        appContainer.classList.remove('sidebar-collapsed');
        appContainer.classList.remove('sidebar-closed');
      } else {
        // Mobile: sidebar open
        appContainer.classList.remove('sidebar-closed');
        appContainer.classList.remove('sidebar-collapsed');
      }
    }

    // Update overlay visibility
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay && isMobile) {
      if (isSidebarOpen) {
        overlay.classList.add('visible');
      } else {
        overlay.classList.remove('visible');
      }
    }
  }, [isSidebarOpen, isMobile]);

  // Listen for window resize to adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);

      // Update classes when screen size changes
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        if (newIsMobile) {
          // When switching to mobile
          if (!isSidebarOpen) {
            appContainer.classList.add('sidebar-closed');
            appContainer.classList.remove('sidebar-collapsed');
          }
        } else {
          // When switching to desktop
          if (!isSidebarOpen) {
            appContainer.classList.add('sidebar-collapsed');
            appContainer.classList.remove('sidebar-closed');
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const fetchAudio = async (url: string, thumbnail: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://noox.ooguy.com:5030/search?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();

      if (data.audioUrl && data.title) {
        playerRef.current?.playSong(
          data.title,
          data.audioUrl,
          thumbnail,
          url,
          data.autor || 'Unknown Artist'
        );
      } else {
        console.error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching audio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongSelect = (song: { url: string; thumbnail: string }) => {
    fetchAudio(song.url, song.thumbnail);
    closeAllModals();
  };

  return (
    <>
      <div
        className={`app-container ${isTransitioning ? 'transitioning' : ''}`}
      >
        <div className="content-wrapper">
          <Sidebar
            isOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            onOpenHistory={() => openModal('history')}
            onOpenPlaylists={() => openModal('playlists')}
            youtubeAPI={youtubeAPI}
            onToggleYouTubeAPI={setYoutubeAPI}
            onOpenAuth={() => openModal('auth')}
          />

          <main className="main-content">
            <div className="top-controls">
              {isMobile && (
                <button className="menu-button" onClick={toggleSidebar}>
                  <Menu size={24} />
                </button>
              )}
              <SearchBar
                fetchAudio={fetchAudio}
                loading={loading}
                youtubeAPI={youtubeAPI}
              />
              {!isMobile && (
                <button
                  className="profile-button"
                  onClick={() => openModal('auth')}
                  title="Login or Register"
                >
                  <UserCircle size={32} />
                </button>
              )}
            </div>

            <h1 style={{ marginBottom: '24px' }}>Welcome to Noox Music</h1>

            <Trending fetchAudio={fetchAudio} />
          </main>
        </div>

        <Player ref={playerRef} fetchAudio={fetchAudio} />
      </div>

      <Auth isOpen={activeModal === 'auth'} onClose={closeAllModals} />
      <History
        isOpen={activeModal === 'history'}
        onClose={closeAllModals}
        onSongSelect={handleSongSelect}
      />
      <Playlists
        isOpen={activeModal === 'playlists'}
        onClose={closeAllModals}
        onSongSelect={handleSongSelect}
      />
    </>
  );
}

export default Home;
