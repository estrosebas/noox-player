import React, { useState } from "react";
import Modal from "react-modal";
import { GoogleLogin } from '@react-oauth/google'; // Importar GoogleLogin
import axios from "axios";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import Cookies from "js-cookie"; 
import "../styles/LoginModal.css"; 

Modal.setAppElement("#root");

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setUserData] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!correo || !contrasena) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://noox.ooguy.com:5030/api/login", {
        correo,
        contrasena,
      });

      Cookies.set("session", JSON.stringify(response.data.usuario), { expires: 7 });

      await Swal.fire({
        icon: "success",
        title: "Login exitoso",
        text: `Bienvenido, ${response.data.usuario.nombre}!`,
        timer: 2000,
        showConfirmButton: false,
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup"
        }
      });

      const usuarioId = response.data.usuario.usuario_id;
      const userResponse = await axios.get(`https://noox.ooguy.com:5030/api/usuarios/${usuarioId}`);
      setUserData(userResponse.data);

      setCorreo("");
      setContrasena("");
      onClose();
    } catch (err: any) {
      console.error("Error al loguearse:", err);
      setError("Correo o contraseña incorrectos.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Correo o contraseña incorrectos.",
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    try {
      const token = response.credential;
      const userResponse = await axios.post("https://noox.ooguy.com:5030/api/google-login", { token });
      Cookies.set("session", JSON.stringify(userResponse.data.usuario), { expires: 7 });

      await Swal.fire({
        icon: "success",
        title: "Login exitoso",
        text: `Bienvenido, ${userResponse.data.usuario.nombre}!`,
        timer: 2000,
        showConfirmButton: false,
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup"
        }
      });

      setUserData(userResponse.data);
      onClose();
    } catch (error) {
      console.error("Error de Google Auth:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al iniciar sesión con Google.",
        background: "linear-gradient(to right, #141e30, #243b55)",
        customClass: {
          popup: "custom-swal-popup"
        }
      });
    }
  };

  const handleGoogleError = () => {
    console.error("Error de Google Auth");
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Hubo un problema con la autenticación de Google.",
      background: "linear-gradient(to right, #141e30, #243b55)",
      customClass: {
        popup: "custom-swal-popup"
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="login-modal"
      overlayClassName="login-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="login-container">
          <h3>Iniciar sesión</h3>
          <form onSubmit={handleSubmit} className="login-form">
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
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="google-login">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          <button className="login-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </Modal>
  );
};

export default LoginModal;
