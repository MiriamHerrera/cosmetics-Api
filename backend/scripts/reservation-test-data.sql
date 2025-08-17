-- Script para probar el sistema de apartados
-- Ejecutar después de tener usuarios y productos

USE cosmetics_db;

-- =========================
-- 1. Crear apartados de prueba
-- =========================

-- Apartado activo (expira en 5 días)
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(2, 1, 1, DATE_ADD(NOW(), INTERVAL 5 DAY), 'active')
ON DUPLICATE KEY UPDATE id = id;

-- Apartado activo (expira en 3 días)
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(2, 5, 2, DATE_ADD(NOW(), INTERVAL 3 DAY), 'active')
ON DUPLICATE KEY UPDATE id = id;

-- Apartado activo (expira en 1 día)
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(2, 12, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), 'active')
ON DUPLICATE KEY UPDATE id = id;

-- Apartado completado (para historial)
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(2, 8, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 'completed')
ON DUPLICATE KEY UPDATE id = id;

-- Apartado cancelado (para historial)
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(2, 3, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'cancelled')
ON DUPLICATE KEY UPDATE id = id;

-- Apartado expirado (para limpieza automática)
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(2, 7, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'expired')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 2. Verificar apartados creados
-- =========================

SELECT 'Apartados del usuario 2:' as info;
SELECT 
  r.id,
  r.quantity,
  r.status,
  r.reserved_at,
  r.expires_at,
  DATEDIFF(r.expires_at, NOW()) as days_remaining,
  p.name as product_name,
  p.price,
  (r.quantity * p.price) as total_price
FROM reservations r
INNER JOIN products p ON r.product_id = p.id
WHERE r.user_id = 2
ORDER BY r.expires_at ASC;

-- =========================
-- 3. Verificar stock actualizado
-- =========================

SELECT 'Stock de productos con apartados:' as info;
SELECT 
  p.id,
  p.name,
  p.stock_total as stock_actual,
  COALESCE(SUM(CASE WHEN r.status = 'active' THEN r.quantity ELSE 0 END), 0) as stock_apartado,
  (p.stock_total + COALESCE(SUM(CASE WHEN r.status = 'active' THEN r.quantity ELSE 0 END), 0)) as stock_total_disponible
FROM products p
LEFT JOIN reservations r ON p.id = r.product_id AND r.status = 'active'
WHERE p.id IN (1, 5, 12, 8, 3, 7)
GROUP BY p.id, p.name, p.stock_total;

-- =========================
-- 4. Apartados próximos a expirar (5 días o menos)
-- =========================

SELECT 'Apartados próximos a expirar:' as info;
SELECT 
  r.id,
  r.quantity,
  r.expires_at,
  DATEDIFF(r.expires_at, NOW()) as days_remaining,
  p.name as product_name,
  u.name as user_name,
  u.phone as user_phone
FROM reservations r
INNER JOIN products p ON r.product_id = p.id
INNER JOIN users u ON r.user_id = u.id
WHERE r.status = 'active' AND DATEDIFF(r.expires_at, NOW()) <= 5
ORDER BY r.expires_at ASC;

-- =========================
-- 5. Apartados expirados (para limpieza)
-- =========================

SELECT 'Apartados expirados (requieren limpieza):' as info;
SELECT 
  r.id,
  r.user_id,
  r.product_id,
  r.quantity,
  r.expires_at,
  DATEDIFF(NOW(), r.expires_at) as days_expired,
  p.name as product_name,
  u.name as user_name
FROM reservations r
INNER JOIN products p ON r.product_id = p.id
INNER JOIN users u ON r.user_id = u.id
WHERE r.status = 'active' AND r.expires_at < NOW()
ORDER BY r.expires_at ASC;

-- =========================
-- 6. Estadísticas de apartados del usuario
-- =========================

SELECT 'Estadísticas de apartados del usuario 2:' as info;
SELECT 
  COUNT(*) as total_reservations,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_reservations,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_reservations,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reservations,
  SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_reservations,
  SUM(quantity) as total_items_reserved
FROM reservations 
WHERE user_id = 2; 