import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { unifiedCartApi } from '@/lib/api';
import { useGuestSession } from './useGuestSession';
import { useGuestMode } from './useGuestMode';
import { useStockSync } from './useStockSync';
import type { Product } from '@/types';

export const useCart = () => {
  const { 
    cart, 
    addToCart: addToStoreCart, 
    removeFromCart: removeFromStoreCart, 
    updateCartItemQuantity: updateStoreCartQuantity,
    clearCart: clearStoreCart,
    products
  } = useStore();
  
  const { sessionId } = useGuestSession();
  const { isGuestMode } = useGuestMode();
  const { syncStock } = useStockSync();
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usar useRef para evitar múltiples actualizaciones simultáneas
  const isProcessing = useRef(false);

  // Función para validar stock antes de operaciones
  const validateStock = useCallback((productId: number, quantity: number, operation: 'add' | 'update' | 'remove') => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.warn(`⚠️ [useCart] Producto ${productId} no encontrado en el store`);
      return false;
    }

    if (operation === 'add' && product.stock_total < quantity) {
      console.warn(`⚠️ [useCart] Stock insuficiente para producto ${productId}: ${product.stock_total} < ${quantity}`);
      return false;
    }

    return true;
  }, [products]);

  // Función para agregar al carrito con validación mejorada
  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    if (isProcessing.current) return false;
    
    try {
      isProcessing.current = true;
      setIsUpdatingStock(true);
      setError(null);

      console.log(`🛒 [useCart] Agregando producto ${product.id} al carrito (cantidad: ${quantity})`);

      // Validar stock antes de proceder
      if (!validateStock(product.id, quantity, 'add')) {
        setError(`Stock insuficiente. Solo hay ${product.stock_total} unidades disponibles.`);
        return false;
      }

      // Usar el sistema unificado para ambos tipos de usuario
      const cartData = isGuestMode 
        ? { sessionId: sessionId || undefined } 
        : { userId: useStore.getState().user?.id, sessionId: sessionId || undefined };
      
      const response = await unifiedCartApi.addItem(product.id, quantity, cartData);

      if (response.success) {
        console.log(`✅ [useCart] Producto ${product.id} agregado al carrito exitosamente`);
        
        // Actualizar el store local
        addToStoreCart(product, quantity);
        
        // Sincronizar stock desde el servidor para confirmar cambios
        console.log(`🔄 [useCart] Iniciando sincronización de stock después de agregar...`);
        await syncStock(true);
        
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
      isProcessing.current = false;
    }
  }, [addToStoreCart, sessionId, isGuestMode, syncStock, validateStock]);

  // Función para remover del carrito
  const removeFromCart = useCallback(async (productId: number) => {
    if (isProcessing.current) return false;
    
    try {
      isProcessing.current = true;
      setIsUpdatingStock(true);
      setError(null);

      console.log(`🗑️ [useCart] Removiendo producto ${productId} del carrito`);

      // Usar el sistema unificado para ambos tipos de usuario
      const cartData = isGuestMode 
        ? { sessionId: sessionId || undefined } 
        : { userId: useStore.getState().user?.id, sessionId: sessionId || undefined };
      
      const response = await unifiedCartApi.removeItem(productId, cartData);

      if (response.success) {
        console.log(`✅ [useCart] Producto ${productId} removido del carrito exitosamente`);
        
        // Remover del store local
        removeFromStoreCart(productId);
        
        // Sincronizar stock desde el servidor para confirmar restauración
        console.log(`🔄 [useCart] Iniciando sincronización de stock después de remover...`);
        await syncStock(true);
        
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
      isProcessing.current = false;
    }
  }, [removeFromStoreCart, sessionId, isGuestMode, syncStock]);

  // Función para actualizar cantidad
  const updateQuantity = useCallback(async (productId: number, newQuantity: number) => {
    if (isProcessing.current) return false;
    
    try {
      isProcessing.current = true;
      setIsUpdatingStock(true);
      setError(null);

      // Encontrar el item actual
      const currentItem = cart?.items.find(item => item.productId === productId);
      if (!currentItem) return false;

      // Validar stock si estamos aumentando la cantidad
      if (newQuantity > currentItem.quantity) {
        const quantityDifference = newQuantity - currentItem.quantity;
        if (!validateStock(productId, quantityDifference, 'add')) {
          setError('Stock insuficiente para aumentar la cantidad');
          return false;
        }
      }

      // Usar el sistema unificado para ambos tipos de usuario
      const cartData = isGuestMode 
        ? { sessionId: sessionId || undefined } 
        : { userId: useStore.getState().user?.id, sessionId: sessionId || undefined };
      
      const response = await unifiedCartApi.updateQuantity(productId, newQuantity, cartData);

      if (response.success) {
        updateStoreCartQuantity(productId, newQuantity);
        
        // Sincronizar stock desde el servidor para confirmar cambios
        await syncStock(true);
        
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
      isProcessing.current = false;
    }
  }, [cart, updateStoreCartQuantity, sessionId, isGuestMode, syncStock, validateStock]);

  // Función para limpiar carrito
  const clearCart = useCallback(async () => {
    if (isProcessing.current) return false;
    
    try {
      isProcessing.current = true;
      setIsUpdatingStock(true);
      setError(null);

      // Usar el sistema unificado para ambos tipos de usuario
      const cartData = isGuestMode 
        ? { sessionId: sessionId || undefined } 
        : { userId: useStore.getState().user?.id, sessionId: sessionId || undefined };
      
      const response = await unifiedCartApi.clearCart(cartData);

      if (response.success) {
        clearStoreCart();
        
        // Sincronizar stock desde el servidor para confirmar restauración
        await syncStock(true);
        
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
      isProcessing.current = false;
    }
  }, [clearStoreCart, sessionId, isGuestMode, syncStock]);

  // Función para cargar carrito del servidor (solo para usuarios autenticados)
  const loadServerCart = useCallback(async () => {
    if (isGuestMode) {
      console.log('ℹ️ Usuario en modo invitado, no se puede cargar carrito del servidor');
      return false;
    }

    try {
      console.log('🔄 Cargando carrito del servidor...');
      const response = await unifiedCartApi.getCart({ 
        userId: useStore.getState().user?.id, 
        sessionId: sessionId || undefined 
      });
      
      if (response.success && response.data) {
        console.log('✅ Carrito del servidor cargado:', response.data);
        // Actualizar el store con el carrito del servidor
        // Aquí necesitamos mapear la respuesta del servidor al formato del store
        // Por ahora, solo actualizamos el store directamente
        return true;
      } else {
        console.log('⚠️ No se pudo cargar carrito del servidor:', response.message);
        return false;
      }
    } catch (err) {
      console.error('❌ Error cargando carrito del servidor:', err);
      return false;
    }
  }, [isGuestMode, sessionId]);

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
    loadServerCart,
    syncStock,
    clearError: () => setError(null)
  };
}; 