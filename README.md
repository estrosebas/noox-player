# Noox Music
# PRUEBALO AQUÍ: [https://noox.ooguy.com](https://noox.ooguy.com)
**Noox Music** es un reproductor de música multiplataforma que permite:

- Escuchar y descargar canciones desde YouTube usando `yt-dlp`.
- Importar playlists de YouTube (y próximamente Spotify).
- Mostrar sugerencias de búsqueda en tiempo real.
- Reproducir música con controles de siguiente/anterior, volumen y descarga.
- Sincronizarse con un servidor Node/Express con SSL y endpoints para conversión y proxy de audio.

Este proyecto combina **React + Vite** (frontend), **Express** (backend), **Electron** (escritorio) y **Capacitor** (Android).

---

## Características

1. **Búsqueda y Sugerencias**  
  - Autocompletado de búsqueda en YouTube.  
  - Endpoints `/api/suggestions` y `/api/yt-search` para encontrar videos.

2. **Reproductor Multimedia**  
  - Interfaz con controles (play, pause, next, prev, volumen).  
  - Descarga de audio (`.mp3`) con un clic.  
  - Importación de playlists de YouTube (usando `yt-dlp`).

3. **Integración con Spotify**  
  - Lógica inicial para obtener canciones de playlists de Spotify y buscarlas en YouTube.

4. **Modo Escritorio con Electron**  
  - Se puede empaquetar como app de escritorio (Windows, macOS, Linux).

5. **Android con Capacitor**  
  - Proyecto listo para compilar como app nativa en Android.

6. **Animaciones**  
  - Uso de **Framer Motion** para animaciones de entrada en modales.

---

## Estructura de Carpetas

```
noox-player/
├─ android/          # Proyecto Android (Capacitor)
├─ back/             # (Opcional) Podrías ubicar lógica backend adicional
├─ dist/             # Build final de Vite (frontend)
├─ electron/
│   └─ main.mjs      # Proceso principal de Electron
├─ node_modules/
├─ public/
├─ src/
│   ├─ components/
│   │   ├─ SearchBar.tsx
│   │   ├─ MusicPlayer.tsx
│   │   ├─ Playlist.tsx
│   │   ├─ Settings.tsx
│   │   └─ ...
│   ├─ pages/
│   │   └─ Home.tsx
│   └─ ...
├─ server.js         # Servidor Express + Endpoints (SSL)
├─ front.js          # Servir la carpeta dist con Express (opcional)
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## Requisitos

- **Node.js** 16+
- **npm** o **yarn**
- **Vite** 6+ (instalado localmente en el proyecto)
- **Electron** 34+ (para modo escritorio)
- **Capacitor** 7+ (para Android)
- `yt-dlp` y `ffmpeg` instalados en tu sistema (para extraer el audio de YouTube)

---

## Instalación y Ejecución (Modo Web)

1. **Instalar dependencias**  
  ```bash
  npm install
  ```

2. **Ejecutar el backend (con SSL, puertos, etc.)**  
  Ajusta tus claves y certificados en `server.js`, luego corre:
  ```bash
  node server.js
  ```
  Esto levantará el servidor en https://noox.ooguy.com:5030 (o tu dominio/puerto configurado).

3. **Ejecutar el frontend**  
  ```bash
  npm run dev
  ```
  Esto inicia el servidor de desarrollo de Vite en http://localhost:3000.

Ahora podrás abrir http://localhost:3000 en tu navegador para usar Noox Music.

---

## Uso

- **Buscar una canción**: En la barra de búsqueda, escribe algo y presiona Enter o clic en “Buscar”.
- **Sugerencias**: A medida que escribes, verás sugerencias de búsqueda.
- **Reproducir**: Haz clic en uno de los resultados para reproducirlo en el reproductor de la parte inferior.
- **Importar playlist de YouTube**: Abre el ícono de playlist (en el MusicPlayer) y pega la URL de YouTube.
- **Controles**: Puedes pausar, adelantar, retroceder y ajustar el volumen.
- **Descarga**: El botón de descarga guarda el audio localmente en formato .mp3 (o .webm).

---

## Empaquetar para Escritorio (Electron)

### Construir el frontend

```bash
npm run build
```
Generará la carpeta `dist/` con la app de React.

### Empaquetar con electron-builder

```bash
npm run electron:build
```
Se usará `electron/main.mjs` como proceso principal. El instalador y/o carpeta `win-unpacked` (u otro) aparecerá en `dist/`.

### Ejecutar en modo desarrollo

```bash
npm run electron:dev
```
Arranca Vite en `localhost:3000`. Espera a que esté disponible y abre Electron.

---

## Empaquetar para Android (Capacitor)

### Crear/editar capacitor.config.ts

Asegúrate de que `webDir` apunte a `dist`.

### Compilar la app

```bash
npm run build
npx cap sync android
```

### Abrir Android Studio

```bash
npx cap open android
```
Desde ahí puedes ejecutar en un emulador o dispositivo y generar el APK/AAB.

---

## Recursos Adicionales

- **React Modal** para modales con animación de entrada.
- **Framer Motion** para animaciones en React.
- **yt-dlp** para extraer audio de YouTube.
- **Electron** para empaquetar la app de escritorio.
- **Capacitor** para empaquetar la app en Android/iOS.

---

## Licencia

Este proyecto está bajo la Noox Music License (Non-Commercial) creada por Diego Sebastián Gonzales Gómez, que exige atribución y prohíbe el uso comercial sin autorización. Revisa el archivo LICENSE.md para más detalles.
