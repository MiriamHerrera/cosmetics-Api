import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useGuestMode } from './useGuestMode';
import { useGuestSession } from './useGuestSession';
import { unifiedCartApi } from '@/lib/api';
import type { Product } from '@/types';

/**
 * Hook Unificado para Carritos
 * Maneja tanto usuarios autenticados como invitados con una sola lógica
 */
export const useUnifiedCart = () => {
  const { 
    cart, 
    addToCart: addToStoreCart, 
    removeFromCart: removeFromStoreCart, 
    updateCartItemQuantity: updateStoreCartQuantity,
    updateProductStock,
    clearCart: clearStoreCart,
    syncServerCart
  } = useStore();
  
  const { isGuestMode } = useGuestMode();
  const { sessionId } = useGuestSession();
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener datos del carrito según el tipo de usuario
   */
  const getCartData = useCallback(() => {
    if (isGuestMode) {
      console.log('🔍 [getCartData] Modo invitado, sessionId:', sessionId);
      return { sessionId: sessionId || undefined };
    } else {
      const user = useStore.getState().user;
      console.log('🔍 [getCartData] Usuario autenticado:', user);
      return { userId: user?.id };
    }
  }, [isGuestMode, sessionId]);

  /**
   * Cargar carrito del servidor
   */
  const loadCart = useCallback(async () => {
    try {
      const cartData = getCartData();
      console.log('🔍 [loadCart] Datos del carrito obtenidos:', cartData);
      
      if (!cartData.userId && !cartData.sessionId) {
        console.log('⚠️ [loadCart] No hay usuario ni sesión para cargar carrito');
        return false;
      }

      console.log('🔄 [loadCart] Cargando carrito unificado:', cartData);
      const response = await unifiedCartApi.getCart(cartData);
      
      if (response.success && response.data) {
        console.log('✅ [loadCart] Carrito unificado cargado:', response.data);
        syncServerCart(response.data);
        return true;
      } else {
        console.log('⚠️ [loadCart] No se pudo cargar carrito:', response.message);
        return false;
      }
    } catch (err) {
      console.error('❌ [loadCart] Error cargando carrito unificado:', err);
      if (err instanceof Error) {
        console.error('❌ [loadCart] Mensaje de error:', err.message);
        console.error('❌ [loadCart] Stack trace:', err.stack);
      }
      return false;
    }
  }, [getCartData, syncServerCart]);

  /**
   * Agregar producto al carrito
   */
  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Verificar stock disponible
      if (product.stock_total < quantity) {
        setError(`Stock insuficiente. Solo hay ${product.stock_total} unidades disponibles.`);
        return false;
      }

      const cartData = getCartData();
      if (!cartData.userId && !cartData.sessionId) {
        setError('No se pudo obtener datos del carrito');
        return false;
      }

      console.log('🔄 Agregando producto al carrito unificado:', { product: product.name, quantity, cartData });
      const response = await unifiedCartApi.addItem(product.id, quantity, cartData);

      if (response.success) {
        // Actualizar el store local
        addToStoreCart(product, quantity);
        
        // Actualizar el stock del producto en la lista en tiempo real
        const newStock = product.stock_total - quantity;
        updateProductStock(product.id, newStock);
        
        console.log('✅ Producto agregado exitosamente');
        return true;
      } else {
        setError(response.message || 'Error al agregar al carrito');
        return false;
      }
    } catch (err) {
      console.error('Error agregando al carrito unificado:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [addToStoreCart, getCartData, updateProductStock]);

  /**
   * Remover producto del carrito
   */
  const removeFromCart = useCallback(async (productId: number) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      const cartData = getCartData();
      if (!cartData.userId && !cartData.sessionId) {
        setError('No se pudo obtener datos del carrito');
        return false;
      }

      console.log('🔄 Removiendo producto del carrito unificado:', { productId, cartData });
      const response = await unifiedCartApi.removeItem(productId, cartData);

      if (response.success) {
        removeFromStoreCart(productId);
        
        // Actualizar el stock del producto en la lista en tiempo real
        const cartItem = cart?.items.find(item => item.productId === productId);
        if (cartItem) {
          const newStock = cartItem.product.stock_total + cartItem.quantity;
          updateProductStock(productId, newStock);
        }
        
        console.log('✅ Producto removido exitosamente');
        return true;
      } else {
        setError(response.message || 'Error al remover del carrito');
        return false;
      }
    } catch (err) {
      console.error('Error removiendo del carrito unificado:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [removeFromStoreCart, getCartData, updateProductStock, cart?.items]);

  /**
   * Actualizar cantidad de un producto
   */
  const updateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      // Encontrar el item actual
      const currentItem = cart?.items.find(item => item.productId === productId);
      if (!currentItem) return false;

      const cartData = getCartData();
      if (!cartData.userId && !cartData.sessionId) {
        setError('No se pudo obtener datos del carrito');
        return false;
      }

      console.log('🔄 Actualizando cantidad en carrito unificado:', { productId, newQuantity, cartData });
      const response = await unifiedCartApi.updateQuantity(productId, newQuantity, cartData);

      if (response.success) {
        updateStoreCartQuantity(productId, newQuantity);
        
        // Actualizar el stock del producto en la lista en tiempo real
        const quantityDiff = newQuantity - currentItem.quantity;
        if (quantityDiff !== 0) {
          const newStock = currentItem.product.stock_total - quantityDiff;
          updateProductStock(productId, newStock);
        }
        
        console.log('✅ Cantidad actualizada exitosamente');
        return true;
      } else {
        setError(response.message || 'Error al actualizar cantidad');
        return false;
      }
    } catch (err) {
      console.error('Error actualizando cantidad en carrito unificado:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [cart, updateStoreCartQuantity, getCartData, updateProductStock]);

  /**
   * Limpiar carrito completo
   */
  const clearCart = useCallback(async () => {
    try {
      setIsUpdatingStock(true);
      setError(null);

      const cartData = getCartData();
      if (!cartData.userId && !cartData.sessionId) {
        setError('No se pudo obtener datos del carrito');
        return false;
      }

      console.log('🔄 Limpiando carrito unificado:', cartData);
      const response = await unifiedCartApi.clearCart(cartData);

      if (response.success) {
        clearStoreCart();
        
        // Restaurar stock de todos los productos
        if (cart) {
          for (const item of cart.items) {
            const currentStock = item.product.stock_total;
            updateProductStock(item.product.id, currentStock + item.quantity);
          }
        }
        
        console.log('✅ Carrito limpiado exitosamente');
        return true;
      } else {
        setError(response.message || 'Error al limpiar carrito');
        return false;
      }
    } catch (err) {
      console.error('Error limpiando carrito unificado:', err);
      setError('Error de conexión. Intenta nuevamente.');
      return false;
    } finally {
      setIsUpdatingStock(false);
    }
  }, [clearStoreCart, getCartData, cart, updateProductStock]);

  /**
   * Migrar carrito de invitado a usuario autenticado
   */
  const migrateGuestToUser = useCallback(async (userId: number) => {
    if (!sessionId) {
      console.log('No hay sesión de invitado para migrar');
      return false;
    }

    try {
      console.log('🔄 Migrando carrito de invitado a usuario:', { sessionId, userId });
      const response = await unifiedCartApi.migrateGuestToUser(sessionId, userId);
      
      if (response.success) {
        console.log('✅ Carrito migrado exitosamente:', response);
        
        // Recargar el carrito del usuario
        await loadCart();
        
        return true;
      } else {
        console.log('⚠️ Error migrando carrito:', response.message);
        return false;
      }
    } catch (err) {
      console.error('❌ Error migrando carrito:', err);
      return false;
    }
  }, [sessionId, loadCart]);

  return {
    // Estado
    cart,
    cartItemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    cartTotal: cart?.total || 0,
    isUpdatingStock,
    error,
    isGuestMode,
    
    // Acciones
    loadCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    migrateGuestToUser,
    clearError: () => setError(null),
    
    // Datos del carrito
    getCartData
  };
}; 