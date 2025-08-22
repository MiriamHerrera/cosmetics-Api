-- Script para verificar la estructura actual de las tablas de encuestas
-- Este script nos ayudará a entender qué campos ya existen y cuáles faltan

-- 1. Verificar estructura de la tabla surveys
DESCRIBE surveys;

-- 2. Verificar estructura de la tabla survey_options
DESCRIBE survey_options;

-- 3. Verificar estructura de la tabla survey_votes
DESCRIBE survey_votes;

-- 4. Verificar estructura de la tabla users (para ver si tiene username)
DESCRIBE users;

-- 5. Mostrar algunos datos de ejemplo
SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
UNION ALL
SELECT 'Survey Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Survey Votes', COUNT(*) FROM survey_votes
UNION ALL
SELECT 'Users', COUNT(*) FROM users;

-- 6. Mostrar algunas encuestas de ejemplo
SELECT id, question, status, created_at FROM surveys LIMIT 3;

-- 7. Mostrar algunas opciones de ejemplo
SELECT id, survey_id, option_text, product_id FROM survey_options LIMIT 3;

-- 8. Mostrar algunos votos de ejemplo
SELECT survey_id, user_id, created_at FROM survey_votes LIMIT 3; 