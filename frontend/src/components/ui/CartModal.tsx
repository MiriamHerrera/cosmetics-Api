'use client';

import { ShoppingCart, X, MessageCircle, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useGuestMode } from '@/hooks/useGuestMode';
import LoginButton from './LoginButton';
import Image from 'next/image';
import { useState, useCallback, useMemo, memo } from 'react';
import CheckoutModal from './CheckoutModal';
import { useGuestSession } from '@/hooks/useGuestSession';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal = memo(({ isOpen, onClose }: CartModalProps) => {
  const { cart, removeFromCart, cartItemCount, cartTotal, clearCart } = useCart();
  const { isGuestMode } = useGuestMode();
  const { sessionId: guestSessionId } = useGuestSession();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Memoizar el handler de cierre para evitar re-renders
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Memoizar el handler de checkout para evitar re-renders
  const handleCheckout = useCallback(() => {
    setShowCheckoutModal(true);
  }, []);

  const handleCloseCheckout = useCallback(() => {
    setShowCheckoutModal(false);
  }, []);

  // Memoizar el handler de remover item para evitar re-renders innecesarios
  const handleRemoveItem = useCallback((productId: number) => {
    removeFromCart(productId);
  }, [removeFromCart]);

  // Memoizar los items del carrito para evitar re-renders innecesarios
  const cartItems = useMemo(() => cart?.items || [], [cart?.items]);

  // Solo renderizar si está abierto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay de fondo oscuro */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
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
              onClick={handleClose}
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
                {cartItems.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="relative w-12 h-12">
                        <Image 
                          src={item.product.image_url || '/NoImage.jpg'} 
                          alt={item.product.name || 'Producto'}
                          fill
                          sizes="48px"
                          className="object-cover rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">{item.product.category_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${((item.product.price || 0) * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
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
              onClick={handleCheckout}
              className="
                w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
                text-white font-bold py-4 px-6 rounded-lg
                transition-all duration-300
                flex items-center justify-center gap-3
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                transform hover:scale-105 shadow-lg hover:shadow-xl
              "
            >
              <MessageCircle className="w-5 h-5" />
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de Checkout unificado */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={handleCloseCheckout}
        cart={cart}
        sessionId={isGuestMode ? guestSessionId : null}
      />
    </div>
  );
});

CartModal.displayName = 'CartModal';

export default CartModal; 