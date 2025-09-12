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

// Endpoint de diagnóstico que muestra qué controlador se está usando
router.post('/diagnose', authenticateToken, requireAdmin, upload.array('images', 1), async (req, res) => {
  try {
    console.log('🔍 [DIAGNOSE] Endpoint de diagnóstico llamado');
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      cloudinary_configured: !!process.env.CLOUDINARY_CLOUD_NAME,
      files_received: req.files?.length || 0,
      using_cloudinary: true,
      message: 'Este es el controlador NUEVO que usa Cloudinary'
    };
    
    if (req.files && req.files.length > 0) {
      console.log('🔍 [DIAGNOSE] Probando subida a Cloudinary...');
      
      try {
        const result = await uploadToCloudinary(req.files[0].buffer, {
          public_id: `diagnose_${Date.now()}`
        });
        
        if (result.success) {
          diagnosis.cloudinary_test = 'SUCCESS';
          diagnosis.cloudinary_url = result.data.secure_url;
          console.log('✅ [DIAGNOSE] Cloudinary funciona correctamente');
        } else {
          diagnosis.cloudinary_test = 'FAILED';
          diagnosis.cloudinary_error = result.error;
          console.log('❌ [DIAGNOSE] Cloudinary falló:', result.error);
        }
      } catch (error) {
        diagnosis.cloudinary_test = 'ERROR';
        diagnosis.cloudinary_error = error.message;
        console.log('❌ [DIAGNOSE] Error en Cloudinary:', error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Diagnóstico completado',
      data: diagnosis
    });
    
  } catch (error) {
    console.error('❌ [DIAGNOSE] Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      message: 'Error en diagnóstico',
      error: error.message
    });
  }
});

// Endpoint simple para verificar qué controlador se está usando
router.get('/check-controller', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Controlador verificado',
    data: {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      controller: 'NUEVO - Cloudinary',
      cloudinary_configured: !!process.env.CLOUDINARY_CLOUD_NAME,
      message: 'Si ves este mensaje, el controlador NUEVO está activo'
    }
  });
});

// Endpoint temporal para verificar URLs en la base de datos
router.get('/debug-products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { query } = require('../config/database');
    
    // Obtener los últimos 10 productos con sus URLs
    const products = await query(`
      SELECT id, name, image_url, created_at 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    res.json({
      success: true,
      message: 'Productos obtenidos',
      data: {
        total: products.length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          created_at: p.created_at,
          is_cloudinary: p.image_url ? p.image_url.includes('res.cloudinary.com') : false
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos',
      error: error.message
    });
  }
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

// Subir múltiples imágenes (admin) - CONTROLADOR PRINCIPAL CON CLOUDINARY OBLIGATORIO
router.post('/upload', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Endpoint /upload llamado - Versión 2.0.0');
    console.log('🔍 [DEBUG] Archivos recibidos:', req.files?.length || 0);
    console.log('🔍 [DEBUG] Cloudinary configurado:', !!process.env.CLOUDINARY_CLOUD_NAME);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han subido archivos'
      });
    }

    console.log(`🚀 [MAIN] FORZANDO subida a Cloudinary - ${req.files.length} imágenes...`);

    // Subir cada imagen a Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          public_id: `product_main_${Date.now()}_${Math.round(Math.random() * 1E9)}`
        });

        if (result.success) {
          console.log(`✅ [MAIN] Imagen subida a Cloudinary: ${result.data.secure_url}`);
          return {
            filename: result.data.public_id,
            originalName: file.originalname,
            path: result.data.secure_url, // URL de Cloudinary
            size: result.data.bytes,
            mimetype: file.mimetype,
            cloudinaryData: result.data
          };
        } else {
          console.error(`❌ [MAIN] Error subiendo ${file.originalname}:`, result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error subiendo ${file.originalname}:`, error);
        throw error;
      }
    });

    // Esperar a que todas las imágenes se suban
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ [MAIN] ${uploadedFiles.length} imágenes subidas exitosamente a Cloudinary`);

    res.json({
      success: true,
      message: 'Imágenes subidas exitosamente a Cloudinary',
      data: uploadedFiles
    });

  } catch (error) {
    console.error('❌ [MAIN] Error subiendo imágenes a Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir imágenes',
      error: error.message
    });
  }
});

// Endpoint de emergencia que reemplaza el controlador original
router.post('/upload-emergency', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han subido archivos'
      });
    }

    console.log(`🚨 [EMERGENCY] FORZANDO subida a Cloudinary - ${req.files.length} imágenes...`);

    // Subir cada imagen a Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          public_id: `emergency_${Date.now()}_${Math.round(Math.random() * 1E9)}`
        });

        if (result.success) {
          console.log(`✅ [EMERGENCY] Imagen subida a Cloudinary: ${result.data.secure_url}`);
          return {
            filename: result.data.public_id,
            originalName: file.originalname,
            path: result.data.secure_url, // URL de Cloudinary
            size: result.data.bytes,
            mimetype: file.mimetype,
            cloudinaryData: result.data
          };
        } else {
          console.error(`❌ [EMERGENCY] Error subiendo ${file.originalname}:`, result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error subiendo ${file.originalname}:`, error);
        throw error;
      }
    });

    // Esperar a que todas las imágenes se suban
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ [EMERGENCY] ${uploadedFiles.length} imágenes subidas exitosamente a Cloudinary`);

    res.json({
      success: true,
      message: 'Imágenes subidas exitosamente a Cloudinary (EMERGENCY)',
      data: uploadedFiles
    });

  } catch (error) {
    console.error('❌ [EMERGENCY] Error subiendo imágenes a Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir imágenes (EMERGENCY)',
      error: error.message
    });
  }
});

module.exports = router;