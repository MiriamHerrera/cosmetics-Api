-- Script para agregar la columna is_approved a la tabla products
-- Esta columna controlará qué productos se muestran en la página principal

-- Agregar la columna is_approved si no existe
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_approved TINYINT(1) DEFAULT 1 COMMENT '1 = Aprobado, 0 = Pendiente de aprobación';

-- Crear un índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_products_approved ON products(is_approved, status);

-- Actualizar productos existentes para que estén aprobados por defecto
UPDATE products SET is_approved = 1 WHERE is_approved IS NULL;

-- Verificar la estructura de la tabla
DESCRIBE products;

-- Mostrar algunos productos de ejemplo
SELECT id, name, status, is_approved FROM products LIMIT 5; 