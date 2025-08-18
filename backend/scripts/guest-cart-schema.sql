-- Esquema para carritos de invitados con expiración automática
-- Ejecutar después de crear las tablas principales

USE cosmetics_db;

-- =========================
-- Tabla para carritos de invitados
-- =========================
CREATE TABLE IF NOT EXISTS guest_carts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 HOUR),
  status ENUM('active', 'expired', 'cleaned') DEFAULT 'active',
  INDEX idx_session_id (session_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_status (status)
);

-- =========================
-- Tabla para items del carrito de invitados
-- =========================
CREATE TABLE IF NOT EXISTS guest_cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  guest_cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  reserved_until TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 1 HOUR),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guest_cart_id) REFERENCES guest_carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_guest_cart_id (guest_cart_id),
  INDEX idx_product_id (product_id),
  INDEX idx_reserved_until (reserved_until)
);

-- =========================
-- Tabla para logs de limpieza automática
-- =========================
CREATE TABLE IF NOT EXISTS cleanup_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cleanup_type ENUM('scheduled', 'manual', 'expired') NOT NULL,
  carts_cleaned INT DEFAULT 0,
  items_cleaned INT DEFAULT 0,
  stock_restored INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  status ENUM('running', 'completed', 'failed') DEFAULT 'running',
  error_message TEXT NULL,
  INDEX idx_cleanup_type (cleanup_type),
  INDEX idx_started_at (started_at),
  INDEX idx_status (status)
);

-- =========================
-- Procedimiento almacenado para limpieza automática
-- =========================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS CleanupExpiredGuestCarts()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE cart_id INT;
  DECLARE product_id INT;
  DECLARE quantity INT;
  DECLARE carts_cleaned INT DEFAULT 0;
  DECLARE items_cleaned INT DEFAULT 0;
  DECLARE stock_restored INT DEFAULT 0;
  DECLARE cleanup_id INT;
  
  -- Crear log de limpieza
  INSERT INTO cleanup_logs (cleanup_type, started_at) VALUES ('scheduled', NOW());
  SET cleanup_id = LAST_INSERT_ID();
  
  -- Cursor para procesar items expirados
  DECLARE expired_cursor CURSOR FOR
    SELECT 
      gci.guest_cart_id,
      gci.product_id,
      gci.quantity
    FROM guest_cart_items gci
    WHERE gci.reserved_until < NOW()
    AND gci.guest_cart_id IN (
      SELECT id FROM guest_carts WHERE expires_at < NOW()
    );
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Iniciar transacción
  START TRANSACTION;
  
  -- Procesar items expirados
  OPEN expired_cursor;
  
  read_loop: LOOP
    FETCH expired_cursor INTO cart_id, product_id, quantity;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Restaurar stock del producto
    UPDATE products 
    SET stock_total = stock_total + quantity 
    WHERE id = product_id;
    
    SET stock_restored = stock_restored + quantity;
    SET items_cleaned = items_cleaned + 1;
  END LOOP;
  
  CLOSE expired_cursor;
  
  -- Eliminar items expirados
  DELETE gci FROM guest_cart_items gci
  INNER JOIN guest_carts gc ON gci.guest_cart_id = gc.id
  WHERE gc.expires_at < NOW();
  
  -- Eliminar carritos expirados
  DELETE FROM guest_carts WHERE expires_at < NOW();
  
  SET carts_cleaned = ROW_COUNT();
  
  -- Marcar carritos como expirados (borrado lógico)
  UPDATE guest_carts 
  SET status = 'expired' 
  WHERE expires_at < NOW() AND status = 'active';
  
  -- Actualizar log de limpieza
  UPDATE cleanup_logs 
  SET 
    carts_cleaned = carts_cleaned,
    items_cleaned = items_cleaned,
    stock_restored = stock_restored,
    completed_at = NOW(),
    status = 'completed'
  WHERE id = cleanup_id;
  
  -- Confirmar transacción
  COMMIT;
  
  -- Log de resultados
  SELECT 
    CONCAT('Limpieza completada: ', carts_cleaned, ' carritos, ', 
            items_cleaned, ' items, ', stock_restored, ' stock restaurado') as result;
END //

DELIMITER ;

-- =========================
-- Evento para ejecutar limpieza automática cada 15 minutos
-- =========================
CREATE EVENT IF NOT EXISTS guest_cart_cleanup_event
ON SCHEDULE EVERY 15 MINUTE
DO CALL CleanupExpiredGuestCarts();

-- =========================
-- Trigger para actualizar expires_at cuando se modifica el carrito
-- =========================
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_guest_cart_expiry
AFTER UPDATE ON guest_cart_items
FOR EACH ROW
BEGIN
  UPDATE guest_carts 
  SET 
    expires_at = (CURRENT_TIMESTAMP + INTERVAL 1 HOUR),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.guest_cart_id;
END //

DELIMITER ;

-- =========================
-- Trigger para actualizar expires_at cuando se agrega un item
-- =========================
DELIMITER //

CREATE TRIGGER IF NOT EXISTS extend_guest_cart_expiry
AFTER INSERT ON guest_cart_items
FOR EACH ROW
BEGIN
  UPDATE guest_carts 
  SET 
    expires_at = (CURRENT_TIMESTAMP + INTERVAL 1 HOUR),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.guest_cart_id;
END //

DELIMITER ;

-- =========================
-- Vista para monitorear carritos activos
-- =========================
CREATE OR REPLACE VIEW active_guest_carts AS
SELECT 
  gc.id,
  gc.session_id,
  gc.created_at,
  gc.expires_at,
  gc.status,
  COUNT(gci.id) as item_count,
  SUM(gci.quantity) as total_quantity,
  TIMESTAMPDIFF(MINUTE, NOW(), gc.expires_at) as minutes_until_expiry
FROM guest_carts gc
LEFT JOIN guest_cart_items gci ON gc.id = gci.guest_cart_id
WHERE gc.status = 'active' AND gc.expires_at > NOW()
GROUP BY gc.id, gc.session_id, gc.created_at, gc.expires_at, gc.status;

-- =========================
-- Vista para productos con stock reservado
-- =========================
CREATE OR REPLACE VIEW products_with_reserved_stock AS
SELECT 
  p.id,
  p.name,
  p.stock_total as available_stock,
  COALESCE(SUM(gci.quantity), 0) as reserved_stock,
  (p.stock_total + COALESCE(SUM(gci.quantity), 0)) as total_stock,
  COUNT(DISTINCT gci.guest_cart_id) as active_reservations
FROM products p
LEFT JOIN guest_cart_items gci ON p.id = gci.product_id
LEFT JOIN guest_carts gc ON gci.guest_cart_id = gc.id
WHERE gc.status = 'active' OR gc.status IS NULL
GROUP BY p.id, p.name, p.stock_total;

-- =========================
-- Índices adicionales para optimización
-- =========================
CREATE INDEX idx_guest_cart_items_cart_product ON guest_cart_items(guest_cart_id, product_id);
CREATE INDEX idx_guest_carts_session_status ON guest_carts(session_id, status);
CREATE INDEX idx_cleanup_logs_completed ON cleanup_logs(completed_at, status); 