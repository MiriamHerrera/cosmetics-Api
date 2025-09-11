// Utilidad para limpiar URLs corruptas en el frontend
export const cleanImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }

  // Si contiene comas, tomar solo la primera parte
  if (imageUrl.includes(',')) {
    const urls = imageUrl.split(',');
    const firstUrl = urls[0].trim();
    
    // Verificar si es una URL de Cloudinary válida
    if (firstUrl.includes('res.cloudinary.com')) {
      return firstUrl;
    } else {
      // Si no es Cloudinary, limpiar
      return null;
    }
  }

  // Si es una URL local, limpiar
  if (imageUrl.includes('api.jeniricosmetics.com') || imageUrl.includes('uploads')) {
    return null;
  }

  // Si es una URL de Cloudinary válida, mantenerla
  if (imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }

  // Para cualquier otra URL, mantenerla
  return imageUrl;
};

// Función para limpiar múltiples URLs
export const cleanImageUrls = (imageUrls: string[]): string[] => {
  return imageUrls
    .map(url => cleanImageUrl(url))
    .filter((url): url is string => url !== null);
};

// Función para obtener la primera URL válida
export const getFirstValidImageUrl = (imageUrl: string | null | undefined): string | null => {
  const cleaned = cleanImageUrl(imageUrl);
  return cleaned;
};
