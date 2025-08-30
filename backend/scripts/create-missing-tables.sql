-- Script para crear todas las tablas faltantes del sistema de cosméticos
-- Ejecutar este script en Railway MySQL para crear las 14 tablas que faltan

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Crear tabla de tipos de producto
CREATE TABLE IF NOT EXISTS product_types (
  id int(11) NOT NULL AUTO_INCREMENT,
  category_id int(11) NOT NULL,
  name varchar(100) NOT NULL,
  PRIMARY KEY (id),
  KEY category_id (category_id),
  CONSTRAINT product_types_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crear tabla de ubicaciones de entrega
CREATE TABLE IF NOT EXISTS delivery_locations (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  address text NOT NULL,
  description text DEFAULT NULL,
  is_active tinyint(1) DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Crear tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id int(11) NOT NULL AUTO_INCREMENT,
  order_number varchar(50) NOT NULL,
  customer_type enum('registered','guest') NOT NULL,
  user_id bigint(20) DEFAULT NULL,
  session_id varchar(255) DEFAULT NULL,
  customer_name varchar(255) NOT NULL,
  customer_phone varchar(20) NOT NULL,
  customer_email varchar(255) DEFAULT NULL,
  delivery_location_id int(11) NOT NULL,
  delivery_date date NOT NULL,
  delivery_time time NOT NULL,
  delivery_address text DEFAULT NULL,
  total_amount decimal(10,2) NOT NULL,
  status enum('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT 'pending',
  whatsapp_message text DEFAULT NULL,
  whatsapp_sent_at timestamp NULL DEFAULT NULL,
  notes text DEFAULT NULL,
  admin_notes text DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY order_number (order_number),
  KEY delivery_location_id (delivery_location_id),
  KEY idx_order_number (order_number),
  KEY idx_customer_type (customer_type),
  KEY idx_user_id (user_id),
  KEY idx_session_id (session_id),
  KEY idx_status (status),
  KEY idx_delivery_date (delivery_date),
  KEY idx_created_at (created_at),
  CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT orders_ibfk_2 FOREIGN KEY (delivery_location_id) REFERENCES delivery_locations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Crear tabla de items de orden
CREATE TABLE IF NOT EXISTS order_items (
  id int(11) NOT NULL AUTO_INCREMENT,
  order_id int(11) NOT NULL,
  product_id bigint(20) NOT NULL,
  product_name varchar(255) NOT NULL,
  product_price decimal(10,2) NOT NULL,
  quantity int(11) NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY idx_order_id (order_id),
  KEY idx_product_id (product_id),
  CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Crear tabla de reservaciones
CREATE TABLE IF NOT EXISTS reservations (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  user_id bigint(20) NOT NULL,
  product_id bigint(20) NOT NULL,
  quantity int(11) NOT NULL,
  reserved_at datetime DEFAULT current_timestamp(),
  expires_at datetime NOT NULL,
  status enum('active','cancelled','expired','completed') DEFAULT 'active',
  reserved_until datetime NOT NULL DEFAULT (current_timestamp() + interval 1 hour),
  user_type enum('guest','registered') NOT NULL DEFAULT 'guest',
  notes text DEFAULT NULL,
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id),
  KEY product_id (product_id),
  KEY idx_reserved_until (reserved_until),
  KEY idx_user_type (user_type),
  KEY idx_status (status),
  CONSTRAINT reservations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT reservations_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Crear tabla de encuestas
CREATE TABLE IF NOT EXISTS surveys (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  question varchar(255) NOT NULL,
  description text DEFAULT NULL COMMENT 'Descripción adicional de la encuesta',
  status enum('draft','active','closed') DEFAULT 'draft' COMMENT 'Estado de la encuesta',
  created_by bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que creó la encuesta',
  created_at datetime DEFAULT current_timestamp(),
  updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  closed_by bigint(20) DEFAULT NULL COMMENT 'ID del admin que cerró la encuesta',
  closed_at datetime DEFAULT NULL COMMENT 'Fecha de cierre',
  PRIMARY KEY (id),
  KEY surveys_closed_by_fk (closed_by),
  KEY idx_surveys_status (status),
  KEY idx_surveys_created_by (created_by),
  KEY idx_surveys_status_created (status, created_at),
  CONSTRAINT surveys_closed_by_fk FOREIGN KEY (closed_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT surveys_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Crear tabla de opciones de encuesta
CREATE TABLE IF NOT EXISTS survey_options (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  survey_id bigint(20) NOT NULL,
  option_text varchar(200) NOT NULL,
  description text DEFAULT NULL COMMENT 'Descripción adicional de la opción',
  product_id bigint(20) DEFAULT NULL,
  created_by bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que sugirió la opción',
  is_approved tinyint(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Aprobada',
  admin_notes text DEFAULT NULL COMMENT 'Notas del administrador sobre la aprobación',
  approved_by bigint(20) DEFAULT NULL COMMENT 'ID del admin que aprobó/rechazó',
  approved_at datetime DEFAULT NULL COMMENT 'Fecha de aprobación/rechazo',
  created_at datetime DEFAULT current_timestamp() COMMENT 'Fecha de creación de la opción',
  updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  KEY product_id (product_id),
  KEY survey_options_approved_by_fk (approved_by),
  KEY idx_survey_options_survey_id (survey_id),
  KEY idx_survey_options_approved (is_approved),
  KEY idx_survey_options_created_by (created_by),
  KEY idx_survey_options_survey_approved (survey_id, is_approved),
  CONSTRAINT survey_options_approved_by_fk FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT survey_options_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT survey_options_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
  CONSTRAINT survey_options_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Crear tabla de votos de encuesta
CREATE TABLE IF NOT EXISTS survey_votes (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  survey_id bigint(20) NOT NULL,
  option_id bigint(20) NOT NULL,
  user_id bigint(20) NOT NULL,
  created_at datetime DEFAULT current_timestamp(),
  updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_option (user_id, option_id),
  KEY idx_survey_votes_survey_id (survey_id),
  KEY idx_survey_votes_option_id (option_id),
  KEY idx_survey_votes_user_id (user_id),
  KEY idx_survey_votes_survey_user (survey_id, user_id),
  CONSTRAINT survey_votes_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
  CONSTRAINT survey_votes_ibfk_2 FOREIGN KEY (option_id) REFERENCES survey_options (id) ON DELETE CASCADE,
  CONSTRAINT survey_votes_ibfk_3 FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Crear tabla de horarios de entrega
CREATE TABLE IF NOT EXISTS delivery_schedules (
  id int(11) NOT NULL AUTO_INCREMENT,
  location_id int(11) NOT NULL,
  day_of_week int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active tinyint(1) DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY unique_location_day (location_id, day_of_week),
  KEY idx_location_day (location_id, day_of_week),
  CONSTRAINT delivery_schedules_ibfk_1 FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Crear tabla de franjas horarias de entrega
CREATE TABLE IF NOT EXISTS delivery_time_slots (
  id int(11) NOT NULL AUTO_INCREMENT,
  location_id int(11) NOT NULL,
  day_of_week int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
  time_slot time NOT NULL COMMENT 'Horario específico disponible',
  is_active tinyint(1) DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY unique_location_day_time (location_id, day_of_week, time_slot),
  KEY idx_location_day_time (location_id, day_of_week, time_slot),
  CONSTRAINT delivery_time_slots_ibfk_1 FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Crear tabla de programación de inventario
CREATE TABLE IF NOT EXISTS inventory_schedule (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  product_id bigint(20) NOT NULL,
  arrival_date datetime NOT NULL,
  quantity int(11) NOT NULL,
  status enum('scheduled','received','cancelled') DEFAULT 'scheduled',
  created_by bigint(20) NOT NULL,
  PRIMARY KEY (id),
  KEY product_id (product_id),
  KEY created_by (created_by),
  CONSTRAINT inventory_schedule_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT inventory_schedule_ibfk_2 FOREIGN KEY (created_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Crear tabla de historial de estados de órdenes
CREATE TABLE IF NOT EXISTS order_status_history (
  id int(11) NOT NULL AUTO_INCREMENT,
  order_id int(11) NOT NULL,
  previous_status enum('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT NULL,
  new_status enum('pending','confirmed','preparing','ready','delivered','cancelled') NOT NULL,
  changed_by enum('system','admin','customer') NOT NULL,
  admin_id bigint(20) DEFAULT NULL COMMENT 'ID del admin si fue cambiado por admin',
  notes text DEFAULT NULL COMMENT 'Notas del cambio de estado',
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY admin_id (admin_id),
  KEY idx_order_id (order_id),
  KEY idx_new_status (new_status),
  KEY idx_created_at (created_at),
  CONSTRAINT order_status_history_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_status_history_ibfk_2 FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Crear tabla de estadísticas de clientes
CREATE TABLE IF NOT EXISTS client_statistics (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  user_id bigint(20) NOT NULL,
  total_purchases int(11) DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0.00,
  created_at datetime DEFAULT current_timestamp(),
  updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT client_statistics_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos básicos mínimos para prueba
INSERT IGNORE INTO categories (id, name) VALUES (1, 'Cosméticos');
INSERT IGNORE INTO product_types (id, category_id, name) VALUES (1, 1, 'Maquillaje');
INSERT IGNORE INTO delivery_locations (id, name, address, description, is_active) VALUES (1, 'Oficina Central', 'Av. Principal 123, Centro', 'Entrega en oficina central', 1);
INSERT IGNORE INTO surveys (id, question, description, status, created_by) VALUES (1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1);
INSERT IGNORE INTO survey_options (id, survey_id, option_text, is_approved) VALUES (1, 1, 'Sí, me gusta mucho', 1);

-- Verificar que se crearon todas las tablas
SHOW TABLES;
