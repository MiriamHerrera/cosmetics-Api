-- Script para limpiar votos duplicados antes de aplicar el constraint único
-- Este script elimina votos duplicados manteniendo solo el más reciente

-- 1. Identificar votos duplicados
SELECT 
  survey_id, 
  user_id, 
  COUNT(*) as vote_count,
  GROUP_CONCAT(id ORDER BY created_at DESC) as vote_ids
FROM survey_votes 
GROUP BY survey_id, user_id 
HAVING COUNT(*) > 1;

-- 2. Crear tabla temporal para mantener solo el voto más reciente
CREATE TEMPORARY TABLE temp_unique_votes AS
SELECT 
  survey_id,
  user_id,
  MAX(created_at) as latest_vote_time
FROM survey_votes 
GROUP BY survey_id, user_id;

-- 3. Eliminar votos duplicados, manteniendo solo el más reciente
DELETE sv FROM survey_votes sv
LEFT JOIN temp_unique_votes tuv ON 
  sv.survey_id = tuv.survey_id AND 
  sv.user_id = tuv.user_id AND 
  sv.created_at = tuv.latest_vote_time
WHERE tuv.survey_id IS NULL;

-- 4. Verificar que no hay duplicados
SELECT 
  survey_id, 
  user_id, 
  COUNT(*) as vote_count
FROM survey_votes 
GROUP BY survey_id, user_id 
HAVING COUNT(*) > 1;

-- 5. Ahora sí podemos agregar el constraint único
ALTER TABLE survey_votes 
ADD CONSTRAINT `unique_vote` UNIQUE (`survey_id`, `user_id`) COMMENT 'Un usuario solo puede votar una vez por encuesta';

-- 6. Limpiar tabla temporal
DROP TEMPORARY TABLE IF EXISTS temp_unique_votes;

-- 7. Verificar la estructura final
DESCRIBE survey_votes;

-- 8. Mostrar estadísticas finales
SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
UNION ALL
SELECT 'Survey Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Survey Votes', COUNT(*) FROM survey_votes; 