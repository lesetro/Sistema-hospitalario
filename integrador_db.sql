-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-06-2025 a las 21:58:52
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `integrador_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `administrativos`
--

CREATE TABLE `administrativos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `sector_id` int(11) NOT NULL,
  `turno_id` int(11) DEFAULT NULL,
  `responsabilidad` enum('Expediente','Turnos','Legajos','Derivaciones','General','Otros') DEFAULT 'General',
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT 'Activo',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `administrativos`
--

INSERT INTO `administrativos` (`id`, `usuario_id`, `sector_id`, `turno_id`, `responsabilidad`, `descripcion`, `estado`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 'General', 'Administrativo general', 'Activo', '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admisiones`
--

CREATE TABLE `admisiones` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `administrativo_id` int(11) NOT NULL,
  `estado` enum('Pendiente','Cancelada','Completada') DEFAULT 'Pendiente',
  `fecha` datetime NOT NULL,
  `medico_id` int(11) DEFAULT NULL,
  `sector_id` int(11) DEFAULT NULL,
  `motivo_id` int(11) NOT NULL,
  `forma_ingreso_id` int(11) NOT NULL,
  `turno_id` int(11) DEFAULT NULL,
  `especialidad_id` int(11) DEFAULT NULL,
  `tipo_estudio_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `admisiones`
--

INSERT INTO `admisiones` (`id`, `paciente_id`, `administrativo_id`, `estado`, `fecha`, `medico_id`, `sector_id`, `motivo_id`, `forma_ingreso_id`, `turno_id`, `especialidad_id`, `tipo_estudio_id`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 'Pendiente', '2025-05-30 00:00:00', 1, 1, 1, 1, 1, 1, NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 2, 1, 'Pendiente', '2025-06-04 00:00:00', 2, 4, 4, 3, 2, 2, 2, '2025-06-09 12:10:01', '2025-06-09 12:10:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `altasmedicas`
--

CREATE TABLE `altasmedicas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `internacion_id` int(11) NOT NULL,
  `fecha_alta` datetime NOT NULL,
  `tipo_alta` enum('Voluntaria','Medica','Contraindicada') NOT NULL,
  `estado_paciente` enum('Estable','Crítico','Fallecido') NOT NULL,
  `instrucciones_post_alta` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `altasmedicas`
--

INSERT INTO `altasmedicas` (`id`, `paciente_id`, `medico_id`, `internacion_id`, `fecha_alta`, `tipo_alta`, `estado_paciente`, `instrucciones_post_alta`, `created_at`, `updated_at`) VALUES
(1, 4, 2, 1, '2025-05-25 00:00:00', 'Medica', 'Estable', NULL, '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `camas`
--

CREATE TABLE `camas` (
  `id` int(11) NOT NULL,
  `habitacion_id` int(11) NOT NULL,
  `numero` varchar(50) NOT NULL,
  `sexo_ocupante` enum('Masculino','Femenino','Otro') DEFAULT NULL,
  `estado` enum('Libre','Ocupada','EnLimpieza') DEFAULT 'Libre',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `fecha_fin_limpieza` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `camas`
--

INSERT INTO `camas` (`id`, `habitacion_id`, `numero`, `sexo_ocupante`, `estado`, `created_at`, `updated_at`, `fecha_fin_limpieza`) VALUES
(1, 1, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(2, 1, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(3, 1, '3', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(4, 1, '4', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(5, 1, '5', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(6, 1, '6', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(7, 1, '7', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(8, 1, '8', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(9, 1, '9', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(10, 1, '10', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(11, 1, '11', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(12, 1, '12', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(13, 1, '13', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(14, 1, '14', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(15, 1, '15', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(16, 1, '16', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(17, 1, '17', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(18, 1, '18', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(19, 1, '19', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(20, 1, '20', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(21, 2, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(22, 2, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(23, 2, '3', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(24, 2, '4', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(25, 2, '5', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(26, 2, '6', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(27, 2, '7', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(28, 2, '8', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(29, 2, '9', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(30, 2, '10', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(31, 2, '11', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(32, 2, '12', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(33, 2, '13', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(34, 2, '14', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(35, 2, '15', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(36, 2, '16', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(37, 2, '17', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(38, 2, '18', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(39, 2, '19', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(40, 2, '20', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(41, 3, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(42, 3, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(43, 3, '3', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(44, 3, '4', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(45, 3, '5', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(46, 3, '6', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(47, 3, '7', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(48, 3, '8', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(49, 3, '9', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(50, 3, '10', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(51, 3, '11', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(52, 3, '12', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(53, 3, '13', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(54, 3, '14', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(55, 3, '15', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(56, 3, '16', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(57, 3, '17', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(58, 3, '18', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(59, 3, '19', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(60, 3, '20', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(61, 4, '1', 'Masculino', 'Ocupada', '2025-06-09 03:04:13', '2025-06-09 12:10:01', NULL),
(62, 4, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(63, 5, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(64, 5, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(65, 6, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(66, 6, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(67, 7, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(68, 7, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(69, 8, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(70, 8, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(71, 9, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(72, 9, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(73, 10, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(74, 11, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(75, 12, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(76, 13, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(77, 14, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(78, 14, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(79, 15, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(80, 15, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(81, 16, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(82, 16, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(83, 17, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(84, 17, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(85, 18, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(86, 18, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(87, 19, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(88, 19, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(89, 20, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(90, 21, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(91, 22, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(92, 23, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(93, 24, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(94, 24, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(95, 25, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(96, 25, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(97, 26, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(98, 26, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(99, 27, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(100, 27, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(101, 28, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(102, 28, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(103, 29, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(104, 29, '2', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(105, 30, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(106, 31, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(107, 32, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(108, 33, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(109, 34, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(110, 35, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(111, 36, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL),
(112, 37, '1', NULL, 'Libre', '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `controlesenfermeria`
--

CREATE TABLE `controlesenfermeria` (
  `id` int(11) NOT NULL,
  `evaluacion_enfermeria_id` int(11) NOT NULL,
  `alergias` text DEFAULT NULL,
  `antecedentes_familiares` text DEFAULT NULL,
  `antecedentes_personales` text DEFAULT NULL,
  `grupo_sanguineo` varchar(255) DEFAULT NULL,
  `factor_rh` enum('Positivo','Negativo') DEFAULT NULL,
  `peso` float DEFAULT NULL,
  `altura` float DEFAULT NULL,
  `presion_arterial` float DEFAULT NULL,
  `frecuencia_cardiaca` varchar(255) DEFAULT NULL,
  `frecuencia_respiratoria` int(11) DEFAULT NULL,
  `temperatura` float DEFAULT NULL,
  `nivel_oxigeno` varchar(255) DEFAULT NULL,
  `nivel_glucosa` float DEFAULT NULL,
  `nivel_colesterol` varchar(255) DEFAULT NULL,
  `nivel_trigliceridos` varchar(255) DEFAULT NULL,
  `nivel_creatinina` varchar(255) DEFAULT NULL,
  `nivel_urea` varchar(255) DEFAULT NULL,
  `nivel_acido_urico` varchar(255) DEFAULT NULL,
  `nivel_hb` varchar(255) DEFAULT NULL,
  `nivel_hct` varchar(255) DEFAULT NULL,
  `nivel_leucocitos` varchar(255) DEFAULT NULL,
  `nivel_plaquetas` varchar(255) DEFAULT NULL,
  `nivel_proteinas` varchar(255) DEFAULT NULL,
  `nivel_albumina` varchar(255) DEFAULT NULL,
  `nivel_globulina` varchar(255) DEFAULT NULL,
  `nivel_fosfatasa` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `controlesenfermeria`
--

INSERT INTO `controlesenfermeria` (`id`, `evaluacion_enfermeria_id`, `alergias`, `antecedentes_familiares`, `antecedentes_personales`, `grupo_sanguineo`, `factor_rh`, `peso`, `altura`, `presion_arterial`, `frecuencia_cardiaca`, `frecuencia_respiratoria`, `temperatura`, `nivel_oxigeno`, `nivel_glucosa`, `nivel_colesterol`, `nivel_trigliceridos`, `nivel_creatinina`, `nivel_urea`, `nivel_acido_urico`, `nivel_hb`, `nivel_hct`, `nivel_leucocitos`, `nivel_plaquetas`, `nivel_proteinas`, `nivel_albumina`, `nivel_globulina`, `nivel_fosfatasa`, `created_at`, `updated_at`) VALUES
(1, 1, 'Penicilina, sulfas', 'Padre con diabetes, madre con hipertensión', 'Asma en la infancia', 'A', 'Positivo', 68.5, 1.72, 120, '72 lpm', 16, 36.5, '98%', 92, '180 mg/dL', '120 mg/dL', '0.9 mg/dL', '28 mg/dL', '5.2 mg/dL', '14 g/dL', '42%', '7500/mm3', '250000/mm3', '7.2 g/dL', '4.0 g/dL', '3.2 g/dL', '80 UI/L', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 2, 'Ninguna conocida', 'Abuela con cáncer de mama', 'Apéndicectomía a los 15 años', 'B', 'Negativo', 75.2, 1.68, 130, '68 lpm', 18, 37, '96%', 105, '210 mg/dL', '150 mg/dL', '1.1 mg/dL', '32 mg/dL', '6.0 mg/dL', '13 g/dL', '39%', '8200/mm3', '210000/mm3', '7.0 g/dL', '3.8 g/dL', '3.2 g/dL', '85 UI/L', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 3, 'Mariscos, yodo', 'Padre con enfermedad coronaria', 'Hipertensión controlada', 'O', 'Positivo', 82, 1.75, 135, '76 lpm', 17, 36.8, '97%', 98, '195 mg/dL', '140 mg/dL', '1.0 mg/dL', '30 mg/dL', '5.8 mg/dL', '15 g/dL', '45%', '6800/mm3', '230000/mm3', '7.4 g/dL', '4.2 g/dL', '3.2 g/dL', '75 UI/L', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 4, 'Polvo, ácaros', 'Madre con artritis reumatoide', 'Diabetes tipo 2', 'AB', 'Positivo', 90.5, 1.8, 140, '82 lpm', 20, 37.2, '92%', 160, '230 mg/dL', '180 mg/dL', '1.3 mg/dL', '38 mg/dL', '6.5 mg/dL', '14.5 g/dL', '43%', '9000/mm3', '240000/mm3', '7.6 g/dL', '4.1 g/dL', '3.5 g/dL', '90 UI/L', '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `diagnosticos`
--

CREATE TABLE `diagnosticos` (
  `id` int(11) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `tipoDiagnostico_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `diagnosticos`
--

INSERT INTO `diagnosticos` (`id`, `codigo`, `tipoDiagnostico_id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(401, 'J18.9', 1, 'Neumonía, no especificada', 'Infección pulmonar de causa no determinada', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(402, 'Z48.0', 2, 'Atención a herida quirúrgica', 'Control postoperatorio de herida', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(403, 'J30.9', 1, 'Rinitis alérgica no especificada', 'Alergia nasal con estornudos y congestión', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(404, 'I10', 3, 'Hipertensión esencial', 'Presión arterial elevada sin causa secundaria identificable', '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `enfermeros`
--

CREATE TABLE `enfermeros` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `sector_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `enfermeros`
--

INSERT INTO `enfermeros` (`id`, `usuario_id`, `sector_id`, `created_at`, `updated_at`) VALUES
(1, 3, 1, '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especialidades`
--

CREATE TABLE `especialidades` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `especialidades`
--

INSERT INTO `especialidades` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Cardiología', 'Especialidad cardíaca', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Traumatología', 'Especialidad ósea', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(3, 'Neurología', 'Especialidad en neurología', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(4, 'Pediatría', 'Especialidad en pediatría', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(5, 'Materno', 'Especialidad en maternidad', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiossolicitados`
--

CREATE TABLE `estudiossolicitados` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `evaluacion_medica_id` int(11) NOT NULL,
  `tipo_estudio_id` int(11) NOT NULL,
  `estado` enum('Pendiente','Realizado','Cancelado') DEFAULT 'Pendiente',
  `observaciones` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiossolicitados`
--

INSERT INTO `estudiossolicitados` (`id`, `paciente_id`, `evaluacion_medica_id`, `tipo_estudio_id`, `estado`, `observaciones`, `created_at`, `updated_at`) VALUES
(501, 101, 1, 1, 'Pendiente', 'Realizar en ayunas', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(502, 102, 2, 2, 'Realizado', 'Resultados dentro de parámetros normales', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(503, 103, 3, 3, 'Pendiente', 'Confirmar alergenos específicos', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(504, 104, 4, 4, 'Cancelado', 'Paciente no asistió a la cita', '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluacionesenfermeria`
--

CREATE TABLE `evaluacionesenfermeria` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `enfermero_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `fecha` datetime NOT NULL,
  `signos_vitales` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`signos_vitales`)),
  `procedimiento_pre_quirurgico_id` int(11) DEFAULT NULL,
  `nivel_triaje` enum('Rojo','Amarillo','Verde','Negro') DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `procedimiento_enfermeria_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `evaluacionesenfermeria`
--

INSERT INTO `evaluacionesenfermeria` (`id`, `paciente_id`, `enfermero_id`, `medico_id`, `fecha`, `signos_vitales`, `procedimiento_pre_quirurgico_id`, `nivel_triaje`, `observaciones`, `procedimiento_enfermeria_id`, `created_at`, `updated_at`) VALUES
(1, 101, 301, 201, '2023-05-14 11:30:00', '{\"presion\":\"120/85\",\"pulso\":68,\"temp\":37.0}', 1, 'Verde', 'Paciente estable, sin quejas', 1, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 102, 302, 202, '2023-05-15 13:15:00', '{\"presion\":\"130/85\",\"pulso\":68,\"temp\":37.0}', NULL, 'Amarillo', 'Paciente con dolor moderado', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 103, 303, 203, '2023-05-16 16:45:00', '{\"presion\":\"110/85\",\"pulso\":90,\"temp\":37.0}', 2, 'Verde', 'Preparación para cirugía programada', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 104, 304, 204, '2023-05-17 19:20:00', '{\"presion\":\"150/75\",\"pulso\":88,\"temp\":41.0}', NULL, 'Rojo', 'Paciente con dificultad respiratoria', 3, '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `evaluacionesmedicas`
--

CREATE TABLE `evaluacionesmedicas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `tratamiento_id` int(11) DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `observaciones_diagnostico` text DEFAULT NULL,
  `diagnostico_id` int(11) DEFAULT NULL,
  `estudio_solicitado_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `evaluacionesmedicas`
--

INSERT INTO `evaluacionesmedicas` (`id`, `paciente_id`, `medico_id`, `tratamiento_id`, `fecha`, `observaciones_diagnostico`, `diagnostico_id`, `estudio_solicitado_id`, `created_at`, `updated_at`) VALUES
(1, 101, 201, 301, '2023-05-15 13:30:00', 'Paciente presenta fiebre persistente y dolor de cabeza', 401, 501, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 102, 202, 302, '2023-05-16 14:15:00', 'Control postoperatorio sin complicaciones', 402, 502, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 103, 203, NULL, '2023-05-17 12:00:00', 'Paciente con síntomas de alergia estacional', 403, 503, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 104, 204, 303, '2023-05-18 19:45:00', 'Seguimiento de tratamiento crónico', 404, NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(7, 2, 2, NULL, '2025-06-09 12:10:01', NULL, NULL, NULL, '2025-06-09 12:10:01', '2025-06-09 12:10:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

CREATE TABLE `facturas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `admision_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_emision` datetime NOT NULL,
  `estado` enum('Pendiente','Pagada','Cancelada') DEFAULT 'Pendiente',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `facturas`
--

INSERT INTO `facturas` (`id`, `paciente_id`, `admision_id`, `monto`, `descripcion`, `fecha_emision`, `estado`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 1500.50, 'Consulta y estudios', '2025-05-20 00:00:00', 'Pendiente', '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `formasingreso`
--

CREATE TABLE `formasingreso` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `formasingreso`
--

INSERT INTO `formasingreso` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Ambulatorio', 'Ingreso ambulatorio', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Emergencia', 'Ingreso por emergencia', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(3, 'Programado', 'Ingreso planificado', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habitaciones`
--

CREATE TABLE `habitaciones` (
  `id` int(11) NOT NULL,
  `tipo` enum('Doble','Colectiva','Individual') DEFAULT 'Colectiva',
  `tipo_de_servicio_id` int(11) NOT NULL,
  `sector_id` int(11) NOT NULL,
  `numero` varchar(10) NOT NULL,
  `sexo_permitido` enum('Masculino','Femenino','Mixto') DEFAULT 'Mixto',
  `tipo_internacion_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `habitaciones`
--

INSERT INTO `habitaciones` (`id`, `tipo`, `tipo_de_servicio_id`, `sector_id`, `numero`, `sexo_permitido`, `tipo_internacion_id`, `created_at`, `updated_at`) VALUES
(1, 'Colectiva', 1, 1, '', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 'Colectiva', 3, 2, 'U1', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 'Individual', 4, 3, 'A1', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 'Doble', 5, 4, '401', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(5, 'Doble', 5, 4, '402', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(6, 'Doble', 5, 4, '403', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(7, 'Doble', 5, 4, '404', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(8, 'Doble', 5, 4, '405', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(9, 'Doble', 5, 4, '406', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(10, 'Individual', 6, 4, '407', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(11, 'Individual', 6, 4, '408', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(12, 'Individual', 6, 4, '409', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(13, 'Individual', 6, 4, '410', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(14, 'Doble', 7, 5, '501', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(15, 'Doble', 7, 5, '502', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(16, 'Doble', 7, 5, '503', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(17, 'Doble', 7, 5, '504', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(18, 'Doble', 7, 5, '505', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(19, 'Doble', 7, 5, '506', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(20, 'Individual', 8, 5, '507', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(21, 'Individual', 8, 5, '508', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(22, 'Individual', 8, 5, '509', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(23, 'Individual', 8, 5, '510', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(24, 'Doble', 1, 6, '601', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(25, 'Doble', 1, 6, '602', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(26, 'Doble', 1, 6, '603', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(27, 'Doble', 1, 6, '604', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(28, 'Doble', 1, 6, '605', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(29, 'Doble', 1, 6, '606', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(30, 'Individual', 2, 6, '607', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(31, 'Individual', 2, 6, '608', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(32, 'Individual', 2, 6, '609', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(33, 'Individual', 2, 6, '610', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(34, 'Individual', 3, 7, '701', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(35, 'Individual', 3, 7, '702', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(36, 'Individual', 3, 7, '703', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(37, 'Individual', 3, 7, '704', 'Mixto', 2, '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historialesmedicos`
--

CREATE TABLE `historialesmedicos` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `motivo_consulta_id` int(11) DEFAULT NULL,
  `descripcion` text NOT NULL,
  `tipo_evento` enum('Consulta','Internacion','Cirugia','Estudio','Otro') NOT NULL,
  `fecha` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historialesmedicos`
--

INSERT INTO `historialesmedicos` (`id`, `paciente_id`, `motivo_consulta_id`, `descripcion`, `tipo_evento`, `fecha`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 'Consulta por dolor torácico', 'Consulta', '2025-05-20 00:00:00', '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `internaciones`
--

CREATE TABLE `internaciones` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `cama_id` int(11) DEFAULT NULL,
  `tipo_internacion_id` int(11) DEFAULT NULL,
  `administrativo_id` int(11) NOT NULL,
  `evaluacion_medica_id` int(11) DEFAULT NULL,
  `intervencion_quirurgica_id` int(11) DEFAULT NULL,
  `es_prequirurgica` tinyint(1) DEFAULT 0,
  `estado_operacion` enum('Prequirurgico','Postquirurgico','No aplica') DEFAULT 'No aplica',
  `estado_estudios` enum('Completos','Pendientes') DEFAULT 'Pendientes',
  `estado_paciente` enum('Estable','Grave','Crítico','Sin Evaluar') NOT NULL DEFAULT 'Sin Evaluar',
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_cirugia` datetime DEFAULT NULL,
  `fecha_alta` datetime DEFAULT NULL,
  `lista_espera_id` int(11) DEFAULT NULL,
  `admision_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `internaciones`
--

INSERT INTO `internaciones` (`id`, `paciente_id`, `medico_id`, `cama_id`, `tipo_internacion_id`, `administrativo_id`, `evaluacion_medica_id`, `intervencion_quirurgica_id`, `es_prequirurgica`, `estado_operacion`, `estado_estudios`, `estado_paciente`, `fecha_inicio`, `fecha_cirugia`, `fecha_alta`, `lista_espera_id`, `admision_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, 1, 1, 1, NULL, 0, 'No aplica', 'Pendientes', 'Sin Evaluar', '2025-05-20 00:00:00', NULL, NULL, 1, 1, '2025-06-09 09:08:55', '2025-06-09 09:08:55'),
(2, 2, 2, 61, 1, 1, 7, NULL, 0, 'No aplica', 'Pendientes', 'Estable', '2025-06-09 12:10:01', NULL, NULL, 5, NULL, '2025-06-09 12:10:01', '2025-06-09 12:10:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `intervencionesquirurgicas`
--

CREATE TABLE `intervencionesquirurgicas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `habitacion_id` int(11) NOT NULL,
  `internacion_id` int(11) NOT NULL,
  `procedimiento_pre_quirurgico_id` int(11) DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `resultado` enum('Exito','Complicaciones','Cancelada') DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `intervencionesquirurgicas`
--

INSERT INTO `intervencionesquirurgicas` (`id`, `paciente_id`, `medico_id`, `habitacion_id`, `internacion_id`, `procedimiento_pre_quirurgico_id`, `fecha`, `resultado`, `created_at`, `updated_at`) VALUES
(1, 4, 2, 2, 1, 1, '2025-05-21 00:00:00', 'Exito', '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `listasesperas`
--

CREATE TABLE `listasesperas` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `especialidad_id` int(11) DEFAULT NULL,
  `prioridad` int(11) NOT NULL DEFAULT 1,
  `tipo` enum('ESTUDIO','EVALUACION','INTERNACION','CIRUGIA') NOT NULL,
  `tipo_estudio_id` int(11) DEFAULT NULL,
  `estado` enum('PENDIENTE','ASIGNADO','CANCELADO','COMPLETADO') NOT NULL DEFAULT 'PENDIENTE',
  `fecha_registro` datetime NOT NULL,
  `habitacion_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `listasesperas`
--

INSERT INTO `listasesperas` (`id`, `paciente_id`, `especialidad_id`, `prioridad`, `tipo`, `tipo_estudio_id`, `estado`, `fecha_registro`, `habitacion_id`, `created_at`, `updated_at`) VALUES
(1, 101, 1, 2, 'EVALUACION', NULL, 'PENDIENTE', '2023-05-10 12:15:00', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 102, NULL, 1, 'ESTUDIO', 2, 'ASIGNADO', '2023-05-11 13:30:00', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 103, 3, 3, 'INTERNACION', NULL, 'COMPLETADO', '2023-05-12 17:45:00', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 104, 2, 1, 'CIRUGIA', NULL, 'PENDIENTE', '2023-05-13 19:20:00', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(5, 2, NULL, 0, 'INTERNACION', NULL, 'COMPLETADO', '2025-06-09 12:10:01', 4, '2025-06-09 12:10:01', '2025-06-09 12:10:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medicos`
--

CREATE TABLE `medicos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `especialidad_id` int(11) NOT NULL,
  `sector_id` int(11) NOT NULL,
  `matricula` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `medicos`
--

INSERT INTO `medicos` (`id`, `usuario_id`, `especialidad_id`, `sector_id`, `matricula`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, 'MED123', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 5, 3, 1, 'MED456', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 6, 4, 6, 'MED789', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 7, 5, 5, 'MED012', '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `motivosadmision`
--

CREATE TABLE `motivosadmision` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `motivosadmision`
--

INSERT INTO `motivosadmision` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Consulta médica', 'Admisión para evaluación médica', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Urgencia', 'Admisión por urgencia', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(3, 'Cirugía', 'Admisión para procedimiento quirúrgico', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(4, 'Programado', 'Cita medica', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `motivosconsultas`
--

CREATE TABLE `motivosconsultas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `motivosconsultas`
--

INSERT INTO `motivosconsultas` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Dolor torácico', 'Consulta por dolor en el pecho', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Fractura', 'Consulta por lesión ósea', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `noticias`
--

CREATE TABLE `noticias` (
  `id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `contenido` text NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `noticias`
--

INSERT INTO `noticias` (`id`, `titulo`, `contenido`, `usuario_id`, `created_at`, `updated_at`) VALUES
(1, 'Nuevo horario de atención', 'El hospital amplía su horario.', 1, '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `mensaje` text NOT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id`, `usuario_id`, `mensaje`, `leida`, `created_at`, `updated_at`) VALUES
(1, 4, 'Nueva factura generada.', 0, '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `obrassociales`
--

CREATE TABLE `obrassociales` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `obrassociales`
--

INSERT INTO `obrassociales` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'OSDE', 'Obra social privada', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Swiss Medical', 'Obra social privada', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pacientes`
--

CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `dni` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellido` varchar(255) NOT NULL,
  `sexo` enum('Masculino','Femenino','Otro') DEFAULT NULL,
  `fecha_nacimiento` datetime NOT NULL,
  `obra_social_id` int(11) DEFAULT NULL,
  `administrativo_id` int(11) DEFAULT NULL,
  `fecha_ingreso` datetime NOT NULL,
  `fecha_egreso` datetime DEFAULT NULL,
  `estado` enum('Activo','Inactivo','Baja') DEFAULT 'Activo',
  `observaciones` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pacientes`
--

INSERT INTO `pacientes` (`id`, `usuario_id`, `dni`, `nombre`, `apellido`, `sexo`, `fecha_nacimiento`, `obra_social_id`, `administrativo_id`, `fecha_ingreso`, `fecha_egreso`, `estado`, `observaciones`, `created_at`, `updated_at`) VALUES
(1, 1, '', '', '', NULL, '1985-05-15 00:00:00', 1, 1, '2023-01-10 00:00:00', '2023-01-10 00:00:00', 'Activo', 'Alergia a la penicilina', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 4, '', '', '', NULL, '1990-07-02 00:00:00', 2, 1, '2023-02-20 00:00:00', '2023-01-10 00:00:00', 'Activo', 'Control anual', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 8, '', '', '', NULL, '0000-00-00 00:00:00', NULL, 1, '2025-06-14 19:49:46', NULL, 'Activo', 'Paciente temporal generado automáticamente', '2025-06-14 19:49:46', '2025-06-14 19:49:46');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id` int(11) NOT NULL,
  `factura_id` int(11) NOT NULL,
  `obra_social_id` int(11) DEFAULT NULL,
  `paciente_id` int(11) DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha` datetime NOT NULL,
  `metodo` enum('Efectivo','Tarjeta','Transferencia','Obra Social') NOT NULL,
  `estado` enum('Pendiente','Completado','Rechazado') DEFAULT 'Pendiente',
  `motivo_rechazo` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id`, `factura_id`, `obra_social_id`, `paciente_id`, `monto`, `fecha`, `metodo`, `estado`, `motivo_rechazo`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 4, 1500.50, '2025-05-21 00:00:00', 'Obra Social', 'Completado', NULL, '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `procedimientosenfermeria`
--

CREATE TABLE `procedimientosenfermeria` (
  `id` int(11) NOT NULL,
  `evaluacion_id` int(11) NOT NULL,
  `tratamiento_id` int(11) DEFAULT NULL,
  `descripcion` text NOT NULL,
  `duracion_estimada` int(11) DEFAULT NULL,
  `requiere_preparacion` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `procedimientosenfermeria`
--

INSERT INTO `procedimientosenfermeria` (`id`, `evaluacion_id`, `tratamiento_id`, `descripcion`, `duracion_estimada`, `requiere_preparacion`, `created_at`, `updated_at`) VALUES
(1, 1, 301, 'Aplicación de vacuna antigripal', 15, 0, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 2, 302, 'Curación de herida postquirúrgica', 30, 1, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 4, NULL, 'Administración de oxígeno complementario', 45, 0, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 3, 303, 'Preparación preoperatoria', 60, 1, '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `procedimientosprequirurgicos`
--

CREATE TABLE `procedimientosprequirurgicos` (
  `id` int(11) NOT NULL,
  `evaluacion_medica_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('Pendiente','Completado') DEFAULT 'Pendiente',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `procedimientosprequirurgicos`
--

INSERT INTO `procedimientosprequirurgicos` (`id`, `evaluacion_medica_id`, `nombre`, `descripcion`, `estado`, `created_at`, `updated_at`) VALUES
(1, 1, 'Preparación intestinal', 'Dieta líquida y laxantes previo a colonoscopía', 'Completado', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 3, 'Ayuno prequirúrgico', '8 horas de ayuno antes de cirugía programada', 'Pendiente', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 2, 'Pruebas de coagulación', 'Estudios de coagulación previo a cirugía mayor', 'Completado', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 4, 'Evaluación cardiológica', 'Evaluación preoperatoria por cardiología', 'Pendiente', '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recetascertificados`
--

CREATE TABLE `recetascertificados` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `tipo` enum('Receta','Certificado') NOT NULL,
  `descripcion` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recetascertificados`
--

INSERT INTO `recetascertificados` (`id`, `paciente_id`, `medico_id`, `tipo`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 4, 2, 'Receta', 'Medicación para dolor', '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reclamos`
--

CREATE TABLE `reclamos` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `descripcion` text NOT NULL,
  `estado` enum('Pendiente','Resuelto','Rechazado') DEFAULT 'Pendiente',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reclamos`
--

INSERT INTO `reclamos` (`id`, `paciente_id`, `descripcion`, `estado`, `created_at`, `updated_at`) VALUES
(1, 4, 'Demora en atención', 'Pendiente', '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Administrativo', 'sin comentario', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Medico', 'sin comentario', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(3, 'Enfermero', 'sin comentario', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(4, 'Paciente', 'sin comentario', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sectores`
--

CREATE TABLE `sectores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sectores`
--

INSERT INTO `sectores` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Administracion', 'sector administrativo', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Clínica Médica', 'Internación médica general', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(3, 'UTI', 'Unidad de Terapia Intensiva', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(4, 'Ambulatorio', 'Área de atención ambulatoria', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(5, 'Materno', 'Área de maternidad', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(6, 'Pediatría', 'Área de pediatría', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(7, 'Cardiología', 'Área de cardiología', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(8, 'Neurología', 'Área de neurología', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudesderivaciones`
--

CREATE TABLE `solicitudesderivaciones` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `origen_id` int(11) NOT NULL,
  `destino_id` int(11) NOT NULL,
  `tipo` enum('Interna','Externa') NOT NULL,
  `estado` enum('Pendiente','Aprobada','Rechazada') NOT NULL,
  `fecha` datetime NOT NULL,
  `motivo` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitudesderivaciones`
--

INSERT INTO `solicitudesderivaciones` (`id`, `paciente_id`, `origen_id`, `destino_id`, `tipo`, `estado`, `fecha`, `motivo`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 2, 'Interna', 'Pendiente', '2025-05-20 00:00:00', 'Evaluación traumatológica', '2025-06-09 03:04:14', '2025-06-09 03:04:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tiposdeservicio`
--

CREATE TABLE `tiposdeservicio` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tiposdeservicio`
--

INSERT INTO `tiposdeservicio` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'General', 'Servicio general', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Quirurgico', 'Servicio quirúrgico', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(3, 'Clínica Médica', 'Internación médica general', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(4, 'UTI', 'Unidad de Terapia Intensiva', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(5, 'Ambulatorio', 'Área de atención ambulatoria', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(6, 'Materno', 'Área de maternidad', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(7, 'Pediatría', 'Área de pediatría', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(8, 'Cardiología', 'Área de cardiología', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(9, 'Neurología', 'Área de neurología', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tiposdiagnostico`
--

CREATE TABLE `tiposdiagnostico` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `sistema_clasificacion` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tiposdiagnostico`
--

INSERT INTO `tiposdiagnostico` (`id`, `nombre`, `descripcion`, `sistema_clasificacion`, `created_at`, `updated_at`) VALUES
(1, 'Primario', 'Diagnóstico principal', '', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Secundario', 'Diagnóstico secundario', '', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tiposestudio`
--

CREATE TABLE `tiposestudio` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `categoria` enum('Imagenología','Laboratorio','Fisiológico') NOT NULL,
  `requiere_ayuno` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tiposestudio`
--

INSERT INTO `tiposestudio` (`id`, `nombre`, `descripcion`, `categoria`, `requiere_ayuno`, `created_at`, `updated_at`) VALUES
(1, 'Radiografía', 'Estudio de imágenes', 'Imagenología', 0, '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Laboratorio', 'Análisis clínicos', 'Imagenología', 0, '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tiposinternacion`
--

CREATE TABLE `tiposinternacion` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `tipo_habitacion` varchar(50) DEFAULT NULL,
  `cantidad_camas` int(11) DEFAULT NULL,
  `cantidad_enfermeros` int(11) DEFAULT NULL,
  `estado_paciente_default` enum('Estable','Grave','Crítico','Sin Evaluar') NOT NULL DEFAULT 'Sin Evaluar',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tiposinternacion`
--

INSERT INTO `tiposinternacion` (`id`, `nombre`, `descripcion`, `tipo_habitacion`, `cantidad_camas`, `cantidad_enfermeros`, `estado_paciente_default`, `created_at`, `updated_at`) VALUES
(1, 'General', 'Internación general', NULL, NULL, NULL, 'Sin Evaluar', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_turno`
--

CREATE TABLE `tipos_turno` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_turno`
--

INSERT INTO `tipos_turno` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Consulta', 'Turno para consulta médica', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Estudio', 'Turno para estudio', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(3, 'Guardia', 'Turno para guardia', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(4, 'Programado', 'tiene una cita', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tratamientos`
--

CREATE TABLE `tratamientos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tratamientos`
--

INSERT INTO `tratamientos` (`id`, `nombre`, `descripcion`, `created_at`, `updated_at`) VALUES
(1, 'Antibióticos', ' antibióticos', '2025-06-09 03:04:12', '2025-06-09 03:04:12'),
(2, 'Fisioterapia', 'Rehabilitación física', '2025-06-09 03:04:12', '2025-06-09 03:04:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnos`
--

CREATE TABLE `turnos` (
  `id` int(11) NOT NULL,
  `tipo_turno_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time DEFAULT NULL,
  `estado` enum('PENDIENTE','CONFIRMADO','COMPLETADO','CANCELADO') DEFAULT 'PENDIENTE',
  `paciente_id` int(11) DEFAULT NULL,
  `medico_id` int(11) DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `sector_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lista_espera_id` int(11) DEFAULT NULL,
  `evaluacion_medica_id` int(11) DEFAULT NULL,
  `tipo_estudio_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `turnos`
--

INSERT INTO `turnos` (`id`, `tipo_turno_id`, `fecha`, `hora_inicio`, `hora_fin`, `estado`, `paciente_id`, `medico_id`, `usuario_id`, `sector_id`, `created_at`, `updated_at`, `lista_espera_id`, `evaluacion_medica_id`, `tipo_estudio_id`) VALUES
(1, 1, '2025-05-30', '00:00:00', NULL, 'PENDIENTE', 4, 2, NULL, NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13', NULL, NULL, NULL),
(2, 4, '2025-06-04', '12:00:00', '12:20:00', 'PENDIENTE', 2, 2, NULL, 4, '2025-06-09 12:10:01', '2025-06-09 12:10:01', NULL, NULL, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnosestudios`
--

CREATE TABLE `turnosestudios` (
  `id` int(11) NOT NULL,
  `estudio_solicitado_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `estado` enum('Pendiente','Realizado','Cancelado') DEFAULT 'Pendiente',
  `resultado` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `turnosestudios`
--

INSERT INTO `turnosestudios` (`id`, `estudio_solicitado_id`, `fecha`, `hora`, `estado`, `resultado`, `created_at`, `updated_at`) VALUES
(1, 501, '2023-05-20', '08:30:00', 'Pendiente', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, 502, '2023-05-18', '10:15:00', 'Realizado', 'Hemograma completo dentro de parámetros normales', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, 503, '2023-05-22', '14:00:00', 'Pendiente', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, 504, '2023-05-19', '16:45:00', 'Cancelado', NULL, '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `turnospersonal`
--

CREATE TABLE `turnospersonal` (
  `id` int(11) NOT NULL,
  `sector_id` int(11) NOT NULL,
  `hora_inicio` datetime NOT NULL,
  `hora_fin` datetime NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('Guardia Activa','Guardia Pasiva','Atencion') NOT NULL,
  `dias` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `turnospersonal`
--

INSERT INTO `turnospersonal` (`id`, `sector_id`, `hora_inicio`, `hora_fin`, `usuario_id`, `tipo`, `dias`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-05-30 08:00:00', '2025-05-30 16:00:00', 0, 'Guardia Activa', '', '2025-06-09 03:04:13', '2025-06-09 03:04:13');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `dni` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellido` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` datetime NOT NULL,
  `sexo` enum('Masculino','Femenino','Otro') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `dni`, `nombre`, `apellido`, `email`, `password`, `rol_id`, `telefono`, `fecha_nacimiento`, `sexo`, `created_at`, `updated_at`) VALUES
(1, '00000001', 'Admin 1', 'Torres', 'admin1@hospital.com', '123456789', 1, NULL, '1990-01-15 00:00:00', 'Masculino', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(2, '00000002', 'Dr. García', 'Torres', 'garcia@hospital.com', '123456789', 2, NULL, '1990-01-15 00:00:00', 'Masculino', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(3, '00000003', 'Enf. López', 'Torres', 'lopez@hospital.com', '123456789', 3, NULL, '1990-01-15 00:00:00', 'Masculino', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(4, '00000004', 'Juan Pérez', 'Torres', 'perez@hospital.com', '123456789', 4, NULL, '1990-01-15 00:00:00', 'Masculino', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(5, '00000005', 'Dra. Martínez', 'Gómez', 'martinez@hospital.com', '123456789', 2, NULL, '1985-03-22 00:00:00', 'Femenino', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(6, '00000006', 'Dr. Fernández', 'Ruiz', 'fernandez@hospital.com', '123456789', 2, NULL, '1978-07-10 00:00:00', 'Masculino', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(7, '00000007', 'Dra. Sánchez', 'López', 'sanchez@hospital.com', '123456789', 2, NULL, '1992-11-30 00:00:00', 'Femenino', '2025-06-09 03:04:13', '2025-06-09 03:04:13'),
(8, 'TEMP1749930586112', 'Temporal', 'Paciente', 'temp+1749930586112@generico.com', 'temp1749930586112', 1, NULL, '1990-01-01 00:00:00', 'Otro', '2025-06-14 19:49:46', '2025-06-14 19:49:46');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `administrativos`
--
ALTER TABLE `administrativos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD KEY `sector_id` (`sector_id`),
  ADD KEY `turno_id` (`turno_id`);

--
-- Indices de la tabla `admisiones`
--
ALTER TABLE `admisiones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `administrativo_id` (`administrativo_id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `sector_id` (`sector_id`),
  ADD KEY `motivo_id` (`motivo_id`),
  ADD KEY `forma_ingreso_id` (`forma_ingreso_id`),
  ADD KEY `turno_id` (`turno_id`),
  ADD KEY `especialidad_id` (`especialidad_id`),
  ADD KEY `tipo_estudio_id` (`tipo_estudio_id`);

--
-- Indices de la tabla `altasmedicas`
--
ALTER TABLE `altasmedicas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `internacion_id` (`internacion_id`);

--
-- Indices de la tabla `camas`
--
ALTER TABLE `camas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `habitacion_id` (`habitacion_id`);

--
-- Indices de la tabla `controlesenfermeria`
--
ALTER TABLE `controlesenfermeria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluacion_enfermeria_id` (`evaluacion_enfermeria_id`);

--
-- Indices de la tabla `diagnosticos`
--
ALTER TABLE `diagnosticos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `tipoDiagnostico_id` (`tipoDiagnostico_id`);

--
-- Indices de la tabla `enfermeros`
--
ALTER TABLE `enfermeros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD KEY `sector_id` (`sector_id`);

--
-- Indices de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `estudiossolicitados`
--
ALTER TABLE `estudiossolicitados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `evaluacion_medica_id` (`evaluacion_medica_id`),
  ADD KEY `tipo_estudio_id` (`tipo_estudio_id`);

--
-- Indices de la tabla `evaluacionesenfermeria`
--
ALTER TABLE `evaluacionesenfermeria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `enfermero_id` (`enfermero_id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `procedimiento_pre_quirurgico_id` (`procedimiento_pre_quirurgico_id`),
  ADD KEY `procedimiento_enfermeria_id` (`procedimiento_enfermeria_id`);

--
-- Indices de la tabla `evaluacionesmedicas`
--
ALTER TABLE `evaluacionesmedicas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `tratamiento_id` (`tratamiento_id`),
  ADD KEY `diagnostico_id` (`diagnostico_id`),
  ADD KEY `estudio_solicitado_id` (`estudio_solicitado_id`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `admision_id` (`admision_id`);

--
-- Indices de la tabla `formasingreso`
--
ALTER TABLE `formasingreso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `habitaciones`
--
ALTER TABLE `habitaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tipo_de_servicio_id` (`tipo_de_servicio_id`),
  ADD KEY `sector_id` (`sector_id`);

--
-- Indices de la tabla `historialesmedicos`
--
ALTER TABLE `historialesmedicos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `motivo_consulta_id` (`motivo_consulta_id`);

--
-- Indices de la tabla `internaciones`
--
ALTER TABLE `internaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cama_id` (`cama_id`),
  ADD KEY `tipo_internacion_id` (`tipo_internacion_id`),
  ADD KEY `evaluacion_medica_id` (`evaluacion_medica_id`),
  ADD KEY `lista_espera_id` (`lista_espera_id`),
  ADD KEY `admision_id` (`admision_id`),
  ADD KEY `fk_internaciones_intervencion_quirurgica` (`intervencion_quirurgica_id`);

--
-- Indices de la tabla `intervencionesquirurgicas`
--
ALTER TABLE `intervencionesquirurgicas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `habitacion_id` (`habitacion_id`),
  ADD KEY `internacion_id` (`internacion_id`),
  ADD KEY `procedimiento_pre_quirurgico_id` (`procedimiento_pre_quirurgico_id`);

--
-- Indices de la tabla `listasesperas`
--
ALTER TABLE `listasesperas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `especialidad_id` (`especialidad_id`),
  ADD KEY `tipo_estudio_id` (`tipo_estudio_id`),
  ADD KEY `habitacion_id` (`habitacion_id`);

--
-- Indices de la tabla `medicos`
--
ALTER TABLE `medicos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matricula` (`matricula`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD KEY `especialidad_id` (`especialidad_id`),
  ADD KEY `sector_id` (`sector_id`);

--
-- Indices de la tabla `motivosadmision`
--
ALTER TABLE `motivosadmision`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `motivosconsultas`
--
ALTER TABLE `motivosconsultas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `noticias`
--
ALTER TABLE `noticias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `obrassociales`
--
ALTER TABLE `obrassociales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD KEY `obra_social_id` (`obra_social_id`),
  ADD KEY `administrativo_id` (`administrativo_id`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `factura_id` (`factura_id`),
  ADD KEY `obra_social_id` (`obra_social_id`),
  ADD KEY `paciente_id` (`paciente_id`);

--
-- Indices de la tabla `procedimientosenfermeria`
--
ALTER TABLE `procedimientosenfermeria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluacion_id` (`evaluacion_id`),
  ADD KEY `tratamiento_id` (`tratamiento_id`);

--
-- Indices de la tabla `procedimientosprequirurgicos`
--
ALTER TABLE `procedimientosprequirurgicos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `evaluacion_medica_id` (`evaluacion_medica_id`);

--
-- Indices de la tabla `recetascertificados`
--
ALTER TABLE `recetascertificados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`);

--
-- Indices de la tabla `reclamos`
--
ALTER TABLE `reclamos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `sectores`
--
ALTER TABLE `sectores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `solicitudesderivaciones`
--
ALTER TABLE `solicitudesderivaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `origen_id` (`origen_id`),
  ADD KEY `destino_id` (`destino_id`);

--
-- Indices de la tabla `tiposdeservicio`
--
ALTER TABLE `tiposdeservicio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tiposdiagnostico`
--
ALTER TABLE `tiposdiagnostico`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tiposestudio`
--
ALTER TABLE `tiposestudio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tiposinternacion`
--
ALTER TABLE `tiposinternacion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tipos_turno`
--
ALTER TABLE `tipos_turno`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tratamientos`
--
ALTER TABLE `tratamientos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tipo_turno_id` (`tipo_turno_id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `medico_id` (`medico_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `sector_id` (`sector_id`),
  ADD KEY `lista_espera_id` (`lista_espera_id`),
  ADD KEY `evaluacion_medica_id` (`evaluacion_medica_id`),
  ADD KEY `tipo_estudio_id` (`tipo_estudio_id`);

--
-- Indices de la tabla `turnosestudios`
--
ALTER TABLE `turnosestudios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estudio_solicitado_id` (`estudio_solicitado_id`);

--
-- Indices de la tabla `turnospersonal`
--
ALTER TABLE `turnospersonal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sector_id` (`sector_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dni` (`dni`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `rol_id` (`rol_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `administrativos`
--
ALTER TABLE `administrativos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `admisiones`
--
ALTER TABLE `admisiones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `altasmedicas`
--
ALTER TABLE `altasmedicas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `camas`
--
ALTER TABLE `camas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT de la tabla `controlesenfermeria`
--
ALTER TABLE `controlesenfermeria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `diagnosticos`
--
ALTER TABLE `diagnosticos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=405;

--
-- AUTO_INCREMENT de la tabla `enfermeros`
--
ALTER TABLE `enfermeros`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `especialidades`
--
ALTER TABLE `especialidades`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `estudiossolicitados`
--
ALTER TABLE `estudiossolicitados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=505;

--
-- AUTO_INCREMENT de la tabla `evaluacionesenfermeria`
--
ALTER TABLE `evaluacionesenfermeria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `evaluacionesmedicas`
--
ALTER TABLE `evaluacionesmedicas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `formasingreso`
--
ALTER TABLE `formasingreso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `habitaciones`
--
ALTER TABLE `habitaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `historialesmedicos`
--
ALTER TABLE `historialesmedicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `internaciones`
--
ALTER TABLE `internaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `intervencionesquirurgicas`
--
ALTER TABLE `intervencionesquirurgicas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `listasesperas`
--
ALTER TABLE `listasesperas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `medicos`
--
ALTER TABLE `medicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `motivosadmision`
--
ALTER TABLE `motivosadmision`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `motivosconsultas`
--
ALTER TABLE `motivosconsultas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `noticias`
--
ALTER TABLE `noticias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `obrassociales`
--
ALTER TABLE `obrassociales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `pacientes`
--
ALTER TABLE `pacientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `procedimientosenfermeria`
--
ALTER TABLE `procedimientosenfermeria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `procedimientosprequirurgicos`
--
ALTER TABLE `procedimientosprequirurgicos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `recetascertificados`
--
ALTER TABLE `recetascertificados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `reclamos`
--
ALTER TABLE `reclamos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `sectores`
--
ALTER TABLE `sectores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `solicitudesderivaciones`
--
ALTER TABLE `solicitudesderivaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tiposdeservicio`
--
ALTER TABLE `tiposdeservicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `tiposdiagnostico`
--
ALTER TABLE `tiposdiagnostico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tiposestudio`
--
ALTER TABLE `tiposestudio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tiposinternacion`
--
ALTER TABLE `tiposinternacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tipos_turno`
--
ALTER TABLE `tipos_turno`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `tratamientos`
--
ALTER TABLE `tratamientos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `turnosestudios`
--
ALTER TABLE `turnosestudios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `turnospersonal`
--
ALTER TABLE `turnospersonal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `administrativos`
--
ALTER TABLE `administrativos`
  ADD CONSTRAINT `administrativos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `administrativos_ibfk_2` FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `administrativos_ibfk_3` FOREIGN KEY (`turno_id`) REFERENCES `turnospersonal` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `admisiones`
--
ALTER TABLE `admisiones`
  ADD CONSTRAINT `admisiones_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_2` FOREIGN KEY (`administrativo_id`) REFERENCES `administrativos` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_3` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_4` FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_5` FOREIGN KEY (`motivo_id`) REFERENCES `motivosadmision` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_6` FOREIGN KEY (`forma_ingreso_id`) REFERENCES `formasingreso` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_7` FOREIGN KEY (`turno_id`) REFERENCES `turnos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_8` FOREIGN KEY (`especialidad_id`) REFERENCES `especialidades` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `admisiones_ibfk_9` FOREIGN KEY (`tipo_estudio_id`) REFERENCES `tiposestudio` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `altasmedicas`
--
ALTER TABLE `altasmedicas`
  ADD CONSTRAINT `altasmedicas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`usuario_id`),
  ADD CONSTRAINT `altasmedicas_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`usuario_id`),
  ADD CONSTRAINT `altasmedicas_ibfk_3` FOREIGN KEY (`internacion_id`) REFERENCES `internaciones` (`id`);

--
-- Filtros para la tabla `camas`
--
ALTER TABLE `camas`
  ADD CONSTRAINT `camas_ibfk_1` FOREIGN KEY (`habitacion_id`) REFERENCES `habitaciones` (`id`);

--
-- Filtros para la tabla `controlesenfermeria`
--
ALTER TABLE `controlesenfermeria`
  ADD CONSTRAINT `controlesenfermeria_ibfk_1` FOREIGN KEY (`evaluacion_enfermeria_id`) REFERENCES `evaluacionesenfermeria` (`id`);

--
-- Filtros para la tabla `diagnosticos`
--
ALTER TABLE `diagnosticos`
  ADD CONSTRAINT `diagnosticos_ibfk_1` FOREIGN KEY (`tipoDiagnostico_id`) REFERENCES `tiposdiagnostico` (`id`);

--
-- Filtros para la tabla `enfermeros`
--
ALTER TABLE `enfermeros`
  ADD CONSTRAINT `enfermeros_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `enfermeros_ibfk_2` FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `estudiossolicitados`
--
ALTER TABLE `estudiossolicitados`
  ADD CONSTRAINT `estudiossolicitados_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `estudiossolicitados_ibfk_2` FOREIGN KEY (`evaluacion_medica_id`) REFERENCES `evaluacionesmedicas` (`id`),
  ADD CONSTRAINT `estudiossolicitados_ibfk_3` FOREIGN KEY (`tipo_estudio_id`) REFERENCES `tiposestudio` (`id`);

--
-- Filtros para la tabla `evaluacionesenfermeria`
--
ALTER TABLE `evaluacionesenfermeria`
  ADD CONSTRAINT `evaluacionesenfermeria_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `evaluacionesenfermeria_ibfk_2` FOREIGN KEY (`enfermero_id`) REFERENCES `enfermeros` (`id`),
  ADD CONSTRAINT `evaluacionesenfermeria_ibfk_3` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`),
  ADD CONSTRAINT `evaluacionesenfermeria_ibfk_4` FOREIGN KEY (`procedimiento_pre_quirurgico_id`) REFERENCES `procedimientosprequirurgicos` (`id`),
  ADD CONSTRAINT `evaluacionesenfermeria_ibfk_5` FOREIGN KEY (`procedimiento_enfermeria_id`) REFERENCES `procedimientosenfermeria` (`id`);

--
-- Filtros para la tabla `evaluacionesmedicas`
--
ALTER TABLE `evaluacionesmedicas`
  ADD CONSTRAINT `evaluacionesmedicas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `evaluacionesmedicas_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`),
  ADD CONSTRAINT `evaluacionesmedicas_ibfk_3` FOREIGN KEY (`tratamiento_id`) REFERENCES `tratamientos` (`id`),
  ADD CONSTRAINT `evaluacionesmedicas_ibfk_4` FOREIGN KEY (`diagnostico_id`) REFERENCES `diagnosticos` (`id`),
  ADD CONSTRAINT `evaluacionesmedicas_ibfk_5` FOREIGN KEY (`estudio_solicitado_id`) REFERENCES `estudios_solicitados` (`id`);

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`usuario_id`),
  ADD CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`admision_id`) REFERENCES `admisiones` (`id`);

--
-- Filtros para la tabla `habitaciones`
--
ALTER TABLE `habitaciones`
  ADD CONSTRAINT `habitaciones_ibfk_1` FOREIGN KEY (`tipo_de_servicio_id`) REFERENCES `tiposdeservicio` (`id`),
  ADD CONSTRAINT `habitaciones_ibfk_2` FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`);

--
-- Filtros para la tabla `historialesmedicos`
--
ALTER TABLE `historialesmedicos`
  ADD CONSTRAINT `historialesmedicos_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`usuario_id`),
  ADD CONSTRAINT `historialesmedicos_ibfk_2` FOREIGN KEY (`motivo_consulta_id`) REFERENCES `motivosconsultas` (`id`);

--
-- Filtros para la tabla `internaciones`
--
ALTER TABLE `internaciones`
  ADD CONSTRAINT `fk_internaciones_intervencion_quirurgica` FOREIGN KEY (`intervencion_quirurgica_id`) REFERENCES `intervencionesquirurgicas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `internaciones_ibfk_1` FOREIGN KEY (`cama_id`) REFERENCES `camas` (`id`),
  ADD CONSTRAINT `internaciones_ibfk_2` FOREIGN KEY (`tipo_internacion_id`) REFERENCES `tiposinternacion` (`id`),
  ADD CONSTRAINT `internaciones_ibfk_3` FOREIGN KEY (`evaluacion_medica_id`) REFERENCES `evaluacionesmedicas` (`id`),
  ADD CONSTRAINT `internaciones_ibfk_4` FOREIGN KEY (`lista_espera_id`) REFERENCES `listasesperas` (`id`),
  ADD CONSTRAINT `internaciones_ibfk_5` FOREIGN KEY (`admision_id`) REFERENCES `admisiones` (`id`);

--
-- Filtros para la tabla `intervencionesquirurgicas`
--
ALTER TABLE `intervencionesquirurgicas`
  ADD CONSTRAINT `intervencionesquirurgicas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `intervencionesquirurgicas_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`),
  ADD CONSTRAINT `intervencionesquirurgicas_ibfk_3` FOREIGN KEY (`habitacion_id`) REFERENCES `habitaciones` (`id`),
  ADD CONSTRAINT `intervencionesquirurgicas_ibfk_4` FOREIGN KEY (`internacion_id`) REFERENCES `internaciones` (`id`),
  ADD CONSTRAINT `intervencionesquirurgicas_ibfk_5` FOREIGN KEY (`procedimiento_pre_quirurgico_id`) REFERENCES `procedimientosprequirurgicos` (`id`);

--
-- Filtros para la tabla `listasesperas`
--
ALTER TABLE `listasesperas`
  ADD CONSTRAINT `listasesperas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `listasesperas_ibfk_2` FOREIGN KEY (`especialidad_id`) REFERENCES `especialidades` (`id`),
  ADD CONSTRAINT `listasesperas_ibfk_3` FOREIGN KEY (`tipo_estudio_id`) REFERENCES `tiposestudio` (`id`),
  ADD CONSTRAINT `listasesperas_ibfk_4` FOREIGN KEY (`habitacion_id`) REFERENCES `habitaciones` (`id`);

--
-- Filtros para la tabla `medicos`
--
ALTER TABLE `medicos`
  ADD CONSTRAINT `medicos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `medicos_ibfk_2` FOREIGN KEY (`especialidad_id`) REFERENCES `especialidades` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `medicos_ibfk_3` FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `noticias`
--
ALTER TABLE `noticias`
  ADD CONSTRAINT `noticias_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `pacientes`
--
ALTER TABLE `pacientes`
  ADD CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `pacientes_ibfk_2` FOREIGN KEY (`obra_social_id`) REFERENCES `obrassociales` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `pacientes_ibfk_3` FOREIGN KEY (`administrativo_id`) REFERENCES `administrativos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`),
  ADD CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`obra_social_id`) REFERENCES `obrassociales` (`id`),
  ADD CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`usuario_id`);

--
-- Filtros para la tabla `procedimientosenfermeria`
--
ALTER TABLE `procedimientosenfermeria`
  ADD CONSTRAINT `procedimientosenfermeria_ibfk_1` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluacionesenfermeria` (`id`),
  ADD CONSTRAINT `procedimientosenfermeria_ibfk_2` FOREIGN KEY (`tratamiento_id`) REFERENCES `tratamientos` (`id`);

--
-- Filtros para la tabla `procedimientosprequirurgicos`
--
ALTER TABLE `procedimientosprequirurgicos`
  ADD CONSTRAINT `procedimientosprequirurgicos_ibfk_1` FOREIGN KEY (`evaluacion_medica_id`) REFERENCES `evaluacionesmedicas` (`id`);

--
-- Filtros para la tabla `recetascertificados`
--
ALTER TABLE `recetascertificados`
  ADD CONSTRAINT `recetascertificados_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`usuario_id`),
  ADD CONSTRAINT `recetascertificados_ibfk_2` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`usuario_id`);

--
-- Filtros para la tabla `reclamos`
--
ALTER TABLE `reclamos`
  ADD CONSTRAINT `reclamos_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`usuario_id`);

--
-- Filtros para la tabla `solicitudesderivaciones`
--
ALTER TABLE `solicitudesderivaciones`
  ADD CONSTRAINT `solicitudesderivaciones_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`usuario_id`),
  ADD CONSTRAINT `solicitudesderivaciones_ibfk_2` FOREIGN KEY (`origen_id`) REFERENCES `sectores` (`id`),
  ADD CONSTRAINT `solicitudesderivaciones_ibfk_3` FOREIGN KEY (`destino_id`) REFERENCES `sectores` (`id`);

--
-- Filtros para la tabla `turnos`
--
ALTER TABLE `turnos`
  ADD CONSTRAINT `turnos_ibfk_1` FOREIGN KEY (`tipo_turno_id`) REFERENCES `tipos_turno` (`id`),
  ADD CONSTRAINT `turnos_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  ADD CONSTRAINT `turnos_ibfk_3` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`id`),
  ADD CONSTRAINT `turnos_ibfk_4` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `turnos_ibfk_5` FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`),
  ADD CONSTRAINT `turnos_ibfk_6` FOREIGN KEY (`lista_espera_id`) REFERENCES `listasespera` (`id`),
  ADD CONSTRAINT `turnos_ibfk_7` FOREIGN KEY (`evaluacion_medica_id`) REFERENCES `evaluacionesmedicas` (`id`),
  ADD CONSTRAINT `turnos_ibfk_8` FOREIGN KEY (`tipo_estudio_id`) REFERENCES `tiposestudio` (`id`);

--
-- Filtros para la tabla `turnosestudios`
--
ALTER TABLE `turnosestudios`
  ADD CONSTRAINT `turnosestudios_ibfk_1` FOREIGN KEY (`estudio_solicitado_id`) REFERENCES `estudiossolicitados` (`id`);

--
-- Filtros para la tabla `turnospersonal`
--
ALTER TABLE `turnospersonal`
  ADD CONSTRAINT `turnospersonal_ibfk_1` FOREIGN KEY (`sector_id`) REFERENCES `sectores` (`id`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
