-- Script para probar que las consultas de encuestas funcionen correctamente
-- Este script verifica que no haya errores de SQL en las consultas principales

-- 1. Verificar que podemos obtener encuestas activas
SELECT 
  s.id,
  s.question,
  s.description,
  s.status,
  s.created_at,
  s.updated_at,
  s.created_by,
  COUNT(DISTINCT so.id) as options_count,
  COUNT(DISTINCT sv.id) as total_votes
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
WHERE s.status = 'open'
GROUP BY s.id, s.question, s.description, s.status, s.created_at, s.updated_at, s.created_by
ORDER BY s.created_at DESC;

-- 2. Verificar que podemos obtener opciones pendientes
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

-- 3. Verificar que podemos obtener todas las encuestas (admin)
SELECT 
  s.id,
  s.question,
  s.description,
  s.status,
  s.created_at,
  s.updated_at,
  u.username as created_by,
  COUNT(DISTINCT so.id) as options_count,
  COUNT(DISTINCT sv.id) as total_votes
FROM surveys s
LEFT JOIN users u ON s.created_by = u.id
LEFT JOIN survey_options so ON s.id = so.survey_id
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
GROUP BY s.id, s.question, s.description, s.status, s.created_at, s.updated_at, u.username
ORDER BY s.created_at DESC;

-- 4. Verificar que la tabla users tiene el campo username
SELECT id, username, email FROM users LIMIT 5;

-- 5. Mostrar estadísticas generales
SELECT 
  'Total Surveys' as metric, COUNT(*) as value FROM surveys
UNION ALL
SELECT 'Active Surveys', COUNT(*) FROM surveys WHERE status = 'open'
UNION ALL
SELECT 'Total Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Pending Options', COUNT(*) FROM survey_options WHERE is_approved = 0
UNION ALL
SELECT 'Total Votes', COUNT(*) FROM survey_votes
UNION ALL
SELECT 'Total Users', COUNT(*) FROM users; 