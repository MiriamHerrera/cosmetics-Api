-- Script para verificar la estructura exacta de la tabla users
-- Esto nos ayudará a entender qué campos usar para el nombre del usuario

-- 1. Verificar estructura completa de la tabla users
DESCRIBE users;

-- 2. Mostrar información detallada de las columnas
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT, 
  COLUMN_COMMENT,
  ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- 3. Mostrar algunos usuarios de ejemplo
SELECT * FROM users LIMIT 3;

-- 4. Verificar si existe algún campo de nombre o email
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('username', 'name', 'email', 'first_name', 'last_name'); 