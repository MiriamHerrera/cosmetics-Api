-- Script para corregir la estructura de las tablas de encuestas
-- Ejecutar este script para sincronizar la base de datos con el código

USE cosmetics_db;

-- 1. Cambiar el enum de status en surveys de 'open' a 'active'
ALTER TABLE surveys 
MODIFY COLUMN status ENUM('draft', 'active', 'closed') DEFAULT 'draft' COMMENT 'Estado de la encuesta';

-- 2. Actualizar registros existentes que tengan 'open' a 'active'
UPDATE surveys SET status = 'active' WHERE status = 'open';

-- 3. Agregar restricción UNIQUE para evitar votos duplicados del mismo usuario en la misma opción
-- Primero eliminar votos duplicados existentes (mantener el más reciente)
DELETE sv1 FROM survey_votes sv1
INNER JOIN survey_votes sv2 
WHERE sv1.id < sv2.id 
AND sv1.user_id = sv2.user_id 
AND sv1.option_id = sv2.option_id;

-- Agregar índice UNIQUE
ALTER TABLE survey_votes 
ADD UNIQUE KEY unique_user_option (user_id, option_id);

-- 4. Agregar restricción UNIQUE para evitar que un usuario vote múltiples veces en la misma encuesta
-- (opcional: si quieres limitar a un voto por encuesta en lugar de por opción)
-- ALTER TABLE survey_votes 
-- ADD UNIQUE KEY unique_user_survey (user_id, survey_id);

-- 5. Verificar que las opciones aprobadas tengan approved_by y approved_at cuando is_approved = 1
UPDATE survey_options 
SET approved_at = created_at, approved_by = created_by 
WHERE is_approved = 1 AND approved_at IS NULL;

-- 6. Agregar índices para mejorar el rendimiento
CREATE INDEX idx_surveys_status_created ON surveys(status, created_at);
CREATE INDEX idx_survey_options_survey_approved ON survey_options(survey_id, is_approved);
CREATE INDEX idx_survey_votes_survey_user ON survey_votes(survey_id, user_id);

-- 7. Verificar la estructura final
SELECT 
    'surveys' as table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' AND TABLE_NAME = 'surveys'
ORDER BY ORDINAL_POSITION;

SELECT 
    'survey_options' as table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' AND TABLE_NAME = 'survey_options'
ORDER BY ORDINAL_POSITION;

SELECT 
    'survey_votes' as table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' AND TABLE_NAME = 'survey_votes'
ORDER BY ORDINAL_POSITION;

-- 8. Mostrar estadísticas actuales
SELECT 
    'Estadísticas de Encuestas' as info,
    COUNT(*) as total_surveys,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_surveys,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_surveys,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_surveys
FROM surveys;

SELECT 
    'Estadísticas de Opciones' as info,
    COUNT(*) as total_options,
    COUNT(CASE WHEN is_approved = 0 THEN 1 END) as pending_options,
    COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved_options
FROM survey_options;

SELECT 
    'Estadísticas de Votos' as info,
    COUNT(*) as total_votes,
    COUNT(DISTINCT user_id) as unique_voters,
    COUNT(DISTINCT survey_id) as surveys_with_votes
FROM survey_votes; 