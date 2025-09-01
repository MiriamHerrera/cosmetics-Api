'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  Filter,
  RefreshCw,
  MessageSquare,
  Calendar,
  Trash2,
  Edit3
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { getImageUrl } from '../../lib/config';

interface Reservation {
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

interface ReservationStats {
  total_reservations: number;
  active_reservations: number;
  expired_reservations: number;
  guest_reservations: number;
  registered_reservations: number;
  overdue_reservations: number;
}

interface CartStats {
  general: {
    total_carts: number;
    active_carts: number;
    expired_carts: number;
    completed_carts: number;
    guest_carts: number;
    registered_carts: number;
    overdue_carts: number;
    expiring_soon_carts: number;
  };
  withProducts: {
    carts_with_products: number;
    total_items_in_carts: number;
    total_cart_value: number;
  };
  expiringSoon: Array<{
    id: number;
    cart_type: string;
    user_id: number | null;
    session_id: string;
    expires_at: string;
    minutes_until_expiry: number;
    items_count: number;
    total_quantity: number;
    total_value: number;
  }>;
  byType: Array<{
    cart_type: string;
    count: number;
    earliest_expiration: string;
    latest_expiration: string;
    avg_hours_until_expiry: number;
  }>;
}

interface Cart {
  id: number;
  cart_type: string;
  user_id: number | null;
  session_id: string;
  expires_at: string;
  created_at: string;
  minutes_until_expiry: number;
  expiration_status: 'expired' | 'critical' | 'warning' | 'safe';
  user_name: string | null;
  user_phone: string | null;
  user_email: string | null;
  items_count: number;
  total_quantity: number;
  total_value: number;
  products_summary: string;
}

const ReservationsSection: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [cartStats, setCartStats] = useState<CartStats | null>(null);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    user_type: '',
    search: ''
  });

  // Filtros para carritos
  const [cartFilters, setCartFilters] = useState({
    cart_type: '',
    search: ''
  });
  
  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Paginación para carritos
  const [cartPagination, setCartPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Estados para modales
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [extensionHours, setExtensionHours] = useState(24);
  const [extensionReason, setExtensionReason] = useState('');

  // Cargar reservas
  const loadReservations = async () => {
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
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await api.get('/reservations/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  // Cargar estadísticas de carritos
  const loadCartStats = async () => {
    try {
      const response = await api.get('/reservations/admin/cart-stats');
      if (response.data.success) {
        setCartStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error cargando estadísticas de carritos:', err);
    }
  };

  // Cargar carritos activos
  const loadCarts = async () => {
    try {
      setCartLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: cartPagination.page.toString(),
        limit: cartPagination.limit.toString(),
        ...(cartFilters.cart_type && { cart_type: cartFilters.cart_type }),
        ...(cartFilters.search && { search: cartFilters.search })
      });

      const response = await api.get(`/reservations/admin/carts?${params}`);
      
      if (response.data.success) {
        setCarts(response.data.data.carts);
        setCartPagination(response.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando carritos');
      console.error('Error cargando carritos:', err);
    } finally {
      setCartLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadReservations();
    loadStats();
    loadCartStats();
    loadCarts();
  }, [pagination.page, filters, cartPagination.page, cartFilters]);

  // Aplicar filtros
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadReservations();
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({ status: '', user_type: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Aplicar filtros de carritos
  const applyCartFilters = () => {
    setCartPagination(prev => ({ ...prev, page: 1 }));
    loadCarts();
  };

  // Limpiar filtros de carritos
  const clearCartFilters = () => {
    setCartFilters({ cart_type: '', search: '' });
    setCartPagination(prev => ({ ...prev, page: 1 }));
  };

  // Extender reserva
  const extendReservation = async () => {
    if (!selectedReservation) return;

    try {
      const response = await api.put(`/reservations/admin/extend/${selectedReservation.id}`, {
        extensionHours,
        reason: extensionReason
      });

      if (response.data.success) {
        setShowExtensionModal(false);
        setSelectedReservation(null);
        setExtensionHours(24);
        setExtensionReason('');
        loadReservations();
        loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error extendiendo reserva');
    }
  };

  // Cancelar reserva
  const cancelReservation = async (reservationId: number, reason: string = 'Cancelada por administrador') => {
    try {
      const response = await api.put(`/reservations/admin/cancel/${reservationId}`, { reason });
      
      if (response.data.success) {
        loadReservations();
        loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cancelando reserva');
    }
  };

  // Enviar recordatorio WhatsApp
  const sendWhatsAppReminder = async (reservationId: number) => {
    try {
      const response = await api.post(`/reservations/admin/reminder/${reservationId}`);
      
      if (response.data.success) {
        alert('Recordatorio enviado exitosamente');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error enviando recordatorio');
    }
  };

  // Limpiar reservas expiradas
  const cleanupExpiredReservations = async () => {
    try {
      const response = await api.post('/reservations/admin/cleanup');
      
      if (response.data.success) {
        alert(`Limpieza completada: ${response.data.data.cleaned} reservas procesadas`);
        loadReservations();
        loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en limpieza');
    }
  };

  // Formatear tiempo restante
  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 0) return 'Expirada';
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  };

  // Obtener color del estado de expiración
  const getExpirationColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600';
      case 'critical': return 'text-orange-600';
      case 'warning': return 'text-yellow-600';
      case 'safe': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Obtener icono del estado de expiración
  const getExpirationIcon = (status: string) => {
    switch (status) {
      case 'expired': return <XCircle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      case 'safe': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Acceso restringido</h3>
          <p>Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h2>
          <p className="text-gray-600">Administra las reservas de productos del sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={cleanupExpiredReservations}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Expiradas
          </button>
          <button
            onClick={() => { loadReservations(); loadStats(); loadCartStats(); loadCarts(); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas de Reservas */}
      {stats && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Estadísticas de Reservas</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{stats.total_reservations}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">{stats.active_reservations}</div>
              <div className="text-sm text-gray-600">Activas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-red-600">{stats.expired_reservations}</div>
              <div className="text-sm text-gray-600">Expiradas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-purple-600">{stats.guest_reservations}</div>
              <div className="text-sm text-gray-600">Invitados</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-indigo-600">{stats.registered_reservations}</div>
              <div className="text-sm text-gray-600">Registrados</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-orange-600">{stats.overdue_reservations}</div>
              <div className="text-sm text-gray-600">Vencidas</div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas de Carritos */}
      {cartStats && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Estadísticas de Carritos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{cartStats.general.active_carts}</div>
              <div className="text-sm text-gray-600">Carritos Activos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">{cartStats.withProducts.carts_with_products}</div>
              <div className="text-sm text-gray-600">Con Productos</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-orange-600">{cartStats.general.expiring_soon_carts}</div>
              <div className="text-sm text-gray-600">Expiran Pronto</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-purple-600">${(cartStats.withProducts.total_cart_value || 0).toFixed(2)}</div>
              <div className="text-sm text-gray-600">Valor Total</div>
            </div>
          </div>
          
          {/* Carritos próximos a expirar */}
          {cartStats.expiringSoon.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow border">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Carritos Próximos a Expirar (24h)</h4>
              <div className="space-y-2">
                {cartStats.expiringSoon.slice(0, 5).map((cart) => (
                  <div key={cart.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <div>
                      <span className="font-medium">
                        {cart.cart_type === 'guest' ? 'Invitado' : 'Registrado'}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        {cart.items_count} productos - ${(cart.total_value || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-orange-600">
                      {formatTimeRemaining(cart.minutes_until_expiry)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="active">Activas</option>
              <option value="expired">Expiradas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
            <select
              value={filters.user_type}
              onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="guest">Invitados</option>
              <option value="registered">Registrados</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Producto, usuario, teléfono..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Aplicar
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600" />
            <p className="mt-2 text-gray-600">Cargando reservas...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={loadReservations}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expira
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={getImageUrl(reservation.product_image)}
                            alt={reservation.product_name}
                            className="w-10 h-10 rounded-md object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.product_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${reservation.product_price}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.user_name || 'Invitado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.user_phone || reservation.user_email || reservation.session_id}
                            </div>
                            <div className="text-xs text-gray-400">
                              {reservation.user_type === 'guest' ? 'Invitado' : 'Registrado'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reservation.quantity}</div>
                        <div className="text-sm text-gray-500">
                          ${reservation.total_amount}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getExpirationIcon(reservation.expiration_status)}
                          <span className={`ml-2 text-sm font-medium ${getExpirationColor(reservation.expiration_status)}`}>
                            {formatTimeRemaining(reservation.minutes_remaining)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(reservation.reserved_until).toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          reservation.status === 'active' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'expired' ? 'bg-red-100 text-red-800' :
                          reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.status === 'active' ? 'Activa' :
                           reservation.status === 'expired' ? 'Expirada' :
                           reservation.status === 'completed' ? 'Completada' :
                           'Cancelada'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {reservation.status === 'active' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setShowExtensionModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Extender plazo"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => sendWhatsAppReminder(reservation.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Enviar recordatorio WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {reservation.status === 'active' && (
                            <button
                              onClick={() => cancelReservation(reservation.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancelar reserva"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} resultados
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filtros de Carritos */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Carritos Activos con Productos</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Carrito</label>
            <select
              value={cartFilters.cart_type}
              onChange={(e) => setCartFilters(prev => ({ ...prev, cart_type: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="guest">Invitados</option>
              <option value="registered">Registrados</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Usuario, teléfono, producto..."
                value={cartFilters.search}
                onChange={(e) => setCartFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={applyCartFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Aplicar
            </button>
            <button
              onClick={clearCartFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Carritos */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {cartLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600" />
            <p className="mt-2 text-gray-600">Cargando carritos...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={loadCarts}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expira
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {carts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {cart.user_name || 'Invitado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cart.user_phone || cart.user_email || cart.session_id}
                            </div>
                            <div className="text-xs text-gray-400">
                              {cart.cart_type === 'guest' ? 'Invitado' : 'Registrado'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {cart.items_count} productos
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {cart.products_summary}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cart.total_quantity}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${(cart.total_value || 0).toFixed(2)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getExpirationIcon(cart.expiration_status)}
                          <span className={`ml-2 text-sm font-medium ${getExpirationColor(cart.expiration_status)}`}>
                            {formatTimeRemaining(cart.minutes_until_expiry)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(cart.expires_at).toLocaleString()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cart.expiration_status === 'expired' ? 'bg-red-100 text-red-800' :
                          cart.expiration_status === 'critical' ? 'bg-orange-100 text-orange-800' :
                          cart.expiration_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {cart.expiration_status === 'expired' ? 'Expirado' :
                           cart.expiration_status === 'critical' ? 'Crítico' :
                           cart.expiration_status === 'warning' ? 'Advertencia' :
                           'Seguro'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación de Carritos */}
            {cartPagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((cartPagination.page - 1) * cartPagination.limit) + 1} a{' '}
                    {Math.min(cartPagination.page * cartPagination.limit, cartPagination.total)} de{' '}
                    {cartPagination.total} resultados
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCartPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={cartPagination.page === 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Página {cartPagination.page} de {cartPagination.pages}
                    </span>
                    <button
                      onClick={() => setCartPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={cartPagination.page === cartPagination.pages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Extensión */}
      {showExtensionModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Extender Reserva</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Producto: <span className="font-medium">{selectedReservation.product_name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Usuario: <span className="font-medium">
                  {selectedReservation.user_name || 'Invitado'}
                </span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Expira: <span className="font-medium">
                  {new Date(selectedReservation.reserved_until).toLocaleString()}
                </span>
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas adicionales
              </label>
              <input
                type="number"
                min="1"
                max="168" // 7 días máximo
                value={extensionHours}
                onChange={(e) => setExtensionHours(parseInt(e.target.value) || 24)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Motivo de la extensión..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExtensionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={extendReservation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Extender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsSection; 