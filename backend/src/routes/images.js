// backend/src/routes/images.js
const express = require('express');
const router = express.Router();
const { upload, uploadImages } = require('../controllers/imageController');
const { uploadToCloudinary } = require('../config/cloudinary');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Endpoint de test para verificar Cloudinary
router.post('/test-cloudinary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 [TEST] Probando Cloudinary...');
    
    // Crear un buffer de imagen de prueba
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const result = await uploadToCloudinary(testImageBuffer, {
      public_id: `test_${Date.now()}`
    });
    
    if (result.success) {
      console.log('✅ [TEST] Cloudinary funciona correctamente!');
      res.json({
        success: true,
        message: 'Cloudinary funciona correctamente',
        data: result.data
      });
    } else {
      console.log('❌ [TEST] Error en Cloudinary:', result.error);
      res.status(500).json({
        success: false,
        message: 'Error en Cloudinary',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno',
      error: error.message
    });
  }
});

// Endpoint para verificar qué controlador se está usando
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de imágenes funcionando',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    cloudinary_configured: !!process.env.CLOUDINARY_CLOUD_NAME,
    endpoints: {
      upload: '/api/images/upload',
      force_cloudinary: '/api/images/force-cloudinary',
      test_cloudinary: '/api/images/test-cloudinary',
      migrate: '/api/images/migrate-to-cloudinary'
    }
  });
});

// Endpoint de migración para limpiar URLs corruptas
router.post('/migrate-to-cloudinary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 [MIGRATE] Iniciando migración a Cloudinary...');
    
    const { query } = require('../config/database');
    
    // Obtener productos con URLs corruptas
    const products = await query(`
      SELECT id, name, image_url 
      FROM products 
      WHERE image_url LIKE '%,%' 
      OR image_url LIKE '%api.jeniricosmetics.com%'
      OR image_url LIKE '%uploads%'
    `);
    
    console.log(`📊 [MIGRATE] Encontrados ${products.length} productos para migrar`);
    
    let migrated = 0;
    let cleaned = 0;
    
    for (const product of products) {
      let cleanUrl = null;
      
      if (product.image_url) {
        // Si contiene comas, tomar solo la primera parte
        const urls = product.image_url.split(',');
        const firstUrl = urls[0].trim();
        
        // Verificar si es una URL de Cloudinary válida
        if (firstUrl.includes('res.cloudinary.com')) {
          cleanUrl = firstUrl;
          migrated++;
        } else {
          // Si no es Cloudinary, limpiar
          cleanUrl = null;
          cleaned++;
        }
      }
      
      // Actualizar la base de datos
      await query(`
        UPDATE products 
        SET image_url = ? 
        WHERE id = ?
      `, [cleanUrl, product.id]);
      
      console.log(`✅ [MIGRATE] Producto ${product.id}: ${cleanUrl || 'LIMPIO'}`);
    }
    
    res.json({
      success: true,
      message: 'Migración completada',
      data: {
        total: products.length,
        migrated: migrated,
        cleaned: cleaned
      }
    });
    
  } catch (error) {
    console.error('❌ [MIGRATE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en migración',
      error: error.message
    });
  }
});

// Endpoint de emergencia para forzar Cloudinary en TODAS las subidas
router.post('/force-cloudinary', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han subido archivos'
      });
    }

    console.log(`🚨 [FORCE] FORZANDO subida a Cloudinary - ${req.files.length} imágenes...`);

    // Subir cada imagen a Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          public_id: `force_${Date.now()}_${Math.round(Math.random() * 1E9)}`
        });

        if (result.success) {
          console.log(`✅ [FORCE] Imagen subida a Cloudinary: ${result.data.secure_url}`);
          return {
            filename: result.data.public_id,
            originalName: file.originalname,
            path: result.data.secure_url, // URL de Cloudinary
            size: result.data.bytes,
            mimetype: file.mimetype,
            cloudinaryData: result.data
          };
        } else {
          console.error(`❌ [FORCE] Error subiendo ${file.originalname}:`, result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error subiendo ${file.originalname}:`, error);
        throw error;
      }
    });

    // Esperar a que todas las imágenes se suban
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ [FORCE] ${uploadedFiles.length} imágenes subidas exitosamente a Cloudinary`);

    res.json({
      success: true,
      message: 'Imágenes subidas exitosamente a Cloudinary (FORZADO)',
      data: uploadedFiles
    });

  } catch (error) {
    console.error('❌ [FORCE] Error subiendo imágenes a Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir imágenes (FORZADO)',
      error: error.message
    });
  }
});

// Subir múltiples imágenes DIRECTO A CLOUDINARY (nuevo endpoint)
router.post('/upload-cloudinary', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han subido archivos'
      });
    }

    console.log(`📤 [DIRECT] Subiendo ${req.files.length} imágenes DIRECTAMENTE a Cloudinary...`);

    // Subir cada imagen a Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          public_id: `product_direct_${Date.now()}_${Math.round(Math.random() * 1E9)}`
        });

        if (result.success) {
          console.log(`✅ [DIRECT] Imagen subida a Cloudinary: ${result.data.secure_url}`);
          return {
            filename: result.data.public_id,
            originalName: file.originalname,
            path: result.data.secure_url, // URL de Cloudinary
            size: result.data.bytes,
            mimetype: file.mimetype,
            cloudinaryData: result.data
          };
        } else {
          console.error(`❌ [DIRECT] Error subiendo ${file.originalname}:`, result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error subiendo ${file.originalname}:`, error);
        throw error;
      }
    });

    // Esperar a que todas las imágenes se suban
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ [DIRECT] ${uploadedFiles.length} imágenes subidas exitosamente a Cloudinary`);

    res.json({
      success: true,
      message: 'Imágenes subidas exitosamente a Cloudinary (DIRECTO)',
      data: uploadedFiles
    });

  } catch (error) {
    console.error('❌ [DIRECT] Error subiendo imágenes a Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir imágenes (DIRECTO)',
      error: error.message
    });
  }
});

// Subir múltiples imágenes (admin) - CONTROLADOR ORIGINAL CON CLOUDINARY FORZADO
router.post('/upload', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han subido archivos'
      });
    }

    console.log(`📤 [ORIGINAL] Subiendo ${req.files.length} imágenes a Cloudinary...`);

    // Subir cada imagen a Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          public_id: `product_original_${Date.now()}_${Math.round(Math.random() * 1E9)}`
        });

        if (result.success) {
          console.log(`✅ [ORIGINAL] Imagen subida a Cloudinary: ${result.data.secure_url}`);
          return {
            filename: result.data.public_id,
            originalName: file.originalname,
            path: result.data.secure_url, // URL de Cloudinary
            size: result.data.bytes,
            mimetype: file.mimetype,
            cloudinaryData: result.data
          };
        } else {
          console.error(`❌ [ORIGINAL] Error subiendo ${file.originalname}:`, result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error subiendo ${file.originalname}:`, error);
        throw error;
      }
    });

    // Esperar a que todas las imágenes se suban
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ [ORIGINAL] ${uploadedFiles.length} imágenes subidas exitosamente a Cloudinary`);

    res.json({
      success: true,
      message: 'Imágenes subidas exitosamente a Cloudinary (ORIGINAL)',
      data: uploadedFiles
    });

  } catch (error) {
    console.error('❌ [ORIGINAL] Error subiendo imágenes a Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir imágenes (ORIGINAL)',
      error: error.message
    });
  }
});

module.exports = router;