-- Esquema del sistema de reservas para Cosmetics API
-- Ejecutar este script en tu base de datos MariaDB

USE cosmetics_db;

-- 1. Tabla principal de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL, -- NULL para usuarios invitados
  session_id VARCHAR(255) NOT NULL, -- ID de sesión (invitado) o user_id (registrado)
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  reserved_until DATETIME NOT NULL, -- Fecha y hora de expiración
  user_type ENUM('guest', 'registered') NOT NULL DEFAULT 'guest',
  status ENUM('active', 'expired', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  notes TEXT NULL, -- Notas adicionales
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para optimizar consultas
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_product_id (product_id),
  INDEX idx_status (status),
  INDEX idx_reserved_until (reserved_until),
  INDEX idx_user_type (user_type),
  
  -- Claves foráneas
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Tabla de extensiones de reserva (admin)
CREATE TABLE IF NOT EXISTS reservation_extensions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  admin_id BIGINT NOT NULL,
  previous_expiration DATETIME NOT NULL,
  new_expiration DATETIME NOT NULL,
  extension_hours INT NOT NULL,
  reason TEXT NULL, -- Motivo de la extensión
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_reservation_id (reservation_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at),
  
  -- Claves foráneas
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tabla de recordatorios de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP NULL, -- NULL si no se ha enviado
  status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_reservation_id (reservation_id),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at),
  
  -- Claves foráneas
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

-- 4. Vista para obtener reservas con detalles completos
CREATE OR REPLACE VIEW reservations_with_details AS
SELECT 
  r.id,
  r.user_id,
  r.session_id,
  r.product_id,
  r.quantity,
  r.reserved_until,
  r.user_type,
  r.status,
  r.notes,
  r.created_at,
  r.updated_at,
  
  -- Información del producto
  p.name as product_name,
  p.description as product_description,
  p.price as product_price,
  p.image_url as product_image,
  p.stock_total as product_stock,
  
  -- Información del usuario (si es registrado)
  u.name as user_name,
  u.phone as user_phone,
  u.email as user_email,
  
  -- Cálculos
  (p.price * r.quantity) as total_amount,
  TIMESTAMPDIFF(MINUTE, NOW(), r.reserved_until) as minutes_remaining,
  TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until) as hours_remaining,
  TIMESTAMPDIFF(DAY, NOW(), r.reserved_until) as days_remaining,
  
  -- Estado de expiración
  CASE 
    WHEN r.reserved_until < NOW() THEN 'expired'
    WHEN TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until) < 1 THEN 'critical'
    WHEN TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until) < 24 THEN 'warning'
    ELSE 'safe'
  END as expiration_status

FROM reservations r
INNER JOIN products p ON r.product_id = p.id
LEFT JOIN users u ON r.user_id = u.id
WHERE r.status = 'active';

-- 5. Procedimiento para limpiar reservas expiradas
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS CleanupExpiredReservations()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE reservation_id INT;
  DECLARE product_id INT;
  DECLARE quantity INT;
  DECLARE product_name VARCHAR(255);
  
  -- Cursor para procesar reservas expiradas
  DECLARE expired_cursor CURSOR FOR
    SELECT r.id, r.product_id, r.quantity, p.name
    FROM reservations r
    INNER JOIN products p ON r.product_id = p.id
    WHERE r.reserved_until < NOW() AND r.status = 'active';
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Iniciar transacción
  START TRANSACTION;
  
  -- Abrir cursor
  OPEN expired_cursor;
  
  -- Procesar cada reserva expirada
  read_loop: LOOP
    FETCH expired_cursor INTO reservation_id, product_id, quantity, product_name;
    
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Restaurar stock del producto
    UPDATE products SET stock_total = stock_total + quantity WHERE id = product_id;
    
    -- Marcar reserva como expirada
    UPDATE reservations SET status = 'expired', updated_at = NOW() WHERE id = reservation_id;
    
    -- Log de la operación
    INSERT INTO reservation_extensions (reservation_id, admin_id, previous_expiration, new_expiration, extension_hours, reason)
    VALUES (reservation_id, 1, NOW(), NOW(), 0, 'Limpieza automática del sistema');
    
  END LOOP;
  
  -- Cerrar cursor
  CLOSE expired_cursor;
  
  -- Confirmar transacción
  COMMIT;
  
END //

DELIMITER ;

-- 6. Evento para limpiar reservas expiradas automáticamente (cada 15 minutos)
CREATE EVENT IF NOT EXISTS cleanup_expired_reservations_event
ON SCHEDULE EVERY 15 MINUTE
DO CALL CleanupExpiredReservations();

-- 7. Evento para enviar recordatorios automáticos (cada hora)
CREATE EVENT IF NOT EXISTS send_whatsapp_reminders_event
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
  -- Enviar recordatorios para reservas que expiran en las próximas 2 horas
  INSERT INTO whatsapp_reminders (reservation_id, message_text, status)
  SELECT 
    r.id,
    CONCAT('Recordatorio: Tu reserva de ', p.name, ' expira en ', 
           TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until), ' horas'),
    'pending'
  FROM reservations r
  INNER JOIN products p ON r.product_id = p.id
  WHERE r.status = 'active' 
    AND r.reserved_until BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR)
    AND r.id NOT IN (
      SELECT reservation_id FROM whatsapp_reminders 
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    );
END;

-- 8. Insertar datos de prueba (opcional)
INSERT INTO reservations (user_id, session_id, product_id, quantity, reserved_until, user_type, status, notes) VALUES
(NULL, 'guest_test_001', 1, 2, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'guest', 'active', 'Reserva de prueba - invitado'),
(2, 'user_002', 3, 1, DATE_ADD(NOW(), INTERVAL 7 DAY), 'registered', 'active', 'Reserva de prueba - usuario registrado'),
(NULL, 'guest_test_002', 5, 3, DATE_SUB(NOW(), INTERVAL 1 HOUR), 'guest', 'expired', 'Reserva expirada de prueba');

-- 9. Verificar que las tablas se crearon correctamente
SELECT 'Verificando tablas de reservas...' as info;

SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' 
  AND table_name IN ('reservations', 'reservation_extensions', 'whatsapp_reminders');

SELECT 'Verificando vista de reservas...' as info;
SELECT COUNT(*) as total_reservations FROM reservations_with_details;

SELECT 'Verificando procedimientos...' as info;
SELECT ROUTINE_NAME, ROUTINE_TYPE 
FROM information_schema.routines 
WHERE routine_schema = 'cosmetics_db' 
  AND routine_name = 'CleanupExpiredReservations';

SELECT 'Verificando eventos...' as info;
SELECT EVENT_NAME, STATUS, LAST_EXECUTED, NEXT_EXECUTION_TIME
FROM information_schema.events 
WHERE event_schema = 'cosmetics_db';

SELECT '✅ Sistema de reservas configurado correctamente' as status; 