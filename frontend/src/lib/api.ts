import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from './config';
import type { 
  Product, 
  User, 
  Cart, 
  Order, 
  Category, 
  ApiResponse, 
  PaginationParams 
} from '@/types';

// Configuración base de la API
const API_BASE_URL = config.apiUrl;

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API de Productos
export const productsApi = {
  // Obtener todos los productos con paginación
  getAll: async (params: PaginationParams): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Obtener producto por ID
  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Buscar productos
  search: async (query: string): Promise<ApiResponse<Product[]>> => {
    const response = await api.get('/products/search', { params: { q: query } });
    return response.data;
  },

  // Obtener productos por categoría
  getByCategory: async (category: string): Promise<ApiResponse<Product[]>> => {
    const response = await api.get(`/products/category/${category}`);
    return response.data;
  },

  // Crear producto (admin)
  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  // Actualizar producto (admin)
  update: async (id: number, product: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },

  // Eliminar producto (admin)
  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

// API de Usuarios
export const usersApi = {
  // Login
  login: async (phone: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', { phone, password });
    return response.data;
  },

  // Registro
  register: async (userData: { name: string; password: string; phone: string }): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Obtener perfil del usuario
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Actualizar perfil
  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }
};

// API del Carrito (con autenticación)
export const cartApi = {
  // Obtener carrito del usuario
  getCart: async (): Promise<ApiResponse<Cart>> => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Agregar producto al carrito
  addItem: async (productId: number, quantity: number): Promise<ApiResponse<Cart>> => {
    const response = await api.post('/cart/items', { productId, quantity });
    return response.data;
  },

  // Actualizar cantidad de item
  updateItemQuantity: async (productId: number, quantity: number): Promise<ApiResponse<Cart>> => {
    const response = await api.put(`/cart/items/${productId}`, { quantity });
    return response.data;
  },

  // Remover item del carrito
  removeItem: async (productId: number): Promise<ApiResponse<Cart>> => {
    const response = await api.delete(`/cart/items/${productId}`);
    return response.data;
  },

  // Limpiar carrito
  clearCart: async (): Promise<ApiResponse<void>> => {
    const response = await api.delete('/cart');
    return response.data;
  },

  // Reservar carrito (7 días)
  reserveCart: async (): Promise<ApiResponse<Cart>> => {
    const response = await api.post('/cart/reserve');
    return response.data;
  }
};

// API del Carrito para Invitados (sin autenticación)
export const guestCartApi = {
  // Agregar producto al carrito invitado (reserva stock)
  addItem: async (productId: number, quantity: number, sessionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.post('/guest-cart/items', { productId, quantity, sessionId });
    return response.data;
  },

  // Actualizar cantidad en carrito invitado
  updateQuantity: async (productId: number, quantity: number, sessionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.put(`/guest-cart/items/${productId}`, { quantity, sessionId });
    return response.data;
  },

  // Remover item del carrito invitado
  removeItem: async (productId: number, sessionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete(`/guest-cart/items/${productId}`, { 
      data: { sessionId } 
    });
    return response.data;
  },

  // Limpiar carrito invitado
  clearCart: async (sessionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete('/guest-cart', { 
      data: { sessionId } 
    });
    return response.data;
  },

  // Verificar stock disponible
  checkStock: async (productId: number): Promise<ApiResponse<{ stock: number; available: boolean }>> => {
    const response = await api.get(`/guest-cart/items/${productId}`);
    return response.data;
  }
};

// API de Órdenes
export const ordersApi = {
  // Crear orden desde carrito
  createFromCart: async (shippingAddress: string, paymentMethod: string): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', { shippingAddress, paymentMethod });
    return response.data;
  },

  // Obtener órdenes del usuario
  getUserOrders: async (): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/orders');
    return response.data;
  },

  // Obtener orden por ID
  getById: async (id: number): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  }
};

// API de Categorías
export const categoriesApi = {
  // Obtener todas las categorías
  getAll: async (): Promise<ApiResponse<Category[]>> => {
    const response = await api.get('/products/categories');
    return response.data;
  }
};

// Exportar instancia de api para uso directo
export default api;
