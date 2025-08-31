'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getImageUrl, shouldOptimizeImage } from '@/lib/config';

interface ImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
  showFullscreen?: boolean;
}

export default function ImageCarousel({ 
  images, 
  productName, 
  className = '',
  showFullscreen = true 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Si no hay imágenes, mostrar imagen por defecto
  if (!images || images.length === 0) {
    return (
      <div className={`relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 ${className}`}>
        <Image
          src="/NoImage.jpg"
          alt={`${productName} - Sin imagen`}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="text-white text-sm font-medium">Sin imagen</span>
        </div>
      </div>
    );
  }

  // Si solo hay una imagen, mostrarla sin controles
  if (images.length === 1) {
    return (
      <div className={`relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 cursor-pointer ${className}`} onClick={() => showFullscreen && setIsFullscreen(true)}>
        <Image
          src={getImageUrl(images[0])}
          alt={`${productName} - Imagen 1`}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          unoptimized={!shouldOptimizeImage(images[0])}
        />
      </div>
    );
  }

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const openFullscreen = useCallback(() => {
    if (showFullscreen) {
      setIsFullscreen(true);
    }
  }, [showFullscreen]);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  return (
    <>
      {/* Carrusel Principal */}
      <div className={`relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg ${className}`}>
        {/* Imagen Actual */}
        <Image
          src={getImageUrl(images[currentIndex])}
          alt={`${productName} - Imagen ${currentIndex + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover cursor-pointer transition-all duration-300"
          onClick={openFullscreen}
          unoptimized={!shouldOptimizeImage(images[currentIndex])}
        />

        {/* Controles de Navegación */}
        {images.length > 1 && (
          <>
            {/* Botón Anterior */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Botón Siguiente */}
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Indicadores de Puntos */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>

            {/* Contador de Imágenes */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Modal Fullscreen */}
      {isFullscreen && showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Imagen Fullscreen */}
            <Image
              src={getImageUrl(images[currentIndex])}
              alt={`${productName} - Imagen ${currentIndex + 1} (Fullscreen)`}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized={!shouldOptimizeImage(images[currentIndex])}
            />

            {/* Botón Cerrar */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
              aria-label="Cerrar vista fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Controles de Navegación Fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all duration-200 hover:scale-110"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                {/* Indicadores Fullscreen */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Ir a imagen ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Contador Fullscreen */}
                <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                  {currentIndex + 1} de {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
