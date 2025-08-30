-- Script para agregar la columna image_url a la tabla products
-- Ejecutar este script si la tabla products ya existe pero no tiene la columna image_url

-- Verificar si la columna ya existe
SELECT IF(
  EXISTS(
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND COLUMN_NAME = 'image_url'
  ),
  'La columna image_url ya existe',
  'Agregando columna image_url...'
) as status;

-- Agregar la columna image_url después de la columna price
ALTER TABLE products 
ADD COLUMN image_url text DEFAULT NULL COMMENT 'URL de la imagen del producto' 
AFTER price;

-- Verificar la estructura actualizada
DESCRIBE products;

-- Mostrar mensaje de confirmación
SELECT 'Columna image_url agregada exitosamente' as resultado;
