'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart, AlertTriangle } from 'lucide-react';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  cartItemCount: number;
}

export default function ExitConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  cartItemCount
}: ExitConfirmationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Confirmar Salida
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                Tienes {cartItemCount} artículo{cartItemCount !== 1 ? 's' : ''} en tu carrito
              </p>
              <p className="text-sm text-gray-600">
                Carrito de invitado
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ Advertencia importante:</p>
                <ul className="space-y-1">
                  <li>• Perderás todos los artículos de tu carrito</li>
                  <li>• El stock de los productos se restaurará automáticamente</li>
                  <li>• No podrás recuperar tu carrito</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            ¿Estás seguro de que quieres salir de la página? Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              setIsProcessing(true);
              try {
                await onConfirm();
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Limpiando Carrito...
              </>
            ) : (
              'Salir y Perder Carrito'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 