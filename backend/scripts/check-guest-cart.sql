-- Script para verificar el estado del carrito de invitado
-- Ejecutar este script en tu base de datos MariaDB

USE cosmetics_db;

-- 1. Verificar que las tablas de carrito de invitado existen
SELECT 'Verificando tablas de carrito de invitado...' as info;

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Tabla guest_carts: OK'
    ELSE 'Tabla guest_carts: NO EXISTE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' AND table_name = 'guest_carts';

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Tabla guest_cart_items: OK'
    ELSE 'Tabla guest_cart_items: NO EXISTE'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'cosmetics_db' AND table_name = 'guest_cart_items';

-- 2. Verificar estructura de las tablas
SELECT 'Estructura de guest_carts:' as info;
DESCRIBE guest_carts;

SELECT 'Estructura de guest_cart_items:' as info;
DESCRIBE guest_cart_items;

-- 3. Verificar datos en las tablas
SELECT 'Datos en guest_carts:' as info;
SELECT 
  id, 
  session_id, 
  status, 
  created_at, 
  expires_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRADO'
    WHEN status = 'active' THEN 'ACTIVO'
    ELSE status
  END as estado_actual
FROM guest_carts 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'Datos en guest_cart_items:' as info;
SELECT 
  gci.id,
  gci.guest_cart_id,
  gc.session_id,
  gci.product_id,
  p.name as product_name,
  gci.quantity,
  gci.created_at
FROM guest_cart_items gci
INNER JOIN guest_carts gc ON gci.guest_cart_id = gc.id
INNER JOIN products p ON gci.product_id = p.id
ORDER BY gci.created_at DESC 
LIMIT 10;

-- 4. Verificar productos disponibles
SELECT 'Productos disponibles:' as info;
SELECT 
  id, 
  name, 
  price, 
  stock_total, 
  status 
FROM products 
WHERE status = 'active' 
ORDER BY name 
LIMIT 10;

-- 5. Verificar lugares de entrega
SELECT 'Lugares de entrega:' as info;
SELECT 
  id, 
  name, 
  address, 
  is_active 
FROM delivery_locations 
WHERE is_active = 1;

-- 6. Crear un carrito de prueba si no hay ninguno
SELECT 'Creando carrito de prueba si no hay ninguno...' as info;

INSERT IGNORE INTO guest_carts (session_id, status, expires_at) 
VALUES ('test-session-123', 'active', DATE_ADD(NOW(), INTERVAL 1 HOUR));

-- 7. Agregar un producto de prueba al carrito
SELECT 'Agregando producto de prueba al carrito...' as info;

INSERT IGNORE INTO guest_cart_items (guest_cart_id, product_id, quantity) 
SELECT 
  gc.id,
  p.id,
  1
FROM guest_carts gc
CROSS JOIN products p
WHERE gc.session_id = 'test-session-123' 
  AND p.status = 'active'
LIMIT 1;

-- 8. Verificar el carrito de prueba
SELECT 'Carrito de prueba creado:' as info;
SELECT 
  gc.id,
  gc.session_id,
  gc.status,
  COUNT(gci.id) as items_count,
  SUM(gci.quantity) as total_quantity
FROM guest_carts gc
LEFT JOIN guest_cart_items gci ON gc.id = gci.guest_cart_id
WHERE gc.session_id = 'test-session-123'
GROUP BY gc.id, gc.session_id, gc.status;

SELECT 'Diagnóstico completado. Revisa los resultados arriba.' as final_status; 