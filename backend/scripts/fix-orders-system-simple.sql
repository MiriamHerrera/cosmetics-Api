-- Script para arreglar el sistema de órdenes
-- Versión simple compatible con MariaDB

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
    o.delivery_date,
    o.delivery_time,
    o.delivery_address,
    o.total_amount,
    o.notes,
    o.status,
    o.whatsapp_message,
    o.whatsapp_sent_at,
    o.admin_notes,
    o.created_at,
    o.updated_at,
    dl.name as delivery_location_name,
    dl.address as delivery_location_address,
    dl.description as delivery_location_description,
    u.name as user_name,
    u.email as user_email
FROM orders o
LEFT JOIN delivery_locations dl ON o.delivery_location_id = dl.id
LEFT JOIN users u ON o.user_id = u.id;

-- 2. Crear el procedimiento GenerateOrderNumber si no existe
DROP PROCEDURE IF EXISTS GenerateOrderNumber;

DELIMITER //

CREATE PROCEDURE GenerateOrderNumber(OUT orderNumber VARCHAR(20))
BEGIN
    DECLARE orderCount INT DEFAULT 0;
    DECLARE datePrefix VARCHAR(8);
    
    -- Obtener fecha actual en formato YYYYMMDD
    SET datePrefix = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Contar órdenes del día actual
    SELECT COUNT(*) INTO orderCount 
    FROM orders 
    WHERE DATE(created_at) = CURDATE();
    
    -- Incrementar contador
    SET orderCount = orderCount + 1;
    
    -- Generar número de orden: ORD + YYYYMMDD + número secuencial de 4 dígitos
    SET orderNumber = CONCAT('ORD', datePrefix, LPAD(orderCount, 4, '0'));
END //

DELIMITER ;

-- 3. Verificar que las tablas necesarias existen
SHOW TABLES LIKE 'orders';
SHOW TABLES LIKE 'order_items';
SHOW TABLES LIKE 'delivery_locations';
SHOW TABLES LIKE 'users';

-- 4. Verificar que la vista se creó correctamente
SELECT 'Vista orders_with_details creada correctamente' as status;
DESCRIBE orders_with_details;

-- 5. Probar el procedimiento GenerateOrderNumber
SET @testOrderNumber = '';
CALL GenerateOrderNumber(@testOrderNumber);
SELECT @testOrderNumber as test_order_number;

-- 6. Verificar datos de prueba en delivery_locations
SELECT COUNT(*) as delivery_locations_count FROM delivery_locations WHERE is_active = TRUE;

-- Si no hay lugares de entrega, crear algunos de prueba
INSERT IGNORE INTO delivery_locations (id, name, address, description, is_active) VALUES
(1, 'Centro de la Ciudad', 'Centro, Ciudad', 'Entrega en el centro de la ciudad', TRUE),
(2, 'Zona Norte', 'Zona Norte, Ciudad', 'Entrega en la zona norte', TRUE),
(3, 'Zona Sur', 'Zona Sur, Ciudad', 'Entrega en la zona sur', TRUE);

SELECT 'Script ejecutado correctamente' as final_status;
