import React, { useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import "../styles/RegisterModal.css"; // Crea este archivo con estilos similares al ejemplo

Modal.setAppElement("#root");

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones básicas
    if (!nombre || !correo || !contrasena) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://noox.ooguy.com:5030/api/usuarios", {
        nombre,
        correo,
        contrasena,
      });
      // Muestra una alerta de éxito con sweetalert2
      await Swal.fire({
        icon: "success",
        title: "Registro exitoso",
        text: `Bienvenido, ${response.data.nombre}!`,
        timer: 2000,
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup"
        },
        showConfirmButton: false,
      });
      // Cierra el modal y limpia los campos
      setNombre("");
      setCorreo("");
      setContrasena("");
      onClose();
    } catch (err: any) {
      console.error("Error registrando usuario:", err);
      setError("Error al registrarse. Intenta de nuevo.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo completar el registro.",
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup"
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="register-modal"
      overlayClassName="register-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="register-container">
          <h3>Regístrate</h3>
          <form onSubmit={handleSubmit} className="register-form">
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
              placeholder="Contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? "Registrando..." : "Registrarme"}
            </button>
          </form>
          <button className="register-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default RegisterModal;
