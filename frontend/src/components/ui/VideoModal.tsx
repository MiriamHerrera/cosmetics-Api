'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, ExternalLink } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  productName: string;
}

// Función para convertir URLs de video a URLs de embed
const getEmbedUrl = (url: string): string => {
  try {
    // YouTube
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      const videoId = url.includes('youtu.be/') 
        ? url.split('youtu.be/')[1].split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // TikTok
    if (url.includes('tiktok.com/')) {
      // Para TikTok, usamos la URL original ya que no hay embed directo
      return url;
    }
    
    // Facebook
    if (url.includes('facebook.com/') || url.includes('fb.watch/')) {
      // Para Facebook, usamos la URL original
      return url;
    }
    
    // Instagram
    if (url.includes('instagram.com/')) {
      return url;
    }
    
    // Para otros casos, devolver la URL original
    return url;
  } catch (error) {
    console.error('Error procesando URL de video:', error);
    return url;
  }
};

// Función para determinar si es una URL de embed directo
const isEmbeddable = (url: string): boolean => {
  return url.includes('youtube.com/embed') || 
         url.includes('youtu.be/') || 
         url.includes('youtube.com/watch');
};

export default function VideoModal({ isOpen, onClose, videoUrl, productName }: VideoModalProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [isEmbeddableVideo, setIsEmbeddableVideo] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && videoUrl) {
      const processedUrl = getEmbedUrl(videoUrl);
      setEmbedUrl(processedUrl);
      setIsEmbeddableVideo(isEmbeddable(processedUrl));
    }
  }, [isOpen, videoUrl]);

  // Efecto para manejar el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Deshabilitar scroll del body
      document.body.style.overflow = 'hidden';
    } else {
      // Rehabilitar scroll del body
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Efecto para manejar teclas cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl) return null;

  return typeof window !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Contenido del Video */}
        <div className="relative w-full max-w-4xl mx-auto">
          {isEmbeddableVideo ? (
            // Video embebido (YouTube)
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                title={`Video de ${productName}`}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            // Enlace externo para otros tipos de video
            <div className="text-center space-y-4 bg-white rounded-lg p-8">
              <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Video no disponible para vista previa
              </h4>
              <p className="text-gray-600 mb-4">
                Este tipo de video se abrirá en una nueva pestaña
              </p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Video
              </a>
            </div>
          )}
        </div>

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-200 hover:scale-110"
          aria-label="Cerrar video"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Título del Video */}
        <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
          Video de {productName}
        </div>
      </div>
    </div>,
    document.body
  );
}
