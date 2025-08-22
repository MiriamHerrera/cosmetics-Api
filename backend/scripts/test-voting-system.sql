-- Script para probar el nuevo sistema de votos con opciones pendientes
-- Este script verifica que el sistema de votos/desvotos funcione correctamente

USE cosmetics_db;

-- 1. Verificar encuesta de prueba existente
SELECT 
    'Encuesta de Prueba' as info,
    id,
    question,
    status,
    created_at
FROM surveys 
WHERE question LIKE '%TEST%';

-- 2. Verificar opciones de la encuesta
SELECT 
    'Opciones de Encuesta' as info,
    id,
    option_text,
    is_approved,
    created_at
FROM survey_options 
WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
ORDER BY is_approved DESC, created_at ASC;

-- 3. Agregar una opción pendiente para probar
INSERT INTO survey_options (survey_id, option_text, description, created_by, is_approved) VALUES
((SELECT id FROM surveys WHERE question LIKE '%TEST%' LIMIT 1), 
 'Productos de cuidado de uñas [PENDIENTE]', 
 'Esmaltes, fortalecedores, removedores', 
 2, 0);

-- 4. Verificar todas las opciones (aprobadas y pendientes)
SELECT 
    'Todas las Opciones' as info,
    id,
    option_text,
    is_approved,
    CASE 
        WHEN is_approved = 1 THEN 'approved'
        WHEN is_approved = 0 THEN 'pending'
        ELSE 'unknown'
    END as status,
    created_at
FROM survey_options 
WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
ORDER BY is_approved DESC, created_at ASC;

-- 5. Verificar votos existentes
SELECT 
    'Votos Existentes' as info,
    sv.id,
    sv.user_id,
    so.option_text,
    so.is_approved,
    sv.created_at
FROM survey_votes sv
INNER JOIN survey_options so ON sv.option_id = so.id
WHERE sv.survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
ORDER BY sv.created_at;

-- 6. Probar sistema de votos/desvotos
-- Simular voto del usuario 1 en opción 1
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES 
((SELECT id FROM surveys WHERE question LIKE '%TEST%' LIMIT 1),
 (SELECT id FROM survey_options WHERE survey_id = (SELECT id FROM surveys WHERE question LIKE '%TEST%' LIMIT 1) AND is_approved = 1 LIMIT 1),
 1);

-- 7. Verificar voto agregado
SELECT 
    'Voto Agregado' as info,
    sv.id,
    sv.user_id,
    so.option_text,
    sv.created_at
FROM survey_votes sv
INNER JOIN survey_options so ON sv.option_id = so.id
WHERE sv.user_id = 1 AND sv.survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%');

-- 8. Simular desvoto (eliminar voto)
DELETE FROM survey_votes 
WHERE user_id = 1 AND option_id = (
    SELECT id FROM survey_options 
    WHERE survey_id = (SELECT id FROM surveys WHERE question LIKE '%TEST%' LIMIT 1) 
    AND is_approved = 1 
    LIMIT 1
);

-- 9. Verificar que el voto fue eliminado
SELECT 
    'Después del Desvoto' as info,
    COUNT(*) as total_votes
FROM survey_votes 
WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%');

-- 10. Verificar consulta de encuestas activas con opciones
SELECT 
    'Consulta de Encuestas Activas' as info,
    s.id,
    s.question,
    s.status,
    COUNT(DISTINCT so.id) as total_options,
    COUNT(DISTINCT CASE WHEN so.is_approved = 1 THEN so.id END) as approved_options,
    COUNT(DISTINCT CASE WHEN so.is_approved = 0 THEN so.id END) as pending_options,
    COUNT(DISTINCT sv.id) as total_votes
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
WHERE s.status = 'active'
GROUP BY s.id, s.question, s.status
ORDER BY s.created_at DESC;

-- 11. Mostrar opciones con estados
SELECT 
    'Opciones con Estados' as info,
    so.id,
    so.option_text,
    CASE 
        WHEN so.is_approved = 1 THEN 'approved'
        WHEN so.is_approved = 0 THEN 'pending'
        ELSE 'unknown'
    END as status,
    COUNT(sv.id) as vote_count
FROM survey_options so
LEFT JOIN survey_votes sv ON so.id = sv.option_id
WHERE so.survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
GROUP BY so.id, so.option_text, so.is_approved
ORDER BY so.is_approved DESC, vote_count DESC, so.created_at ASC;

-- 12. Estadísticas finales
SELECT 
    'Estadísticas Finales' as info,
    COUNT(*) as total_surveys,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_surveys,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_surveys
FROM surveys;

SELECT 
    'Estadísticas de Opciones' as info,
    COUNT(*) as total_options,
    COUNT(CASE WHEN is_approved = 1 THEN 1 END) as approved_options,
    COUNT(CASE WHEN is_approved = 0 THEN 1 END) as pending_options
FROM survey_options;

SELECT 
    'Estadísticas de Votos' as info,
    COUNT(*) as total_votes,
    COUNT(DISTINCT user_id) as unique_voters
FROM survey_votes; 