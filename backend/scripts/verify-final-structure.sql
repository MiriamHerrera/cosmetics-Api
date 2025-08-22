-- Script para verificar la estructura final de todas las tablas de encuestas
-- Este script confirma que todos los campos necesarios estén presentes

-- 1. Verificar estructura de surveys
SELECT '=== SURVEYS TABLE ===' as info;
DESCRIBE surveys;

-- 2. Verificar estructura de survey_options
SELECT '=== SURVEY_OPTIONS TABLE ===' as info;
DESCRIBE survey_options;

-- 3. Verificar estructura de survey_votes
SELECT '=== SURVEY_VOTES TABLE ===' as info;
DESCRIBE survey_votes;

-- 4. Verificar estructura de users
SELECT '=== USERS TABLE ===' as info;
DESCRIBE users;

-- 5. Verificar que los campos críticos existan
SELECT 
  'Surveys' as table_name,
  COUNT(CASE WHEN COLUMN_NAME = 'created_at' THEN 1 END) as has_created_at,
  COUNT(CASE WHEN COLUMN_NAME = 'updated_at' THEN 1 END) as has_updated_at,
  COUNT(CASE WHEN COLUMN_NAME = 'created_by' THEN 1 END) as has_created_by
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' AND TABLE_NAME = 'surveys'

UNION ALL

SELECT 
  'Survey Options' as table_name,
  COUNT(CASE WHEN COLUMN_NAME = 'created_at' THEN 1 END) as has_created_at,
  COUNT(CASE WHEN COLUMN_NAME = 'updated_at' THEN 1 END) as has_updated_at,
  COUNT(CASE WHEN COLUMN_NAME = 'created_by' THEN 1 END) as has_created_by
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' AND TABLE_NAME = 'survey_options'

UNION ALL

SELECT 
  'Survey Votes' as table_name,
  COUNT(CASE WHEN COLUMN_NAME = 'created_at' THEN 1 END) as has_created_at,
  COUNT(CASE WHEN COLUMN_NAME = 'updated_at' THEN 1 END) as has_updated_at,
  COUNT(CASE WHEN COLUMN_NAME = 'user_id' THEN 1 END) as has_user_id
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' AND TABLE_NAME = 'survey_votes'

UNION ALL

SELECT 
  'Users' as table_name,
  COUNT(CASE WHEN COLUMN_NAME = 'id' THEN 1 END) as has_id,
  COUNT(CASE WHEN COLUMN_NAME = 'username' THEN 1 END) as has_username,
  COUNT(CASE WHEN COLUMN_NAME = 'email' THEN 1 END) as has_email
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'cosmetics_db' AND TABLE_NAME = 'users';

-- 6. Mostrar estadísticas finales
SELECT '=== FINAL STATISTICS ===' as info;
SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
UNION ALL
SELECT 'Survey Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Survey Votes', COUNT(*) FROM survey_votes
UNION ALL
SELECT 'Users', COUNT(*) FROM users; 