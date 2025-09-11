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

// Subir múltiples imágenes (admin) - CONTROLADOR ORIGINAL
router.post('/upload', authenticateToken, requireAdmin, upload.array('images', 10), uploadImages);

module.exports = router;