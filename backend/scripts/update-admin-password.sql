-- Script para actualizar la contraseña del usuario administrador
-- Ejecutar en MySQL para corregir el problema de login

USE cosmetics_db;

-- Actualizar la contraseña del usuario administrador
-- Nueva contraseña: admin123 (hasheada con bcrypt)
UPDATE users 
SET password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re'
WHERE phone = '+1234567890' AND role = 'admin';

-- Verificar que se actualizó correctamente
SELECT id, name, phone, role, LENGTH(password) as password_length 
FROM users 
WHERE phone = '+1234567890';

-- Mensaje de confirmación
SELECT 'Contraseña del administrador actualizada correctamente' as mensaje; 