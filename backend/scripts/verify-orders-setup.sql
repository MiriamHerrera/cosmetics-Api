-- Script para verificar y crear todos los elementos necesarios para el sistema de órdenes
-- Ejecutar este script en tu base de datos MariaDB

USE cosmetics_db;

-- 1. Verificar si existe la vista orders_with_details
SELECT 'Verificando vista orders_with_details...' as info;

-- Intentar crear la vista si no existe
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

-- 2. Verificar si existe el procedimiento GenerateOrderNumber
SELECT 'Verificando procedimiento GenerateOrderNumber...' as info;

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS GenerateOrderNumber(OUT orderNumber VARCHAR(50))
BEGIN
  DECLARE currentDate VARCHAR(8);
  DECLARE sequenceNumber INT DEFAULT 1;
  DECLARE tempOrderNumber VARCHAR(50);
  
  -- Obtener fecha actual en formato YYYYMMDD
  SET currentDate = DATE_FORMAT(NOW(), '%Y%m%d');
  
  -- Buscar el siguiente número de secuencia para hoy
  WHILE TRUE DO
    SET tempOrderNumber = CONCAT('ORD', currentDate, LPAD(sequenceNumber, 4, '0'));
    
    -- Verificar si ya existe
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = tempOrderNumber) THEN
      SET orderNumber = tempOrderNumber;
      LEAVE;
    END IF;
    
    SET sequenceNumber = sequenceNumber + 1;
  END WHILE;
END //

DELIMITER ;

-- 3. Verificar que las tablas necesarias existen
SELECT 'Verificando tablas necesarias...' as info;

-- Verificar tabla orders
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Tabla orders: OK'
    ELSE 'Tabla orders: NO EXISTE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' AND table_name = 'orders';

-- Verificar tabla order_items
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Tabla order_items: OK'
    ELSE 'Tabla order_items: NO EXISTE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' AND table_name = 'order_items';

-- Verificar tabla delivery_locations
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Tabla delivery_locations: OK'
    ELSE 'Tabla delivery_locations: NO EXISTE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' AND table_name = 'delivery_locations';

-- Verificar tabla guest_carts
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Tabla guest_carts: OK'
    ELSE 'Tabla guest_carts: NO EXISTE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' AND table_name = 'guest_carts';

-- Verificar tabla guest_cart_items
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Tabla guest_cart_items: OK'
    ELSE 'Tabla guest_cart_items: NO EXISTE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' AND table_name = 'guest_cart_items';

-- 4. Verificar que la vista se creó correctamente
SELECT 'Verificando vista orders_with_details...' as info;
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Vista orders_with_details: OK'
    ELSE 'Vista orders_with_details: NO EXISTE'
  END as status
FROM information_schema.views 
WHERE table_schema = 'cosmetics_db' AND table_name = 'orders_with_details';

-- 5. Verificar que el procedimiento se creó correctamente
SELECT 'Verificando procedimiento GenerateOrderNumber...' as info;
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Procedimiento GenerateOrderNumber: OK'
    ELSE 'Procedimiento GenerateOrderNumber: NO EXISTE'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'cosmetics_db' AND routine_name = 'GenerateOrderNumber';

-- 6. Mostrar estructura de la vista
SELECT 'Estructura de la vista orders_with_details:' as info;
DESCRIBE orders_with_details;

-- 7. Verificar que hay al menos un lugar de entrega
SELECT 'Verificando lugares de entrega...' as info;
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN CONCAT('Lugares de entrega: ', COUNT(*), ' encontrados')
    ELSE 'Lugares de entrega: NINGUNO ENCONTRADO'
  END as status
FROM delivery_locations;

-- 8. Mostrar lugares de entrega disponibles
SELECT 'Lugares de entrega disponibles:' as info;
SELECT id, name, address, is_active FROM delivery_locations WHERE is_active = 1;

SELECT 'Verificación completada. Revisa los resultados arriba.' as final_status; 