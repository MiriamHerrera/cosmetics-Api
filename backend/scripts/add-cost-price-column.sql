-- Script para agregar la columna cost_price a la tabla products
-- Este script es necesario para que funcionen los reportes de márgenes de ganancia

USE cosmetics_db;

-- Agregar la columna cost_price si no existe
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Precio de costo del producto';

-- Actualizar productos existentes con un costo estimado (60% del precio de venta)
-- Esto es solo para testing, en producción deberías ingresar los costos reales
UPDATE products 
SET cost_price = ROUND(price * 0.6, 2) 
WHERE cost_price = 0 OR cost_price IS NULL;

-- Verificar que la columna se agregó correctamente
DESCRIBE products;

-- Mostrar algunos productos con sus precios y costos
SELECT 
    id,
    name,
    price,
    cost_price,
    ROUND((price - cost_price), 2) as ganancia_unitaria,
    ROUND(((price - cost_price) / price) * 100, 2) as margen_porcentaje
FROM products 
LIMIT 10;

-- Crear un índice para mejorar el rendimiento de los reportes
CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price);
CREATE INDEX IF NOT EXISTS idx_products_price_cost ON products(price, cost_price);

-- Verificar que los índices se crearon
SHOW INDEX FROM products; 