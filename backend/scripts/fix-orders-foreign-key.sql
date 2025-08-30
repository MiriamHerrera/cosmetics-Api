-- Script para corregir incompatibilidad de tipos en tabla orders
-- Problema: user_id y id tienen tipos incompatibles para foreign key

USE `railway`;

-- ========================================
-- PASO 1: Verificar tipos actuales
-- ========================================

-- Verificar estructura de tabla users
SELECT 'Estructura de users:' as mensaje;
DESCRIBE users;

-- Verificar estructura de tabla orders
SELECT 'Estructura de orders:' as mensaje;
DESCRIBE orders;

-- ========================================
-- PASO 2: Corregir tipos de datos
-- ========================================

-- Opción 1: Modificar orders para que coincida con users
-- Si users.id es bigint(20), hacer orders.user_id también bigint(20)

-- Eliminar la restricción de clave foránea existente
ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1;

-- Modificar el tipo de user_id para que coincida con users.id
ALTER TABLE orders MODIFY COLUMN user_id bigint(20) NULL;

-- Recrear la restricción de clave foránea
ALTER TABLE orders ADD CONSTRAINT orders_ibfk_1 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- PASO 3: Verificar la corrección
-- ========================================

-- Verificar que la restricción se creó correctamente
SELECT 'Restricciones de orders:' as mensaje;
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'railway' 
AND TABLE_NAME = 'orders' 
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verificar estructura final
SELECT 'Estructura final de orders:' as mensaje;
DESCRIBE orders;

-- ========================================
-- PASO 4: Alternativa si la opción 1 falla
-- ========================================

-- Si la opción 1 falla, usar esta alternativa:
-- Modificar users.id para que coincida con orders.user_id

/*
-- Eliminar restricciones que dependan de users.id
ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1;
ALTER TABLE surveys DROP FOREIGN KEY surveys_created_by_fk;
ALTER TABLE surveys DROP FOREIGN KEY surveys_closed_by_fk;
ALTER TABLE survey_options DROP FOREIGN KEY survey_options_created_by_fk;
ALTER TABLE survey_options DROP FOREIGN KEY survey_options_approved_by_fk;
ALTER TABLE survey_votes DROP FOREIGN KEY survey_votes_user_fk;

-- Modificar users.id
ALTER TABLE users MODIFY COLUMN id int(11) NOT NULL AUTO_INCREMENT;

-- Recrear todas las restricciones
ALTER TABLE orders ADD CONSTRAINT orders_ibfk_1 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE surveys ADD CONSTRAINT surveys_created_by_fk 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE surveys ADD CONSTRAINT surveys_closed_by_fk 
FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE survey_options ADD CONSTRAINT survey_options_created_by_fk 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE survey_options ADD CONSTRAINT survey_options_approved_by_fk 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE survey_votes ADD CONSTRAINT survey_votes_user_fk 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
*/

-- ========================================
-- PASO 5: Verificación final
-- ========================================

-- Probar que la restricción funciona
SELECT 'Verificación final:' as mensaje;
SELECT 
    'users.id' as tabla_columna,
    COLUMN_TYPE as tipo
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'railway' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'id'

UNION ALL

SELECT 
    'orders.user_id' as tabla_columna,
    COLUMN_TYPE as tipo
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'railway' 
AND TABLE_NAME = 'orders' 
AND COLUMN_NAME = 'user_id';

-- Mensaje de éxito
SELECT '✅ Corrección aplicada exitosamente' as resultado;
