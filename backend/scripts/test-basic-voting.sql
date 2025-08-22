-- Script simple para probar la funcionalidad básica de votación
-- Este script verifica que se puedan insertar y eliminar votos

-- 1. Verificar que tenemos datos básicos
SELECT '=== VERIFICANDO DATOS BÁSICOS ===' as info;

-- Verificar encuestas activas
SELECT 
    id,
    question,
    status
FROM surveys 
WHERE status = 'active'
LIMIT 3;

-- Verificar opciones aprobadas
SELECT 
    so.id,
    so.survey_id,
    so.option_text,
    so.is_approved
FROM survey_options so
JOIN surveys s ON so.survey_id = s.id
WHERE s.status = 'active' AND so.is_approved = 1
LIMIT 3;

-- Verificar usuarios
SELECT 
    id,
    username,
    role
FROM users
WHERE role = 'user'
LIMIT 3;

-- 2. Probar inserción de voto
SELECT '=== PROBANDO INSERCIÓN DE VOTO ===' as info;

-- Obtener IDs para la prueba
SET @survey_id = (SELECT id FROM surveys WHERE status = 'active' LIMIT 1);
SET @option_id = (SELECT id FROM survey_options WHERE survey_id = @survey_id AND is_approved = 1 LIMIT 1);
SET @user_id = (SELECT id FROM users WHERE role = 'user' LIMIT 1);

SELECT 
    CONCAT('Survey ID: ', @survey_id) as survey_info,
    CONCAT('Option ID: ', @option_id) as option_info,
    CONCAT('User ID: ', @user_id) as user_info;

-- Verificar que tenemos todos los IDs
IF @survey_id IS NOT NULL AND @option_id IS NOT NULL AND @user_id IS NOT NULL THEN
    SELECT '✅ Todos los IDs obtenidos correctamente' as status;
    
    -- Verificar que no existe ya este voto
    SELECT 
        'Verificando voto existente...' as accion,
        COUNT(*) as votos_existentes
    FROM survey_votes 
    WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;
    
    -- Insertar voto de prueba
    INSERT INTO survey_votes (survey_id, option_id, user_id, created_at)
    VALUES (@survey_id, @option_id, @user_id, NOW());
    
    SELECT '✅ Voto insertado exitosamente' as resultado;
    
    -- Verificar que se insertó
    SELECT 
        'Verificando inserción...' as accion,
        COUNT(*) as votos_despues
    FROM survey_votes 
    WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;
    
    -- Eliminar voto de prueba
    DELETE FROM survey_votes 
    WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;
    
    SELECT '✅ Voto de prueba eliminado' as limpieza;
    
    -- Verificar que se eliminó
    SELECT 
        'Verificando eliminación...' as accion,
        COUNT(*) as votos_final
    FROM survey_votes 
    WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;
    
ELSE
    SELECT '❌ Error: No se pudieron obtener todos los IDs necesarios' as error;
    SELECT 
        CASE 
            WHEN @survey_id IS NULL THEN '❌ No hay encuestas activas'
            ELSE '✅ Encuestas activas disponibles'
        END as encuestas,
        CASE 
            WHEN @option_id IS NULL THEN '❌ No hay opciones aprobadas'
            ELSE '✅ Opciones aprobadas disponibles'
        END as opciones,
        CASE 
            WHEN @user_id IS NULL THEN '❌ No hay usuarios disponibles'
            ELSE '✅ Usuarios disponibles'
        END as usuarios;
END IF;

-- 3. Resumen de la prueba
SELECT '=== RESUMEN DE LA PRUEBA ===' as info;

SELECT 
    'Prueba completada' as estado,
    CASE 
        WHEN @survey_id IS NOT NULL THEN '✅ Encuesta disponible'
        ELSE '❌ Sin encuestas activas'
    END as encuesta,
    CASE 
        WHEN @option_id IS NOT NULL THEN '✅ Opción disponible'
        ELSE '❌ Sin opciones aprobadas'
    END as opcion,
    CASE 
        WHEN @user_id IS NOT NULL THEN '✅ Usuario disponible'
        ELSE '❌ Sin usuarios'
    END as usuario; 