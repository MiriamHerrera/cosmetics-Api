-- Script para actualizar las tablas de encuestas existentes
-- Este script modifica las tablas para que coincidan con el nuevo sistema

-- 1. Actualizar tabla surveys
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS `description` TEXT COMMENT 'Descripción adicional de la encuesta' AFTER `question`,
ADD COLUMN IF NOT EXISTS `created_by` BIGINT(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que creó la encuesta' AFTER `status`,
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
ADD COLUMN IF NOT EXISTS `closed_by` BIGINT(20) NULL COMMENT 'ID del admin que cerró la encuesta' AFTER `updated_at`,
ADD COLUMN IF NOT EXISTS `closed_at` DATETIME NULL COMMENT 'Fecha de cierre' AFTER `closed_by`;

-- Cambiar el enum de status para incluir 'draft'
ALTER TABLE surveys 
MODIFY COLUMN `status` ENUM('draft', 'open', 'closed') DEFAULT 'open' COMMENT 'Estado de la encuesta';

-- Agregar foreign key para created_by (asumiendo que existe un usuario con ID 1)
ALTER TABLE surveys 
ADD CONSTRAINT `surveys_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Agregar foreign key para closed_by
ALTER TABLE surveys 
ADD CONSTRAINT `surveys_closed_by_fk` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 2. Actualizar tabla survey_options
ALTER TABLE survey_options 
ADD COLUMN IF NOT EXISTS `description` TEXT COMMENT 'Descripción adicional de la opción' AFTER `option_text`,
ADD COLUMN IF NOT EXISTS `created_by` BIGINT(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que sugirió la opción' AFTER `product_id`,
ADD COLUMN IF NOT EXISTS `is_approved` TINYINT(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Aprobada' AFTER `created_by`,
ADD COLUMN IF NOT EXISTS `admin_notes` TEXT COMMENT 'Notas del administrador sobre la aprobación' AFTER `is_approved`,
ADD COLUMN IF NOT EXISTS `approved_by` BIGINT(20) NULL COMMENT 'ID del admin que aprobó/rechazó' AFTER `admin_notes`,
ADD COLUMN IF NOT EXISTS `approved_at` DATETIME NULL COMMENT 'Fecha de aprobación/rechazo' AFTER `approved_by`,
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `approved_at`;

-- Agregar foreign keys
ALTER TABLE survey_options 
ADD CONSTRAINT `survey_options_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
ADD CONSTRAINT `survey_options_approved_by_fk` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 3. Actualizar tabla survey_votes
ALTER TABLE survey_votes 
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Agregar constraint único para evitar votos duplicados
ALTER TABLE survey_votes 
ADD CONSTRAINT `unique_vote` UNIQUE (`survey_id`, `user_id`) COMMENT 'Un usuario solo puede votar una vez por encuesta';

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS `idx_surveys_status` ON surveys(`status`);
CREATE INDEX IF NOT EXISTS `idx_surveys_created_by` ON surveys(`created_by`);
CREATE INDEX IF NOT EXISTS `idx_survey_options_survey_id` ON survey_options(`survey_id`);
CREATE INDEX IF NOT EXISTS `idx_survey_options_approved` ON survey_options(`is_approved`);
CREATE INDEX IF NOT EXISTS `idx_survey_options_created_by` ON survey_options(`created_by`);
CREATE INDEX IF NOT EXISTS `idx_survey_votes_survey_id` ON survey_votes(`survey_id`);
CREATE INDEX IF NOT EXISTS `idx_survey_votes_option_id` ON survey_votes(`option_id`);
CREATE INDEX IF NOT EXISTS `idx_survey_votes_user_id` ON survey_votes(`user_id`);

-- 5. Actualizar datos existentes
-- Asignar created_by = 1 para encuestas existentes (asumiendo que existe un usuario admin con ID 1)
UPDATE surveys SET created_by = 1 WHERE created_by IS NULL;

-- Asignar created_by = 1 para opciones existentes
UPDATE survey_options SET created_by = 1 WHERE created_by IS NULL;

-- Marcar opciones existentes como aprobadas
UPDATE survey_options SET is_approved = 1 WHERE is_approved IS NULL;

-- 6. Verificar la estructura actualizada
DESCRIBE surveys;
DESCRIBE survey_options;
DESCRIBE survey_votes;

-- 7. Mostrar datos existentes
SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
UNION ALL
SELECT 'Survey Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Survey Votes', COUNT(*) FROM survey_votes;

-- 8. Mostrar algunas encuestas de ejemplo
SELECT id, question, status, created_by, created_at FROM surveys LIMIT 5;

-- 9. Mostrar algunas opciones de ejemplo
SELECT id, survey_id, option_text, is_approved, created_by FROM survey_options LIMIT 5; 