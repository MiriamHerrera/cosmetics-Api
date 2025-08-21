-- Script para arreglar el sistema de órdenes (Versión simple para MariaDB)
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

-- 2. Crear el procedimiento GenerateOrderNumber si no existe (versión simple)
DROP PROCEDURE IF EXISTS GenerateOrderNumber;

DELIMITER //

CREATE PROCEDURE GenerateOrderNumber(OUT orderNumber VARCHAR(50))
BEGIN
  DECLARE currentDate VARCHAR(8);
  DECLARE nextSequence INT DEFAULT 1;
  
  -- Obtener fecha actual en formato YYYYMMDD
  SET currentDate = DATE_FORMAT(NOW(), '%Y%m%d');
  
  -- Obtener el siguiente número de secuencia para hoy
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 12) AS UNSIGNED)), 0) + 1
  INTO nextSequence
  FROM orders 
  WHERE order_number LIKE CONCAT('ORD', currentDate, '%');
  
  -- Generar el número de orden
  SET orderNumber = CONCAT('ORD', currentDate, LPAD(nextSequence, 4, '0'));
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

-- 5. Probar múltiples veces para verificar que genera números únicos
SELECT 'Probando generación de múltiples números...' as info;
SET @order1 = '';
SET @order2 = '';
SET @order3 = '';

CALL GenerateOrderNumber(@order1);
CALL GenerateOrderNumber(@order2);
CALL GenerateOrderNumber(@order3);

SELECT 
  @order1 as order_1,
  @order2 as order_2,
  @order3 as order_3;

SELECT 'Sistema de órdenes arreglado correctamente!' as final_status; 