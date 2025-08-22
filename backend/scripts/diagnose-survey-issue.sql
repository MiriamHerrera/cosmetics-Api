-- Script para diagnosticar el problema actual con la encuesta de prueba
-- Ejecutar este script primero para entender qué está pasando

USE cosmetics_db;

-- 1. Verificar si existe la encuesta TEST
SELECT 
    '¿Existe Encuesta TEST?' as pregunta,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SÍ'
        ELSE 'NO'
    END as respuesta,
    COUNT(*) as cantidad
FROM surveys 
WHERE question LIKE '%TEST%';

-- 2. Si existe, mostrar detalles
SELECT 
    'Detalles de Encuesta TEST' as info,
    id,
    question,
    status,
    created_at
FROM surveys 
WHERE question LIKE '%TEST%';

-- 3. Verificar opciones de la encuesta TEST
SELECT 
    'Opciones de Encuesta TEST' as info,
    id,
    option_text,
    is_approved,
    created_at
FROM survey_options 
WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
ORDER BY is_approved DESC, created_at ASC;

-- 4. Verificar si hay opciones aprobadas
SELECT 
    '¿Hay Opciones Aprobadas?' as pregunta,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SÍ'
        ELSE 'NO'
    END as respuesta,
    COUNT(*) as cantidad
FROM survey_options 
WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
AND is_approved = 1;

-- 5. Verificar votos existentes
SELECT 
    'Votos Existentes' as info,
    COUNT(*) as total_votos
FROM survey_votes 
WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%');

-- 6. Mostrar estructura de la base de datos
SELECT 
    'Estructura de Tablas' as info,
    TABLE_NAME,
    TABLE_ROWS
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'cosmetics_db' 
AND TABLE_NAME IN ('surveys', 'survey_options', 'survey_votes');

-- 7. Verificar usuarios disponibles
SELECT 
    'Usuarios Disponibles' as info,
    id,
    username,
    role
FROM users 
ORDER BY id 
LIMIT 5; 