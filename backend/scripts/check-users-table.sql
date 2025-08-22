-- Script para verificar la estructura de la tabla users
-- Esto nos ayudará a entender qué campos usar para el nombre del usuario

-- 1. Verificar estructura de la tabla users
DESCRIBE users;

-- 2. Mostrar algunos usuarios de ejemplo
SELECT * FROM users LIMIT 3;

-- 3. Verificar si existe algún campo de nombre
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION; 