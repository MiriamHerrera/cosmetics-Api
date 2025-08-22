-- Script para agregar campo username a la tabla users
-- Esto es necesario para que el sistema de encuestas funcione correctamente

-- 1. Verificar si la columna username ya existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Column username already exists'
    ELSE 'Column username does not exist'
  END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'username';

-- 2. Agregar la columna username si no existe
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS `username` VARCHAR(50) UNIQUE COMMENT 'Nombre de usuario único' AFTER `id`;

-- 3. Actualizar usuarios existentes con un username basado en su ID
UPDATE users 
SET username = CONCAT('user_', id) 
WHERE username IS NULL OR username = '';

-- 4. Verificar la estructura final
DESCRIBE users;

-- 5. Mostrar algunos usuarios con sus usernames
SELECT id, username, email FROM users LIMIT 5; 