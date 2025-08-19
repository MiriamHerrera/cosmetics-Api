import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { guestCartApi } from '@/lib/api';
import { useGuestSession } from './useGuestSession';
import type { Product } from '@/types';

export const useCart = () => {
  const { 
    cart, 
    addToCart: addToStoreCart, 
    removeFromCart: removeFromStoreCart, 
    updateCartItemQuantity: updateStoreCartQuantity,
    updateProductStock,
    clearCart: clearStoreCart
  } = useStore();
  
  const { sessionId } = useGuestSession();
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para agregar al carrito con actualización de stock
  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Verificar stock disponible
      if (product.stock_total < quantity) {
        setError(`Stock insuficiente. Solo hay ${product.stock_total} unidades disponibles.`);
        return false;
      }

      // Llamar a la API para actualizar stock
      if (!sessionId) {
        setError('No se pudo obtener la sesión de invitado');
        return false;
      }
      const response = await guestCartApi.addItem(product.id, quantity, sessionId);

      if (response.success) {
        // Actualizar el store local
        addToStoreCart(product, quantity);
        
        // Actualizar el stock del producto en la lista en tiempo real
        const newStock = product.stock_total - quantity;
        updateProductStock(product.id, newStock);
        
        return true;
      } else {
        setError(response.message || 'Error al agregar al carrito');
        return false;
      }
    } catch (err) {
      console.error('Error agregando al carrito:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [addToStoreCart, sessionId, updateProductStock]);

  // Función para remover del carrito
  const removeFromCart = useCallback(async (productId: number) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Llamar a la API para restaurar stock
      if (!sessionId) {
        setError('No se pudo obtener la sesión de invitado');
        return false;
      }
      const response = await guestCartApi.removeItem(productId, sessionId);

      if (response.success) {
        removeFromStoreCart(productId);
        
        // Actualizar el stock del producto en la lista en tiempo real
        // Necesitamos encontrar el producto y su cantidad en el carrito
        const cartItem = cart?.items.find(item => item.productId === productId);
        if (cartItem) {
          const newStock = cartItem.product.stock_total + cartItem.quantity;
          updateProductStock(productId, newStock);
        }
        
        return true;
      } else {
        setError(response.message || 'Error al remover del carrito');
        return false;
      }
    } catch (err) {
      console.error('Error removiendo del carrito:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [removeFromStoreCart, sessionId, updateProductStock, cart?.items]);

  // Función para actualizar cantidad
  const updateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Encontrar el item actual
      const currentItem = cart?.items.find(item => item.productId === productId);
      if (!currentItem) return false;

      // Llamar a la API para actualizar stock
      if (!sessionId) {
        setError('No se pudo obtener la sesión de invitado');
        return false;
      }
      const response = await guestCartApi.updateQuantity(productId, newQuantity, sessionId);

      if (response.success) {
        updateStoreCartQuantity(productId, newQuantity);
        
        // Actualizar el stock del producto en la lista en tiempo real
        // Calcular la diferencia de stock
        const quantityDiff = newQuantity - currentItem.quantity;
        if (quantityDiff !== 0) {
          const newStock = currentItem.product.stock_total - quantityDiff;
          updateProductStock(productId, newStock);
        }
        
        return true;
      } else {
        setError(response.message || 'Error al actualizar cantidad');
        return false;
      }
    } catch (err) {
      console.error('Error actualizando cantidad:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [cart, updateStoreCartQuantity, sessionId, updateProductStock]);

  // Función para limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Llamar a la API para restaurar todo el stock
      if (!sessionId) {
        setError('No se pudo obtener la sesión de invitado');
        return false;
      }
      const response = await guestCartApi.clearCart(sessionId);

              if (response.success) {
          clearStoreCart();
          // Restaurar stock de todos los productos
          if (cart) {
            for (const item of cart.items) {
              const currentStock = item.product.stock_total;
              updateProductStock(item.product.id, currentStock + item.quantity);
            }
          }
          return true;
        } else {
        setError(response.message || 'Error al limpiar carrito');
        return false;
      }
    } catch (err) {
      console.error('Error limpiando carrito:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [clearStoreCart, sessionId, cart, updateProductStock]);

  return {
    cart,
    cartItemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    cartTotal: cart?.total || 0,
    isUpdatingStock,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearError: () => setError(null)
  };
}; 