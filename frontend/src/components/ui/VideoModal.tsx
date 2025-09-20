'use client';

import { useState, useEffect } from 'react';
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

  if (!isOpen || !videoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Video de {productName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
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
            <div className="text-center space-y-4">
              <div className="bg-gray-50 rounded-lg p-8">
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
