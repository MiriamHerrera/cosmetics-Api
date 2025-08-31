'use client';

import { useState, useCallback, useEffect } from 'react';
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

  // Cerrar con tecla Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullscreen) {
      closeFullscreen();
    }
  }, [isFullscreen, closeFullscreen]);

  // Agregar/remover event listener para tecla Escape
  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      // Restaurar scroll del body
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, handleKeyDown]);

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
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center animate-in fade-in duration-300">
          {/* Imagen Fullscreen */}
          <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300">
            <Image
              src={getImageUrl(images[currentIndex])}
              alt={`${productName} - Imagen ${currentIndex + 1} (Fullscreen)`}
              fill
              sizes="100vw"
              className="object-contain"
              unoptimized={!shouldOptimizeImage(images[currentIndex])}
              priority
            />

            {/* Botón Cerrar - Posicionado en esquina superior derecha */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300"
              aria-label="Cerrar vista fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Controles de Navegación Fullscreen */}
            {images.length > 1 && (
              <>
                {/* Botón Anterior - Lado izquierdo */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 sm:p-4 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm animate-in slide-in-from-left-2 duration-300"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>

                {/* Botón Siguiente - Lado derecho */}
                <button
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 sm:p-4 rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm animate-in slide-in-from-right-2 duration-300"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>

                {/* Indicadores de Puntos - Parte inferior */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2 sm:space-x-3 animate-in slide-in-from-bottom-2 duration-300">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${
                        index === currentIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Ir a imagen ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Contador de Imágenes - Esquina superior izquierda */}
                <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-sm px-3 py-2 rounded-full backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                  {currentIndex + 1} de {images.length}
                </div>

                {/* Información del Producto - Parte inferior */}
                <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white text-center px-4 py-2 rounded-full backdrop-blur-sm max-w-xs sm:max-w-md animate-in slide-in-from-bottom-2 duration-300">
                  <p className="text-sm sm:text-base font-medium truncate">{productName}</p>
                  <p className="text-xs text-gray-300">Imagen {currentIndex + 1} de {images.length}</p>
                </div>
              </>
            )}

            {/* Gestos de Swipe para Móvil */}
            <div 
              className="absolute inset-0 z-0" 
              onClick={(e) => {
                // Solo cerrar si se hace clic en la imagen (no en los controles)
                if (e.target === e.currentTarget) {
                  closeFullscreen();
                }
              }}
            >
              {/* Área clickeable para cerrar al tocar la imagen */}
            </div>
          </div>

          {/* Overlay de fondo negro completo */}
          <div className="absolute inset-0 bg-black -z-10" />
        </div>
      )}
    </>
  );
}
