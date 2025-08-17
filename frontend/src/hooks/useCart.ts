import { useState, useEffect, useCallback } from 'react';
import { cartApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import type { Cart, CartItem, Product, ApiResponse } from '@/types';

export const useCart = () => {
  const { cart, setCart, user } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar carrito del usuario
  const loadCart = useCallback(async () => {
    if (!user) return; // Solo cargar si hay usuario autenticado
    
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Cart> = await cartApi.getCart();
      
      if (response.success && response.data) {
        setCart(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Error de conexión al cargar carrito');
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setCart]);

  // Agregar producto al carrito
  const addToCart = useCallback(async (product: Product, quantity: number) => {
    if (!user) {
      setError('Debes iniciar sesión para agregar productos al carrito');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Cart> = await cartApi.addItem(product.id, quantity);
      
      if (response.success && response.data) {
        setCart(response.data);
        return true;
      } else {
        setError(response.error || 'Error al agregar al carrito');
        return false;
      }
    } catch (err) {
      setError('Error de conexión al agregar al carrito');
      console.error('Error adding to cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, setCart]);

  // Actualizar cantidad de un item
  const updateItemQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!user || !cart) return false;

    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Cart> = await cartApi.updateItemQuantity(productId, quantity);
      
      if (response.success && response.data) {
        setCart(response.data);
        return true;
      } else {
        setError(response.error || 'Error al actualizar cantidad');
        return false;
      }
    } catch (err) {
      setError('Error de conexión al actualizar cantidad');
      console.error('Error updating item quantity:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cart, setCart]);

  // Remover item del carrito
  const removeFromCart = useCallback(async (productId: string) => {
    if (!user || !cart) return false;

    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Cart> = await cartApi.removeItem(productId);
      
      if (response.success && response.data) {
        setCart(response.data);
        return true;
      } else {
        setError(response.error || 'Error al remover del carrito');
        return false;
      }
    } catch (err) {
      setError('Error de conexión al remover del carrito');
      console.error('Error removing from cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cart, setCart]);

  // Limpiar carrito
  const clearCart = useCallback(async () => {
    if (!user || !cart) return false;

    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<void> = await cartApi.clearCart();
      
      if (response.success) {
        setCart(null);
        return true;
      } else {
        setError(response.error || 'Error al limpiar carrito');
        return false;
      }
    } catch (err) {
      setError('Error de conexión al limpiar carrito');
      console.error('Error clearing cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cart, setCart]);

  // Reservar carrito
  const reserveCart = useCallback(async () => {
    if (!user || !cart) return false;

    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Cart> = await cartApi.reserveCart();
      
      if (response.success && response.data) {
        setCart(response.data);
        return true;
      } else {
        setError(response.error || 'Error al reservar carrito');
        return false;
      }
    } catch (err) {
      setError('Error de conexión al reservar carrito');
      console.error('Error reserving cart:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cart, setCart]);

  // Cargar carrito al montar el componente si hay usuario
  useEffect(() => {
    if (user) {
      loadCart();
    }
  }, [user, loadCart]);

  return {
    cart,
    loading,
    error,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    clearCart,
    reserveCart,
    loadCart,
    refreshCart: () => loadCart()
  };
}; 