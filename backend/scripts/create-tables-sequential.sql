-- Script para crear tablas en el orden correcto (Railway)
-- Ejecutar este script en la base de datos de Railway

USE `railway`;

-- ========================================
-- PASO 1: Tablas base (sin dependencias)
-- ========================================

-- 1.1 Tabla de usuarios (necesaria para todas las demás)
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('client','admin') DEFAULT 'client',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 Tabla de categorías
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 Tabla de tipos de producto
CREATE TABLE IF NOT EXISTS `product_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `product_types_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 Tabla de productos
CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_type_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `stock_total` int(11) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_approved` tinyint(1) DEFAULT 1,
  `cost_price` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `product_type_id` (`product_type_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`product_type_id`) REFERENCES `product_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PASO 2: Tablas de encuestas (con dependencias)
-- ========================================

-- 2.1 Tabla de encuestas (depende de users)
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `question` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('draft','active','closed') DEFAULT 'draft',
  `created_by` bigint(20) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `closed_by` bigint(20) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `surveys_closed_by_fk` (`closed_by`),
  KEY `idx_surveys_status` (`status`),
  KEY `idx_surveys_created_by` (`created_by`),
  KEY `idx_surveys_status_created` (`status`,`created_at`),
  CONSTRAINT `surveys_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `surveys_closed_by_fk` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 Tabla de opciones de encuesta (depende de surveys y users)
CREATE TABLE IF NOT EXISTS `survey_options` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) NOT NULL,
  `option_text` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `created_by` bigint(20) NOT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `admin_notes` text DEFAULT NULL,
  `approved_by` bigint(20) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `survey_options_approved_by_fk` (`approved_by`),
  KEY `idx_survey_options_survey_id` (`survey_id`),
  KEY `idx_survey_options_approved` (`is_approved`),
  KEY `idx_survey_options_created_by` (`created_by`),
  KEY `idx_survey_options_survey_approved` (`survey_id`,`is_approved`),
  CONSTRAINT `survey_options_survey_fk` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_options_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_options_approved_by_fk` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `survey_options_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 Tabla de votos de encuesta (depende de surveys, survey_options y users)
CREATE TABLE IF NOT EXISTS `survey_votes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) NOT NULL,
  `option_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_option` (`user_id`,`option_id`),
  KEY `idx_survey_votes_survey_id` (`survey_id`),
  KEY `idx_survey_votes_option_id` (`option_id`),
  KEY `idx_survey_votes_user_id` (`user_id`),
  KEY `idx_survey_votes_survey_user` (`survey_id`,`user_id`),
  CONSTRAINT `survey_votes_survey_fk` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_votes_option_fk` FOREIGN KEY (`option_id`) REFERENCES `survey_options` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_votes_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PASO 3: Insertar datos mínimos
-- ========================================

-- 3.1 Usuario admin
INSERT IGNORE INTO `users` (`id`, `username`, `name`, `phone`, `email`, `password`, `role`, `is_active`) VALUES
(1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- 3.2 Categoría
INSERT IGNORE INTO `categories` (`id`, `name`) VALUES
(1, 'Cosméticos');

-- 3.3 Tipo de producto
INSERT IGNORE INTO `product_types` (`id`, `category_id`, `name`) VALUES
(1, 1, 'Maquillaje');

-- 3.4 Producto
INSERT IGNORE INTO `products` (`id`, `product_type_id`, `name`, `description`, `price`, `stock_total`, `status`, `is_approved`) VALUES
(1, 1, 'Labial de Prueba', 'Labial de color rojo para pruebas del sistema', 19.99, 100, 'active', 1);

-- 3.5 Encuesta
INSERT IGNORE INTO `surveys` (`id`, `question`, `description`, `status`, `created_by`) VALUES
(1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1);

-- 3.6 Opción de encuesta
INSERT IGNORE INTO `survey_options` (`id`, `survey_id`, `option_text`, `description`, `created_by`, `is_approved`) VALUES
(1, 1, 'Sí, me gusta mucho', 'Opción de prueba para verificar funcionamiento', 1, 1);

-- ========================================
-- PASO 4: Verificar creación exitosa
-- ========================================

-- Verificar que todas las tablas se crearon
SELECT 'Tablas creadas:' as mensaje;
SHOW TABLES;

-- Verificar datos mínimos
SELECT 'Datos mínimos:' as mensaje;
SELECT 'Usuarios' as tipo, COUNT(*) as cantidad FROM users
UNION ALL
SELECT 'Categorías', COUNT(*) FROM categories
UNION ALL
SELECT 'Tipos de producto', COUNT(*) FROM product_types
UNION ALL
SELECT 'Productos', COUNT(*) FROM products
UNION ALL
SELECT 'Encuestas', COUNT(*) FROM surveys
UNION ALL
SELECT 'Opciones de encuesta', COUNT(*) FROM survey_options;

-- Verificar estructura de tabla surveys
SELECT 'Estructura de surveys:' as mensaje;
DESCRIBE surveys;
