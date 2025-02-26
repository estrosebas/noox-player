import { useState, useRef } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [loading, setLoading] = useState(false);
  const [youtubeAPI, setYoutubeAPI] = useState(true);
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
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchAudio = async (url: string, thumbnail: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://noox.ooguy.com:5030/search?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();
      
      if (data.audioUrl && data.title) {
        playerRef.current?.playSong(data.title, data.audioUrl, thumbnail, url);
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
      <div className="app-container">
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
            {window.innerWidth <= 768 && (
              <button className="menu-button" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
            )}
            <SearchBar 
              fetchAudio={fetchAudio}
              loading={loading}
              youtubeAPI={youtubeAPI}
            />
            {window.innerWidth > 768 && (
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

        <Player ref={playerRef} fetchAudio={fetchAudio} />
      </div>

      <Auth 
        isOpen={activeModal === 'auth'} 
        onClose={closeAllModals} 
      />
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