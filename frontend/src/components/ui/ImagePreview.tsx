'use client';

import { useState } from 'react';
import { X, Trash2, Eye, Download } from 'lucide-react';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ImagePreviewProps {
  images: ImageFile[];
  onRemove: (imageId: string) => void;
  maxImages?: number;
  showFileInfo?: boolean;
}

export default function ImagePreview({ 
  images, 
  onRemove, 
  maxImages = 10, 
  showFileInfo = true 
}: ImagePreviewProps) {
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [showModal, setShowModal] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatFileName = (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3);
    return `${truncatedName}...${extension ? `.${extension}` : ''}`;
  };

  const openImageModal = (image: ImageFile) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const closeImageModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const downloadImage = (image: ImageFile) => {
    const link = document.createElement('a');
    link.href = image.preview;
    link.download = image.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm">No hay imágenes seleccionadas</p>
        <p className="text-xs text-gray-400">Selecciona imágenes para ver la vista previa</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.slice(0, maxImages).map((image) => (
          <div key={image.id} className="relative group">
            {/* Imagen */}
            <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img 
                src={image.preview} 
                alt="Vista previa" 
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => openImageModal(image)}
              />
            </div>
            
            {/* Overlay con acciones */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => openImageModal(image)}
                  className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  title="Ver imagen completa"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => downloadImage(image)}
                  className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  title="Descargar imagen"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(image.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Información del archivo */}
            {showFileInfo && (
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-600 font-medium truncate" title={image.file.name}>
                  {formatFileName(image.file.name)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(image.file.size)}
                </p>
              </div>
            )}
          </div>
        ))}
        
        {/* Indicador de más imágenes */}
        {images.length > maxImages && (
          <div className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-sm font-medium">+{images.length - maxImages}</p>
              <p className="text-xs">más</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de imagen completa */}
      {showModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-full">
            {/* Botón cerrar */}
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Imagen */}
            <img 
              src={selectedImage.preview} 
              alt="Imagen completa" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Información de la imagen */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedImage.file.name}</p>
                  <p className="text-sm text-gray-300">
                    {formatFileSize(selectedImage.file.size)} • {selectedImage.file.type}
                  </p>
                </div>
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  title="Descargar imagen"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
