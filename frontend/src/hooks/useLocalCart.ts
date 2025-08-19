import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface LocalCart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

const CART_STORAGE_KEY = 'cosmetics_cart';

export const useLocalCart = () => {
  const [cart, setCart] = useState<LocalCart>({
    items: [],
    total: 0,
    itemCount: 0
  });

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    console.log('💾 Guardando carrito en localStorage:', cart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Calcular totales
  const calculateTotals = useCallback((items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { total, itemCount };
  }, []);

  // Agregar producto al carrito
  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    console.log('🛒 Hook: Agregando producto:', product.name, 'cantidad:', quantity);
    
    setCart(prevCart => {
      console.log('🛒 Hook: Carrito anterior:', prevCart);
      
      const existingItemIndex = prevCart.items.findIndex(
        item => item.product.id === product.id
      );

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Producto ya existe, actualizar cantidad
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
        console.log('🛒 Hook: Producto existente, cantidad actualizada');
      } else {
        // Producto nuevo, agregarlo
        newItems = [...prevCart.items, { product, quantity }];
        console.log('🛒 Hook: Producto nuevo agregado');
      }

      const { total, itemCount } = calculateTotals(newItems);
      const newCart = { items: newItems, total, itemCount };
      
      console.log('🛒 Hook: Nuevo carrito:', newCart);
      return newCart;
    });

    return true; // Éxito
  }, [calculateTotals]);

  // Remover producto del carrito
  const removeFromCart = useCallback((productId: number) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(item => item.product.id !== productId);
      const { total, itemCount } = calculateTotals(newItems);
      return { items: newItems, total, itemCount };
    });
  }, [calculateTotals]);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      const newItems = prevCart.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );
      const { total, itemCount } = calculateTotals(newItems);
      return { items: newItems, total, itemCount };
    });
  }, [removeFromCart, calculateTotals]);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setCart({ items: [], total: 0, itemCount: 0 });
  }, []);

  // Obtener cantidad de un producto específico
  const getItemQuantity = useCallback((productId: number) => {
    const item = cart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }, [cart.items]);

  // Verificar si un producto está en el carrito
  const isInCart = useCallback((productId: number) => {
    return cart.items.some(item => item.product.id === productId);
  }, [cart.items]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart
  };
}; 