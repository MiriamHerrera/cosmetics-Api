-- Script para generar datos de prueba para los reportes
-- Este script crea pedidos y elementos de pedido para que puedas ver los reportes funcionando

USE cosmetics_db;

-- Verificar que tenemos productos
SELECT COUNT(*) as total_productos FROM products;

-- Verificar que tenemos usuarios
SELECT COUNT(*) as total_usuarios FROM users WHERE role = 'client';

-- Crear algunos pedidos de prueba si no existen
INSERT INTO orders (user_id, order_number, status, total_amount, created_at, updated_at)
SELECT 
    u.id,
    CONCAT('ORD-', LPAD(u.id, 4, '0'), '-', DATE_FORMAT(NOW() - INTERVAL FLOOR(RAND() * 30) DAY, '%Y%m%d')),
    'completed',
    0, -- Se actualizará después
    NOW() - INTERVAL FLOOR(RAND() * 30) DAY,
    NOW()
FROM users u 
WHERE u.role = 'client' 
AND u.id NOT IN (SELECT DISTINCT user_id FROM orders WHERE user_id IS NOT NULL)
LIMIT 5;

-- Crear elementos de pedido para los pedidos existentes
INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
SELECT 
    o.id,
    p.id,
    FLOOR(RAND() * 3) + 1, -- Cantidad aleatoria entre 1 y 3
    p.price,
    o.created_at
FROM orders o
CROSS JOIN products p
WHERE o.status = 'completed'
AND o.id NOT IN (SELECT DISTINCT order_id FROM order_items)
AND RAND() < 0.3; -- 30% de probabilidad de que se cree un elemento

-- Actualizar el total de los pedidos
UPDATE orders o
SET total_amount = (
    SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
    FROM order_items oi
    WHERE oi.order_id = o.id
)
WHERE o.status = 'completed';

-- Verificar que los datos se crearon correctamente
SELECT 
    'Pedidos creados' as tipo,
    COUNT(*) as cantidad
FROM orders 
WHERE status = 'completed'

UNION ALL

SELECT 
    'Elementos de pedido' as tipo,
    COUNT(*) as cantidad
FROM order_items;

-- Mostrar algunos pedidos de ejemplo
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.created_at,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'completed'
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 5;

-- Mostrar algunos elementos de pedido de ejemplo
SELECT 
    oi.id,
    oi.order_id,
    p.name as product_name,
    oi.quantity,
    oi.price,
    p.cost_price,
    (oi.quantity * oi.price) as total_revenue,
    (oi.quantity * p.cost_price) as total_cost,
    (oi.quantity * (oi.price - p.cost_price)) as total_profit
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
ORDER BY oi.created_at DESC
LIMIT 10;

-- Verificar que los reportes pueden funcionar
-- Este query debería funcionar si todo está configurado correctamente
SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    SUM(oi.quantity * oi.price) as total_revenue,
    SUM(oi.quantity * p.cost_price) as total_cost,
    SUM(oi.quantity * (oi.price - p.cost_price)) as total_profit,
    ROUND(
        (SUM(oi.quantity * (oi.price - p.cost_price)) / SUM(oi.quantity * oi.price)) * 100, 2
    ) as profit_margin_percentage
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.status = 'completed'
AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY); 