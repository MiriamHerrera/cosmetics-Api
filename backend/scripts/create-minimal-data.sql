-- Script para crear datos mínimos de prueba
-- Solo 1 producto, 1 encuesta con 1 opción

USE cosmetics_db;

-- Limpiar datos existentes (cuidado en producción)
-- DELETE FROM cart_items_unified;
-- DELETE FROM carts_unified;
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM products;
-- DELETE FROM product_types;
-- DELETE FROM categories;
-- DELETE FROM survey_votes;
-- DELETE FROM survey_options;
-- DELETE FROM surveys;
-- DELETE FROM users WHERE id > 1;

-- 1. Usuario admin (mantener ID 1)
INSERT IGNORE INTO users (id, username, name, phone, email, password, role, is_active) VALUES
(1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1);

-- 2. Una sola categoría
INSERT IGNORE INTO categories (id, name) VALUES
(1, 'Cosméticos');

-- 3. Un solo tipo de producto
INSERT IGNORE INTO product_types (id, category_id, name) VALUES
(1, 1, 'Maquillaje');

-- 4. Un solo producto
INSERT IGNORE INTO products (id, product_type_id, name, description, price, stock_total, status, is_approved) VALUES
(1, 1, 'Labial de Prueba', 'Labial de color rojo para pruebas del sistema', 19.99, 100, 'active', 1);

-- 5. Una sola encuesta
INSERT IGNORE INTO surveys (id, question, description, status, created_by) VALUES
(1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1);

-- 6. Una sola opción para la encuesta
INSERT IGNORE INTO survey_options (id, survey_id, option_text, is_correct) VALUES
(1, 1, 'Sí, me gusta mucho', 1);

-- 7. Una ubicación de entrega
INSERT IGNORE INTO delivery_locations (id, name, address, description, is_active) VALUES
(1, 'Oficina Central', 'Av. Principal 123, Centro', 'Entrega en oficina central', 1);

-- Verificar datos creados
SELECT 'Usuarios:' as tipo, COUNT(*) as cantidad FROM users
UNION ALL
SELECT 'Categorías:', COUNT(*) FROM categories
UNION ALL
SELECT 'Tipos de producto:', COUNT(*) FROM product_types
UNION ALL
SELECT 'Productos:', COUNT(*) FROM products
UNION ALL
SELECT 'Encuestas:', COUNT(*) FROM surveys
UNION ALL
SELECT 'Opciones de encuesta:', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Ubicaciones de entrega:', COUNT(*) FROM delivery_locations;
