-- Script para verificar que los votos del usuario están realmente en la base de datos
-- Este script confirma que el problema no está en la base de datos

-- 1. Verificar votos existentes en la tabla survey_votes
SELECT '=== VOTOS EXISTENTES EN LA BASE DE DATOS ===' as info;

SELECT 
    sv.id,
    sv.survey_id,
    s.question as encuesta,
    sv.option_id,
    so.option_text as opcion,
    sv.user_id,
    u.username as usuario,
    sv.created_at
FROM survey_votes sv
JOIN surveys s ON sv.survey_id = s.id
JOIN survey_options so ON sv.option_id = so.id
JOIN users u ON sv.user_id = u.id
ORDER BY sv.created_at DESC;

-- 2. Verificar votos por usuario específico
SELECT '=== VOTOS POR USUARIO ===' as info;

SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(sv.id) as total_votos
FROM users u
LEFT JOIN survey_votes sv ON u.id = sv.user_id
WHERE u.role = 'user'
GROUP BY u.id, u.username, u.email
ORDER BY total_votos DESC;

-- 3. Verificar votos por encuesta específica
SELECT '=== VOTOS POR ENCUESTA ===' as info;

SELECT 
    s.id as survey_id,
    s.question as encuesta,
    s.status,
    COUNT(sv.id) as total_votos,
    COUNT(DISTINCT sv.user_id) as usuarios_que_votaron
FROM surveys s
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
WHERE s.status = 'active'
GROUP BY s.id, s.question, s.status
ORDER BY s.id;

-- 4. Verificar votos por opción específica
SELECT '=== VOTOS POR OPCIÓN ===' as info;

SELECT 
    so.id as option_id,
    so.option_text,
    so.survey_id,
    s.question as encuesta,
    COUNT(sv.id) as votos_totales,
    GROUP_CONCAT(u.username SEPARATOR ', ') as usuarios_que_votaron
FROM survey_options so
JOIN surveys s ON so.survey_id = s.id
LEFT JOIN survey_votes sv ON so.id = sv.option_id
LEFT JOIN users u ON sv.user_id = u.id
WHERE so.is_approved = 1
GROUP BY so.id, so.option_text, so.survey_id, s.question
ORDER BY so.survey_id, so.id;

-- 5. Verificar estructura de la tabla survey_votes
SELECT '=== ESTRUCTURA DE LA TABLA SURVEY_VOTES ===' as info;

DESCRIBE survey_votes;

-- 6. Verificar restricciones y índices
SELECT '=== RESTRICCIONES Y ÍNDICES ===' as info;

SHOW INDEX FROM survey_votes;

-- 7. Verificar si hay datos huérfanos
SELECT '=== VERIFICANDO DATOS HUÉRFANOS ===' as info;

SELECT 
    'Votos sin encuesta válida' as tipo,
    COUNT(*) as cantidad
FROM survey_votes sv
LEFT JOIN surveys s ON sv.survey_id = s.id
WHERE s.id IS NULL

UNION ALL

SELECT 
    'Votos sin opción válida' as tipo,
    COUNT(*) as cantidad
FROM survey_votes sv
LEFT JOIN survey_options so ON sv.option_id = so.id
WHERE so.id IS NULL

UNION ALL

SELECT 
    'Votos sin usuario válido' as tipo,
    COUNT(*) as cantidad
FROM survey_votes sv
LEFT JOIN users u ON sv.user_id = u.id
WHERE u.id IS NULL;

-- 8. Resumen final
SELECT '=== RESUMEN FINAL ===' as info;

SELECT 
    'Verificación completada' as estado,
    (SELECT COUNT(*) FROM survey_votes) as total_votos_en_db,
    (SELECT COUNT(DISTINCT user_id) FROM survey_votes) as usuarios_que_votaron,
    (SELECT COUNT(DISTINCT survey_id) FROM survey_votes) as encuestas_con_votos,
    (SELECT COUNT(DISTINCT option_id) FROM survey_votes) as opciones_votadas,
    CASE 
        WHEN (SELECT COUNT(*) FROM survey_votes) > 0 THEN '✅ Hay votos en la base de datos'
        ELSE '❌ No hay votos en la base de datos'
    END as conclusion; 