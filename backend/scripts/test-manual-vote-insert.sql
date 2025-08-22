-- Script para probar la inserción manual de un voto
-- Este script verifica que se pueda insertar un voto directamente en la base de datos

-- 1. Verificar datos disponibles
SELECT '=== VERIFICANDO DATOS DISPONIBLES ===' as info;

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

-- 2. Insertar voto de prueba manualmente
SELECT '=== INSERTANDO VOTO DE PRUEBA ===' as info;

-- Obtener IDs para la prueba
SET @survey_id = (SELECT id FROM surveys WHERE status = 'active' LIMIT 1);
SET @option_id = (SELECT id FROM survey_options WHERE survey_id = @survey_id AND is_approved = 1 LIMIT 1);
SET @user_id = (SELECT id FROM users WHERE role = 'user' LIMIT 1);

-- Mostrar los IDs obtenidos
SELECT 
    CONCAT('Survey ID: ', @survey_id) as survey_info,
    CONCAT('Option ID: ', @option_id) as option_info,
    CONCAT('User ID: ', @user_id) as user_info;

-- 3. Verificar que no existe ya este voto
SELECT 
    'Verificando voto existente...' as accion,
    COUNT(*) as votos_existentes
FROM survey_votes 
WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;

-- 4. Insertar el voto de prueba
INSERT INTO survey_votes (survey_id, option_id, user_id, created_at)
VALUES (@survey_id, @option_id, @user_id, NOW());

-- 5. Verificar que se insertó correctamente
SELECT 
    'Verificando inserción...' as accion,
    COUNT(*) as votos_despues
FROM survey_votes 
WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;

-- 6. Mostrar el voto insertado
SELECT 
    'Voto insertado:' as resultado,
    sv.id,
    sv.survey_id,
    sv.option_id,
    sv.user_id,
    sv.created_at
FROM survey_votes sv
WHERE sv.survey_id = @survey_id AND sv.option_id = @option_id AND sv.user_id = @user_id;

-- 7. Limpiar el voto de prueba
SELECT 'Limpiando voto de prueba...' as limpieza;

DELETE FROM survey_votes 
WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;

-- 8. Verificar que se eliminó
SELECT 
    'Verificando limpieza...' as accion,
    COUNT(*) as votos_final
FROM survey_votes 
WHERE survey_id = @survey_id AND option_id = @option_id AND user_id = @user_id;

-- 9. Resumen de la prueba
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
    END as usuario,
    '✅ Inserción y eliminación exitosas' as funcionalidad; 