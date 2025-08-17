-- Script para probar el sistema de encuestas
-- Ejecutar después de tener usuarios y productos

USE cosmetics_db;

-- =========================
-- 1. Crear encuestas de prueba
-- =========================

-- Encuesta 1: Productos para próximo inventario
INSERT INTO surveys (question, status) VALUES
('¿Qué tipo de productos te gustaría ver en el próximo inventario?', 'open');

-- Encuesta 2: Colores de labiales
INSERT INTO surveys (question, status) VALUES
('¿Qué colores de labiales prefieres para la próxima temporada?', 'open');

-- Encuesta 3: Cuidado de la piel
INSERT INTO surveys (question, status) VALUES
('¿Qué productos de cuidado de la piel necesitas más?', 'open');

-- Encuesta 4: Encuesta cerrada (para historial)
INSERT INTO surveys (question, status) VALUES
('¿Qué accesorios de maquillaje te gustan más?', 'closed');

-- =========================
-- 2. Crear opciones para las encuestas
-- =========================

-- Opciones para Encuesta 1 (Productos próximo inventario)
INSERT INTO survey_options (survey_id, option_text) VALUES
(1, 'Labiales de larga duración'),
(1, 'Sombras con glitter'),
(1, 'Bases con cobertura alta'),
(1, 'Serums anti-edad'),
(1, 'Perfumes florales'),
(1, 'Brochas profesionales');

-- Opciones para Encuesta 2 (Colores de labiales)
INSERT INTO survey_options (survey_id, option_text) VALUES
(2, 'Rojos intensos'),
(2, 'Rosas suaves'),
(2, 'Nudes naturales'),
(2, 'Morados elegantes'),
(2, 'Corales vibrantes');

-- Opciones para Encuesta 3 (Cuidado de la piel)
INSERT INTO survey_options (survey_id, option_text) VALUES
(3, 'Protectores solares'),
(3, 'Serums hidratantes'),
(3, 'Exfoliantes suaves'),
(3, 'Mascarillas faciales'),
(3, 'Toners equilibrantes');

-- Opciones para Encuesta 4 (Accesorios - cerrada)
INSERT INTO survey_options (survey_id, option_text) VALUES
(4, 'Brochas de sombras'),
(4, 'Esponjas beauty blender'),
(4, 'Espejos con luz LED'),
(4, 'Estuches organizadores');

-- =========================
-- 3. Crear votos de prueba
-- =========================

-- Votos para Encuesta 1
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(1, 1, 2), -- Cliente vota por "Labiales de larga duración"
(1, 3, 2), -- Cliente vota por "Bases con cobertura alta"
(1, 2, 1), -- Admin vota por "Sombras con glitter"
(1, 4, 1); -- Admin vota por "Serums anti-edad"

-- Votos para Encuesta 2
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(2, 1, 2), -- Cliente vota por "Rojos intensos"
(2, 3, 2), -- Cliente vota por "Nudes naturales"
(2, 2, 1); -- Admin vota por "Rosas suaves"

-- Votos para Encuesta 3
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(3, 1, 2), -- Cliente vota por "Protectores solares"
(3, 2, 2), -- Cliente vota por "Serums hidratantes"
(3, 4, 1); -- Admin vota por "Mascarillas faciales"

-- Votos para Encuesta 4 (cerrada)
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(4, 1, 2), -- Cliente vota por "Brochas de sombras"
(4, 3, 1); -- Admin vota por "Espejos con luz LED"

-- =========================
-- 4. Verificar datos creados
-- =========================

SELECT 'Encuestas creadas:' as info;
SELECT 
  id,
  question,
  status,
  created_at
FROM surveys
ORDER BY id;

SELECT 'Opciones por encuesta:' as info;
SELECT 
  s.id as survey_id,
  s.question,
  so.id as option_id,
  so.option_text,
  COUNT(sv.id) as vote_count
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id
LEFT JOIN survey_votes sv ON so.id = sv.option_id
GROUP BY s.id, s.question, so.id, so.option_text
ORDER BY s.id, so.id;

SELECT 'Votos por usuario:' as info;
SELECT 
  u.name as user_name,
  u.role,
  s.question as survey_question,
  so.option_text as voted_option,
  sv.created_at as voted_at
FROM survey_votes sv
INNER JOIN users u ON sv.user_id = u.id
INNER JOIN surveys s ON sv.survey_id = s.id
INNER JOIN survey_options so ON sv.option_id = so.id
ORDER BY sv.created_at DESC;

SELECT 'Estadísticas de encuestas:' as info;
SELECT 
  s.id,
  s.question,
  s.status,
  COUNT(DISTINCT so.id) as total_options,
  COUNT(sv.id) as total_votes,
  CASE 
    WHEN COUNT(sv.id) > 0 THEN 
      CONCAT(ROUND((COUNT(sv.id) / (SELECT COUNT(*) FROM users WHERE role = 'client')) * 100, 1), '%')
    ELSE '0%'
  END as participation_rate
FROM surveys s
LEFT JOIN survey_options so ON s.id = so.survey_id
LEFT JOIN survey_votes sv ON s.id = sv.survey_id
GROUP BY s.id, s.question, s.status
ORDER BY s.id; 