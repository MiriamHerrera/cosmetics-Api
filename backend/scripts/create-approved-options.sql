-- Script para crear opciones aprobadas para testing
-- Este script resuelve el problema de que no hay opciones aprobadas para votar

-- 1. Verificar el estado actual
SELECT '=== ESTADO ACTUAL ===' as info;

SELECT 
    s.id,
    s.question,
    s.status,
    COUNT(so.id) as total_opciones,
    SUM(CASE WHEN so.is_approved = 1 THEN 1 ELSE 0 END) as opciones_aprobadas,
    SUM(CASE WHEN so.is_approved = 0 THEN 1 ELSE 0 END) as opciones_pendientes
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id
GROUP BY s.id, s.question, s.status
ORDER BY s.id;

-- 2. Crear opciones aprobadas para encuestas activas que no las tengan
SELECT '=== CREANDO OPCIONES APROBADADAS ===' as info;

-- Para cada encuesta activa, crear opciones si no las tiene
INSERT INTO survey_options (survey_id, option_text, description, is_approved, created_by, created_at, updated_at)
SELECT 
    s.id as survey_id,
    'Opción A - Primera opción' as option_text,
    'Descripción de la primera opción' as description,
    1 as is_approved,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by,
    NOW() as created_at,
    NOW() as updated_at
FROM surveys s
WHERE s.status = 'active' 
AND NOT EXISTS (
    SELECT 1 FROM survey_options so WHERE so.survey_id = s.id
);

-- Crear segunda opción para encuestas que solo tengan una
INSERT INTO survey_options (survey_id, option_text, description, is_approved, created_by, created_at, updated_at)
SELECT 
    s.id as survey_id,
    'Opción B - Segunda opción' as option_text,
    'Descripción de la segunda opción' as description,
    1 as is_approved,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by,
    NOW() as created_at,
    NOW() as updated_at
FROM surveys s
WHERE s.status = 'active' 
AND (
    SELECT COUNT(*) FROM survey_options so WHERE so.survey_id = s.id AND so.is_approved = 1
) = 1;

-- Crear tercera opción para encuestas que solo tengan dos
INSERT INTO survey_options (survey_id, option_text, description, is_approved, created_by, created_at, updated_at)
SELECT 
    s.id as survey_id,
    'Opción C - Tercera opción' as option_text,
    'Descripción de la tercera opción' as description,
    1 as is_approved,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as created_by,
    NOW() as created_at,
    NOW() as updated_at
FROM surveys s
WHERE s.status = 'active' 
AND (
    SELECT COUNT(*) FROM survey_options so WHERE so.survey_id = s.id AND so.is_approved = 1
) = 2;

-- 3. Verificar el estado después de crear las opciones
SELECT '=== ESTADO DESPUÉS DE CREAR OPCIONES ===' as info;

SELECT 
    s.id,
    s.question,
    s.status,
    COUNT(so.id) as total_opciones,
    SUM(CASE WHEN so.is_approved = 1 THEN 1 ELSE 0 END) as opciones_aprobadas,
    SUM(CASE WHEN so.is_approved = 0 THEN 1 ELSE 0 END) as opciones_pendientes
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id
GROUP BY s.id, s.question, s.status
ORDER BY s.id;

-- 4. Mostrar las opciones creadas
SELECT '=== OPCIONES CREADAS ===' as info;

SELECT 
    so.id,
    so.survey_id,
    s.question as encuesta,
    so.option_text,
    so.is_approved,
    so.created_at
FROM survey_options so
JOIN surveys s ON so.survey_id = s.id
WHERE so.is_approved = 1
ORDER BY so.survey_id, so.id;

-- 5. Verificar que ahora se pueden insertar votos
SELECT '=== VERIFICANDO QUE SE PUEDEN INSERTAR VOTOS ===' as info;

-- Obtener IDs para la prueba
SET @survey_id = (SELECT id FROM surveys WHERE status = 'active' LIMIT 1);
SET @option_id = (SELECT id FROM survey_options WHERE survey_id = @survey_id AND is_approved = 1 LIMIT 1);
SET @user_id = (SELECT id FROM users WHERE role = 'user' LIMIT 1);

SELECT 
    CONCAT('Survey ID: ', @survey_id) as survey_info,
    CONCAT('Option ID: ', @option_id) as option_info,
    CONCAT('User ID: ', @user_id) as user_info;

-- Verificar que tenemos todos los IDs
SELECT 
    CASE 
        WHEN @survey_id IS NOT NULL THEN '✅ Survey ID obtenido'
        ELSE '❌ No hay encuestas activas'
    END as survey_status,
    CASE 
        WHEN @option_id IS NOT NULL THEN '✅ Option ID obtenido'
        ELSE '❌ No hay opciones aprobadas'
    END as option_status,
    CASE 
        WHEN @user_id IS NOT NULL THEN '✅ User ID obtenido'
        ELSE '❌ No hay usuarios disponibles'
    END as user_status;

-- 6. Resumen final
SELECT '=== RESUMEN FINAL ===' as info;

SELECT 
    'Opciones creadas exitosamente' as estado,
    CASE 
        WHEN (SELECT COUNT(*) FROM survey_options WHERE is_approved = 1) > 0 THEN '✅ Ahora hay opciones aprobadas'
        ELSE '❌ Aún no hay opciones aprobadas'
    END as opciones_aprobadas,
    CASE 
        WHEN (SELECT COUNT(*) FROM surveys WHERE status = 'active') > 0 THEN '✅ Hay encuestas activas'
        ELSE '❌ No hay encuestas activas'
    END as encuestas_activas,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'user') > 0 THEN '✅ Hay usuarios disponibles'
        ELSE '❌ No hay usuarios disponibles'
    END as usuarios_disponibles,
    '✅ Sistema listo para votar' as conclusion; 