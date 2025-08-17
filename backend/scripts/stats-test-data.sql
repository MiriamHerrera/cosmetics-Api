-- Script para generar datos de prueba adicionales para estadísticas
-- Ejecutar después de tener usuarios, productos, carritos y apartados

USE cosmetics_db;

-- =========================
-- 1. Crear más usuarios de prueba para estadísticas
-- =========================

INSERT INTO users (name, phone, email, password, role) VALUES
('María González', '+1234567892', 'maria@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re', 'client'),
('Ana Rodríguez', '+1234567893', 'ana@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re', 'client'),
('Carmen López', '+1234567894', 'carmen@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re', 'client'),
('Isabel Martín', '+1234567895', 'isabel@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re', 'client'),
('Laura Sánchez', '+1234567896', 'laura@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re', 'client')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 2. Crear más carritos para estadísticas de actividad
-- =========================

-- Carritos para María (usuario 3)
INSERT INTO carts (user_id, status) VALUES
(3, 'sent'),
(3, 'open')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(4, 1, 1), -- Labial Mate Premium
(4, 3, 2), -- Polvo Compacto
(5, 5, 1)  -- Corrector Líquido
ON DUPLICATE KEY UPDATE id = id;

-- Carritos para Ana (usuario 4)
INSERT INTO carts (user_id, status) VALUES
(4, 'sent'),
(4, 'cancelled')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(6, 2, 1), -- Rubor en Polvo
(6, 6, 1), -- Sombra Individual
(7, 8, 1)  -- Delineador Líquido
ON DUPLICATE KEY UPDATE id = id;

-- Carritos para Carmen (usuario 5)
INSERT INTO carts (user_id, status) VALUES
(5, 'open')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(8, 7, 1), -- Máscara de Pestañas
(8, 4, 1)  -- Base Líquida
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 3. Crear más apartados para estadísticas
-- =========================

-- Apartados para María
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(3, 1, 2, DATE_ADD(NOW(), INTERVAL 5 DAY), 'active'),
(3, 5, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 'completed')
ON DUPLICATE KEY UPDATE id = id;

-- Apartados para Ana
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(4, 3, 1, DATE_ADD(NOW(), INTERVAL 3 DAY), 'active'),
(4, 7, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 'cancelled')
ON DUPLICATE KEY UPDATE id = id;

-- Apartados para Carmen
INSERT INTO reservations (user_id, product_id, quantity, expires_at, status) VALUES
(5, 2, 1, DATE_ADD(NOW(), INTERVAL 7 DAY), 'active')
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 4. Crear más votos en encuestas para estadísticas
-- =========================

-- Votos de María
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(1, 2, 3), -- Sombras con glitter
(2, 1, 3), -- Rojos intensos
(3, 1, 3)  -- Protectores solares
ON DUPLICATE KEY UPDATE id = id;

-- Votos de Ana
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(1, 4, 4), -- Serums anti-edad
(2, 3, 4), -- Nudes naturales
(3, 2, 4)  -- Serums hidratantes
ON DUPLICATE KEY UPDATE id = id;

-- Votos de Carmen
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(1, 6, 5), -- Brochas profesionales
(2, 4, 5), -- Morados elegantes
(3, 3, 5)  -- Exfoliantes suaves
ON DUPLICATE KEY UPDATE id = id;

-- Votos de Isabel
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(1, 1, 6), -- Labiales de larga duración
(2, 2, 6), -- Rosas suaves
(3, 4, 6)  -- Mascarillas faciales
ON DUPLICATE KEY UPDATE id = id;

-- Votos de Laura
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(1, 3, 7), -- Bases con cobertura alta
(2, 5, 7), -- Corales vibrantes
(3, 5, 7)  -- Toners equilibrantes
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 5. Crear carritos con fechas diferentes para análisis temporal
-- =========================

-- Carritos de días anteriores para análisis de tendencias
INSERT INTO carts (user_id, status, created_at) VALUES
(2, 'sent', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'sent', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 'sent', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 'sent', DATE_SUB(NOW(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(9, 1, 1), -- Labial Mate Premium
(10, 3, 1), -- Polvo Compacto
(11, 5, 1), -- Corrector Líquido
(12, 7, 1)  -- Máscara de Pestañas
ON DUPLICATE KEY UPDATE id = id;

-- =========================
-- 6. Verificar datos creados para estadísticas
-- =========================

SELECT 'Resumen de usuarios creados:' as info;
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_today
FROM users 
WHERE is_active = true
GROUP BY role;

SELECT 'Actividad por usuario (últimos 30 días):' as info;
SELECT 
  u.name,
  u.role,
  COUNT(DISTINCT c.id) as total_carts,
  COUNT(DISTINCT r.id) as total_reservations,
  COUNT(DISTINCT sv.survey_id) as surveys_participated,
  (COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id)) as total_activity
FROM users u
LEFT JOIN carts c ON u.id = c.user_id 
  AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
LEFT JOIN reservations r ON u.id = r.user_id 
  AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
LEFT JOIN survey_votes sv ON u.id = sv.user_id 
  AND sv.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
WHERE u.role = 'client' AND u.is_active = true
GROUP BY u.id, u.name, u.role
ORDER BY total_activity DESC;

SELECT 'Productos más populares (por apartados y carritos):' as info;
SELECT 
  p.name,
  COUNT(DISTINCT r.id) as total_reservations,
  COUNT(DISTINCT ci.cart_id) as total_carts,
  (COUNT(DISTINCT r.id) + COUNT(DISTINCT ci.cart_id)) as popularity_score
FROM products p
LEFT JOIN reservations r ON p.id = r.product_id
LEFT JOIN cart_items ci ON p.id = ci.product_id
WHERE p.status = 'active'
GROUP BY p.id, p.name
ORDER BY popularity_score DESC
LIMIT 10;

SELECT 'Actividad por día (últimos 7 días):' as info;
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_activities
FROM (
  SELECT created_at FROM carts 
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  UNION ALL
  SELECT created_at FROM reservations 
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  UNION ALL
  SELECT created_at FROM survey_votes 
  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
) all_activity
GROUP BY DATE(created_at)
ORDER BY date DESC; 