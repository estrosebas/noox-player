import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import '../styles/Auth.css';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  usuario_id: number;
  nombre: string;
  correo: string;
}

const Auth: React.FC<AuthProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const sessionCookie = Cookies.get('session');
    if (sessionCookie) {
      const user = JSON.parse(sessionCookie);
      axios
        .get(`http://localhost:5030/api/usuarios/${user.usuario_id}`)
        .then((response) => {
          setUserData(response.data);
        })
        .catch((err) => {
          console.error('Error fetching user data:', err);
        });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogout = () => {
    Cookies.remove('session');
    setUserData(null);
    onClose();
    Swal.fire({
      icon: 'success',
      title: 'Logged out successfully',
      timer: 1500,
      showConfirmButton: false,
      background: 'linear-gradient(to right, #141e30, #243b55)',
      customClass: {
        popup: 'custom-swal-popup',
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(
          'http://localhost:5030/api/login',
          {
            correo: formData.correo,
            contrasena: formData.contrasena,
          }
        );

        Cookies.set('session', JSON.stringify(response.data.usuario), {
          expires: 7,
        });
        setUserData(response.data.usuario);

        await Swal.fire({
          icon: 'success',
          title: 'Login successful',
          text: `Welcome back, ${response.data.usuario.nombre}!`,
          timer: 2000,
          showConfirmButton: false,
          background: 'linear-gradient(to right, #141e30, #243b55)',
          customClass: {
            popup: 'custom-swal-popup',
          },
        });
      } else {
        const response = await axios.post(
          'http://localhost:5030/api/usuarios',
          {
            nombre: formData.nombre,
            correo: formData.correo,
            contrasena: formData.contrasena,
          }
        );

        await Swal.fire({
          icon: 'success',
          title: 'Registration successful',
          text: `Welcome, ${response.data.nombre}!`,
          timer: 2000,
          background: 'linear-gradient(to right, #141e30, #243b55)',
          customClass: {
            popup: 'custom-swal-popup',
          },
          showConfirmButton: false,
        });
      }

      setFormData({ nombre: '', correo: '', contrasena: '' });
      onClose();
    } catch (err) {
      console.error('Error:', err);
      setError(isLogin ? 'Invalid email or password.' : 'Registration failed.');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: isLogin ? 'Invalid email or password.' : 'Registration failed.',
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: {
          popup: 'custom-swal-popup',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    try {
      const token = response.credential;
      const userResponse = await axios.post(
        'http://localhost:5030/api/google-login',
        { token }
      );
      Cookies.set('session', JSON.stringify(userResponse.data.usuario), {
        expires: 7,
      });
      setUserData(userResponse.data.usuario);

      await Swal.fire({
        icon: 'success',
        title: 'Login successful',
        text: `Welcome, ${userResponse.data.usuario.nombre}!`,
        timer: 2000,
        showConfirmButton: false,
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: {
          popup: 'custom-swal-popup',
        },
      });

      onClose();
    } catch (error) {
      console.error('Google Auth Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Google login failed.',
        background: 'linear-gradient(to right, #141e30, #243b55)',
        customClass: {
          popup: 'custom-swal-popup',
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="auth-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>

          {userData ? (
            <div className="profile-info">
              <h3>Profile</h3>
              <div className="profile-field">
                <label>Name</label>
                <span>{userData.nombre}</span>
              </div>
              <div className="profile-field">
                <label>Email</label>
                <span>{userData.correo}</span>
              </div>
              <button className="btn-danger" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h2>{isLogin ? 'Login to noox music' : 'Create account'}</h2>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="form-group">
                    <label htmlFor="nombre">Name</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      placeholder="Your name"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="correo">Email</label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contrasena">Password</label>
                  <input
                    type="password"
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign up'}
                </button>

                {isLogin && (
                  <div className="google-login">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        console.error('Google Login Failed');
                      }}
                    />
                  </div>
                )}

                <div className="auth-switch">
                  <span>
                    {isLogin
                      ? "Don't have an account?"
                      : 'Already have an account?'}
                    <button type="button" onClick={() => setIsLogin(!isLogin)}>
                      {isLogin ? 'Sign up' : 'Login'}
                    </button>
                  </span>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Auth;
