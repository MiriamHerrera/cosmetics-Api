// backend/src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Función para subir imagen a Cloudinary
const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    console.log('🔧 [Cloudinary] Iniciando subida...', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'undefined',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'undefined'
    });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'cosmetics/products',
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          ...options
        },
        (error, result) => {
          if (error) {
            console.error('❌ [Cloudinary] Error en upload_stream:', error);
            reject(error);
          } else {
            console.log('✅ [Cloudinary] Subida exitosa:', result.secure_url);
            resolve(result);
          }
        }
      ).end(fileBuffer);
    });

    return {
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    };
  } catch (error) {
    console.error('❌ [Cloudinary] Error subiendo a Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para eliminar imagen de Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      data: result
    };
  } catch (error) {
    console.error('Error eliminando de Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};