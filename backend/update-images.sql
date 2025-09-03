-- Script SQL para actualizar todas las URLs de imágenes a Cloudinary
-- Ejecutar este script en tu panel de administración de base de datos

-- Producto ID 1 (Esponja de Maquillaje)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928790/cosmetics/products/product_1_1_1756928789452.jpg' WHERE id = 1;

-- Producto ID 2 (Polvo traslúcido yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928796/cosmetics/products/product_2_1_1756928795388.jpg' WHERE id = 2;

-- Producto ID 3 (Polvo fijador sheglam)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928802/cosmetics/products/product_3_1_1756928800926.jpg,https://res.cloudinary.com/dthbzzrey/image/upload/v1756928806/cosmetics/products/product_3_2_1756928805576.jpg' WHERE id = 3;

-- Producto ID 4 (Conjunto de esponjas)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928812/cosmetics/products/product_4_1_1756928811162.jpg,https://res.cloudinary.com/dthbzzrey/image/upload/v1756928816/cosmetics/products/product_4_2_1756928815711.jpg' WHERE id = 4;

-- Producto ID 5 (Mascara de pestañas Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928822/cosmetics/products/product_5_1_1756928821586.jpg' WHERE id = 5;

-- Producto ID 6 (Máscara de pestañas Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928828/cosmetics/products/product_6_1_1756928827324.jpg' WHERE id = 6;

-- Producto ID 7 (Labial líquido Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928833/cosmetics/products/product_7_1_1756928832977.jpg' WHERE id = 7;

-- Producto ID 8 (Labial líquido Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928840/cosmetics/products/product_8_1_1756928838710.jpg' WHERE id = 8;

-- Producto ID 9 (Corrector Sheglam)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928845/cosmetics/products/product_9_1_1756928844670.jpg,https://res.cloudinary.com/dthbzzrey/image/upload/v1756928850/cosmetics/products/product_9_2_1756928849355.jpg' WHERE id = 9;

-- Producto ID 10 (Cosmetiquera)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928855/cosmetics/products/product_10_1_1756928854838.jpg,https://res.cloudinary.com/dthbzzrey/image/upload/v1756928861/cosmetics/products/product_10_2_1756928860137.jpg' WHERE id = 10;

-- Producto ID 11 (Espejo portátil)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928866/cosmetics/products/product_11_1_1756928865790.jpg' WHERE id = 11;

-- Producto ID 12 (Mini Rizador de pestañas)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928872/cosmetics/products/product_12_1_1756928871556.jpg' WHERE id = 12;

-- Producto ID 13 (Calma todo bien Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928878/cosmetics/products/product_13_1_1756928877189.jpg' WHERE id = 13;

-- Producto ID 14 (Cera en barra IKT)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928883/cosmetics/products/product_14_1_1756928882724.jpg' WHERE id = 14;

-- Producto ID 15 (Polvo fijador sheglam)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928889/cosmetics/products/product_15_1_1756928888466.jpg' WHERE id = 15;

-- Producto ID 16 (Bálsamo Labial Sheglam)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756774628/images-1756773174841-890651696_yzkuoq.jpg,https://res.cloudinary.com/dthbzzrey/image/upload/v1756928897/cosmetics/products/product_16_2_1756928896668.jpg' WHERE id = 16;

-- Producto ID 17 (Set de Brochas Sheglam)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928903/cosmetics/products/product_17_1_1756928902587.jpg' WHERE id = 17;

-- Producto ID 18 (Set de Brochas Portatil)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928908/cosmetics/products/product_18_1_1756928908178.jpg,https://res.cloudinary.com/dthbzzrey/image/upload/v1756928914/cosmetics/products/product_18_2_1756928913010.jpg' WHERE id = 18;

-- Producto ID 19 (Tinta Multiusos Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928919/cosmetics/products/product_19_1_1756928918976.jpg' WHERE id = 19;

-- Producto ID 20 (Tinta Multiusos Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928925/cosmetics/products/product_20_1_1756928924612.jpg' WHERE id = 20;

-- Producto ID 21 (Tinta Multiusos Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928932/cosmetics/products/product_21_1_1756928930389.jpg' WHERE id = 21;

-- Producto ID 22 (Tinta Multiusos Yuya)
UPDATE products SET image_url = 'https://res.cloudinary.com/dthbzzrey/image/upload/v1756928937/cosmetics/products/product_22_1_1756928936623.jpg' WHERE id = 22;

-- Verificar que todas las imágenes estén actualizadas
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN image_url LIKE 'https://res.cloudinary.com/%' THEN 1 END) as cloudinary_images,
    COUNT(CASE WHEN image_url LIKE 'http://api.jeniricosmetics.com/%' THEN 1 END) as local_images
FROM products 
WHERE image_url IS NOT NULL AND image_url != '';
