import { useMemo } from 'react';

interface UseProductImagesProps {
  imageUrl?: string;
  fallbackImage?: string;
}

export const useProductImages = ({ 
  imageUrl, 
  fallbackImage = '/NoImage.jpg' 
}: UseProductImagesProps) => {
  const images = useMemo(() => {
    if (!imageUrl || imageUrl.trim() === '') {
      return {
        primary: fallbackImage,
        all: [],
        hasImages: false
      };
    }

    // Si la imagen es una URL externa (http/https), usarla directamente
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return {
        primary: imageUrl,
        all: [imageUrl],
        hasImages: true
      };
    }

    // Si la imagen es una ruta local (empieza con /), construir la URL completa
    if (imageUrl.startsWith('/')) {
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com'}${imageUrl}`;
      return {
        primary: fullUrl,
        all: [fullUrl],
        hasImages: true
      };
    }

    // Si la imagen es múltiple (separada por comas), procesar cada una
    if (imageUrl.includes(',')) {
      const imageUrls = imageUrl.split(',').map(url => url.trim()).filter(url => url);
      
      if (imageUrls.length === 0) {
        return {
          primary: fallbackImage,
          all: [],
          hasImages: false
        };
      }

      const processedUrls = imageUrls.map(url => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        if (url.startsWith('/')) {
          return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com'}${url}`;
        }
        return url;
      });

      return {
        primary: processedUrls[0],
        all: processedUrls,
        hasImages: true
      };
    }

    // Imagen única local
    const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com'}/${imageUrl}`;
    return {
      primary: fullUrl,
      all: [fullUrl],
      hasImages: true
    };
  }, [imageUrl, fallbackImage]);

  return images;
};
