import { useState, useCallback } from 'react';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export interface UseImageUploadOptions {
  maxFiles?: number;
  maxFileSize?: number; // en bytes
  allowedTypes?: string[];
  autoGenerateId?: boolean;
}

export interface UseImageUploadReturn {
  images: ImageFile[];
  addImages: (files: FileList | File[]) => void;
  removeImage: (imageId: string) => void;
  clearImages: () => void;
  getImageById: (imageId: string) => ImageFile | undefined;
  totalSize: number;
  isValid: boolean;
  errors: string[];
}

const DEFAULT_OPTIONS: UseImageUploadOptions = {
  maxFiles: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  autoGenerateId: true,
};

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [images, setImages] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Generar ID único para la imagen
  const generateId = useCallback(() => {
    if (!config.autoGenerateId) return '';
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }, [config.autoGenerateId]);

  // Validar archivo
  const validateFile = useCallback((file: File): string | null => {
    // Verificar tipo de archivo
    if (!config.allowedTypes?.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}. Tipos permitidos: ${config.allowedTypes?.join(', ')}`;
    }

    // Verificar tamaño
    if (file.size > config.maxFileSize!) {
      const maxSizeMB = config.maxFileSize! / (1024 * 1024);
      return `El archivo es muy grande: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Tamaño máximo: ${maxSizeMB}MB`;
    }

    return null;
  }, [config.allowedTypes, config.maxFileSize]);

  // Crear vista previa de imagen
  const createImagePreview = useCallback((file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imageFile: ImageFile = {
          id: generateId(),
          file: file,
          preview: e.target?.result as string,
        };
        resolve(imageFile);
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsDataURL(file);
    });
  }, [generateId]);

  // Agregar imágenes
  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Validar archivos
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    // Verificar límite de archivos
    if (images.length + validFiles.length > config.maxFiles!) {
      newErrors.push(`Máximo ${config.maxFiles} archivos permitidos`);
    }

    // Actualizar errores
    setErrors(newErrors);

    if (newErrors.length > 0) {
      return;
    }

    // Crear vistas previas para archivos válidos
    try {
      const imagePromises = validFiles.map(createImagePreview);
      const newImages = await Promise.all(imagePromises);
      
      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Error al crear vistas previas:', error);
      setErrors(prev => [...prev, 'Error al procesar las imágenes']);
    }
  }, [images.length, config.maxFiles, validateFile, createImagePreview]);

  // Eliminar imagen
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  // Limpiar todas las imágenes
  const clearImages = useCallback(() => {
    setImages([]);
    setErrors([]);
  }, []);

  // Obtener imagen por ID
  const getImageById = useCallback((imageId: string) => {
    return images.find(img => img.id === imageId);
  }, [images]);

  // Calcular tamaño total
  const totalSize = images.reduce((total, img) => total + img.file.size, 0);

  // Verificar si es válido
  const isValid = images.length > 0 && errors.length === 0;

  return {
    images,
    addImages,
    removeImage,
    clearImages,
    getImageById,
    totalSize,
    isValid,
    errors,
  };
}
