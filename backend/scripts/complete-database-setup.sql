-- Script completo para configurar la base de datos cosmetics_db en Railway
-- Incluye toda la estructura y solo los datos esenciales

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `cosmetics_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cosmetics_db`;

-- =====================================================
-- TABLA: users (con usuario admin mínimo)
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL COMMENT 'Nombre de usuario único',
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

-- Insertar usuario admin mínimo (ID 1)
INSERT INTO `users` (`id`, `username`, `name`, `phone`, `email`, `password`, `role`, `is_active`) VALUES
(1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- =====================================================
-- TABLA: categories (categorías básicas)
-- =====================================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar categorías básicas
INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Maquillaje'),
(2, 'Skincare'),
(3, 'Fragancias'),
(4, 'Accesorios');

-- =====================================================
-- TABLA: product_types (tipos de producto básicos)
-- =====================================================
CREATE TABLE IF NOT EXISTS `product_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `product_types_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar tipos de producto básicos
INSERT INTO `product_types` (`id`, `category_id`, `name`) VALUES
(1, 1, 'Máscara de Pestañas'),
(2, 1, 'Labial'),
(3, 1, 'Sombras'),
(4, 2, 'Crema Hidratante'),
(5, 2, 'Serum'),
(6, 2, 'Limpiador Facial'),
(7, 3, 'Perfume'),
(8, 3, 'Colonia');

-- =====================================================
-- TABLA: products (productos básicos)
-- =====================================================
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
  `is_approved` tinyint(1) DEFAULT 1 COMMENT '0 = Pendiente de aprobación, 1 = Aprobado, NULL = No revisado',
  `cost_price` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `product_type_id` (`product_type_id`),
  KEY `idx_products_cost_price` (`cost_price`),
  KEY `idx_products_price_cost` (`price`,`cost_price`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`product_type_id`) REFERENCES `product_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar productos básicos
INSERT INTO `products` (`id`, `product_type_id`, `name`, `description`, `price`, `stock_total`, `status`, `is_approved`) VALUES
(1, 1, 'Máscara Volumizadora', 'Máscara de pestañas que agrega volumen', 24.99, 50, 'active', 1),
(2, 4, 'Crema Hidratante Intensiva', 'Crema hidratante con ácido hialurónico', 29.99, 40, 'active', 1),
(3, 7, 'Perfume Floral', 'Perfume con notas florales y frutales', 49.99, 25, 'active', 1);

-- =====================================================
-- TABLA: carts_unified (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `carts_unified` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `status` enum('active','expired','cleaned') DEFAULT 'active',
  `cart_type` enum('guest','registered') DEFAULT 'guest',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_cart_type` (`cart_type`),
  KEY `idx_user_session` (`user_id`,`session_id`),
  KEY `idx_cart_user_status` (`user_id`,`status`),
  KEY `idx_cart_session_status` (`session_id`,`status`),
  KEY `idx_cart_type_status` (`cart_type`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cart_items_unified (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `cart_items_unified` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reserved_until` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cart_items_cart_id` (`cart_id`),
  KEY `idx_cart_items_product_id` (`product_id`),
  CONSTRAINT `cart_items_unified_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts_unified` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_unified_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: delivery_locations (ubicaciones de entrega básicas)
-- =====================================================
CREATE TABLE IF NOT EXISTS `delivery_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar ubicaciones básicas
INSERT INTO `delivery_locations` (`id`, `name`, `address`, `description`, `is_active`) VALUES
(1, 'Centro Comercial', 'Av. Principal 123, Centro', 'Entrega en centro comercial', 1),
(2, 'Zona Norte', 'Calle Norte 456, Zona Norte', 'Entrega en zona norte', 1);

-- =====================================================
-- TABLA: delivery_schedules (horarios de entrega básicos)
-- =====================================================
CREATE TABLE IF NOT EXISTS `delivery_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `day_of_week` int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_location_day` (`location_id`,`day_of_week`),
  KEY `idx_location_day` (`location_id`,`day_of_week`),
  CONSTRAINT `delivery_schedules_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `delivery_locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar horarios básicos (Lunes a Viernes)
INSERT INTO `delivery_schedules` (`location_id`, `day_of_week`, `start_time`, `end_time`, `is_active`) VALUES
(1, 1, '09:00:00', '18:00:00', 1), -- Lunes
(1, 2, '09:00:00', '18:00:00', 1), -- Martes
(1, 3, '09:00:00', '18:00:00', 1), -- Miércoles
(1, 4, '09:00:00', '18:00:00', 1), -- Jueves
(1, 5, '09:00:00', '18:00:00', 1); -- Viernes

-- =====================================================
-- TABLA: delivery_time_slots (franjas horarias específicas)
-- =====================================================
CREATE TABLE IF NOT EXISTS `delivery_time_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `day_of_week` int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
  `time_slot` time NOT NULL COMMENT 'Horario específico disponible',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_location_day_time` (`location_id`,`day_of_week`,`time_slot`),
  KEY `idx_location_day_time` (`location_id`,`day_of_week`,`time_slot`),
  CONSTRAINT `delivery_time_slots_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `delivery_locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar franjas horarias básicas
INSERT INTO `delivery_time_slots` (`location_id`, `day_of_week`, `time_slot`, `is_active`) VALUES
(1, 1, '10:00:00', 1), -- Lunes 10:00
(1, 1, '14:00:00', 1), -- Lunes 14:00
(1, 1, '16:00:00', 1), -- Lunes 16:00
(1, 2, '10:00:00', 1), -- Martes 10:00
(1, 2, '14:00:00', 1), -- Martes 14:00
(1, 2, '16:00:00', 1); -- Martes 16:00

-- =====================================================
-- TABLA: orders (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) NOT NULL COMMENT 'Número de orden único',
  `customer_type` enum('registered','guest') NOT NULL,
  `user_id` bigint(20) DEFAULT NULL COMMENT 'NULL para usuarios invitados',
  `session_id` varchar(255) DEFAULT NULL COMMENT 'Para usuarios invitados',
  `customer_name` varchar(255) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `delivery_location_id` int(11) NOT NULL,
  `delivery_date` date NOT NULL,
  `delivery_time` time NOT NULL,
  `delivery_address` text DEFAULT NULL COMMENT 'Dirección específica si es necesario',
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT 'pending',
  `whatsapp_message` text DEFAULT NULL,
  `whatsapp_sent_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL COMMENT 'Notas adicionales del cliente',
  `admin_notes` text DEFAULT NULL COMMENT 'Notas del administrador',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `delivery_location_id` (`delivery_location_id`),
  KEY `idx_order_number` (`order_number`),
  KEY `idx_customer_type` (`customer_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_status` (`status`),
  KEY `idx_delivery_date` (`delivery_date`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`delivery_location_id`) REFERENCES `delivery_locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: order_items (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: order_status_history (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `previous_status` enum('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT NULL,
  `new_status` enum('pending','confirmed','preparing','ready','delivered','cancelled') NOT NULL,
  `changed_by` enum('system','admin','customer') NOT NULL,
  `admin_id` bigint(20) DEFAULT NULL COMMENT 'ID del admin si fue cambiado por admin',
  `notes` text DEFAULT NULL COMMENT 'Notas del cambio de estado',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_new_status` (`new_status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_status_history_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: reservations (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `product_id` bigint(20) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reserved_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `status` enum('active','cancelled','expired','completed') DEFAULT 'active',
  `reserved_until` datetime NOT NULL DEFAULT (current_timestamp() + interval 1 hour),
  `user_type` enum('guest','registered') NOT NULL DEFAULT 'guest',
  `notes` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_reserved_until` (`reserved_until`),
  KEY `idx_user_type` (`user_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: surveys (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `question` varchar(255) NOT NULL,
  `description` text DEFAULT NULL COMMENT 'Descripción adicional de la encuesta',
  `status` enum('draft','active','closed') DEFAULT 'draft' COMMENT 'Estado de la encuesta',
  `created_by` bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que creó la encuesta',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `closed_by` bigint(20) DEFAULT NULL COMMENT 'ID del admin que cerró la encuesta',
  `closed_at` datetime DEFAULT NULL COMMENT 'Fecha de cierre',
  PRIMARY KEY (`id`),
  KEY `surveys_closed_by_fk` (`closed_by`),
  KEY `idx_surveys_status` (`status`),
  KEY `idx_surveys_created_by` (`created_by`),
  KEY `idx_surveys_status_created` (`status`,`created_at`),
  CONSTRAINT `surveys_closed_by_fk` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `surveys_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: survey_options (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `survey_options` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `survey_id` bigint(20) NOT NULL,
  `option_text` varchar(200) NOT NULL,
  `description` text DEFAULT NULL COMMENT 'Descripción adicional de la opción',
  `product_id` bigint(20) DEFAULT NULL,
  `created_by` bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que sugirió la opción',
  `is_approved` tinyint(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Aprobada',
  `admin_notes` text DEFAULT NULL COMMENT 'Notas del administrador sobre la aprobación',
  `approved_by` bigint(20) DEFAULT NULL COMMENT 'ID del admin que aprobó/rechazó',
  `approved_at` datetime DEFAULT NULL COMMENT 'Fecha de aprobación/rechazo',
  `created_at` datetime DEFAULT current_timestamp() COMMENT 'Fecha de creación de la opción',
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `survey_options_approved_by_fk` (`approved_by`),
  KEY `idx_survey_options_survey_id` (`survey_id`),
  KEY `idx_survey_options_approved` (`is_approved`),
  KEY `idx_survey_options_created_by` (`created_by`),
  KEY `idx_survey_options_survey_approved` (`survey_id`,`is_approved`),
  CONSTRAINT `survey_options_approved_by_fk` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `survey_options_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_options_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_options_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: survey_votes (estructura completa)
-- =====================================================
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
  CONSTRAINT `survey_votes_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_votes_ibfk_2` FOREIGN KEY (`option_id`) REFERENCES `survey_options` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_votes_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: client_statistics (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `client_statistics` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `total_purchases` int(11) DEFAULT 0,
  `total_spent` decimal(10,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `client_statistics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: inventory_schedule (estructura completa)
-- =====================================================
CREATE TABLE IF NOT EXISTS `inventory_schedule` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) NOT NULL,
  `arrival_date` datetime NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('scheduled','received','cancelled') DEFAULT 'scheduled',
  `created_by` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `inventory_schedule_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `inventory_schedule_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PROCEDIMIENTO: GenerateOrderNumber
-- =====================================================
DELIMITER //
CREATE PROCEDURE `GenerateOrderNumber`(OUT orderNumber VARCHAR(50))
BEGIN
  DECLARE currentDate VARCHAR(8);
  DECLARE sequenceNumber INT DEFAULT 1;
  DECLARE tempOrderNumber VARCHAR(50);
  DECLARE orderExists INT DEFAULT 0;
  
  -- Obtener fecha actual en formato YYYYMMDD
  SET currentDate = DATE_FORMAT(NOW(), '%Y%m%d');
  
  -- Buscar el siguiente número de secuencia para hoy
  REPEAT
    SET tempOrderNumber = CONCAT('ORD', currentDate, LPAD(sequenceNumber, 4, '0'));
    
    -- Verificar si ya existe
    SELECT COUNT(*) INTO orderExists FROM orders WHERE order_number = tempOrderNumber;
    
    IF orderExists = 0 THEN
      SET orderNumber = tempOrderNumber;
    ELSE
      SET sequenceNumber = sequenceNumber + 1;
    END IF;
    
  UNTIL orderExists = 0 END REPEAT;
  
  -- Log para debugging
  SELECT CONCAT('Generated: ', orderNumber) as debug_info;
END//
DELIMITER ;

-- =====================================================
-- VISTAS (estructura completa)
-- =====================================================

-- Vista: carts_with_items
CREATE OR REPLACE VIEW `carts_with_items` AS SELECT 
  c.id,
  c.user_id,
  c.session_id,
  c.status,
  c.cart_type,
  c.created_at,
  c.updated_at,
  c.expires_at,
  COUNT(ci.id) as item_count,
  SUM(ci.quantity) as total_quantity,
  SUM(ci.quantity * p.price) as total_amount,
  GROUP_CONCAT(
    CONCAT(p.name, ' (', ci.quantity, ')') 
    SEPARATOR ', '
  ) as items_summary
FROM carts_unified c
LEFT JOIN cart_items_unified ci ON c.id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.id
GROUP BY c.id, c.user_id, c.session_id, c.status, c.cart_type, c.created_at, c.updated_at, c.expires_at;

-- Vista: carts_with_items_optimized
CREATE OR REPLACE VIEW `carts_with_items_optimized` AS SELECT 
  c.id,
  c.user_id,
  c.session_id,
  c.cart_type,
  c.status,
  c.created_at,
  c.updated_at,
  c.expires_at,
  COUNT(ci.id) as item_count,
  SUM(ci.quantity) as total_quantity,
  GROUP_CONCAT(
    CONCAT(ci.product_id, ':', ci.quantity) 
    ORDER BY ci.product_id 
    SEPARATOR '|'
  ) as items_summary
FROM carts_unified c
LEFT JOIN cart_items_unified ci ON c.id = ci.cart_id
GROUP BY c.id, c.user_id, c.session_id, c.cart_type, c.status, c.created_at, c.updated_at, c.expires_at;

-- Vista: orders_with_details
CREATE OR REPLACE VIEW `orders_with_details` AS SELECT 
  o.id,
  o.order_number,
  o.customer_type,
  o.user_id,
  o.session_id,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.delivery_location_id,
  dl.name as delivery_location_name,
  o.delivery_date,
  o.delivery_time,
  o.delivery_address,
  o.total_amount,
  o.status,
  o.notes,
  o.admin_notes,
  o.whatsapp_message,
  o.whatsapp_sent_at,
  o.created_at,
  o.updated_at,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity
FROM orders o
INNER JOIN delivery_locations dl ON o.delivery_location_id = dl.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_type, o.user_id, o.session_id, 
         o.customer_name, o.customer_phone, o.customer_email, o.delivery_location_id,
         dl.name, o.delivery_date, o.delivery_time, o.delivery_address, o.total_amount,
         o.status, o.notes, o.admin_notes, o.whatsapp_message, o.whatsapp_sent_at,
         o.created_at, o.updated_at;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT 'Base de datos configurada correctamente' as status;
SHOW TABLES;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'cosmetics_db';
