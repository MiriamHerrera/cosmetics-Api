-- Script para completar la configuración de encuestas
-- Ejecutar DESPUÉS de fix-duplicate-votes.sql

-- 1. Crear índices para mejorar rendimiento (si no existen)
CREATE INDEX IF NOT EXISTS `idx_surveys_status` ON surveys(`status`);
CREATE INDEX IF NOT EXISTS `idx_surveys_created_by` ON surveys(`created_by`);
CREATE INDEX IF NOT EXISTS `idx_survey_options_survey_id` ON survey_options(`survey_id`);
CREATE INDEX IF NOT EXISTS `idx_survey_options_approved` ON survey_options(`is_approved`);
CREATE INDEX IF NOT EXISTS `idx_survey_options_created_by` ON survey_options(`created_by`);
CREATE INDEX IF NOT EXISTS `idx_survey_votes_survey_id` ON survey_votes(`survey_id`);
CREATE INDEX IF NOT EXISTS `idx_survey_votes_option_id` ON survey_votes(`option_id`);
CREATE INDEX IF NOT EXISTS `idx_survey_votes_user_id` ON survey_votes(`user_id`);

-- 2. Actualizar datos existentes para que sean compatibles
-- Asignar created_by = 1 para encuestas existentes (asumiendo que existe un usuario admin con ID 1)
UPDATE surveys SET created_by = 1 WHERE created_by IS NULL;

-- Asignar created_by = 1 para opciones existentes
UPDATE survey_options SET created_by = 1 WHERE created_by IS NULL;

-- Marcar opciones existentes como aprobadas (para mantener compatibilidad)
UPDATE survey_options SET is_approved = 1 WHERE is_approved IS NULL;

-- 3. Verificar la estructura final
DESCRIBE surveys;
DESCRIBE survey_options;
DESCRIBE survey_votes;

-- 4. Mostrar datos existentes
SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
UNION ALL
SELECT 'Survey Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Survey Votes', COUNT(*) FROM survey_votes;

-- 5. Mostrar algunas encuestas de ejemplo
SELECT id, question, status, created_by, created_at FROM surveys LIMIT 5;

-- 6. Mostrar algunas opciones de ejemplo
SELECT id, survey_id, option_text, is_approved, created_by FROM survey_options LIMIT 5;

-- 7. Mostrar algunos votos de ejemplo
SELECT survey_id, user_id, COUNT(*) as vote_count FROM survey_votes GROUP BY survey_id, user_id LIMIT 5;

-- 8. Verificar que no hay duplicados
SELECT 
  survey_id, 
  user_id, 
  COUNT(*) as vote_count
FROM survey_votes 
GROUP BY survey_id, user_id 
HAVING COUNT(*) > 1;

-- 9. Mostrar encuestas activas
SELECT 
  s.id,
  s.question,
  s.description,
  s.status,
  COUNT(DISTINCT so.id) as options_count,
  COUNT(DISTINCT sv.id) as total_votes
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
WHERE s.status = 'open'
GROUP BY s.id, s.question, s.description, s.status
ORDER BY s.created_at DESC; 