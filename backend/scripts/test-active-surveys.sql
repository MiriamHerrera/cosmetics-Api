-- Script para probar que las encuestas activas se muestren correctamente
-- Este script crea encuestas de prueba y verifica que se muestren en el panel del cliente

USE cosmetics_db;

-- 1. Limpiar datos de prueba existentes (opcional)
-- DELETE FROM survey_votes WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%');
-- DELETE FROM survey_options WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%');
-- DELETE FROM surveys WHERE question LIKE '%TEST%';

-- 2. Crear encuesta de prueba en estado draft
INSERT INTO surveys (question, description, status, created_by) VALUES 
('¿Qué productos te gustaría que incluyamos en nuestro catálogo? [TEST]', 'Encuesta de prueba para verificar funcionalidad', 'draft', 1);

SET @survey_id = LAST_INSERT_ID();

-- 3. Agregar opciones iniciales (aprobadas por admin)
INSERT INTO survey_options (survey_id, option_text, description, created_by, is_approved, approved_by, approved_at) VALUES
(@survey_id, 'Productos de cuidado facial', 'Cremas, limpiadores, mascarillas', 1, 1, 1, NOW()),
(@survey_id, 'Productos de maquillaje', 'Labiales, sombras, bases', 1, 1, 1, NOW()),
(@survey_id, 'Productos de cuidado corporal', 'Lociones, exfoliantes, aceites', 1, 1, 1, NOW());

-- 4. Verificar que la encuesta está en draft (no visible para clientes)
SELECT 
    'Estado de Encuesta de Prueba' as info,
    id,
    question,
    status,
    created_at
FROM surveys 
WHERE id = @survey_id;

-- 5. Verificar que las opciones están aprobadas
SELECT 
    'Opciones de la Encuesta' as info,
    id,
    option_text,
    is_approved,
    created_at
FROM survey_options 
WHERE survey_id = @survey_id
ORDER BY is_approved DESC, created_at ASC;

-- 6. Cambiar estado a active para hacerla visible
UPDATE surveys SET status = 'active' WHERE id = @survey_id;

-- 7. Verificar que ahora está activa
SELECT 
    'Encuesta Activada' as info,
    id,
    question,
    status,
    created_at
FROM surveys 
WHERE id = @survey_id;

-- 8. Simular algunos votos para probar la funcionalidad
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES 
(@survey_id, @survey_id, 1),      -- Usuario 1 vota por opción 1
(@survey_id, @survey_id + 1, 2), -- Usuario 2 vota por opción 2
(@survey_id, @survey_id + 2, 3); -- Usuario 3 vota por opción 3

-- 9. Verificar votos registrados
SELECT 
    'Votos Registrados' as info,
    sv.id,
    sv.user_id,
    so.option_text,
    sv.created_at
FROM survey_votes sv
INNER JOIN survey_options so ON sv.option_id = so.id
WHERE sv.survey_id = @survey_id
ORDER BY sv.created_at;

-- 10. Verificar que la encuesta aparece en la consulta de encuestas activas
SELECT 
    'Consulta de Encuestas Activas' as info,
    s.id,
    s.question,
    s.status,
    s.options_count,
    s.total_votes
FROM (
    SELECT 
        s.id,
        s.question,
        s.description,
        s.status,
        s.created_at,
        COUNT(DISTINCT so.id) as options_count,
        COUNT(DISTINCT sv.id) as total_votes
    FROM surveys s
    LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
    LEFT JOIN survey_votes sv ON s.id = sv.survey_id
    WHERE s.status = 'active'
    GROUP BY s.id, s.question, s.description, s.created_at
    ORDER BY s.created_at DESC
) s
WHERE s.id = @survey_id;

-- 11. Verificar opciones con conteo de votos
SELECT 
    'Opciones con Votos' as info,
    so.id,
    so.option_text,
    so.is_approved,
    COUNT(sv.id) as vote_count
FROM survey_options so
LEFT JOIN survey_votes sv ON so.id = sv.option_id
WHERE so.survey_id = @survey_id AND so.is_approved = 1
GROUP BY so.id, so.option_text, so.is_approved
ORDER BY vote_count DESC, so.created_at ASC;

-- 12. Mostrar estadísticas finales
SELECT 
    'Estadísticas Finales' as info,
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

-- 13. Limpiar datos de prueba (descomentar para limpiar)
-- DELETE FROM survey_votes WHERE survey_id = @survey_id;
-- DELETE FROM survey_options WHERE survey_id = @survey_id;
-- DELETE FROM surveys WHERE id = @survey_id; 