-- Script CORREGIDO para probar el nuevo sistema de votos con opciones pendientes
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

-- 3. Agregar una opción pendiente para probar (solo si no existe)
INSERT INTO survey_options (survey_id, option_text, description, created_by, is_approved) 
SELECT 
    s.id,
    'Productos de cuidado de uñas [PENDIENTE]',
    'Esmaltes, fortalecedores, removedores',
    2,
    0
FROM surveys s
WHERE s.question LIKE '%TEST%'
AND NOT EXISTS (
    SELECT 1 FROM survey_options so 
    WHERE so.survey_id = s.id 
    AND so.option_text LIKE '%cuidado de uñas%'
);

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

-- 6. Obtener IDs de manera segura para pruebas
SET @survey_id = (SELECT id FROM surveys WHERE question LIKE '%TEST%' LIMIT 1);
SET @approved_option_id = (SELECT id FROM survey_options WHERE survey_id = @survey_id AND is_approved = 1 LIMIT 1);

-- 7. Verificar que tenemos los IDs necesarios
SELECT 
    'IDs para Pruebas' as info,
    @survey_id as survey_id,
    @approved_option_id as approved_option_id,
    CASE 
        WHEN @survey_id IS NULL THEN 'ERROR: No hay encuesta TEST'
        WHEN @approved_option_id IS NULL THEN 'ERROR: No hay opciones aprobadas'
        ELSE 'OK: IDs obtenidos correctamente'
    END as status;

-- 8. Solo continuar si tenemos los IDs necesarios
-- Probar sistema de votos/desvotos
IF @survey_id IS NOT NULL AND @approved_option_id IS NOT NULL THEN
    -- Simular voto del usuario 1 en opción aprobada
    INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES 
    (@survey_id, @approved_option_id, 1);
    
    SELECT 'Voto Agregado Exitosamente' as info;
ELSE
    SELECT 'ERROR: No se pueden agregar votos - faltan IDs' as info;
END IF;

-- 9. Verificar voto agregado
SELECT 
    'Voto Agregado' as info,
    sv.id,
    sv.user_id,
    so.option_text,
    sv.created_at
FROM survey_votes sv
INNER JOIN survey_options so ON sv.option_id = so.id
WHERE sv.user_id = 1 AND sv.survey_id = @survey_id;

-- 10. Simular desvoto (eliminar voto)
IF @survey_id IS NOT NULL AND @approved_option_id IS NOT NULL THEN
    DELETE FROM survey_votes 
    WHERE user_id = 1 AND option_id = @approved_option_id;
    
    SELECT 'Desvoto Realizado Exitosamente' as info;
ELSE
    SELECT 'ERROR: No se puede realizar desvoto - faltan IDs' as info;
END IF;

-- 11. Verificar que el voto fue eliminado
SELECT 
    'Después del Desvoto' as info,
    COUNT(*) as total_votes
FROM survey_votes 
WHERE survey_id = @survey_id;

-- 12. Verificar consulta de encuestas activas con opciones
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

-- 13. Mostrar opciones con estados
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
WHERE so.survey_id = @survey_id
GROUP BY so.id, so.option_text, so.is_approved
ORDER BY so.is_approved DESC, vote_count DESC, so.created_at ASC;

-- 14. Estadísticas finales
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