// backend/scripts/migrate-to-cloudinary.js
// Script para migrar imágenes existentes de archivos locales a Cloudinary

const fs = require('fs').promises;
const path = require('path');
const { uploadToCloudinary } = require('../src/config/cloudinary');
const { getConnection } = require('../src/config/database');

async function migrateImagesToCloudinary() {
  let connection;
  
  try {
    console.log('🚀 Iniciando migración de imágenes a Cloudinary...');
    
    // Conectar a la base de datos
    connection = await getConnection();
    console.log('✅ Conectado a la base de datos');
    
    // Obtener todos los productos con imágenes locales
    const [products] = await connection.query(`
      SELECT id, name, image_url 
      FROM products 
      WHERE image_url IS NOT NULL 
      AND image_url != '' 
      AND image_url NOT LIKE 'https://%'
      AND image_url NOT LIKE 'http://%'
    `);
    
    console.log(`📦 Encontrados ${products.length} productos con imágenes locales`);
    
    if (products.length === 0) {
      console.log('✅ No hay imágenes locales para migrar');
      return;
    }
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`\n🔄 Migrando producto: ${product.name} (ID: ${product.id})`);
        
        // Parsear las URLs de imagen (pueden ser múltiples separadas por comas)
        const imageUrls = product.image_url.split(',').map(url => url.trim()).filter(url => url);
        const newImageUrls = [];
        
        for (const imageUrl of imageUrls) {
          try {
            // Construir la ruta del archivo local
            let localPath;
            if (imageUrl.startsWith('/uploads/')) {
              localPath = path.join(process.cwd(), imageUrl);
            } else if (imageUrl.startsWith('uploads/')) {
              localPath = path.join(process.cwd(), imageUrl);
            } else {
              localPath = path.join(process.cwd(), 'uploads/products', imageUrl);
            }
            
            console.log(`  📁 Buscando archivo: ${localPath}`);
            
            // Verificar si el archivo existe
            try {
              await fs.access(localPath);
            } catch (error) {
              console.log(`  ⚠️  Archivo no encontrado: ${localPath}`);
              continue;
            }
            
            // Leer el archivo
            const fileBuffer = await fs.readFile(localPath);
            console.log(`  📤 Subiendo a Cloudinary...`);
            
            // Subir a Cloudinary
            const result = await uploadToCloudinary(fileBuffer, {
              public_id: `migrated_product_${product.id}_${Date.now()}_${Math.round(Math.random() * 1E9)}`
            });
            
            if (result.success) {
              newImageUrls.push(result.data.secure_url);
              console.log(`  ✅ Migrado: ${result.data.secure_url}`);
            } else {
              console.log(`  ❌ Error subiendo: ${result.error}`);
              errorCount++;
            }
            
          } catch (error) {
            console.log(`  ❌ Error procesando imagen ${imageUrl}:`, error.message);
            errorCount++;
          }
        }
        
        // Actualizar la base de datos con las nuevas URLs
        if (newImageUrls.length > 0) {
          const newImageUrl = newImageUrls.join(',');
          await connection.query(
            'UPDATE products SET image_url = ? WHERE id = ?',
            [newImageUrl, product.id]
          );
          console.log(`  💾 Base de datos actualizada con ${newImageUrls.length} imágenes`);
          migratedCount++;
        } else {
          console.log(`  ⚠️  No se migraron imágenes para este producto`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error migrando producto ${product.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎯 Migración completada:');
    console.log(`  ✅ Productos migrados: ${migratedCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);
    console.log(`  📦 Total procesados: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  migrateImagesToCloudinary()
    .then(() => {
      console.log('🏁 Script de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateImagesToCloudinary };
