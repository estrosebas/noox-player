import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import { Button } from 'react-bootstrap'; // Importamos el componente Button de React Bootstrap
import RegisterModal from './RegisterModal'; // Importa tu modal de registro
import LoginModal from './LoginModal'; // Asegúrate de importar el modal
import { useState } from 'react';
import '../styles/Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory: () => void; // Para abrir el modal de historial
  onOpenSettings: () => void; // Para abrir el modal de configuración
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
  const [isRegisterOpen, setIsRegisterOpen] = useState(false); // Controlar la apertura del modal de registro
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
          <li>
            <a href="#">Inicio</a>
          </li>
          <li>
            <a href="#">Perfil</a>
          </li>
          {/* Ítem para abrir historial */}
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenHistory();
                onClose();
              }}
            >
              Historial
            </a>
          </li>
          {/* Ítem para abrir configuración */}
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenSettings();
                onClose();
              }}
            >
              Configuración
            </a>
          </li>
          <li>
            <a href="#">Ayuda</a>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        {/* Botones de registro e iniciar sesión */}
        <Button
          variant="success"
          size="lg"
          onClick={() => setIsRegisterOpen(true)}
        >
          Registrarse
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsLoginOpen(true)}
        >
          Iniciar sesión
        </Button>
      </div>
      {/* Modal de registro */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </motion.div>
  );
};

export default Sidebar;
