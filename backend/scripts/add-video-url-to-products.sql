-- Agregar campo video_url a la tabla products
ALTER TABLE products 
ADD COLUMN video_url TEXT NULL COMMENT 'URL del video del producto (YouTube, TikTok, Facebook)' 
AFTER image_url;

-- Crear índice para búsquedas por video_url
CREATE INDEX idx_products_video_url ON products(video_url(255));

-- Verificar que la columna se agregó correctamente
DESCRIBE products;
