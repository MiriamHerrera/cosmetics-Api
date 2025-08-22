-- Script para verificar y corregir el estado actual de la encuesta de prueba
-- Ejecutar después de haber corrido el script anterior

USE cosmetics_db;

-- 1. Verificar el estado actual de la encuesta de prueba
SELECT 
    'Estado Actual de Encuesta TEST' as info,
    id,
    question,
    status,
    created_at
FROM surveys 
WHERE question LIKE '%TEST%';

-- 2. Verificar las opciones de la encuesta
SELECT 
    'Opciones de Encuesta TEST' as info,
    id,
    option_text,
    is_approved,
    created_at
FROM survey_options 
WHERE survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
ORDER BY id;

-- 3. Verificar votos existentes
SELECT 
    'Votos Existentes' as info,
    sv.id,
    sv.survey_id,
    sv.option_id,
    sv.user_id,
    so.option_text,
    sv.created_at
FROM survey_votes sv
INNER JOIN survey_options so ON sv.option_id = so.id
WHERE sv.survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%')
ORDER BY sv.created_at;

-- 4. Si la encuesta no está activa, activarla
UPDATE surveys 
SET status = 'active' 
WHERE question LIKE '%TEST%' AND status != 'active';

-- 5. Verificar que ahora está activa
SELECT 
    'Encuesta Activada' as info,
    id,
    question,
    status,
    created_at
FROM surveys 
WHERE question LIKE '%TEST%';

-- 6. Verificar que aparece en consulta de encuestas activas
SELECT 
    'Consulta de Encuestas Activas' as info,
    s.id,
    s.question,
    s.status,
    COUNT(DISTINCT so.id) as options_count,
    COUNT(DISTINCT sv.id) as total_votes
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id AND so.is_approved = 1
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
WHERE s.status = 'active'
GROUP BY s.id, s.question, s.status
ORDER BY s.created_at DESC;

-- 7. Mostrar opciones con conteo de votos para la encuesta TEST
SELECT 
    'Opciones con Votos - Encuesta TEST' as info,
    so.id,
    so.option_text,
    so.is_approved,
    COUNT(sv.id) as vote_count
FROM survey_options so
LEFT JOIN survey_votes sv ON so.id = sv.option_id
WHERE so.survey_id IN (SELECT id FROM surveys WHERE question LIKE '%TEST%') 
  AND so.is_approved = 1
GROUP BY so.id, so.option_text, so.is_approved
ORDER BY vote_count DESC, so.created_at ASC; 