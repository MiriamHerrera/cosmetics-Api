-- Script de migración simplificado para encuestas
-- Este script agrega solo los campos esenciales sin usar prepared statements complejos

-- 1. Agregar campos a la tabla surveys
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS `description` TEXT COMMENT 'Descripción adicional de la encuesta' AFTER `question`,
ADD COLUMN IF NOT EXISTS `created_by` BIGINT(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que creó la encuesta' AFTER `status`,
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
ADD COLUMN IF NOT EXISTS `closed_by` BIGINT(20) NULL COMMENT 'ID del admin que cerró la encuesta' AFTER `updated_at`,
ADD COLUMN IF NOT EXISTS `closed_at` DATETIME NULL COMMENT 'Fecha de cierre' AFTER `closed_by`;

-- 2. Agregar campos a la tabla survey_options
ALTER TABLE survey_options 
ADD COLUMN IF NOT EXISTS `description` TEXT COMMENT 'Descripción adicional de la opción' AFTER `option_text`,
ADD COLUMN IF NOT EXISTS `created_by` BIGINT(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que sugirió la opción' AFTER `product_id`,
ADD COLUMN IF NOT EXISTS `is_approved` TINYINT(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Aprobada' AFTER `created_by`,
ADD COLUMN IF NOT EXISTS `admin_notes` TEXT COMMENT 'Notas del administrador sobre la aprobación' AFTER `is_approved`,
ADD COLUMN IF NOT EXISTS `approved_by` BIGINT(20) NULL COMMENT 'ID del admin que aprobó/rechazó' AFTER `admin_notes`,
ADD COLUMN IF NOT EXISTS `approved_at` DATETIME NULL COMMENT 'Fecha de aprobación/rechazo' AFTER `approved_by`,
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `approved_at`;

-- 3. Agregar campos a la tabla survey_votes
ALTER TABLE survey_votes 
ADD COLUMN IF NOT EXISTS `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- 4. Cambiar el enum de status en surveys
ALTER TABLE surveys 
MODIFY COLUMN `status` ENUM('draft', 'open', 'closed') DEFAULT 'open' COMMENT 'Estado de la encuesta';

-- 5. Actualizar datos existentes
UPDATE surveys SET created_by = 1 WHERE created_by IS NULL;
UPDATE survey_options SET created_by = 1 WHERE created_by IS NULL;
UPDATE survey_options SET is_approved = 1 WHERE is_approved IS NULL;

-- 6. Verificar la estructura final
DESCRIBE surveys;
DESCRIBE survey_options;
DESCRIBE survey_votes;

-- 7. Mostrar estadísticas finales
SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
UNION ALL
SELECT 'Survey Options', COUNT(*) FROM survey_options
UNION ALL
SELECT 'Survey Votes', COUNT(*) FROM survey_votes; 