/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP TABLE IF EXISTS `reservas`;
DROP TABLE IF EXISTS `penalizaciones`;
DROP TABLE IF EXISTS `sesiones_fechas`;
DROP TABLE IF EXISTS `sesiones`;
DROP TABLE IF EXISTS `clientes`;
DROP TABLE IF EXISTS `tipos_clase`;

CREATE TABLE `tipos_clase` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tipos_clase` VALUES
(1,'Pilates con hipopresivos'),
(2,'Yoga'),
(3,'Barre');

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `apellidos` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sesiones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_clase_id` int(11) NOT NULL,
  `dia_semana` tinyint(4) NOT NULL,
  `hora` time NOT NULL,
  `modalidad` enum('maquina','suelo','ninguna') NOT NULL DEFAULT 'ninguna',
  `capacidad_min` int(11) NOT NULL,
  `capacidad_max` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tipo_clase_id` (`tipo_clase_id`),
  CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`tipo_clase_id`) REFERENCES `tipos_clase` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `sesiones` VALUES
(57,1,1,'09:30:00','maquina',3,5),
(58,1,1,'10:30:00','maquina',3,5),
(59,1,1,'16:00:00','maquina',3,5),
(60,1,1,'17:00:00','maquina',3,5),
(61,1,1,'18:00:00','maquina',3,5),
(62,1,1,'19:00:00','maquina',3,5),
(63,1,1,'20:00:00','maquina',3,5),
(64,1,1,'09:30:00','suelo',3,6),
(65,1,1,'10:30:00','suelo',3,6),
(66,1,1,'17:00:00','suelo',3,6),
(67,1,1,'18:00:00','suelo',3,6),
(68,1,1,'19:00:00','suelo',3,6),
(69,1,1,'20:00:00','suelo',3,6),
(70,1,3,'09:30:00','maquina',3,5),
(71,1,3,'10:30:00','maquina',3,5),
(72,1,3,'16:00:00','maquina',3,5),
(73,1,3,'17:00:00','maquina',3,5),
(74,1,3,'18:00:00','maquina',3,5),
(75,1,3,'19:00:00','maquina',3,5),
(76,1,3,'20:00:00','maquina',3,5),
(77,1,3,'09:30:00','suelo',3,6),
(78,1,3,'10:30:00','suelo',3,6),
(79,1,3,'17:00:00','suelo',3,6),
(80,1,3,'18:00:00','suelo',3,6),
(81,1,3,'19:00:00','suelo',3,6),
(82,1,3,'20:00:00','suelo',3,6),
(83,1,2,'09:30:00','maquina',3,5),
(84,1,2,'10:30:00','maquina',3,5),
(85,1,2,'15:15:00','maquina',3,5),
(86,1,2,'17:00:00','maquina',3,5),
(87,1,2,'18:00:00','maquina',3,5),
(88,1,2,'19:00:00','maquina',3,5),
(89,1,2,'20:00:00','maquina',3,5),
(90,1,2,'09:30:00','suelo',3,6),
(91,1,2,'10:30:00','suelo',3,6),
(92,1,2,'14:30:00','suelo',3,6),
(93,1,2,'15:30:00','suelo',3,6),
(94,1,2,'17:00:00','suelo',3,6),
(95,1,2,'18:00:00','suelo',3,6),
(96,1,2,'19:00:00','suelo',3,6),
(97,1,2,'20:00:00','suelo',3,6),
(98,1,4,'09:30:00','maquina',3,5),
(99,1,4,'10:30:00','maquina',3,5),
(100,1,4,'15:15:00','maquina',3,5),
(101,1,4,'17:00:00','maquina',3,5),
(102,1,4,'18:00:00','maquina',3,5),
(103,1,4,'19:00:00','maquina',3,5),
(104,1,4,'20:00:00','maquina',3,5),
(105,1,4,'09:30:00','suelo',3,6),
(106,1,4,'10:30:00','suelo',3,6),
(107,1,4,'14:30:00','suelo',3,6),
(108,1,4,'15:30:00','suelo',3,6),
(109,1,4,'17:00:00','suelo',3,6),
(110,1,4,'18:00:00','suelo',3,6),
(111,1,4,'19:00:00','suelo',3,6),
(112,1,4,'20:00:00','suelo',3,6),
(113,1,5,'18:00:00','maquina',3,5),
(114,1,5,'19:00:00','maquina',3,5),
(115,2,6,'10:30:00','ninguna',1,9),
(116,2,6,'11:30:00','ninguna',1,9),
(117,3,5,'19:00:00','ninguna',3,9),
(118,3,5,'20:00:00','ninguna',3,9),
(119,3,6,'12:00:00','ninguna',3,9);

CREATE TABLE `sesiones_fechas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sesion_recurrente_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `capacidad_min` int(11) NOT NULL,
  `capacidad_max` int(11) NOT NULL,
  `estado` enum('activa','cancelada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (`id`),
  KEY `sesion_recurrente_id` (`sesion_recurrente_id`),
  CONSTRAINT `sesiones_fechas_ibfk_1` FOREIGN KEY (`sesion_recurrente_id`) REFERENCES `sesiones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `penalizaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `motivo` varchar(100) DEFAULT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `penalizaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reservas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `sesion_id` int(11) NOT NULL,
  `fecha_reserva` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('confirmada','cancelada') NOT NULL DEFAULT 'confirmada',
  `fecha_clase` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `sesion_fecha_id` (`sesion_id`),
  CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;