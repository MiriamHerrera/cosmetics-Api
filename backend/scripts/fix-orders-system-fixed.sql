-- Script para arreglar el sistema de órdenes (Versión corregida para MariaDB)
-- Ejecutar este script en tu base de datos MariaDB

USE cosmetics_db;

-- 1. Crear la vista orders_with_details si no existe
DROP VIEW IF EXISTS orders_with_details;

CREATE VIEW orders_with_details AS
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

-- 2. Crear el procedimiento GenerateOrderNumber si no existe (versión corregida para MariaDB)
DROP PROCEDURE IF EXISTS GenerateOrderNumber;

DELIMITER //

CREATE PROCEDURE GenerateOrderNumber(OUT orderNumber VARCHAR(50))
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
    
    -- Verificar si ya existe usando una variable
    SELECT COUNT(*) INTO orderExists FROM orders WHERE order_number = tempOrderNumber;
    
    IF orderExists = 0 THEN
      SET orderNumber = tempOrderNumber;
    ELSE
      SET sequenceNumber = sequenceNumber + 1;
    END IF;
    
  UNTIL orderExists = 0 END REPEAT;
END //

DELIMITER ;

-- 3. Verificar que se crearon correctamente
SELECT 'Vista orders_with_details creada:' as info;
SHOW CREATE VIEW orders_with_details;

SELECT 'Procedimiento GenerateOrderNumber creado:' as info;
SHOW CREATE PROCEDURE GenerateOrderNumber;

-- 4. Probar el procedimiento
SELECT 'Probando procedimiento...' as info;
SET @testOrderNumber = '';
CALL GenerateOrderNumber(@testOrderNumber);
SELECT @testOrderNumber as test_result;

SELECT 'Sistema de órdenes arreglado correctamente!' as final_status; 