import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { guestCartApi } from '@/lib/api';
import type { Product } from '@/types';

export const useCart = () => {
  const { 
    cart, 
    addToCart: addToStoreCart, 
    removeFromCart: removeFromStoreCart, 
    updateCartItemQuantity: updateStoreCartQuantity,
    clearCart: clearStoreCart 
  } = useStore();
  
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
      const response = await guestCartApi.addItem(product.id, quantity);

      if (response.success) {
        // Actualizar el store local
        addToStoreCart(product, quantity);
        
        // Actualizar el stock del producto en la lista
        // Esto se puede hacer emitiendo un evento o actualizando el store
        console.log('✅ Producto agregado al carrito y stock actualizado');
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
  }, [addToStoreCart]);

  // Función para remover del carrito
  const removeFromCart = useCallback(async (productId: number) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Llamar a la API para restaurar stock
      const response = await guestCartApi.removeItem(productId);

      if (response.success) {
        removeFromStoreCart(productId);
        console.log('✅ Producto removido del carrito y stock restaurado');
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
  }, [removeFromStoreCart]);

  // Función para actualizar cantidad
  const updateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Encontrar el item actual
      const currentItem = cart?.items.find(item => item.productId === productId);
      if (!currentItem) return false;

      const quantityDiff = newQuantity - currentItem.quantity;
      
      if (quantityDiff > 0) {
        // Aumentando cantidad - verificar stock
        if (currentItem.product.stock_total < quantityDiff) {
          setError(`Stock insuficiente. Solo hay ${currentItem.product.stock_total} unidades disponibles.`);
          return false;
        }
      }

      // Llamar a la API para actualizar stock
      const response = await guestCartApi.updateQuantity(productId, newQuantity);

      if (response.success) {
        updateStoreCartQuantity(productId, newQuantity);
        console.log('✅ Cantidad actualizada y stock ajustado');
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
  }, [cart, updateStoreCartQuantity]);

  // Función para limpiar carrito
  const clearCart = useCallback(async () => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Llamar a la API para restaurar todo el stock
      const response = await guestCartApi.clearCart();

      if (response.success) {
        clearStoreCart();
        console.log('✅ Carrito limpiado y stock restaurado');
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
  }, [clearStoreCart]);

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