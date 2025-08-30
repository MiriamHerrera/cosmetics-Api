-- Script para corregir el tipo de dato de la columna phone
-- Cambiar de mediumint a VARCHAR(20) para permitir números de teléfono

-- Verificar la estructura actual
DESCRIBE users;

-- Cambiar el tipo de dato de la columna phone
ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NOT NULL;

-- Verificar que el cambio se aplicó correctamente
DESCRIBE users;

-- Opcional: Agregar índice para búsquedas rápidas
-- CREATE INDEX idx_users_phone ON users(phone);

-- Verificar que los datos existentes se mantuvieron
SELECT id, phone, name, email, role FROM users LIMIT 5;
