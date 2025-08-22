-- Script para verificar el estado de las encuestas y sus opciones
-- Este script identifica por qué no hay opciones aprobadas para votar

-- 1. Verificar todas las encuestas y su estado
SELECT '=== ESTADO DE TODAS LAS ENCUESTAS ===' as info;

SELECT 
    id,
    question,
    status,
    created_at,
    updated_at
FROM surveys
ORDER BY created_at DESC;

-- 2. Verificar todas las opciones y su estado de aprobación
SELECT '=== ESTADO DE TODAS LAS OPCIONES ===' as info;

SELECT 
    so.id,
    so.survey_id,
    s.question as encuesta,
    s.status as estado_encuesta,
    so.option_text,
    so.is_approved,
    so.created_at,
    so.updated_at
FROM survey_options so
JOIN surveys s ON so.survey_id = s.id
ORDER BY so.survey_id, so.id;

-- 3. Verificar encuestas activas específicamente
SELECT '=== ENCUESTAS ACTIVAS DETALLADAS ===' as info;

SELECT 
    s.id,
    s.question,
    s.status,
    s.created_at,
    COUNT(so.id) as total_opciones,
    SUM(CASE WHEN so.is_approved = 1 THEN 1 ELSE 0 END) as opciones_aprobadas,
    SUM(CASE WHEN so.is_approved = 0 THEN 1 ELSE 0 END) as opciones_pendientes
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id
WHERE s.status = 'active'
GROUP BY s.id, s.question, s.status, s.created_at;

-- 4. Verificar opciones pendientes de aprobación
SELECT '=== OPCIONES PENDIENTES DE APROBACIÓN ===' as info;

SELECT 
    so.id,
    so.survey_id,
    s.question as encuesta,
    so.option_text,
    so.description,
    so.created_at,
    u.username as creador
FROM survey_options so
JOIN surveys s ON so.survey_id = s.id
LEFT JOIN users u ON so.created_by = u.id
WHERE so.is_approved = 0
ORDER BY so.created_at DESC;

-- 5. Verificar si hay opciones sin encuestas (datos huérfanos)
SELECT '=== VERIFICANDO DATOS HUÉRFANOS ===' as info;

SELECT 
    'Opciones sin encuesta válida' as tipo,
    COUNT(*) as cantidad
FROM survey_options so
LEFT JOIN surveys s ON so.survey_id = s.id
WHERE s.id IS NULL

UNION ALL

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
WHERE so.id IS NULL;

-- 6. Resumen del problema
SELECT '=== RESUMEN DEL PROBLEMA ===' as info;

SELECT 
    'Diagnóstico completado' as estado,
    CASE 
        WHEN (SELECT COUNT(*) FROM surveys WHERE status = 'active') > 0 THEN '✅ Hay encuestas activas'
        ELSE '❌ No hay encuestas activas'
    END as encuestas_activas,
    CASE 
        WHEN (SELECT COUNT(*) FROM survey_options WHERE is_approved = 1) > 0 THEN '✅ Hay opciones aprobadas'
        ELSE '❌ NO HAY OPCIONES APROBADAS - ESTE ES EL PROBLEMA'
    END as opciones_aprobadas,
    CASE 
        WHEN (SELECT COUNT(*) FROM survey_options WHERE is_approved = 0) > 0 THEN '✅ Hay opciones pendientes'
        ELSE '❌ No hay opciones pendientes'
    END as opciones_pendientes,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'user') > 0 THEN '✅ Hay usuarios disponibles'
        ELSE '❌ No hay usuarios disponibles'
    END as usuarios_disponibles; 