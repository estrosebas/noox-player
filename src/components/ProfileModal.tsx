import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import Cookies from "js-cookie"; // Para gestionar cookies
import "../styles/ProfileModal.css"; // Crea un archivo de estilos similar al de LoginModal

Modal.setAppElement("#root");

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionCookie = Cookies.get("session");
    if (sessionCookie) {
      const userData = JSON.parse(sessionCookie);
      // Fetch datos del usuario usando el ID de la cookie
      axios
        .get(`https://noox.ooguy.com:5030/api/usuarios/${userData.usuario_id}`)
        .then(({ data }) => { // Desestructuramos la respuesta directamente
          const { nombre, correo } = data;
          setNombre(nombre);
          setCorreo(correo);
        })
        .catch((err) => {
          console.error("Error al cargar los datos del perfil:", err);
          setError("Error al cargar los datos del perfil.");
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones básicas
    if (!nombre || !correo) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    const sessionCookie = Cookies.get("session");
    if (sessionCookie) {
      const userData = JSON.parse(sessionCookie);
      try {
        await axios.put(`https://noox.ooguy.com:5030/api/usuarios/${userData.usuario_id}`, {
          nombre,
          correo,
          contrasena: contrasena || undefined, // Solo enviar contraseña si no está vacía
        });

        // Muestra una alerta de éxito con sweetalert2
        await Swal.fire({
          icon: "success",
          title: "Perfil actualizado",
          text: `Tu perfil ha sido actualizado exitosamente.`,
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "swal-custom", // Aplicar border-radius a las alertas
          },
        });

        onClose(); // Cerrar el modal después de actualizar
      } catch (err: any) {
        console.error("Error actualizando perfil:", err);
        setError("Error al actualizar el perfil. Intenta de nuevo.");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo actualizar el perfil.",
          customClass: {
            popup: "swal-custom", // Aplicar border-radius a las alertas
          },
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="profile-modal"
      overlayClassName="profile-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="profile-container">
          <h3>Actualizar tu perfil</h3>
          <form onSubmit={handleSubmit} className="profile-form">
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <input
              type="password"
              placeholder="Nueva Contraseña (opcional)"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" className="profile-button" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </form>
          <button className="profile-close" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default ProfileModal;
