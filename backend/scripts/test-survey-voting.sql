-- Script de prueba para verificar el sistema de votos múltiples en encuestas
-- Este script demuestra cómo funciona el sistema de votos

USE cosmetics_db;

-- 1. Crear una encuesta de prueba
INSERT INTO surveys (question, description, status, created_by) VALUES 
('¿Qué productos te gustaría que incluyamos en nuestro catálogo?', 'Encuesta para conocer las preferencias de nuestros clientes', 'active', 1);

SET @survey_id = LAST_INSERT_ID();

-- 2. Crear opciones iniciales (aprobadas por admin)
INSERT INTO survey_options (survey_id, option_text, description, created_by, is_approved, approved_by, approved_at) VALUES
(@survey_id, 'Productos de cuidado facial', 'Cremas, limpiadores, mascarillas', 1, 1, 1, NOW()),
(@survey_id, 'Productos de maquillaje', 'Labiales, sombras, bases', 1, 1, 1, NOW()),
(@survey_id, 'Productos de cuidado corporal', 'Lociones, exfoliantes, aceites', 1, 1, 1, NOW()),
(@survey_id, 'Productos de cabello', 'Shampoos, acondicionadores, tratamientos', 1, 1, 1, NOW());

-- 3. Simular votos de diferentes usuarios en diferentes opciones
-- Usuario 1 vota por opción 1
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES (@survey_id, @survey_id, 1);

-- Usuario 2 vota por opción 1 y opción 3 (votos múltiples permitidos)
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES (@survey_id, @survey_id, 2);
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES (@survey_id, @survey_id + 2, 2);

-- Usuario 3 vota por opción 2
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES (@survey_id, @survey_id + 1, 3);

-- 4. Simular sugerencia de nueva opción por usuario (pendiente de aprobación)
INSERT INTO survey_options (survey_id, option_text, description, created_by, is_approved) VALUES
(@survey_id, 'Productos de cuidado de uñas', 'Esmaltes, fortalecedores, removedores', 2, 0);

-- 5. Verificar resultados
SELECT 
    'Resumen de la Encuesta de Prueba' as info,
    s.question,
    s.status,
    COUNT(DISTINCT so.id) as total_options,
    COUNT(DISTINCT sv.id) as total_votes,
    COUNT(DISTINCT sv.user_id) as unique_voters
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
WHERE s.id = @survey_id
GROUP BY s.id, s.question, s.status;

-- 6. Mostrar opciones y sus votos
SELECT 
    'Opciones y Votos' as info,
    so.id as option_id,
    so.option_text,
    so.is_approved,
    COUNT(sv.id) as vote_count,
    GROUP_CONCAT(DISTINCT sv.user_id ORDER BY sv.user_id) as voters
FROM survey_options so
LEFT JOIN survey_votes sv ON so.id = sv.option_id
WHERE so.survey_id = @survey_id
GROUP BY so.id, so.option_text, so.is_approved
ORDER BY so.is_approved DESC, vote_count DESC;

-- 7. Mostrar opciones pendientes de aprobación
SELECT 
    'Opciones Pendientes de Aprobación' as info,
    so.id as option_id,
    so.option_text,
    so.description,
    u.username as suggested_by,
    so.created_at
FROM survey_options so
INNER JOIN users u ON so.created_by = u.id
WHERE so.survey_id = @survey_id AND so.is_approved = 0;

-- 8. Mostrar votos por usuario
SELECT 
    'Votos por Usuario' as info,
    u.username,
    COUNT(sv.id) as total_votes,
    GROUP_CONCAT(so.option_text ORDER BY so.option_text) as voted_options
FROM users u
INNER JOIN survey_votes sv ON u.id = sv.user_id
INNER JOIN survey_options so ON sv.option_id = so.id
WHERE sv.survey_id = @survey_id
GROUP BY u.id, u.username
ORDER BY total_votes DESC;

-- 9. Limpiar datos de prueba (descomentar para limpiar)
-- DELETE FROM survey_votes WHERE survey_id = @survey_id;
-- DELETE FROM survey_options WHERE survey_id = @survey_id;
-- DELETE FROM surveys WHERE id = @survey_id; 