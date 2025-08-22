-- Script para verificar la estructura exacta de la tabla survey_options
-- Esto nos ayudará a entender qué columnas están realmente presentes

-- 1. Verificar estructura completa de survey_options
DESCRIBE survey_options;

-- 2. Verificar información detallada de las columnas
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT, 
  COLUMN_COMMENT,
  ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME = 'survey_options'
ORDER BY ORDINAL_POSITION;

-- 3. Verificar si la columna created_at existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Column created_at EXISTS'
    ELSE 'Column created_at DOES NOT EXIST'
  END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME = 'survey_options' 
AND COLUMN_NAME = 'created_at';

-- 4. Mostrar algunas filas de ejemplo
SELECT * FROM survey_options LIMIT 3; 