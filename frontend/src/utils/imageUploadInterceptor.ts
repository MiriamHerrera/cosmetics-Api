 // Interceptor para convertir URLs locales a Cloudinary
import { uploadToCloudinary } from '../lib/cloudinaryClient';

// Cliente de Cloudinary para el frontend
const cloudinaryClient = {
  upload: async (file: File): Promise<string> => {
    try {
      // Convertir File a base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extraer solo la parte base64
      const base64Data = base64.split(',')[1];

      // Subir a Cloudinary usando la API del backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/images/upload-cloudinary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: (() => {
          const formData = new FormData();
          formData.append('images', file);
          return formData;
        })()
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          return result.data[0].path; // URL de Cloudinary
        }
      }

      throw new Error('Error subiendo a Cloudinary');
    } catch (error) {
      console.error('Error en upload interceptor:', error);
      throw error;
    }
  }
};

// Función para interceptar y convertir URLs
export const interceptImageUpload = async (files: File[]): Promise<string[]> => {
  try {
    console.log('🔄 [INTERCEPTOR] Interceptando subida de imágenes...');
    
    const uploadPromises = files.map(async (file) => {
      try {
        const cloudinaryUrl = await cloudinaryClient.upload(file);
        console.log('✅ [INTERCEPTOR] Imagen convertida a Cloudinary:', cloudinaryUrl);
        return cloudinaryUrl;
      } catch (error) {
        console.error('❌ [INTERCEPTOR] Error convirtiendo imagen:', error);
        throw error;
      }
    });

    const cloudinaryUrls = await Promise.all(uploadPromises);
    console.log('✅ [INTERCEPTOR] Todas las imágenes convertidas a Cloudinary');
    
    return cloudinaryUrls;
  } catch (error) {
    console.error('❌ [INTERCEPTOR] Error en interceptor:', error);
    throw error;
  }
};

// Función para detectar si una URL es local y necesita conversión
export const isLocalUrl = (url: string): boolean => {
  return url.includes('api.jeniricosmetics.com') || url.includes('uploads');
};

// Función para limpiar URLs locales y mantener solo Cloudinary
export const cleanImageUrls = (urls: string[]): string[] => {
  return urls.filter(url => !isLocalUrl(url));
};
