'use client';

import { ShoppingCart, X, MessageCircle, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useGuestMode } from '@/hooks/useGuestMode';
import { LoginButton } from './index';
import Image from 'next/image';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, removeFromCart, cartItemCount, cartTotal } = useCart();
  const { isGuestMode } = useGuestMode();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay de fondo oscuro */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal centrado */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="
          relative w-full max-w-sm sm:max-w-md bg-white rounded-lg shadow-xl
          transform transition-all duration-300 ease-in-out
          animate-in fade-in-0 zoom-in-95
          mx-2
        ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tu Carrito</h2>
            </div>
            <button
              onClick={onClose}
              className="
                p-2 text-gray-400 hover:text-gray-600
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full
              "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-4 sm:p-6">
            {cartItemCount === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
                <p className="text-gray-400 text-sm">Agrega algunos productos para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lista de productos */}
                {cart?.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="relative w-12 h-12">
                        <Image 
                          src={item.product.image_url || '/NoImage.jpg'} 
                          alt={item.product.name}
                          fill
                          sizes="48px"
                          className="object-cover rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">{item.product.category_name}</p>
                      {/* <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div> */}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700 p-1 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-rose-600">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer con botón de WhatsApp */}
          <div className="p-4 sm:p-6 border-t border-gray-200 space-y-3">
            {/* Botón de login para usuarios invitados */}
            {isGuestMode && cartItemCount > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  💡 Inicia sesión para guardar tu carrito
                </p>
                <LoginButton 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  showIcon={false}
                >
                  Guardar Carrito
                </LoginButton>
              </div>
            )}
            
            <button
              onClick={() => {
                // Aquí iría la lógica para enviar por WhatsApp
              }}
              className="
                w-full bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600
                text-white font-bold py-4 px-6 rounded-lg
                transition-all duration-300
                flex items-center justify-center gap-3
                focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2
                transform hover:scale-105 shadow-lg hover:shadow-xl
              "
            >
              <MessageCircle className="w-5 h-5" />
              Finalizar compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 