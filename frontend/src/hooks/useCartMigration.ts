import { useCallback } from 'react';
import { useLocalCart } from './useLocalCart';
import { useCart } from './useCart';
import { useGuestMode } from './useGuestMode';

export const useCartMigration = () => {
  const { cart: localCart, clearCart: clearLocalCart } = useLocalCart();
  const { addToCart: addToServerCart, cart: serverCart } = useCart();
  const { isGuestMode } = useGuestMode();

  // Migrar carrito de invitado al servidor cuando el usuario se autentica
  const migrateGuestCart = useCallback(async () => {
    if (isGuestMode || !localCart.items.length) {
      return;
    }

    try {
      console.log('🔄 Migrando carrito de invitado al servidor...');
      
      // Agregar cada item del carrito local al carrito del servidor
      for (const item of localCart.items) {
        await addToServerCart(item.product, item.quantity);
      }
      
      // Limpiar carrito local después de migrar exitosamente
      clearLocalCart();
      
      console.log('✅ Carrito migrado exitosamente');
      
      return true;
    } catch (error) {
      console.error('❌ Error migrando carrito:', error);
      return false;
    }
  }, [isGuestMode, localCart.items, addToServerCart, clearLocalCart]);

  // Verificar si hay items en el carrito de invitado que necesiten migración
  const hasGuestCartItems = localCart.items.length > 0;

  // Obtener el carrito activo (local o del servidor)
  const getActiveCart = useCallback(() => {
    if (isGuestMode) {
      return localCart;
    }
    return serverCart;
  }, [isGuestMode, localCart, serverCart]);

  return {
    migrateGuestCart,
    hasGuestCartItems,
    getActiveCart,
    localCart,
    serverCart
  };
}; 