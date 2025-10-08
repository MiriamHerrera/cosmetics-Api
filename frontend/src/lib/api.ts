import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from './config';
import { 
  Product, 
  User, 
  Cart, 
  Order, 
  Category, 
  ApiResponse, 
  PaginationParams 
} from '@/types';

// Configuración centralizada de la API
export const API_CONFIG = {
  // URL base de la API (dominio personalizado por defecto, localhost para desarrollo)
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api',
  
  // Endpoints específicos
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    
    // Products
    PRODUCTS: '/products',
    PUBLIC_PRODUCTS: '/public/products',
    PRODUCT_TYPES: '/products/types',
    PRODUCT_CATEGORIES: '/products/categories',
    
    // Cart
    CART: '/cart',
    CART_ITEMS: '/cart/items',
    UNIFIED_CART: '/unified-cart',
    
    // Orders
    ORDERS: '/orders',
    GUEST_ORDERS: '/orders/guest',
    DELIVERY_LOCATIONS: '/orders/delivery-locations',
    DELIVERY_TIMES: '/orders/delivery-times',
    
    // Reservations
    RESERVATIONS: '/reservations',
    ADMIN_RESERVATIONS: '/reservations/admin/all',
    
    // Surveys
    SURVEYS: '/enhanced-surveys',
    SURVEY_OPTIONS: '/enhanced-surveys/options',
    
    // Admin
    ADMIN: '/admin',
    ADMIN_PRODUCTS: '/admin/products',
    
    // Reports
    REPORTS: '/reports',
    
    // Stats
    STATS: '/stats',
    
    // Health
    HEALTH: '/health'
  }
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Función helper para hacer fetch con configuración estándar
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`❌ API Error (${endpoint}):`, error);
    throw error;
  }
};

// Función helper para hacer fetch y parsear JSON
export const apiFetchJson = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const response = await apiFetch(endpoint, options);
  return response.json();
};

// Función helper para hacer POST
export const apiPost = async <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
};

// Función helper para hacer PUT
export const apiPut = async <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
};

// Función helper para hacer DELETE
export const apiDelete = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'DELETE',
    ...options,
  });
};

// Función helper para hacer GET
export const apiGet = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'GET',
    ...options,
  });
};

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
    // Solo redirigir a /login si es un token expirado (401) Y ya hay un usuario logueado
    // Esto evita redirecciones no deseadas en login/registro con credenciales incorrectas
    if (error.response?.status === 401 && localStorage.getItem('auth_token')) {
      // Token expirado o inválido - solo limpiar token, no redirigir
      localStorage.removeItem('auth_token');
      console.log('🔑 Token expirado, limpiando localStorage');
      
      // Solo redirigir si estamos en una página que requiere autenticación
      // y no en el proceso de login/registro
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      
      if (!isAuthPage) {
        console.log('🔄 Redirigiendo a login por token expirado');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API de Productos Públicos (solo aprobados)
export const publicProductsApi = {
  // Obtener productos públicos con paginación y filtros
  getPublicProducts: async (params: PaginationParams = { page: 1, limit: 50 }) => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.PUBLIC_PRODUCTS}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo productos públicos:', error);
      throw error;
    }
  },

  // Obtener producto público por ID
  getPublicProductById: async (id: number) => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.PUBLIC_PRODUCTS}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo producto público:', error);
      throw error;
    }
  },

  // Buscar productos públicos
  searchPublicProducts: async (query: string, params: PaginationParams = { page: 1, limit: 50 }) => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.PUBLIC_PRODUCTS}/search`, { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Error buscando productos públicos:', error);
      throw error;
    }
  },

  // Obtener productos por categoría
  getPublicProductsByCategory: async (category: string, params: PaginationParams = { page: 1, limit: 50 }) => {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.PUBLIC_PRODUCTS}/category/${category}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo productos por categoría:', error);
      throw error;
    }
  }
};

// API de Productos (admin)
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

// API del Carrito Unificado (para usuarios autenticados e invitados)
export const unifiedCartApi = {
  // Obtener carrito (usuario autenticado o invitado)
  getCart: async (cartData: { userId?: number; sessionId?: string }): Promise<ApiResponse<Cart>> => {
    const response = await api.post(`${API_CONFIG.ENDPOINTS.UNIFIED_CART}/get`, cartData);
    return response.data;
  },

  // Agregar producto al carrito
  addItem: async (productId: number, quantity: number, cartData: { userId?: number; sessionId?: string }): Promise<ApiResponse<Cart>> => {
    const response = await api.post(`${API_CONFIG.ENDPOINTS.UNIFIED_CART}/add-item`, { productId, quantity, ...cartData });
    return response.data;
  },

  // Actualizar cantidad de item
  updateQuantity: async (productId: number, quantity: number, cartData: { userId?: number; sessionId?: string }): Promise<ApiResponse<Cart>> => {
    const response = await api.put(`${API_CONFIG.ENDPOINTS.UNIFIED_CART}/update-quantity`, { productId, quantity, ...cartData });
    return response.data;
  },

  // Remover item del carrito
  removeItem: async (productId: number, cartData: { userId?: number; sessionId?: string }): Promise<ApiResponse<Cart>> => {
    const response = await api.delete(`${API_CONFIG.ENDPOINTS.UNIFIED_CART}/remove-item`, { 
      data: { productId, ...cartData } 
    });
    return response.data;
  },

  // Limpiar carrito
  clearCart: async (cartData: { userId?: number; sessionId?: string }): Promise<ApiResponse<void>> => {
    const response = await api.post(`${API_CONFIG.ENDPOINTS.UNIFIED_CART}/clear`, cartData);
    return response.data;
  },

  // Migrar carrito de invitado a usuario autenticado
  migrateGuestToUser: async (sessionId: string, userId: number): Promise<ApiResponse<Cart>> => {
    const response = await api.post(`${API_CONFIG.ENDPOINTS.UNIFIED_CART}/migrate-guest-to-user`, { sessionId, userId });
    return response.data;
  },

  // Limpiar carritos expirados
  cleanupExpired: async (): Promise<ApiResponse<{ cleaned: number }>> => {
    const response = await api.post(`${API_CONFIG.ENDPOINTS.UNIFIED_CART}/cleanup-expired`);
    return response.data;
  }
};

// Exportar instancia de api para uso directo
export default api;
