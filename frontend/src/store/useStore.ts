import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Cart, User, CartItem } from '@/types';

interface AppState {
  // Estado
  user: User | null;
  products: Product[];
  cart: Cart | null;
  categories: string[];
  isLoading: boolean;
  
  // Acciones
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
  setCart: (cart: Cart | null) => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setCategories: (categories: string[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Actualizar stock de un producto específico
  updateProductStock: (productId: number, newStock: number) => void;
  
  // Computed values
  cartItemCount: number;
  cartTotal: number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      products: [],
      cart: null,
      categories: [],
      isLoading: false,

      // Acciones
      setUser: (user) => set({ user }),
      
      setProducts: (products) => set({ products }),
      
      setCart: (cart) => set({ cart }),
      
      addToCart: (product, quantity) => {
        const currentCart = get().cart;
        const existingItem = currentCart?.items.find(item => item.productId === product.id);
        
        if (existingItem && currentCart) {
          // Actualizar cantidad si ya existe
          const updatedItems = currentCart.items.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          
          const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
          
          set({
            cart: {
              ...currentCart,
              items: updatedItems,
              total,
              updatedAt: new Date()
            }
          });
        } else {
          // Agregar nuevo item
          const newItem: CartItem = {
            productId: product.id,
            quantity,
            product
          };
          
          const newCart: Cart = {
            id: `cart_${Date.now()}`,
            userId: get().user?.id?.toString() || 'anonymous',
            items: [...(currentCart?.items || []), newItem],
            total: (currentCart?.total || 0) + (product.price * quantity),
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set({ cart: newCart });
        }
      },
      
      removeFromCart: (productId) => {
        const currentCart = get().cart;
        if (!currentCart) return;
        
        const updatedItems = currentCart.items.filter(item => item.productId !== productId);
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        set({
          cart: {
            ...currentCart,
            items: updatedItems,
            total,
            updatedAt: new Date()
          }
        });
      },
      
      updateCartItemQuantity: (productId, quantity) => {
        const currentCart = get().cart;
        if (!currentCart) return;
        
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        const updatedItems = currentCart.items.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        );
        
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        set({
          cart: {
            ...currentCart,
            items: updatedItems,
            total,
            updatedAt: new Date()
          }
        });
      },
      
      clearCart: () => set({ cart: null }),
      
      setCategories: (categories) => set({ categories }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Actualizar stock de un producto específico
      updateProductStock: (productId, newStock) => {
        const updatedProducts = get().products.map(product =>
          product.id === productId ? { ...product, stock_total: newStock } : product
        );
        set({ products: updatedProducts });
      },
      
      // Computed values
      get cartItemCount() {
        const cart = get().cart;
        return cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
      },
      
      get cartTotal() {
        const cart = get().cart;
        return cart ? cart.total : 0;
      }
    }),
    {
      name: 'cosmetics-store',
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        categories: state.categories
      })
    }
  )
);
