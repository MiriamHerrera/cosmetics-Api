-- Esquema para sistema de órdenes con lugares y horarios de entrega
-- Ejecutar después de crear las tablas principales

USE cosmetics_db;

-- =========================
-- Tabla para lugares de entrega
-- =========================
CREATE TABLE IF NOT EXISTS delivery_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- Tabla para horarios de entrega por lugar
-- =========================
CREATE TABLE IF NOT EXISTS delivery_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  day_of_week INT NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES delivery_locations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_location_day (location_id, day_of_week),
  INDEX idx_location_day (location_id, day_of_week)
);

-- =========================
-- Tabla para horarios específicos (para lugares con horarios fijos)
-- =========================
CREATE TABLE IF NOT EXISTS delivery_time_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  location_id INT NOT NULL,
  day_of_week INT NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
  time_slot TIME NOT NULL COMMENT 'Horario específico disponible',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES delivery_locations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_location_day_time (location_id, day_of_week, time_slot),
  INDEX idx_location_day_time (location_id, day_of_week, time_slot)
);

-- =========================
-- Tabla principal de órdenes
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Número de orden único',
  customer_type ENUM('registered', 'guest') NOT NULL,
  user_id INT NULL COMMENT 'NULL para usuarios invitados',
  session_id VARCHAR(255) NULL COMMENT 'Para usuarios invitados',
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NULL,
  
  -- Información de entrega
  delivery_location_id INT NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time TIME NOT NULL,
  delivery_address TEXT NULL COMMENT 'Dirección específica si es necesario',
  
  -- Información del pedido
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
  
  -- Información de WhatsApp
  whatsapp_message TEXT NULL,
  whatsapp_sent_at TIMESTAMP NULL,
  
  -- Metadatos
  notes TEXT NULL COMMENT 'Notas adicionales del cliente',
  admin_notes TEXT NULL COMMENT 'Notas del administrador',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (delivery_location_id) REFERENCES delivery_locations(id),
  
  INDEX idx_order_number (order_number),
  INDEX idx_customer_type (customer_type),
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_status (status),
  INDEX idx_delivery_date (delivery_date),
  INDEX idx_created_at (created_at)
);

-- =========================
-- Tabla para items de la orden
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
);

-- =========================
-- Tabla para historial de cambios de estado
-- =========================
CREATE TABLE IF NOT EXISTS order_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  previous_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') NULL,
  new_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') NOT NULL,
  changed_by ENUM('system', 'admin', 'customer') NOT NULL,
  admin_id INT NULL COMMENT 'ID del admin si fue cambiado por admin',
  notes TEXT NULL COMMENT 'Notas del cambio de estado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_order_id (order_id),
  INDEX idx_new_status (new_status),
  INDEX idx_created_at (created_at)
);

-- =========================
-- Insertar lugares de entrega predefinidos
-- =========================
INSERT INTO delivery_locations (name, address, description) VALUES
('Unidad Académica Juárez UANL', 'Unidad Académica Juárez UANL, Nuevo León, México', 'Entrega en la unidad académica con horarios específicos'),
('Soriana San Roque', 'Soriana San Roque, Nuevo León, México', 'Entrega en Soriana San Roque con horarios específicos'),
('Soriana Santa María', 'Soriana Santa María, Nuevo León, México', 'Entrega en Soriana Santa María con horarios de libre elección')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- Insertar horarios para Unidad Académica Juárez UANL (Lunes a Viernes)
-- =========================
INSERT INTO delivery_schedules (location_id, day_of_week, start_time, end_time) VALUES
(1, 1, '09:00:00', '17:00:00'), -- Lunes
(1, 2, '09:00:00', '17:00:00'), -- Martes
(1, 3, '09:00:00', '17:00:00'), -- Miércoles
(1, 4, '09:00:00', '17:00:00'), -- Jueves
(1, 5, '09:00:00', '17:00:00')  -- Viernes
ON DUPLICATE KEY UPDATE id = id;

-- Insertar horarios específicos para UANL
INSERT INTO delivery_time_slots (location_id, day_of_week, time_slot) VALUES
(1, 1, '09:00:00'), (1, 1, '11:00:00'), (1, 1, '13:00:00'), (1, 1, '15:00:00'), (1, 1, '17:00:00'),
(1, 2, '09:00:00'), (1, 2, '11:00:00'), (1, 2, '13:00:00'), (1, 2, '15:00:00'), (1, 2, '17:00:00'),
(1, 3, '09:00:00'), (1, 3, '11:00:00'), (1, 3, '13:00:00'), (1, 3, '15:00:00'), (1, 3, '17:00:00'),
(1, 4, '09:00:00'), (1, 4, '11:00:00'), (1, 4, '13:00:00'), (1, 4, '15:00:00'), (1, 4, '17:00:00'),
(1, 5, '09:00:00'), (1, 5, '11:00:00'), (1, 5, '13:00:00'), (1, 5, '15:00:00'), (1, 5, '17:00:00')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- Insertar horarios para Soriana San Roque (Lunes a Domingo)
-- =========================
INSERT INTO delivery_schedules (location_id, day_of_week, start_time, end_time) VALUES
(2, 1, '10:00:00', '20:00:00'), -- Lunes
(2, 2, '10:00:00', '20:00:00'), -- Martes
(2, 3, '10:00:00', '20:00:00'), -- Miércoles
(2, 4, '10:00:00', '20:00:00'), -- Jueves
(2, 5, '10:00:00', '20:00:00'), -- Viernes
(2, 6, '10:00:00', '20:00:00'), -- Sábado
(2, 0, '10:00:00', '20:00:00')  -- Domingo
ON DUPLICATE KEY UPDATE id = id;

-- Insertar horarios específicos para San Roque
INSERT INTO delivery_time_slots (location_id, day_of_week, time_slot) VALUES
(2, 1, '10:00:00'), (2, 1, '12:00:00'), (2, 1, '14:00:00'), (2, 1, '16:00:00'), (2, 1, '18:00:00'), (2, 1, '20:00:00'),
(2, 2, '10:00:00'), (2, 2, '12:00:00'), (2, 2, '14:00:00'), (2, 2, '16:00:00'), (2, 2, '18:00:00'), (2, 2, '20:00:00'),
(2, 3, '10:00:00'), (2, 3, '12:00:00'), (2, 3, '14:00:00'), (2, 3, '16:00:00'), (2, 3, '18:00:00'), (2, 3, '20:00:00'),
(2, 4, '10:00:00'), (2, 4, '12:00:00'), (2, 4, '14:00:00'), (2, 4, '16:00:00'), (2, 4, '18:00:00'), (2, 4, '20:00:00'),
(2, 5, '10:00:00'), (2, 5, '12:00:00'), (2, 5, '14:00:00'), (2, 5, '16:00:00'), (2, 5, '18:00:00'), (2, 5, '20:00:00'),
(2, 6, '10:00:00'), (2, 6, '12:00:00'), (2, 6, '14:00:00'), (2, 6, '16:00:00'), (2, 6, '18:00:00'), (2, 6, '20:00:00'),
(2, 0, '10:00:00'), (2, 0, '12:00:00'), (2, 0, '14:00:00'), (2, 0, '16:00:00'), (2, 0, '18:00:00'), (2, 0, '20:00:00')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- Insertar horarios para Soriana Santa María (Lunes a Domingo con horarios flexibles)
-- =========================
INSERT INTO delivery_schedules (location_id, day_of_week, start_time, end_time) VALUES
(3, 1, '08:00:00', '22:00:00'), -- Lunes
(3, 2, '08:00:00', '22:00:00'), -- Martes
(3, 3, '08:00:00', '22:00:00'), -- Miércoles
(3, 4, '08:00:00', '22:00:00'), -- Jueves
(3, 5, '08:00:00', '22:00:00'), -- Viernes
(3, 6, '08:00:00', '22:00:00'), -- Sábado
(3, 0, '08:00:00', '22:00:00')  -- Domingo
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- Procedimiento para generar número de orden único
-- =========================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS GenerateOrderNumber(OUT orderNumber VARCHAR(50))
BEGIN
  DECLARE currentDate VARCHAR(8);
  DECLARE sequenceNumber INT;
  
  -- Obtener fecha actual en formato YYYYMMDD
  SET currentDate = DATE_FORMAT(NOW(), '%Y%m%d');
  
  -- Obtener siguiente número de secuencia para hoy
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 9) AS UNSIGNED)), 0) + 1
  INTO sequenceNumber
  FROM orders 
  WHERE order_number LIKE CONCAT(currentDate, '%');
  
  -- Generar número de orden: YYYYMMDD + secuencia de 4 dígitos
  SET orderNumber = CONCAT(currentDate, LPAD(sequenceNumber, 4, '0'));
END //

DELIMITER ;

-- =========================
-- Trigger para crear historial de cambios de estado
-- =========================
DELIMITER //

CREATE TRIGGER IF NOT EXISTS track_order_status_changes
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO order_status_history (
      order_id, 
      previous_status, 
      new_status, 
      changed_by, 
      notes
    ) VALUES (
      NEW.id, 
      OLD.status, 
      NEW.status, 
      'system', 
      CONCAT('Estado cambiado de ', OLD.status, ' a ', NEW.status)
    );
  END IF;
END //

DELIMITER ;

-- =========================
-- Vista para órdenes con información completa
-- =========================
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
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

-- =========================
-- Índices adicionales para optimización
-- =========================
CREATE INDEX idx_orders_delivery_location_date ON orders(delivery_location_id, delivery_date);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status_date ON orders(status, delivery_date);
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);

-- =========================
-- Verificar datos insertados
-- =========================
SELECT 'Lugares de entrega creados:' as info;
SELECT * FROM delivery_locations;

SELECT 'Horarios de entrega por lugar:' as info;
SELECT 
  dl.name as location_name,
  ds.day_of_week,
  CASE ds.day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as day_name,
  ds.start_time,
  ds.end_time
FROM delivery_schedules ds
INNER JOIN delivery_locations dl ON ds.location_id = dl.id
ORDER BY dl.id, ds.day_of_week;

SELECT 'Horarios específicos por lugar:' as info;
SELECT 
  dl.name as location_name,
  dts.day_of_week,
  CASE dts.day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END as day_name,
  dts.time_slot
FROM delivery_time_slots dts
INNER JOIN delivery_locations dl ON dts.location_id = dl.id
ORDER BY dl.id, dts.day_of_week, dts.time_slot; 