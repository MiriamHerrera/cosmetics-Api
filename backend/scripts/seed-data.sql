-- Script para insertar datos de prueba en cosmetics_db
-- Ejecutar después de crear las tablas

USE cosmetics_db;

-- =========================
-- 1. Insertar categorías
-- =========================
INSERT INTO categories (name) VALUES
('Maquillaje'),
('Cuidado de la piel'),
('Fragancias'),
('Accesorios');

-- =========================
-- 2. Insertar tipos de producto
-- =========================
INSERT INTO product_types (category_id, name) VALUES
-- Maquillaje
(1, 'Labiales'),
(1, 'Rubores'),
(1, 'Polvos'),
(1, 'Bases'),
(1, 'Correctores'),
(1, 'Sombras'),
(1, 'Máscaras'),
(1, 'Delineadores'),

-- Cuidado de la piel
(2, 'Limpiadores'),
(2, 'Toners'),
(2, 'Serums'),
(2, 'Cremas hidratantes'),
(2, 'Protectores solares'),
(2, 'Exfoliantes'),

-- Fragancias
(3, 'Perfumes'),
(3, 'Colonias'),
(3, 'Aguas de colonia'),

-- Accesorios
(4, 'Brochas'),
(4, 'Esponjas'),
(4, 'Espejos'),
(4, 'Estuches');

-- =========================
-- 3. Insertar productos de ejemplo
-- =========================
INSERT INTO products (product_type_id, name, description, price, image_url, stock_total) VALUES
-- Labiales
(1, 'Labial Mate Premium', 'Labial de larga duración con acabado mate elegante', 25.99, 'https://example.com/labial-mate.jpg', 50),
(1, 'Gloss Brillante', 'Gloss con brillo intenso y sabor a frutas', 18.50, 'https://example.com/gloss-brillante.jpg', 75),
(1, 'Labial Líquido', 'Labial líquido mate de alta pigmentación', 22.99, 'https://example.com/labial-liquido.jpg', 30),

-- Rubores
(2, 'Rubor en Polvo', 'Rubor natural con acabado mate', 15.99, 'https://example.com/rubor-polvo.jpg', 60),
(2, 'Rubor Cremoso', 'Rubor cremoso de fácil aplicación', 19.99, 'https://example.com/rubor-cremoso.jpg', 45),

-- Polvos
(3, 'Polvo Compacto', 'Polvo compacto para acabado mate', 16.99, 'https://example.com/polvo-compacto.jpg', 80),
(3, 'Polvo Suelto', 'Polvo suelto translúcido', 14.50, 'https://example.com/polvo-suelto.jpg', 65),

-- Bases
(4, 'Base Líquida', 'Base de cobertura media a alta', 32.99, 'https://example.com/base-liquida.jpg', 40),
(4, 'Base en Polvo', 'Base en polvo para piel mixta', 28.99, 'https://example.com/base-polvo.jpg', 55),

-- Correctores
(5, 'Corrector Líquido', 'Corrector de alta cobertura', 24.99, 'https://example.com/corrector-liquido.jpg', 35),
(5, 'Corrector en Barra', 'Corrector en barra para ojeras', 21.99, 'https://example.com/corrector-barra.jpg', 50),

-- Sombras
(6, 'Paleta de Sombras', 'Paleta con 18 colores mate y brillantes', 45.99, 'https://example.com/paleta-sombras.jpg', 25),
(6, 'Sombra Individual', 'Sombra individual con acabado satinado', 12.99, 'https://example.com/sombra-individual.jpg', 70),

-- Máscaras
(7, 'Máscara de Pestañas', 'Máscara volumizadora y alargadora', 26.99, 'https://example.com/mascara-pestanas.jpg', 60),
(7, 'Máscara de Pestañas Waterproof', 'Máscara resistente al agua', 29.99, 'https://example.com/mascara-waterproof.jpg', 40),

-- Delineadores
(8, 'Delineador Líquido', 'Delineador líquido de punta fina', 23.99, 'https://example.com/delineador-liquido.jpg', 55),
(8, 'Delineador en Lápiz', 'Delineador en lápiz suave', 18.99, 'https://example.com/delineador-lapiz.jpg', 65),

-- Limpiadores
(9, 'Gel Limpiador', 'Gel limpiador suave para todo tipo de piel', 20.99, 'https://example.com/gel-limpiador.jpg', 45),
(9, 'Agua Micelar', 'Agua micelar para desmaquillar', 16.99, 'https://example.com/agua-micelar.jpg', 80),

-- Toners
(10, 'Toner Hidratante', 'Toner con ácido hialurónico', 22.99, 'https://example.com/toner-hidratante.jpg', 50),
(10, 'Toner Exfoliante', 'Toner con AHA para exfoliación suave', 25.99, 'https://example.com/toner-exfoliante.jpg', 35),

-- Serums
(11, 'Serum Vitamina C', 'Serum antioxidante con vitamina C', 38.99, 'https://example.com/serum-vitamina-c.jpg', 30),
(11, 'Serum Retinol', 'Serum anti-edad con retinol', 42.99, 'https://example.com/serum-retinol.jpg', 25),

-- Cremas hidratantes
(12, 'Crema Hidratante', 'Crema hidratante para piel seca', 34.99, 'https://example.com/crema-hidratante.jpg', 40),
(12, 'Gel Hidratante', 'Gel hidratante para piel mixta', 29.99, 'https://example.com/gel-hidratante.jpg', 55),

-- Protectores solares
(13, 'Protector Solar SPF 50', 'Protector solar de amplio espectro', 36.99, 'https://example.com/protector-spf50.jpg', 70),
(13, 'Protector Solar SPF 30', 'Protector solar ligero para uso diario', 32.99, 'https://example.com/protector-spf30.jpg', 60),

-- Exfoliantes
(14, 'Exfoliante Físico', 'Exfoliante con microesferas', 24.99, 'https://example.com/exfoliante-fisico.jpg', 45),
(14, 'Exfoliante Químico', 'Exfoliante con ácido glicólico', 28.99, 'https://example.com/exfoliante-quimico.jpg', 35),

-- Perfumes
(15, 'Perfume Femenino', 'Perfume floral y elegante', 89.99, 'https://example.com/perfume-femenino.jpg', 20),
(15, 'Perfume Masculino', 'Perfume amaderado y fresco', 95.99, 'https://example.com/perfume-masculino.jpg', 18),

-- Colonias
(16, 'Colonia Suave', 'Colonia suave para uso diario', 45.99, 'https://example.com/colonia-suave.jpg', 40),
(16, 'Colonia Deportiva', 'Colonia fresca para deportes', 38.99, 'https://example.com/colonia-deportiva.jpg', 50),

-- Brochas
(19, 'Brocha de Base', 'Brocha profesional para aplicar base', 19.99, 'https://example.com/brocha-base.jpg', 60),
(19, 'Brocha de Sombras', 'Brocha suave para aplicar sombras', 15.99, 'https://example.com/brocha-sombras.jpg', 75),
(19, 'Brocha de Labios', 'Brocha fina para labios', 12.99, 'https://example.com/brocha-labios.jpg', 80),

-- Esponjas
(20, 'Esponja Beauty Blender', 'Esponja profesional para maquillaje', 24.99, 'https://example.com/esponja-beauty-blender.jpg', 45),
(20, 'Esponja Triangular', 'Esponja triangular para correcciones', 18.99, 'https://example.com/esponja-triangular.jpg', 55),

-- Espejos
(21, 'Espejo de Maquillaje', 'Espejo con aumento y luz LED', 34.99, 'https://example.com/espejo-maquillaje.jpg', 25),
(21, 'Espejo Compacto', 'Espejo compacto para bolso', 16.99, 'https://example.com/espejo-compacto.jpg', 70),

-- Estuches
(22, 'Estuche Profesional', 'Estuche grande para organizar productos', 49.99, 'https://example.com/estuche-profesional.jpg', 20),
(22, 'Estuche Compacto', 'Estuche pequeño para viajes', 29.99, 'https://example.com/estuche-compacto.jpg', 35);
-- =========================
-- 4. Insertar usuario administrador
-- =========================
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO users (name, phone, email, password, role) VALUES
('Administrador', '+1234567890', 'admin@cosmetics.com', '$2a$12$Jl4zC7Oj53pq8FALHTf1yuaLWNZjshqY206Amq8gjCCf.3crc0sWi', 'admin');

-- =========================
-- 5. Insertar encuesta de ejemplo
-- =========================
INSERT INTO surveys (question, status) VALUES
('¿Qué tipo de productos te gustaría ver en el próximo inventario?', 'open');

INSERT INTO survey_options (survey_id, option_text) VALUES
(1, 'Labiales de larga duración'),
(1, 'Sombras con glitter'),
(1, 'Bases con cobertura alta'),
(1, 'Serums anti-edad'),
(1, 'Perfumes florales');

-- =========================
-- 6. Insertar inventario programado
-- =========================
INSERT INTO inventory_schedule (product_id, arrival_date, quantity, status, created_by) VALUES
(1, DATE_ADD(NOW(), INTERVAL 7 DAY), 100, 'scheduled', 1),
(5, DATE_ADD(NOW(), INTERVAL 10 DAY), 80, 'scheduled', 1),
(12, DATE_ADD(NOW(), INTERVAL 5 DAY), 120, 'scheduled', 1);

-- =========================
-- 7. Insertar estadísticas de cliente de ejemplo
-- =========================
INSERT INTO client_statistics (user_id, total_purchases, total_spent) VALUES
(1, 0, 0.00);

-- Mensaje de confirmación
SELECT 'Datos de prueba insertados correctamente' as mensaje; 