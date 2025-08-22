-- Script para crear la estructura completa de encuestas
-- Incluye sistema de aprobación de items y gestión completa

-- Tabla de encuestas
CREATE TABLE IF NOT EXISTS surveys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  question VARCHAR(500) NOT NULL COMMENT 'Pregunta de la encuesta',
  description TEXT COMMENT 'Descripción adicional de la encuesta',
  status ENUM('draft', 'active', 'closed') DEFAULT 'draft' COMMENT 'Estado de la encuesta',
  created_by INT NOT NULL COMMENT 'ID del usuario que creó la encuesta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_by INT NULL COMMENT 'ID del admin que cerró la encuesta',
  closed_at TIMESTAMP NULL COMMENT 'Fecha de cierre',
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de opciones de encuesta
CREATE TABLE IF NOT EXISTS survey_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  survey_id INT NOT NULL COMMENT 'ID de la encuesta',
  option_text VARCHAR(255) NOT NULL COMMENT 'Texto de la opción',
  description TEXT COMMENT 'Descripción adicional de la opción',
  created_by INT NOT NULL COMMENT 'ID del usuario que sugirió la opción',
  is_approved TINYINT(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Aprobada',
  admin_notes TEXT COMMENT 'Notas del administrador sobre la aprobación',
  approved_by INT NULL COMMENT 'ID del admin que aprobó/rechazó',
  approved_at TIMESTAMP NULL COMMENT 'Fecha de aprobación/rechazo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de votos
CREATE TABLE IF NOT EXISTS survey_votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  survey_id INT NOT NULL COMMENT 'ID de la encuesta',
  option_id INT NOT NULL COMMENT 'ID de la opción votada',
  user_id INT NOT NULL COMMENT 'ID del usuario que votó',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES survey_options(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (survey_id, user_id) COMMENT 'Un usuario solo puede votar una vez por encuesta'
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);
CREATE INDEX IF NOT EXISTS idx_survey_options_survey_id ON survey_options(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_options_approved ON survey_options(is_approved);
CREATE INDEX IF NOT EXISTS idx_survey_options_created_by ON survey_options(created_by);
CREATE INDEX IF NOT EXISTS idx_survey_votes_survey_id ON survey_votes(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_option_id ON survey_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_user_id ON survey_votes(user_id);

-- Insertar datos de ejemplo
INSERT INTO surveys (question, description, status, created_by) VALUES 
('¿Qué productos te gustaría que incluyamos en el próximo inventario?', 'Ayúdanos a decidir qué productos traer en la próxima entrega', 'active', 1),
('¿Qué tipo de maquillaje prefieres?', 'Encuesta sobre preferencias de maquillaje', 'active', 1),
('¿Qué productos de skincare te interesan más?', 'Para conocer mejor tus necesidades de cuidado de la piel', 'draft', 1);

-- Insertar opciones de ejemplo (algunas aprobadas, otras pendientes)
INSERT INTO survey_options (survey_id, option_text, description, created_by, is_approved, approved_by, approved_at) VALUES
(1, 'Paletas de Sombras Profesionales', 'Paletas con múltiples tonos para looks profesionales', 1, 1, 1, CURRENT_TIMESTAMP),
(1, 'Productos de Skincare', 'Serums, cremas y mascarillas faciales', 1, 1, 1, CURRENT_TIMESTAMP),
(1, 'Set de Brochas Profesionales', 'Brochas de alta calidad para aplicación profesional', 1, 1, 1, CURRENT_TIMESTAMP),
(1, 'Labiales de Larga Duración', 'Labiales que no se desvanecen fácilmente', 2, 0, NULL, NULL),
(1, 'Delineadores de Ojos', 'Delineadores líquidos y en lápiz', 2, 0, NULL, NULL);

-- Insertar algunos votos de ejemplo
INSERT INTO survey_votes (survey_id, option_id, user_id) VALUES
(1, 1, 2),
(1, 1, 3),
(1, 2, 4),
(1, 3, 5);

-- Verificar la estructura creada
DESCRIBE surveys;
DESCRIBE survey_options;
DESCRIBE survey_votes;

-- Mostrar datos de ejemplo
SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
UNION ALL
SELECT 'Survey Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Survey Votes', COUNT(*) FROM survey_votes; 