-- Script para diagnosticar por qué no se están guardando los votos
-- Este script verifica el estado de la base de datos y los votos

-- 1. Verificar estructura de la base de datos
SELECT '=== VERIFICANDO ESTRUCTURA DE LA BASE DE DATOS ===' as info;

-- Verificar que la tabla survey_votes existe y tiene la estructura correcta
DESCRIBE survey_votes;

-- Verificar que la tabla surveys existe y tiene encuestas activas
SELECT 
    'Tabla surveys' as tabla,
    COUNT(*) as total_encuestas,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as encuestas_activas,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as encuestas_draft,
    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as encuestas_cerradas
FROM surveys;

-- Verificar que la tabla survey_options existe y tiene opciones aprobadas
SELECT 
    'Tabla survey_options' as tabla,
    COUNT(*) as total_opciones,
    SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as opciones_aprobadas,
    SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as opciones_pendientes
FROM survey_options;

-- Verificar que la tabla users existe y tiene usuarios
SELECT 
    'Tabla users' as tabla,
    COUNT(*) as total_usuarios,
    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as usuarios_normales,
    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as administradores
FROM users;

-- 2. Verificar encuestas activas específicas
SELECT '=== ENCUESTAS ACTIVAS DISPONIBLES ===' as info;

SELECT 
    s.id,
    s.question,
    s.status,
    s.created_at,
    COUNT(so.id) as opciones_aprobadas,
    COUNT(sv.id) as total_votos
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
WHERE s.status = 'active'
GROUP BY s.id, s.question, s.status, s.created_at
ORDER BY s.created_at DESC;

-- 3. Verificar opciones aprobadas para votar
SELECT '=== OPCIONES APROBADAS PARA VOTAR ===' as info;

SELECT 
    so.id,
    so.survey_id,
    s.question as encuesta,
    so.option_text,
    so.is_approved,
    COUNT(sv.id) as votos_actuales
FROM survey_options so
JOIN surveys s ON so.survey_id = s.id
LEFT JOIN survey_votes sv ON so.id = sv.option_id
WHERE s.status = 'active' AND so.is_approved = 1
GROUP BY so.id, so.survey_id, s.question, so.option_text, so.is_approved
ORDER BY so.survey_id, so.id;

-- 4. Verificar usuarios disponibles para testing
SELECT '=== USUARIOS DISPONIBLES PARA TESTING ===' as info;

SELECT 
    id,
    username,
    email,
    role,
    created_at
FROM users
WHERE role = 'user'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar votos existentes
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
ORDER BY sv.created_at DESC
LIMIT 10;

-- 6. Verificar restricciones y índices
SELECT '=== VERIFICANDO RESTRICCIONES Y ÍNDICES ===' as info;

-- Verificar si existe la restricción unique_user_option
SHOW INDEX FROM survey_votes;

-- Verificar si hay triggers o procedimientos almacenados
SHOW TRIGGERS;

-- 7. Verificar permisos de usuario de la base de datos
SELECT '=== VERIFICANDO PERMISOS DE USUARIO ===' as info;

-- Mostrar el usuario actual de la base de datos
SELECT USER() as usuario_actual;

-- Verificar permisos del usuario actual
SHOW GRANTS;

-- 8. Verificar logs de errores recientes (si están disponibles)
SELECT '=== VERIFICANDO LOGS DE ERRORES ===' as info;

-- Intentar insertar un voto de prueba para ver si hay errores
SELECT 'Insertando voto de prueba...' as accion;

-- Obtener IDs para el voto de prueba
SET @test_survey_id = (SELECT id FROM surveys WHERE status = 'active' LIMIT 1);
SET @test_option_id = (SELECT id FROM survey_options WHERE survey_id = @test_survey_id AND is_approved = 1 LIMIT 1);
SET @test_user_id = (SELECT id FROM users WHERE role = 'user' LIMIT 1);

SELECT 
    @test_survey_id as survey_id,
    @test_option_id as option_id,
    @test_user_id as user_id;

-- Si tenemos todos los IDs, intentar insertar
IF @test_survey_id IS NOT NULL AND @test_option_id IS NOT NULL AND @test_user_id IS NOT NULL THEN
    -- Verificar que no existe ya este voto
    SELECT 
        'Verificando si existe voto de prueba...' as accion,
        COUNT(*) as votos_existentes
    FROM survey_votes 
    WHERE survey_id = @test_survey_id AND option_id = @test_option_id AND user_id = @test_user_id;
    
    -- Intentar insertar voto de prueba
    INSERT INTO survey_votes (survey_id, option_id, user_id, created_at)
    VALUES (@test_survey_id, @test_option_id, @test_user_id, NOW());
    
    SELECT 'Voto de prueba insertado exitosamente' as resultado;
    
    -- Limpiar voto de prueba
    DELETE FROM survey_votes 
    WHERE survey_id = @test_survey_id AND option_id = @test_option_id AND user_id = @test_user_id;
    
    SELECT 'Voto de prueba eliminado' as limpieza;
ELSE
    SELECT 'No se pudieron obtener IDs para el voto de prueba' as error;
END IF;

-- 9. Resumen del diagnóstico
SELECT '=== RESUMEN DEL DIAGNÓSTICO ===' as info;

SELECT 
    'Verificación completada' as estado,
    CASE 
        WHEN (SELECT COUNT(*) FROM surveys WHERE status = 'active') > 0 THEN '✅ Hay encuestas activas'
        ELSE '❌ No hay encuestas activas'
    END as encuestas_activas,
    CASE 
        WHEN (SELECT COUNT(*) FROM survey_options WHERE is_approved = 1) > 0 THEN '✅ Hay opciones aprobadas'
        ELSE '❌ No hay opciones aprobadas'
    END as opciones_aprobadas,
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE role = 'user') > 0 THEN '✅ Hay usuarios disponibles'
        ELSE '❌ No hay usuarios disponibles'
    END as usuarios_disponibles,
    CASE 
        WHEN (SELECT COUNT(*) FROM survey_votes) >= 0 THEN '✅ Tabla de votos accesible'
        ELSE '❌ Error en tabla de votos'
    END as tabla_votos; 