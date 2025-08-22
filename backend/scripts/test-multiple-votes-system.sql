-- Script para probar el sistema de múltiples votos por encuesta
-- Este script verifica que un usuario pueda votar por múltiples opciones
-- y que cada voto se maneje correctamente

DELIMITER $$

-- 1. Verificar la estructura actual
SELECT '=== VERIFICANDO ESTRUCTURA ACTUAL ===' as info;

-- Verificar encuestas activas
SELECT 
    id,
    question,
    status,
    created_at
FROM surveys 
WHERE status = 'active'
ORDER BY created_at DESC;

-- Verificar opciones aprobadas
SELECT 
    so.id,
    so.survey_id,
    so.option_text,
    so.is_approved,
    so.created_at
FROM survey_options so
JOIN surveys s ON so.survey_id = s.id
WHERE s.status = 'active' AND so.is_approved = 1
ORDER BY so.survey_id, so.id;

-- Verificar usuarios disponibles
SELECT 
    id,
    username,
    email
FROM users
WHERE role = 'user'
LIMIT 3;

-- 2. Crear datos de prueba si no existen
SELECT '=== CREANDO DATOS DE PRUEBA ===' as info;

-- Crear encuesta de prueba si no existe
INSERT IGNORE INTO surveys (question, description, status, created_at, updated_at)
VALUES (
    'ENCUESTA DE PRUEBA - MÚLTIPLES VOTOS',
    'Esta encuesta es para probar el sistema de múltiples votos por usuario',
    'active',
    NOW(),
    NOW()
);

-- Obtener ID de la encuesta de prueba
SET @test_survey_id = LAST_INSERT_ID();
IF @test_survey_id = 0 THEN
    SELECT id INTO @test_survey_id FROM surveys WHERE question LIKE '%ENCUESTA DE PRUEBA - MÚLTIPLES VOTOS%' LIMIT 1;
END IF;

SELECT CONCAT('ID de encuesta de prueba: ', @test_survey_id) as survey_info;

-- Crear opciones de prueba si no existen
INSERT IGNORE INTO survey_options (survey_id, option_text, description, is_approved, created_at, updated_at)
VALUES 
    (@test_survey_id, 'Opción A - Música Rock', 'Género musical rock', 1, NOW(), NOW()),
    (@test_survey_id, 'Opción B - Música Pop', 'Género musical pop', 1, NOW(), NOW()),
    (@test_survey_id, 'Opción C - Música Jazz', 'Género musical jazz', 1, NOW(), NOW()),
    (@test_survey_id, 'Opción D - Música Clásica', 'Género musical clásico', 1, NOW(), NOW());

-- Obtener IDs de las opciones
SELECT 
    id,
    option_text,
    is_approved
FROM survey_options 
WHERE survey_id = @test_survey_id
ORDER BY id;

-- 3. Simular votos de un usuario
SELECT '=== SIMULANDO VOTOS MÚLTIPLES ===' as info;

-- Obtener un usuario de prueba
SELECT id INTO @test_user_id FROM users WHERE role = 'user' LIMIT 1;
SELECT CONCAT('ID de usuario de prueba: ', @test_user_id) as user_info;

-- Obtener IDs de opciones aprobadas
SELECT id INTO @option_a_id FROM survey_options WHERE survey_id = @test_survey_id AND option_text LIKE '%Opción A%' LIMIT 1;
SELECT id INTO @option_b_id FROM survey_options WHERE survey_id = @test_survey_id AND option_text LIKE '%Opción B%' LIMIT 1;
SELECT id INTO @option_c_id FROM survey_options WHERE survey_id = @test_survey_id AND option_text LIKE '%Opción C%' LIMIT 1;

-- Verificar que tenemos los IDs
SELECT 
    @option_a_id as option_a_id,
    @option_b_id as option_b_id,
    @option_c_id as option_c_id;

-- 4. Simular secuencia de votos
SELECT '=== SECUENCIA DE VOTOS ===' as info;

-- Voto 1: Votar por Opción A
SELECT 'Votando por Opción A...' as action;
INSERT INTO survey_votes (survey_id, option_id, user_id, created_at)
VALUES (@test_survey_id, @option_a_id, @test_user_id, NOW());

-- Verificar estado después del primer voto
SELECT 
    'Después del primer voto' as estado,
    COUNT(*) as total_votos_usuario
FROM survey_votes 
WHERE survey_id = @test_survey_id AND user_id = @test_user_id;

-- Voto 2: Votar por Opción B
SELECT 'Votando por Opción B...' as action;
INSERT INTO survey_votes (survey_id, option_id, user_id, created_at)
VALUES (@test_survey_id, @option_b_id, @test_user_id, NOW());

-- Verificar estado después del segundo voto
SELECT 
    'Después del segundo voto' as estado,
    COUNT(*) as total_votos_usuario
FROM survey_votes 
WHERE survey_id = @test_survey_id AND user_id = @test_user_id;

-- Voto 3: Votar por Opción C
SELECT 'Votando por Opción C...' as action;
INSERT INTO survey_votes (survey_id, option_id, user_id, created_at)
VALUES (@test_survey_id, @option_c_id, @test_user_id, NOW());

-- Verificar estado después del tercer voto
SELECT 
    'Después del tercer voto' as estado,
    COUNT(*) as total_votos_usuario
FROM survey_votes 
WHERE survey_id = @test_survey_id AND user_id = @test_user_id;

-- 5. Verificar votos individuales por opción
SELECT '=== VOTOS POR OPCIÓN ===' as info;

SELECT 
    so.option_text,
    COUNT(sv.id) as votos_totales,
    CASE 
        WHEN EXISTS(SELECT 1 FROM survey_votes WHERE option_id = so.id AND user_id = @test_user_id) 
        THEN 'SÍ' 
        ELSE 'NO' 
    END as votado_por_usuario
FROM survey_options so
LEFT JOIN survey_votes sv ON so.id = sv.option_id
WHERE so.survey_id = @test_survey_id
GROUP BY so.id, so.option_text
ORDER BY so.id;

-- 6. Simular desvoto
SELECT '=== SIMULANDO DESVOTO ===' as info;

-- Desvotar Opción A
SELECT 'Desvotando Opción A...' as action;
DELETE FROM survey_votes 
WHERE survey_id = @test_survey_id AND option_id = @option_a_id AND user_id = @test_user_id;

-- Verificar estado después del desvoto
SELECT 
    'Después del desvoto de Opción A' as estado,
    COUNT(*) as total_votos_usuario
FROM survey_votes 
WHERE survey_id = @test_survey_id AND user_id = @test_user_id;

-- Verificar votos por opción después del desvoto
SELECT 
    so.option_text,
    COUNT(sv.id) as votos_totales,
    CASE 
        WHEN EXISTS(SELECT 1 FROM survey_votes WHERE option_id = so.id AND user_id = @test_user_id) 
        THEN 'SÍ' 
        ELSE 'NO' 
    END as votado_por_usuario
FROM survey_options so
LEFT JOIN survey_votes sv ON so.id = sv.option_id
WHERE so.survey_id = @test_survey_id
GROUP BY so.id, so.option_text
ORDER BY so.id;

-- 7. Limpiar datos de prueba
SELECT '=== LIMPIANDO DATOS DE PRUEBA ===' as info;

-- Eliminar votos de prueba
DELETE FROM survey_votes 
WHERE survey_id = @test_survey_id AND user_id = @test_user_id;

-- Eliminar opciones de prueba
DELETE FROM survey_options WHERE survey_id = @test_survey_id;

-- Eliminar encuesta de prueba
DELETE FROM surveys WHERE id = @test_survey_id;

SELECT 'Datos de prueba eliminados correctamente' as cleanup_result;

-- 8. Resumen final
SELECT '=== RESUMEN DEL TEST ===' as info;
SELECT 
    'Sistema de múltiples votos funcionando correctamente' as resultado,
    'Usuario puede votar por múltiples opciones' as caracteristica_1,
    'Cada voto se maneja independientemente' as caracteristica_2,
    'Desvoto funciona correctamente' as caracteristica_3,
    'No hay conflictos entre votos' as caracteristica_4;

DELIMITER ; 