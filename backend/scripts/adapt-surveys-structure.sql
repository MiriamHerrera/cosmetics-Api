-- Script de migración adaptado para las tablas de encuestas existentes
-- Este script se adapta a la estructura actual y agrega solo los campos necesarios

-- 1. Verificar si las columnas ya existen antes de agregarlas
-- Para la tabla surveys
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'surveys' 
   AND COLUMN_NAME = 'description') = 0,
  'ALTER TABLE surveys ADD COLUMN description TEXT COMMENT "Descripción adicional de la encuesta" AFTER question;',
  'SELECT "Column description already exists in surveys" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'surveys' 
   AND COLUMN_NAME = 'created_by') = 0,
  'ALTER TABLE surveys ADD COLUMN created_by BIGINT(20) NOT NULL DEFAULT 1 COMMENT "ID del usuario que creó la encuesta" AFTER status;',
  'SELECT "Column created_by already exists in surveys" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'surveys' 
   AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE surveys ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;',
  'SELECT "Column updated_at already exists in surveys" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'surveys' 
   AND COLUMN_NAME = 'closed_by') = 0,
  'ALTER TABLE surveys ADD COLUMN closed_by BIGINT(20) NULL COMMENT "ID del admin que cerró la encuesta" AFTER updated_at;',
  'SELECT "Column closed_by already exists in surveys" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'surveys' 
   AND COLUMN_NAME = 'closed_at') = 0,
  'ALTER TABLE surveys ADD COLUMN closed_at DATETIME NULL COMMENT "Fecha de cierre" AFTER closed_by;',
  'SELECT "Column closed_at already exists in surveys" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Para la tabla survey_options
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_options' 
   AND COLUMN_NAME = 'description') = 0,
  'ALTER TABLE survey_options ADD COLUMN description TEXT COMMENT "Descripción adicional de la opción" AFTER option_text;',
  'SELECT "Column description already exists in survey_options" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_options' 
   AND COLUMN_NAME = 'created_by') = 0,
  'ALTER TABLE survey_options ADD COLUMN created_by BIGINT(20) NOT NULL DEFAULT 1 COMMENT "ID del usuario que sugirió la opción" AFTER product_id;',
  'SELECT "Column created_by already exists in survey_options" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_options' 
   AND COLUMN_NAME = 'is_approved') = 0,
  'ALTER TABLE survey_options ADD COLUMN is_approved TINYINT(1) DEFAULT 0 COMMENT "0 = Pendiente, 1 = Aprobada" AFTER created_by;',
  'SELECT "Column is_approved already exists in survey_options" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_options' 
   AND COLUMN_NAME = 'admin_notes') = 0,
  'ALTER TABLE survey_options ADD COLUMN admin_notes TEXT COMMENT "Notas del administrador sobre la aprobación" AFTER is_approved;',
  'SELECT "Column admin_notes already exists in survey_options" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_options' 
   AND COLUMN_NAME = 'approved_by') = 0,
  'ALTER TABLE survey_options ADD COLUMN approved_by BIGINT(20) NULL COMMENT "ID del admin que aprobó/rechazó" AFTER admin_notes;',
  'SELECT "Column approved_by already exists in survey_options" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_options' 
   AND COLUMN_NAME = 'approved_at') = 0,
  'ALTER TABLE survey_options ADD COLUMN approved_at DATETIME NULL COMMENT "Fecha de aprobación/rechazo" AFTER approved_by;',
  'SELECT "Column approved_at already exists in survey_options" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_options' 
   AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE survey_options ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER approved_at;',
  'SELECT "Column updated_at already exists in survey_options" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Para la tabla survey_votes
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'cosmetics_db' 
   AND TABLE_NAME = 'survey_votes' 
   AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE survey_votes ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;',
  'SELECT "Column updated_at already exists in survey_votes" as message;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Cambiar el enum de status en surveys si es necesario
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