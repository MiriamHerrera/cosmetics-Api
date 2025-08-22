-- Script para probar la consulta de opciones pendientes que está fallando
-- Esta es la consulta exacta que usa el controlador

-- 1. Verificar que la consulta funciona
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

-- 2. Verificar que no hay valores NULL problemáticos
SELECT 
  'survey_options' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN survey_id IS NULL THEN 1 END) as null_survey_id,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as null_created_by
FROM survey_options;

-- 3. Verificar que no hay valores NULL problemáticos en surveys
SELECT 
  'surveys' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN id IS NULL THEN 1 END) as null_id
FROM surveys;

-- 4. Verificar que no hay valores NULL problemáticos en users
SELECT 
  'users' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN id IS NULL THEN 1 END) as null_id,
  COUNT(CASE WHEN username IS NULL THEN 1 END) as null_username
FROM users;

-- 5. Verificar las relaciones entre tablas
SELECT 
  'survey_options sin survey válido' as issue,
  COUNT(*) as count
FROM survey_options so
LEFT JOIN surveys s ON so.survey_id = s.id
WHERE s.id IS NULL

UNION ALL

SELECT 
  'survey_options sin user válido' as issue,
  COUNT(*) as count
FROM survey_options so
LEFT JOIN users u ON so.created_by = u.id
WHERE u.id IS NULL;

-- 6. Mostrar algunos ejemplos de datos
SELECT 
  'Ejemplos de survey_options:' as info;
SELECT id, survey_id, created_by, is_approved FROM survey_options LIMIT 5;

SELECT 
  'Ejemplos de surveys:' as info;
SELECT id, question, status FROM surveys LIMIT 5;

SELECT 
  'Ejemplos de users:' as info;
SELECT id, username, email FROM users LIMIT 5; 