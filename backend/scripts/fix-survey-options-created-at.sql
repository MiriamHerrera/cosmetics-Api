-- Script para agregar la columna created_at a survey_options
-- Esta columna es necesaria para que el sistema de encuestas funcione

-- 1. Verificar si la columna ya existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'Column created_at already exists'
    ELSE 'Column created_at needs to be added'
  END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME = 'survey_options' 
AND COLUMN_NAME = 'created_at';

-- 2. Agregar la columna created_at si no existe
ALTER TABLE survey_options 
ADD COLUMN IF NOT EXISTS `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación de la opción' AFTER `approved_at`;

-- 3. Verificar que la columna se agregó correctamente
DESCRIBE survey_options;

-- 4. Actualizar registros existentes con una fecha de creación
UPDATE survey_options 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- 5. Verificar que todos los registros tienen created_at
SELECT 
  'Total rows' as metric, COUNT(*) as value FROM survey_options
UNION ALL
SELECT 'Rows with created_at', COUNT(*) FROM survey_options WHERE created_at IS NOT NULL
UNION ALL
SELECT 'Rows without created_at', COUNT(*) FROM survey_options WHERE created_at IS NULL;

-- 6. Probar la consulta que estaba fallando
SELECT 
  so.id,
  so.option_text,
  so.description,
  so.created_at,
  so.admin_notes,
  s.question as survey_question,
  s.id as survey_id,
  u.username as suggested_by
FROM survey_options so
INNER JOIN surveys s ON so.survey_id = s.id
INNER JOIN users u ON so.created_by = u.id
WHERE so.is_approved = 0
ORDER BY so.created_at ASC; 