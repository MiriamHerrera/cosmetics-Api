// backend/src/controllers/imageController.js
const multer = require('multer');
const path = require('path');
const { uploadToCloudinary } = require('../config/cloudinary');

// Configuración de multer para memoria (no guardar en disco)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // máximo 10 archivos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Subir múltiples imágenes a Cloudinary
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han subido archivos'
      });
    }

    console.log(`📤 Subiendo ${req.files.length} imágenes a Cloudinary...`);

    // Subir cada imagen a Cloudinary
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await uploadToCloudinary(file.buffer, {
          public_id: `product_${Date.now()}_${Math.round(Math.random() * 1E9)}`
        });

        if (result.success) {
          return {
            filename: result.data.public_id,
            originalName: file.originalname,
            path: result.data.secure_url, // URL de Cloudinary
            size: result.data.bytes,
            mimetype: file.mimetype,
            cloudinaryData: result.data
          };
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error subiendo ${file.originalname}:`, error);
        throw error;
      }
    });

    // Esperar a que todas las imágenes se suban
    const uploadedFiles = await Promise.all(uploadPromises);

    console.log(`✅ ${uploadedFiles.length} imágenes subidas exitosamente a Cloudinary`);

    res.json({
      success: true,
      message: 'Imágenes subidas exitosamente a Cloudinary',
      data: uploadedFiles
    });

  } catch (error) {
    console.error('Error subiendo imágenes a Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir imágenes',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadImages
};