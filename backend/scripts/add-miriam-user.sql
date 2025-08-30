-- Script para agregar usuario Miriam Herrera
-- Ejecutar este script para crear el usuario con los datos especificados

-- Verificar si el usuario ya existe
SELECT IF(
  EXISTS(
    SELECT id FROM users WHERE phone = '8124307494'
  ),
  'El usuario ya existe con el teléfono 8124307494',
  'Agregando usuario Miriam Herrera...'
) as status;

-- Insertar el usuario Miriam Herrera
INSERT IGNORE INTO users (name, phone, password, role, is_active, created_at, updated_at) 
VALUES (
  'Miriam Herrera',
  '8124307494',
  '$2a$12$Jl4zC7Oj53pq8FALHTf1yuaLWNZjshqY206Amq8gjCCf.3crc0sWi',
  'client',
  1,
  NOW(),
  NOW()
);

-- Verificar que el usuario fue creado
SELECT 
  id,
  name,
  phone,
  role,
  is_active,
  created_at
FROM users 
WHERE phone = '8124307494';

-- Mostrar mensaje de confirmación
SELECT 
  CASE 
    WHEN ROW_COUNT() > 0 THEN 'Usuario Miriam Herrera creado exitosamente'
    ELSE 'Usuario ya existía o no se pudo crear'
  END as resultado;
