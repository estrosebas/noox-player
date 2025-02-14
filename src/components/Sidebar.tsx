// Sidebar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import '../styles/Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory: () => void; // Nueva propiedad para abrir el modal de historial
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenHistory }) => {
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
          <li><a href="#">Inicio</a></li>
          <li><a href="#">Perfil</a></li>
          {/* Ítem que dispara el modal de historial */}
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
          <li><a href="#">Ayuda</a></li>
        </ul>
      </nav>
    </motion.div>
  );
};

export default Sidebar;
