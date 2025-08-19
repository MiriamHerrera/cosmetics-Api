import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: 'client' | 'admin';
  is_active: number;
  created_at: string;
  updated_at: string;
  total_carts: number;
  total_reservations: number;
  surveys_participated: number;
  total_activity: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_total: number;
  status: string;
  product_type: string;
  category: string;
  total_reservations: number;
  total_carts: number;
  active_reservations: number;
  popularity_score: number;
}

interface Cart {
  id: number;
  status: string;
  created_at: string;
  user_name: string;
  user_phone: string;
  total_items: number;
  total_value: number;
}

interface Reservation {
  id: number;
  quantity: number;
  status: string;
  reserved_at: string;
  expires_at: string;
  days_remaining: number;
  user_name: string;
  user_phone: string;
  product_name: string;
  price: number;
  total_value: number;
}

interface Survey {
  id: number;
  question: string;
  status: string;
  created_at: string;
  total_options: number;
  total_votes: number;
  unique_voters: number;
  participation_rate: string;
}

interface DashboardData {
  today_stats: {
    new_users_today: number;
    new_carts_today: number;
    new_reservations_today: number;
    new_votes_today: number;
  };
  week_stats: {
    new_users_week: number;
    new_carts_week: number;
    new_reservations_week: number;
    new_votes_week: number;
    completed_orders_week: number;
  };
  low_stock_products: Product[];
  expiring_reservations: Reservation[];
  recent_activity: any[];
  top_products_today: any[];
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para los datos
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  // Función para hacer llamadas a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`http://localhost:8000/api/admin/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Cargar dashboard
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall('dashboard');
      setDashboardData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios
  const loadUsers = async (page = 1, limit = 20, search = '', role = '', status = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status }),
      });
      
      const data = await apiCall(`users?${params}`);
      setUsers(data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos
  const loadProducts = async (page = 1, limit = 20, search = '', category = '', status = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(status && { status }),
      });
      
      const data = await apiCall(`products?${params}`);
      setProducts(data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cargar carritos
  const loadCarts = async (page = 1, limit = 20, status = '', period = '7') => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        period,
      });
      
      const data = await apiCall(`carts?${params}`);
      setCarts(data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cargar reservas
  const loadReservations = async (page = 1, limit = 20, status = '', period = '7') => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        period,
      });
      
      const data = await apiCall(`reservations?${params}`);
      setReservations(data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cargar encuestas
  const loadSurveys = async (page = 1, limit = 20, status = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });
      
      const data = await apiCall(`surveys?${params}`);
      setSurveys(data.data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de usuario
  const updateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      await apiCall(`users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
      });
      
      // Recargar usuarios para reflejar el cambio
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboard();
    }
  }, [user]);

  return {
    // Estados
    loading,
    error,
    dashboardData,
    users,
    products,
    carts,
    reservations,
    surveys,
    
    // Funciones
    loadDashboard,
    loadUsers,
    loadProducts,
    loadCarts,
    loadReservations,
    loadSurveys,
    updateUserStatus,
    
    // Utilidades
    clearError: () => setError(null),
  };
}; 