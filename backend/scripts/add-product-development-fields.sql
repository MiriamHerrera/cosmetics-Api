-- Script para agregar campos de estado de desarrollo a productos
-- Similar al sistema de construcción de edificios

ALTER TABLE products 
ADD COLUMN is_new_product TINYINT(1) DEFAULT 0 COMMENT 'Indica si es un producto nuevo en desarrollo',
ADD COLUMN is_under_development TINYINT(1) DEFAULT 0 COMMENT 'Indica si está en desarrollo activo',
ADD COLUMN development_stage ENUM('planning', 'development', 'testing', 'production', 'launched') DEFAULT 'production' COMMENT 'Etapa de desarrollo del producto',
ADD COLUMN development_size_units INT(11) DEFAULT 0 COMMENT 'Cantidad de unidades en desarrollo',
ADD COLUMN expected_launch_date DATE DEFAULT NULL COMMENT 'Fecha esperada de lanzamiento',
ADD COLUMN development_notes TEXT DEFAULT NULL COMMENT 'Notas sobre el desarrollo';

-- Índices para optimizar consultas
ALTER TABLE products 
ADD KEY idx_products_development (is_new_product, is_under_development),
ADD KEY idx_products_development_stage (development_stage),
ADD KEY idx_products_launch_date (expected_launch_date);

