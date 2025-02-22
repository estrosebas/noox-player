# 🎵 Noox Player

Un reproductor de música web moderno y elegante construido con React y TypeScript que te permite transmitir música desde diversas fuentes.

## 🌟 Características Principales

### 🎮 Reproductor de Música
- **Control de Reproducción Avanzado**
  - Barra de progreso interactiva
  - Control de volumen deslizable
  - Botones de reproducción/pausa
  - Navegación entre canciones (siguiente/anterior)
  - Visualización de tiempo transcurrido y duración total

### 🔍 Sistema de Búsqueda
- **Búsqueda en Tiempo Real**
  - Sugerencias automáticas mientras escribes
  - Visualización de miniaturas de videos
  - Resultados instantáneos
  - Interfaz intuitiva de selección

### 📑 Gestión de Playlists
- **Funcionalidades Completas**
  - Crear playlists personalizadas
  - Añadir y eliminar canciones
  - Organizar el orden de reproducción
  - Guardar playlists favoritas
  - Reproducción secuencial automática

### 👤 Sistema de Usuarios
- **Características de Cuenta**
  - Registro de usuario
  - Inicio de sesión
  - Perfil personalizado
  - Historial de reproducción
  - Preferencias guardadas

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - React 18
  - TypeScript
  - Bootstrap 5
  - CSS Modules
  - HTML5 Audio API

## 💻 Requisitos del Sistema

- Node.js (versión 14.0 o superior)
- npm (versión 6.0 o superior) o yarn
- Navegador web moderno (Chrome, Firefox, Edge)
- Conexión a Internet

## 🚀 Guía de Instalación

### 1. Preparación del Entorno
Asegúrate de tener instalado Node.js y npm en tu sistema. Puedes descargarlos desde:
- [Node.js](https://nodejs.org/es/)

Para verificar la instalación, abre una terminal y ejecuta:
```bash
node --version
npm --version
```
### 2. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/noox-player.git
cd noox-player
```  
### 3. Instalar Dependencias
```bash
npm install
```
### 4. Iniciar el Proyecto
```bash
npm run dev
```
El proyecto se abrirá automáticamente en tu navegador predeterminado en http://localhost:5173

## 📁 Estructura del Proyecto
```
noox-player/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── MusicPlayer/   # Reproductor principal
│   │   ├── SearchBar/     # Barra de búsqueda
│   │   ├── Playlist/      # Gestión de playlists
│   │   └── ...
│   ├── pages/             # Páginas de la aplicación
│   ├── styles/            # Estilos CSS
│   └── main.tsx          # Punto de entrada
```
## 🔧 Funcionalidades Detalladas
### 🎵 Reproductor Principal (MusicPlayer)
- Control de Audio
  - Reproducción/Pausa con animaciones suaves
  - Control de volumen con persistencia
  - Barra de progreso interactiva
  - Visualización de tiempo en formato mm:ss
### 🔍 Barra de Búsqueda (SearchBar)
- Búsqueda Inteligente
  - Sugerencias en tiempo real
  - Caché de búsquedas recientes
  - Filtrado de resultados
  - Previsualización de miniaturas
### 📑 Sistema de Playlists
- Gestión Completa
  - Creación de playlists ilimitadas
  - Organización por drag & drop
  - Reproducción aleatoria
  - Modo repetición
## ⚙️ Configuración Personalizada
### Temas
- Modo oscuro por defecto
- Interfaz adaptable
- Animaciones personalizables
### Ajustes de Audio
- Calidad de reproducción ajustable
- Ecualizador básico
- Control de fade entre canciones
## 🤝 Contribución
1. Haz un Fork del proyecto
2. Crea una rama para tu función ( git checkout -b feature/AmazingFeature )
3. Commit tus cambios ( git commit -m 'Add some AmazingFeature' )
4. Push a la rama ( git push origin feature/AmazingFeature )
5. Abre un Pull Request
## 🐛 Reporte de Problemas
Si encuentras algún bug o tienes sugerencias, por favor abre un issue en el repositorio de GitHub.

## 📝 Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE.md para más detalles.

## 📞 Soporte
Para soporte técnico o consultas:

- Crear un issue en GitHub
- Enviar un correo a: [ estrosebas@gmail.com ]
## 🙏 Agradecimientos
- A la comunidad de React
- A todos los contribuidores
- A los usuarios que confían en Noox Player

Desarrollado con ❤️ por Diego Sebastian Gonzales Gomez
