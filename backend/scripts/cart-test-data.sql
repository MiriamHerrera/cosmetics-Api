-- Script para probar el sistema de carrito
-- Ejecutar después de tener usuarios registrados

USE cosmetics_db;

-- =========================
-- 1. Crear usuario de prueba para carrito
-- =========================
-- Nota: La contraseña es 'test123' (hasheada con bcrypt)
INSERT INTO users (name, phone, email, password, role) VALUES
('Cliente Test', '+1234567891', 'cliente@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re', 'client')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 2. Crear carrito de prueba
-- =========================
INSERT INTO carts (user_id, status) VALUES
(2, 'open')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 3. Agregar items al carrito de prueba
-- =========================
INSERT INTO cart_items (cart_id, product_id, quantity, reserved_until) VALUES
(2, 1, 2, DATE_ADD(NOW(), INTERVAL 7 DAY)),  -- 2 Labiales Mate Premium
(2, 5, 1, DATE_ADD(NOW(), INTERVAL 7 DAY)),  -- 1 Corrector Líquido
(2, 12, 3, DATE_ADD(NOW(), INTERVAL 7 DAY))  -- 3 Sombras Individuales
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 4. Crear carrito enviado (para probar historial)
-- =========================
INSERT INTO carts (user_id, status) VALUES
(2, 'sent')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cart_items (cart_id, product_id, quantity, reserved_until) VALUES
(3, 3, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),  -- 1 Labial Líquido
(3, 8, 2, DATE_SUB(NOW(), INTERVAL 1 DAY))   -- 2 Delineadores Líquidos
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 5. Verificar datos insertados
-- =========================
SELECT 'Carritos creados:' as info;
SELECT 
  c.id,
  c.status,
  c.created_at,
  COUNT(ci.id) as item_count
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
WHERE c.user_id = 2
GROUP BY c.id, c.status, c.created_at;

SELECT 'Items en carrito activo:' as info;
SELECT 
  ci.id,
  p.name as product_name,
  ci.quantity,
  p.price,
  (ci.quantity * p.price) as subtotal,
  ci.reserved_until
FROM cart_items ci
INNER JOIN products p ON ci.product_id = p.id
INNER JOIN carts c ON ci.cart_id = c.id
WHERE c.user_id = 2 AND c.status = 'open'
ORDER BY ci.id;

SELECT 'Total del carrito activo:' as info;
SELECT 
  SUM(ci.quantity * p.price) as total_cart
FROM cart_items ci
INNER JOIN products p ON ci.product_id = p.id
INNER JOIN carts c ON ci.cart_id = c.id
WHERE c.user_id = 2 AND c.status = 'open'; 