import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Reservation {
  id: number;
  user_id: number | null;
  session_id: string;
  product_id: number;
  quantity: number;
  reserved_until: string;
  user_type: 'guest' | 'registered';
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  product_name: string;
  product_price: number;
  product_image: string;
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  total_amount: number;
  minutes_remaining: number;
  hours_remaining: number;
  days_remaining: number;
  expiration_status: 'expired' | 'critical' | 'warning' | 'safe';
}

export interface ReservationStats {
  total_reservations: number;
  active_reservations: number;
  expired_reservations: number;
  guest_reservations: number;
  registered_reservations: number;
  overdue_reservations: number;
}

export interface ReservationFilters {
  status: string;
  user_type: string;
  search: string;
}

export interface ReservationPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ReservationPagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Cargar todas las reservas (admin)
  const loadAllReservations = useCallback(async (filters: ReservationFilters = { status: '', user_type: '', search: '' }) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.user_type && { user_type: filters.user_type }),
        ...(filters.search && { search: filters.search })
      });

      const response = await api.get(`/reservations/admin/all?${params}`);
      
      if (response.data.success) {
        setReservations(response.data.data.reservations);
        setPagination(response.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando reservas');
      console.error('Error cargando reservas:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Cargar reservas de un usuario específico
  const loadUserReservations = useCallback(async (userId?: string, sessionId?: string, status: string = 'active') => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      if (userId) {
        endpoint = `/reservations/user/${userId}?status=${status}`;
      } else if (sessionId) {
        endpoint = `/reservations/session/${sessionId}?status=${status}`;
      } else {
        throw new Error('Se requiere userId o sessionId');
      }

      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setReservations(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando reservas del usuario');
      console.error('Error cargando reservas del usuario:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const response = await api.get('/reservations/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  // Crear nueva reserva
  const createReservation = useCallback(async (reservationData: {
    userId?: string;
    sessionId?: string;
    productId: number;
    quantity: number;
    userType?: 'guest' | 'registered';
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/reservations/create', reservationData);
      
      if (response.data.success) {
        // Recargar reservas si es necesario
        if (reservationData.userId || reservationData.sessionId) {
          await loadUserReservations(reservationData.userId, reservationData.sessionId);
        }
        return response.data.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando reserva');
      console.error('Error creando reserva:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserReservations]);

  // Extender reserva (admin)
  const extendReservation = useCallback(async (reservationId: number, extensionHours: number = 24, reason?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put(`/reservations/admin/extend/${reservationId}`, {
        extensionHours,
        reason
      });

      if (response.data.success) {
        // Recargar reservas
        await loadAllReservations();
        await loadStats();
        return response.data.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error extendiendo reserva');
      console.error('Error extendiendo reserva:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAllReservations, loadStats]);

  // Cancelar reserva
  const cancelReservation = useCallback(async (reservationId: number, reason?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put(`/reservations/admin/cancel/${reservationId}`, { reason });
      
      if (response.data.success) {
        // Recargar reservas
        await loadAllReservations();
        await loadStats();
        return response.data.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cancelando reserva');
      console.error('Error cancelando reserva:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAllReservations, loadStats]);

  // Enviar recordatorio WhatsApp
  const sendWhatsAppReminder = useCallback(async (reservationId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/reservations/admin/reminder/${reservationId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error enviando recordatorio');
      console.error('Error enviando recordatorio:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar reservas expiradas
  const cleanupExpiredReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/reservations/admin/cleanup');
      
      if (response.data.success) {
        // Recargar reservas y estadísticas
        await loadAllReservations();
        await loadStats();
        return response.data.data;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en limpieza');
      console.error('Error en limpieza:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAllReservations, loadStats]);

  // Cambiar página
  const changePage = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Cambiar límite por página
  const changeLimit = useCallback((newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Formatear tiempo restante
  const formatTimeRemaining = useCallback((minutes: number) => {
    if (minutes < 0) return 'Expirada';
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  }, []);

  // Obtener color del estado de expiración
  const getExpirationColor = useCallback((status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600';
      case 'critical': return 'text-orange-600';
      case 'warning': return 'text-yellow-600';
      case 'safe': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }, []);

  // Obtener icono del estado de expiración
  const getExpirationIcon = useCallback((status: string) => {
    switch (status) {
      case 'expired': return '❌';
      case 'critical': return '⚠️';
      case 'warning': return '⏰';
      case 'safe': return '✅';
      default: return '⏰';
    }
  }, []);

  return {
    // Estado
    reservations,
    stats,
    loading,
    error,
    pagination,
    
    // Acciones
    loadAllReservations,
    loadUserReservations,
    loadStats,
    createReservation,
    extendReservation,
    cancelReservation,
    sendWhatsAppReminder,
    cleanupExpiredReservations,
    changePage,
    changeLimit,
    clearError,
    
    // Utilidades
    formatTimeRemaining,
    getExpirationColor,
    getExpirationIcon
  };
}; 