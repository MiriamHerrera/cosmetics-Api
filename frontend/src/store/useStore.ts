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
  
  // Configuración de logging
  DEBUG_MODE: boolean;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  
  // Acciones
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
  setCart: (cart: Cart | null) => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  syncServerCart: (serverCart: any) => void;
  setCategories: (categories: string[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Actualizar stock de un producto específico
  updateProductStock: (productId: number, newStock: number) => void;
  
  // Sincronizar todo el stock desde el servidor
  syncAllStock: (serverProducts: Product[]) => void;
  
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

      // Configuración de logging (solo en desarrollo)
      DEBUG_MODE: process.env.NODE_ENV === 'development',
      
      log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
        if (get().DEBUG_MODE) {
          const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '🔄';
          console.log(`${prefix} [Store] ${message}`);
        }
      },

      // Acciones
      setUser: (user) => set({ user }),
      
      setProducts: (products) => {
        const store = get();
        store.log(`setProducts llamado con ${products.length} productos`);
        if (products.length > 0) {
          store.log(`Primer producto: ${products[0].name}`);
        }
        set({ products });
        store.log(`Productos guardados en store: ${products.length} productos`);
      },
      
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
      
      // Función para sincronizar carrito del servidor con el store local
      syncServerCart: (serverCart: any) => {
        if (!serverCart) return;
        
        const store = get();
        store.log('Recibiendo carrito del servidor');
        
        // Mapear la respuesta del servidor al formato del store
        const mappedCart = {
          id: serverCart.id?.toString() || `cart_${Date.now()}`,
          userId: serverCart.userId?.toString() || serverCart.user_id?.toString() || 'anonymous',
          items: serverCart.items?.map((item: any) => {
            store.log(`Mapeando item: ${item.product?.name || item.name}`);
            return {
              productId: item.productId || item.product_id,
              quantity: item.quantity,
              product: {
                id: item.productId || item.product_id,
                name: item.product?.name || item.product_name || item.name || 'Producto sin nombre',
                price: item.product?.price || item.price || 0,
                image_url: item.product?.image_url || item.image_url || '/NoImage.jpg',
                stock_total: item.product?.stock_total || item.stock_total || 0,
                description: item.product?.description || item.description || '',
                product_type_id: item.product?.product_type_id || item.product_type_id || 0,
                category_name: item.product?.category_name || item.category_name || 'Sin categoría'
              }
            };
          }) || [],
          total: serverCart.total || 0,
          status: serverCart.status || 'active',
          createdAt: serverCart.createdAt ? new Date(serverCart.createdAt) : serverCart.created_at ? new Date(serverCart.created_at) : new Date(),
          updatedAt: serverCart.updatedAt ? new Date(serverCart.updatedAt) : serverCart.updated_at ? new Date(serverCart.updated_at) : new Date()
        };
        
        store.log('Carrito mapeado y guardado');
        set({ cart: mappedCart });
      },
      
      setCategories: (categories) => set({ categories }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Actualizar stock de un producto específico
      updateProductStock: (productId, newStock) => {
        const currentProducts = get().products;
        const currentProduct = currentProducts.find(p => p.id === productId);
        const store = get();
        
        store.log(`Actualizando stock del producto ${productId}: ${currentProduct?.stock_total} → ${newStock}`);
        
        // Solo actualizar si el stock realmente cambió y es válido
        if (currentProduct && currentProduct.stock_total !== newStock && newStock >= 0) {
          const updatedProducts = currentProducts.map(product =>
            product.id === productId ? { ...product, stock_total: newStock } : product
          );
          set({ products: updatedProducts });
          store.log(`Stock del producto ${productId} actualizado a ${newStock}`);
          
          // También actualizar el stock en el carrito si existe
          const currentCart = get().cart;
          if (currentCart) {
            const cartItem = currentCart.items.find(item => item.productId === productId);
            if (cartItem && cartItem.product.stock_total !== newStock) {
              const updatedCartItems = currentCart.items.map(item =>
                item.productId === productId 
                  ? { ...item, product: { ...item.product, stock_total: newStock } }
                  : item
              );
              
              const updatedCart = {
                ...currentCart,
                items: updatedCartItems,
                updatedAt: new Date()
              };
              
              set({ cart: updatedCart });
              store.log(`Stock del producto ${productId} actualizado en el carrito`);
            }
          }
        } else {
          if (newStock < 0) {
            store.log(`Stock negativo no permitido para producto ${productId}: ${newStock}`, 'warn');
          } else {
            store.log(`Stock del producto ${productId} no cambió (${currentProduct?.stock_total})`);
          }
        }
      },
      
      // Sincronizar todo el stock desde el servidor
      syncAllStock: (serverProducts: Product[]) => {
        if (!serverProducts || !Array.isArray(serverProducts)) {
          const store = get();
          store.log('syncAllStock: productos del servidor inválidos', 'warn');
          return;
        }
        
        const store = get();
        store.log(`Sincronizando stock de ${serverProducts.length} productos desde servidor...`);
        
        const currentProducts = get().products;
        let updatedCount = 0;
        
        serverProducts.forEach(serverProduct => {
          const localProduct = currentProducts.find(p => p.id === serverProduct.id);
          if (localProduct && localProduct.stock_total !== serverProduct.stock_total) {
            // Usar updateProductStock para mantener consistencia
            get().updateProductStock(serverProduct.id, serverProduct.stock_total);
            updatedCount++;
          }
        });
        
        store.log(`Stock sincronizado: ${updatedCount} productos actualizados`);
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
