-- Script para crear pedidos de prueba completados
-- Esto es necesario para que los reportes tengan datos para mostrar

USE cosmetics_db;

-- Verificar pedidos existentes
SELECT 
    'Pedidos existentes' as tipo,
    COUNT(*) as cantidad,
    status
FROM orders 
GROUP BY status;

-- Crear pedidos completados de prueba si no existen
INSERT INTO orders (
    order_number, 
    customer_type, 
    user_id, 
    customer_name, 
    customer_phone, 
    customer_email, 
    delivery_location_id, 
    delivery_date, 
    delivery_time, 
    delivery_address, 
    total_amount, 
    status, 
    created_at, 
    updated_at
)
SELECT 
    CONCAT('TEST-', LPAD(u.id, 4, '0'), '-', DATE_FORMAT(NOW() - INTERVAL FLOOR(RAND() * 30) DAY, '%Y%m%d')),
    'registered',
    u.id,
    u.name,
    u.phone,
    u.email,
    1,
    DATE_ADD(NOW(), INTERVAL FLOOR(RAND() * 7) DAY),
    '14:00:00',
    'Dirección de prueba',
    0,
    'delivered',
    NOW() - INTERVAL FLOOR(RAND() * 30) DAY,
    NOW()
FROM users u 
WHERE u.role = 'client' 
AND u.id NOT IN (SELECT DISTINCT user_id FROM orders WHERE status = 'delivered')
LIMIT 3;

-- Crear elementos de pedido para los pedidos completados
INSERT INTO order_items (
    order_id, 
    product_id, 
    product_name, 
    product_price, 
    quantity, 
    subtotal, 
    created_at
)
SELECT 
    o.id,
    p.id,
    p.name,
    p.price,
    FLOOR(RAND() * 3) + 1,
    p.price * (FLOOR(RAND() * 3) + 1),
    o.created_at
FROM orders o
CROSS JOIN products p
WHERE o.status = 'delivered'
AND o.id NOT IN (SELECT DISTINCT order_id FROM order_items)
AND RAND() < 0.4; -- 40% de probabilidad de que se cree un elemento

-- Actualizar el total de los pedidos
UPDATE orders o
SET total_amount = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM order_items oi
    WHERE oi.order_id = o.id
)
WHERE o.status = 'delivered';

-- Verificar que los datos se crearon correctamente
SELECT 
    'Pedidos completados' as tipo,
    COUNT(*) as cantidad
FROM orders 
WHERE status = 'delivered'

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
WHERE o.status = 'delivered'
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 5;

-- Mostrar algunos elementos de pedido de ejemplo
SELECT 
    oi.id,
    oi.order_id,
    oi.product_name,
    oi.quantity,
    oi.product_price,
    oi.subtotal,
    p.cost_price,
    (oi.quantity * oi.product_price) as total_revenue,
    (oi.quantity * p.cost_price) as total_cost,
    (oi.quantity * (oi.product_price - p.cost_price)) as total_profit
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
ORDER BY oi.created_at DESC
LIMIT 10;

-- Verificar que los reportes pueden funcionar
SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    SUM(oi.quantity * oi.product_price) as total_revenue,
    SUM(oi.quantity * p.cost_price) as total_cost,
    SUM(oi.quantity * (oi.product_price - p.cost_price)) as total_profit,
    ROUND(
        (SUM(oi.quantity * (oi.product_price - p.cost_price)) / SUM(oi.quantity * oi.product_price)) * 100, 2
    ) as profit_margin_percentage
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.status = 'delivered'
AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY); 