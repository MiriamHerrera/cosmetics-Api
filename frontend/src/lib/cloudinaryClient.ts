// Cliente de Cloudinary para el frontend
export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    console.log('📤 [CLOUDINARY] Subiendo imagen directamente a Cloudinary...');
    
    // Crear FormData
    const formData = new FormData();
    formData.append('images', file);
    
    // Subir usando el endpoint de Cloudinary del backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/images/upload-cloudinary`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        const cloudinaryUrl = result.data[0].path;
        console.log('✅ [CLOUDINARY] Imagen subida exitosamente:', cloudinaryUrl);
        return cloudinaryUrl;
      }
    }

    throw new Error(`Error subiendo a Cloudinary: ${response.status}`);
  } catch (error) {
    console.error('❌ [CLOUDINARY] Error:', error);
    throw error;
  }
};
