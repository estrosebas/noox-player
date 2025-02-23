-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost:3306
-- Tiempo de generación: 23-02-2025 a las 22:54:37
-- Versión del servidor: 8.0.41-0ubuntu0.22.04.1
-- Versión de PHP: 8.1.2-1ubuntu2.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `noox-music`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `canciones`
--

CREATE TABLE `canciones` (
  `cancion_id` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `url_cancion` varchar(255) NOT NULL,
  `url_thumbnail` varchar(255) NOT NULL,
  `playlist_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `canciones`
--

INSERT INTO `canciones` (`cancion_id`, `nombre`, `url_cancion`, `url_thumbnail`, `playlist_id`) VALUES
(8, 'Lana Del Rey - Shades Of Cool', 'https://www.youtube.com/watch?v=rJABBmAMXnY', 'https://i.ytimg.com/vi/rJABBmAMXnY/hqdefault.jpg', 5),
(10, 'Lana Del Rey unreleased mix', 'https://www.youtube.com/watch?v=04ItUoPQRXA', 'https://i.ytimg.com/vi/04ItUoPQRXA/hqdefault.jpg', 5),
(11, 'Cherry', 'https://www.youtube.com/watch?v=uNuMH2i6wdI', 'https://i.ytimg.com/vi/uNuMH2i6wdI/hqdefault.jpg', 5),
(12, 'Lana Del Rey - Shades of Cool (Official Audio)', 'https://www.youtube.com/watch?v=KuX_xwghhsw', 'https://i.ytimg.com/vi/KuX_xwghhsw/hqdefault.jpg', 5),
(15, 'Labios Compartidos (2019 Remasterizado)', 'https://www.youtube.com/watch?v=vpDn5xYxqlE', 'https://i.ytimg.com/vi/vpDn5xYxqlE/hqdefault.jpg', 12),
(16, 'Oye Mi Amor', 'https://www.youtube.com/watch?v=OhXeBoTlCr4', 'https://i.ytimg.com/vi/OhXeBoTlCr4/hqdefault.jpg', 12),
(17, 'Kainbeats - mindscapes (Sad Lofi Hiphop EP)', 'https://www.youtube.com/watch?v=iuT8KImN-Rk', 'https://i.ytimg.com/vi/iuT8KImN-Rk/hqdefault.jpg', 13),
(18, 'cinnamon girl // lana del rey', 'https://www.youtube.com/watch?v=kfAdqByTH5U', 'https://i.ytimg.com/vi/kfAdqByTH5U/hqdefault.jpg', 13),
(19, 'cinnamon girl // lana del rey', 'https://www.youtube.com/watch?v=kfAdqByTH5U', 'https://i.ytimg.com/vi/kfAdqByTH5U/hqdefault.jpg', 5),
(20, 'Lana Del Rey - Brooklyn Baby (Lyrics)', 'https://www.youtube.com/watch?v=JhLG1Bbe4ks', 'https://i.ytimg.com/vi/JhLG1Bbe4ks/hqdefault.jpg', 5),
(21, 'Lana Del Rey - Ultraviolence (Lyrics)', 'https://www.youtube.com/watch?v=EAivfIiUlNg', 'https://i.ytimg.com/vi/EAivfIiUlNg/hqdefault.jpg', 5),
(22, 'Billie Eilish - BIRDS OF A FEATHER (Official Music Video)', 'https://www.youtube.com/watch?v=V9PVRfjEBTI', 'https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg', 12),
(23, 'Lana Del Rey - Born To Die (Lyrics)', 'https://www.youtube.com/watch?v=uN46mvvLauQ', 'https://i.ytimg.com/vi/uN46mvvLauQ/hqdefault.jpg', 5),
(24, 'AC/DC - Shoot To Thrill (Iron Man 2 Version)', 'https://www.youtube.com/watch?v=xRQnJyP77tY', 'https://i.ytimg.com/vi/xRQnJyP77tY/hqdefault.jpg', 14),
(25, 'AC/DC - Thunderstruck (Official Video)', 'https://www.youtube.com/watch?v=v2AC41dglnM', 'https://i.ytimg.com/vi/v2AC41dglnM/hqdefault.jpg', 14),
(26, 'Los Cafres - Tus ojos (DVD \"25 años\" Video oficial)', 'https://www.youtube.com/watch?v=UdITqp3EmHI', 'https://i.ytimg.com/vi/UdITqp3EmHI/hqdefault.jpg', 15),
(27, 'you can be the boss- lana del rey', 'https://www.youtube.com/watch?v=MKYUmGJLa0Q', 'https://i.ytimg.com/vi/MKYUmGJLa0Q/hqdefault.jpg', 5),
(28, 'you can be the boss- lana del rey', 'https://www.youtube.com/watch?v=MKYUmGJLa0Q', 'https://i.ytimg.com/vi/MKYUmGJLa0Q/hqdefault.jpg', 12),
(29, 'Famy Ava - Slowed+reverb // Ghostmw2', 'https://www.youtube.com/watch?v=PagIhDbMnZQ', 'https://i.ytimg.com/vi/PagIhDbMnZQ/hqdefault.jpg', 20),
(30, 'Rihanna - Diamonds (Slowed + Reverb)', 'https://www.youtube.com/watch?v=2f3s53Uzxx4', 'https://i.ytimg.com/vi/2f3s53Uzxx4/hqdefault.jpg', 20),
(31, 'Dónde Está el Amor', 'https://www.youtube.com/watch?v=J4dXwgaMNTs', 'https://i.ytimg.com/vi/J4dXwgaMNTs/hqdefault.jpg', 20),
(32, 'No es suficiente - Rio Band (Letra Completa)(Canción de Joel y Macarena) Al Fondo Hay Sitio 9', 'https://www.youtube.com/watch?v=q3otPaI3aFs', 'https://i.ytimg.com/vi/q3otPaI3aFs/hqdefault.jpg', 20),
(33, 'Carla Morrison - Compartir [VIDEO OFICIAL]', 'https://www.youtube.com/watch?v=xdfik2FRhck', 'https://i.ytimg.com/vi/xdfik2FRhck/hqdefault.jpg', 20),
(34, 'Tiago PZK, LIT killah, Maria Becerra, Nicki Nicole - Entre Nosotros REMIX (Video Oficial)', 'https://www.youtube.com/watch?v=sidPTvbTv9o', 'https://i.ytimg.com/vi/sidPTvbTv9o/hqdefault.jpg', 20),
(35, 'Dragon ball Cancion ganador', 'https://www.youtube.com/watch?v=euudENRx4OM', 'https://i.ytimg.com/vi/euudENRx4OM/hqdefault.jpg', 20),
(36, 'ThxSoMch - Hate. (Slowed + Reverb)', 'https://www.youtube.com/watch?v=p3W4xVYy07c', 'https://i.ytimg.com/vi/p3W4xVYy07c/hqdefault.jpg', 20),
(37, 'girl in red - we fell in love in october', 'https://www.youtube.com/watch?v=iggmiF7DNoM', 'https://i.ytimg.com/vi/iggmiF7DNoM/hqdefault.jpg', 20),
(38, 'Mon Laferte - Mi Buen Amor (Video Oficial) ft. Enrique Bunbury', 'https://www.youtube.com/watch?v=13m9v78uNJk', 'https://i.ytimg.com/vi/13m9v78uNJk/hqdefault.jpg', 20),
(39, 'Pensando en Ti - Arianna Fernandez (Canción de Yuli y Cristobal) Al Fondo Hay Sitio 9na Temporada', 'https://www.youtube.com/watch?v=M9gXjw7E6jY', 'https://i.ytimg.com/vi/M9gXjw7E6jY/hqdefault.jpg', 20),
(40, 'quedate conmigo (letra)', 'https://www.youtube.com/watch?v=gCrdz_IXcaA', 'https://i.ytimg.com/vi/gCrdz_IXcaA/hqdefault.jpg', 20),
(41, 'Suki Waterhouse - Good looking // Subtitulado español', 'https://www.youtube.com/watch?v=7OYBAVfY9V0', 'https://i.ytimg.com/vi/7OYBAVfY9V0/hqdefault.jpg', 20),
(42, 'The Rare Occasions - Notion (Slowed)', 'https://www.youtube.com/watch?v=aLAy3a8Lie8', 'https://i.ytimg.com/vi/aLAy3a8Lie8/hqdefault.jpg', 20),
(43, 'Somewhere only we know.. 💝🌹 (SLOWED TO PERFECTION)', 'https://www.youtube.com/watch?v=-x-lpdzb9jc', 'https://i.ytimg.com/vi/-x-lpdzb9jc/hqdefault.jpg', 20),
(44, 'Cigarettes After Sex - Sweet (sub español/lyrics)', 'https://www.youtube.com/watch?v=szQkBayBzN8', 'https://i.ytimg.com/vi/szQkBayBzN8/hqdefault.jpg', 20),
(45, 'JESSE & JOY - La De La Mala Suerte (Video Oficial)', 'https://www.youtube.com/watch?v=r0eIhlsks4s', 'https://i.ytimg.com/vi/r0eIhlsks4s/hqdefault.jpg', 20),
(46, 'JESSE & JOY - Dueles (Video Oficial)', 'https://www.youtube.com/watch?v=TMT9MNM-NHg', 'https://i.ytimg.com/vi/TMT9MNM-NHg/hqdefault.jpg', 20),
(47, 'Bloody Mary (Instrumental x Dum Dum, Da-Di-Da)  [Full Version 2] - Lady Gaga [Edit Audio]', 'https://www.youtube.com/watch?v=4ftoUGyzUvA', 'https://i.ytimg.com/vi/4ftoUGyzUvA/hqdefault.jpg', 20),
(48, 'Cigarettes After Sex - Cry (Traducida al Español + Lyrics)', 'https://www.youtube.com/watch?v=9qNgwtMrp1Q', 'https://i.ytimg.com/vi/9qNgwtMrp1Q/hqdefault.jpg', 20),
(49, 'Coyote Theory - This Side of Paradise (Animated Music Video)', 'https://www.youtube.com/watch?v=XgNc8iELq0c', 'https://i.ytimg.com/vi/XgNc8iELq0c/hqdefault.jpg', 20),
(50, 'Conan Gray - Heather [Subtitulado en Español + Lyrics]', 'https://www.youtube.com/watch?v=UmZdgbmVkO0', 'https://i.ytimg.com/vi/UmZdgbmVkO0/hqdefault.jpg', 20),
(51, '𝑱𝒖𝒅𝒂𝒔 ( 𝑺𝒍𝒐𝒘𝒆𝒅 + 𝑹𝒆𝒗𝒆𝒓𝒃 ) - 𝑳𝒂𝒅𝒚 𝑮𝒂𝒈𝒂 ♡︎', 'https://www.youtube.com/watch?v=M4yYf-Ic2A4', 'https://i.ytimg.com/vi/M4yYf-Ic2A4/hqdefault.jpg', 20),
(52, 'Pablo Alborán feat. Jesse & Joy - Dónde está el amor  (Lyric Video) | CantoYo', 'https://www.youtube.com/watch?v=uN6hzjkrZ4w', 'https://i.ytimg.com/vi/uN6hzjkrZ4w/hqdefault.jpg', 20),
(53, 'The Night We Met - Lord Huron  | Español', 'https://www.youtube.com/watch?v=g4ZmSLgjL44', 'https://i.ytimg.com/vi/g4ZmSLgjL44/hqdefault.jpg', 20),
(54, 'Mon Laferte - Tu Falta De Querer (Video Oficial)', 'https://www.youtube.com/watch?v=WT-VE9OyAJk', 'https://i.ytimg.com/vi/WT-VE9OyAJk/hqdefault.jpg', 20),
(55, 'COMENZAR DE NUEVO - Jhovan Tomasevich Lyrics', 'https://www.youtube.com/watch?v=OdSo7-CgX6o', 'https://i.ytimg.com/vi/OdSo7-CgX6o/hqdefault.jpg', 20),
(56, 'the black eyed peas - i gotta feeling (slowed+reverb)', 'https://www.youtube.com/watch?v=6GRTU-WfKOQ', 'https://i.ytimg.com/vi/6GRTU-WfKOQ/hqdefault.jpg', 20),
(57, 'Ven', 'https://www.youtube.com/watch?v=_PKS4rsUakU', 'https://i.ytimg.com/vi/_PKS4rsUakU/hqdefault.jpg', 20),
(58, 'Vacations - Telephones (sub español/lyrics)', 'https://www.youtube.com/watch?v=4TfuBPL55cc', 'https://i.ytimg.com/vi/4TfuBPL55cc/hqdefault.jpg', 20),
(59, 'Nano Morris - Mi Amor Te Espero (Video Oficial)', 'https://www.youtube.com/watch?v=nZD2lhjrie8', 'https://i.ytimg.com/vi/nZD2lhjrie8/hqdefault.jpg', 20),
(60, 'Goo Goo Dolls – Iris [Official Music Video] [4K Remaster]', 'https://www.youtube.com/watch?v=NdYWuo9OFAw', 'https://i.ytimg.com/vi/NdYWuo9OFAw/hqdefault.jpg', 20),
(61, 'The Walters - I Love You So [Official Video]', 'https://www.youtube.com/watch?v=HZX7MB_m13M', 'https://i.ytimg.com/vi/HZX7MB_m13M/hqdefault.jpg', 20),
(62, 'poker face - lady gaga ( slowed + reverb + bass boosted )', 'https://www.youtube.com/watch?v=ZP-KMvYzg5s', 'https://i.ytimg.com/vi/ZP-KMvYzg5s/hqdefault.jpg', 20),
(63, '*NSYNC - Bye Bye Bye (Official Video from Deadpool and Wolverine)', 'https://www.youtube.com/watch?v=Eo-KmOd3i7s', 'https://i.ytimg.com/vi/Eo-KmOd3i7s/hqdefault.jpg', 20),
(64, 'WAKE UP', 'https://www.youtube.com/watch?v=qiFgKJJAEjY', 'https://i.ytimg.com/vi/qiFgKJJAEjY/hqdefault.jpg', 20),
(65, 'Es una loca sub en español 🖤👅', 'https://www.youtube.com/watch?v=1TDytdtJhOM', 'https://i.ytimg.com/vi/1TDytdtJhOM/hqdefault.jpg', 20),
(66, 'combinacion de color rosa las dos versiones [openig 3 de DBS] (la cancion perfecta)', 'https://www.youtube.com/watch?v=npz461VzFqo', 'https://i.ytimg.com/vi/npz461VzFqo/hqdefault.jpg', 20),
(67, 'Summertime Sadness — Lana Del Rey || Sub. Español | Lyrics', 'https://www.youtube.com/watch?v=76zzapFpgJM', 'https://i.ytimg.com/vi/76zzapFpgJM/hqdefault.jpg', 20),
(68, 'LIT killah - Eclipse (Official Video)', 'https://www.youtube.com/watch?v=GefGmfKUaJw', 'https://i.ytimg.com/vi/GefGmfKUaJw/hqdefault.jpg', 20),
(69, 'Jesse & Joy - \"Ecos de Amor\" (Video con Letra)', 'https://www.youtube.com/watch?v=qCZNxmo6pxs', 'https://i.ytimg.com/vi/qCZNxmo6pxs/hqdefault.jpg', 20),
(70, '¡Corre!', 'https://www.youtube.com/watch?v=hd2yAElE_ds', 'https://i.ytimg.com/vi/hd2yAElE_ds/hqdefault.jpg', 20),
(71, 'Mitski - My Love Mine All Mine (Español + Lyrics)', 'https://www.youtube.com/watch?v=XQ_YrqmmpIw', 'https://i.ytimg.com/vi/XQ_YrqmmpIw/hqdefault.jpg', 20),
(72, 'thxsomch - spit in my face! [ slowed + reverb ] (lyrics)', 'https://www.youtube.com/watch?v=--XM_nNl-yY', 'https://i.ytimg.com/vi/--XM_nNl-yY/hqdefault.jpg', 20),
(73, '𝐃𝐚𝐯𝐢𝐝 𝐋𝐚𝐢𝐝 𝐗 𝐏𝐨𝐤𝐞𝐫 𝐅𝐚𝐜𝐞 (𝐒𝐥𝐨𝐰𝐞𝐝 + 𝐑𝐞𝐰𝐞𝐫𝐛)', 'https://www.youtube.com/watch?v=fYWpDy3JeHs', 'https://i.ytimg.com/vi/fYWpDy3JeHs/hqdefault.jpg', 20),
(74, 'D4vd - here with me (Sub. Español)', 'https://www.youtube.com/watch?v=Y9QnCx_JVSc', 'https://i.ytimg.com/vi/Y9QnCx_JVSc/hqdefault.jpg', 20),
(75, 'Ari Abdul - BABYDOLL (Lyrics)', 'https://www.youtube.com/watch?v=b_WnZqLhzR4', 'https://i.ytimg.com/vi/b_WnZqLhzR4/hqdefault.jpg', 20),
(76, 'The Neighbourhood - Daddy Issues (Sub Español)', 'https://www.youtube.com/watch?v=m1r_qWdTuy8', 'https://i.ytimg.com/vi/m1r_qWdTuy8/hqdefault.jpg', 20),
(77, 'Amor Sincero - Marina Yafac (Oficial Vídeo Music)', 'https://www.youtube.com/watch?v=u-RJ7XRijAw', 'https://i.ytimg.com/vi/u-RJ7XRijAw/hqdefault.jpg', 20),
(78, 'hard life - ocean view', 'https://www.youtube.com/watch?v=nBdb8VmNI8E', 'https://i.ytimg.com/vi/nBdb8VmNI8E/hqdefault.jpg', 12),
(79, 'Lana Del Rey - Groupie Love (Official Audio) ft. A$AP Rocky', 'https://www.youtube.com/watch?v=tBwoRviPvVw', 'https://i.ytimg.com/vi/tBwoRviPvVw/hqdefault.jpg', 5),
(80, 'Lana Del Rey - Unfixable (Shades of Cool Demo)', 'https://www.youtube.com/watch?v=jfPA1RL-bcs', 'https://i.ytimg.com/vi/jfPA1RL-bcs/hqdefault.jpg', 5),
(81, 'Andrés Obregón - Lagrimas Cayendo (Video Oficial)', 'https://www.youtube.com/watch?v=EW2Op-7Mmc0', 'https://i.ytimg.com/vi/EW2Op-7Mmc0/hqdefault.jpg', 12);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `playlists`
--

CREATE TABLE `playlists` (
  `playlist_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `usuario_id` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `playlists`
--

INSERT INTO `playlists` (`playlist_id`, `nombre`, `descripcion`, `usuario_id`, `fecha_creacion`) VALUES
(5, 'Lanita sad ', 'mi mix favorito de lana del rey', 1, '2025-02-18 18:21:55'),
(6, 'oldsad', 'canciones que escuchaba cuando yo la amaba', 3, '2025-02-18 19:35:45'),
(7, 'XD', 'X', 4, '2025-02-19 00:56:50'),
(8, ':V', 'no funciona tu cosa', 4, '2025-02-19 00:57:07'),
(12, 'chill', 'hi chill', 1, '2025-02-19 22:29:49'),
(13, 'programing chill', 'a chil playlist for programming', 1, '2025-02-19 23:12:26'),
(14, 'jugando', 'para jugar', 1, '2025-02-20 03:09:06'),
(15, 'chetados', 'samperos', 6, '2025-02-21 21:12:27'),
(20, 'post bffa', 'tite', 1, '2025-02-21 23:54:47'),
(22, 'spider', 'man', 10, '2025-02-23 03:37:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `usuario_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `contrasena` varchar(255) DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `google_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`usuario_id`, `nombre`, `correo`, `contrasena`, `fecha_registro`, `google_id`) VALUES
(1, 'SrEstrosebas', 'estrosebas@gmail.com', 'Estroganzo18050516@bffa', '2025-02-18 02:38:06', NULL),
(3, 'Sr warwarack', 'estrofree@gmail.com', 'Estro123', '2025-02-18 19:33:48', NULL),
(4, 'aea', 'mongol@e.com', 'ez', '2025-02-19 00:55:30', NULL),
(6, 'Sebas Estro', 'sebasestro90@gmail.com', NULL, '2025-02-21 21:12:00', '116819787985894249338'),
(10, 'Neff PM', 'forthehorde400@gmail.com', NULL, '2025-02-23 03:36:23', '110318467443807714312');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `canciones`
--
ALTER TABLE `canciones`
  ADD PRIMARY KEY (`cancion_id`),
  ADD KEY `playlist_id` (`playlist_id`);

--
-- Indices de la tabla `playlists`
--
ALTER TABLE `playlists`
  ADD PRIMARY KEY (`playlist_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`usuario_id`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `canciones`
--
ALTER TABLE `canciones`
  MODIFY `cancion_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT de la tabla `playlists`
--
ALTER TABLE `playlists`
  MODIFY `playlist_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `usuario_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `canciones`
--
ALTER TABLE `canciones`
  ADD CONSTRAINT `canciones_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`playlist_id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `playlists`
--
ALTER TABLE `playlists`
  ADD CONSTRAINT `playlists_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
