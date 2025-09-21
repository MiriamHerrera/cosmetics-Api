-- Script SQL para eliminar pedidos a partir del 19 de septiembre de 2025
-- y resetear el AUTO_INCREMENT

-- IMPORTANTE: Hacer backup de la base de datos antes de ejecutar este script
-- BACKUP: mysqldump -u root -p cosmetics_db > backup_before_delete_$(date +%Y%m%d_%H%M%S).sql

-- 1. Ver pedidos que se van a eliminar
SELECT 
    'PEDIDOS A ELIMINAR' as info,
    COUNT(*) as total_pedidos
FROM orders 
WHERE created_at >= '2025-09-19 00:00:00';

SELECT 
    id, 
    order_number, 
    customer_name, 
    created_at,
    status
FROM orders 
WHERE created_at >= '2025-09-19 00:00:00'
ORDER BY id ASC;

-- 2. Ver el último ID antes del 19 de septiembre
SELECT 
    'ULTIMO ID ANTES DEL 19 SEP' as info,
    COALESCE(MAX(id), 0) as max_id,
    COALESCE(MAX(id), 0) + 1 as siguiente_id
FROM orders 
WHERE created_at < '2025-09-19 00:00:00';

-- 3. Verificar items de pedidos que se eliminarán
SELECT 
    'ITEMS A ELIMINAR' as info,
    COUNT(*) as total_items
FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= '2025-09-19 00:00:00';

-- 4. Deshabilitar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- 5. Eliminar items de pedidos relacionados
DELETE oi FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= '2025-09-19 00:00:00';

-- 6. Eliminar los pedidos
DELETE FROM orders 
WHERE created_at >= '2025-09-19 00:00:00';

-- 7. Resetear AUTO_INCREMENT (reemplazar XXXX con el siguiente ID disponible)
-- ALTER TABLE orders AUTO_INCREMENT = XXXX;

-- 8. Rehabilitar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- 9. Verificar el resultado
SELECT 
    'RESULTADO FINAL' as info,
    COUNT(*) as pedidos_restantes_desde_19_sep
FROM orders 
WHERE created_at >= '2025-09-19 00:00:00';

SELECT 
    'AUTO_INCREMENT ACTUAL' as info,
    AUTO_INCREMENT
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'orders';

-- 10. Mostrar el último pedido válido
SELECT 
    'ULTIMO PEDIDO VALIDO' as info,
    id, 
    order_number, 
    customer_name, 
    created_at
FROM orders 
WHERE created_at < '2025-09-19 00:00:00'
ORDER BY id DESC 
LIMIT 1;
