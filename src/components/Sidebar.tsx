import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import RegisterModal from './RegisterModal';
import LoginModal from './LoginModal';
import { GoogleOAuthProvider } from '@react-oauth/google'; 
import ProfileModal from './ProfileModal'; // Importa el modal de perfil
import Cookies from 'js-cookie'; // Para gestionar cookies
import Swal from 'sweetalert2'; // Importamos SweetAlert2
import '../styles/Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenHistory, onOpenSettings }) => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // Nuevo estado para el modal de perfil
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Para saber si el usuario está logueado

  useEffect(() => {
    // Verificar si ya hay una cookie de sesión al inicio
    const sessionCookie = Cookies.get("session");
    if (sessionCookie) {
      setIsLoggedIn(true);
    }

    // Revisar cada 3 segundos si la cookie de sesión existe
    const intervalId = setInterval(() => {
      const sessionCookie = Cookies.get("session");
      setIsLoggedIn(!!sessionCookie); // Actualizar el estado de login
    }, 3000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    Cookies.remove("session"); // Eliminar la cookie de sesión
    setIsLoggedIn(false); // Cambiar el estado a no logueado
  };

  // Controlar apertura de modales (cerrar el modal anterior al abrir uno nuevo)
  const openRegisterModal = () => {
    setIsRegisterOpen(true);
    setIsLoginOpen(false);
    onClose(); // Cerrar el sidebar al abrir el modal de registro
  };

  const openLoginModal = () => {
    setIsLoginOpen(true);
    setIsRegisterOpen(false);
    onClose(); // Cerrar el sidebar al abrir el modal de login
  };

  const openProfileModal = () => {
    if (!isLoggedIn) {
      // Si no hay sesión, mostramos un SweetAlert indicando que inicie sesión
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Para ver tu perfil, por favor inicia sesión.',
        background: "linear-gradient(to right, #141e30, #243b55)",
        confirmButtonText: 'Iniciar sesión',
        customClass: {
          popup: "custom-swal-popup"
        }
      }).then(() => {
        // Si el usuario hace clic en "Iniciar sesión", abrir el modal de login
        setIsLoginOpen(true);
      });
    } else {
      // Si está logueado, abrir el modal de perfil
      setIsProfileOpen(true);
    }
    onClose(); // Cerrar el sidebar al hacer clic en "Perfil"
  };

  return (
    <motion.div
      className="sidebar"
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      initial="closed"
    >
      <div className="sidebar-header">
        <h2>Menú</h2>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li><a href="#" onClick={onClose}>Inicio</a></li> {/* Cierra el sidebar al hacer clic */}
          <li><a href="#" onClick={openProfileModal}>Perfil</a></li> {/* Cierra el sidebar al abrir perfil */}
          <li><a href="#" onClick={() => { onOpenHistory(); onClose(); }}>Historial</a></li> {/* Cierra el sidebar al abrir historial */}
          <li><a href="#" onClick={() => { onOpenSettings(); onClose(); }}>Configuración</a></li> {/* Cierra el sidebar al abrir configuración */}
          <li><a href="#">Ayuda</a></li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        {!isLoggedIn ? (
          <>
            <Button variant="success" size="lg" onClick={openRegisterModal}>
              Registrarse
            </Button>
            <Button variant="primary" size="lg" onClick={openLoginModal}>
              Iniciar sesión
            </Button>
          </>
        ) : (
          <Button variant="danger" size="lg" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        )}
      </div>

      {/* Modal de registro y login */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      
      <GoogleOAuthProvider clientId="131317178402-b96jr7cg0pp88ordmgv68hsfr4rvedhd.apps.googleusercontent.com">  {/* Aquí configuras el clientId */}
        <div>
          {/* Aquí pones el LoginModal o el componente que contiene el botón de Google Login */}
          <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
      </GoogleOAuthProvider>

      
      {/* Modal de perfil */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </motion.div>
  );
};

export default Sidebar;
