'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  User, 
  Package, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Truck,
  Eye,
  Edit,
  X,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { config } from '@/lib/config';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
  description?: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_type: 'registered' | 'guest';
  user_id: number | null;
  session_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_location_id: number;
  delivery_location_name: string;
  delivery_date: string;
  delivery_time: string;
  delivery_address: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes: string | null;
  admin_notes: string | null;
  whatsapp_message: string | null;
  whatsapp_sent_at: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
  total_quantity: number;
}

interface DeliveryLocation {
  id: number;
  name: string;
}

export default function OrdersSection() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCustomerType, setSelectedCustomerType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // Estados de la interfaz
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Cargar órdenes
  const loadOrders = async (page = 1) => {
    if (!user || user.role !== 'admin') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCustomerType) params.append('customerType', selectedCustomerType);
      if (selectedLocation) params.append('locationId', selectedLocation);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      console.log('📡 Enviando parámetros al backend:', params.toString());
      console.log('🔗 URL completa:', `${config.apiUrl}/orders?${params}`);

      const response = await fetch(`${config.apiUrl}/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data.orders);
        setTotalPages(data.data.pagination.pages);
        setTotalOrders(data.data.pagination.total);
        setCurrentPage(page);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error cargando órdenes');
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    console.log('🔍 Aplicando filtros:', {
      searchTerm,
      selectedStatus,
      selectedCustomerType,
      selectedLocation,
      startDate,
      endDate
    });
    setCurrentPage(1);
    // No llamar a loadOrders aquí, se ejecutará automáticamente por el useEffect
  };

  // Limpiar filtros
  const clearFilters = () => {
    console.log('🧹 Limpiando filtros...');
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedCustomerType('');
    setSelectedLocation('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    // No llamar a loadOrders aquí, se ejecutará automáticamente por el useEffect
  };

  // Actualizar estado de la orden
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    setUpdatingStatus(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes || null
        })
      });

      if (response.ok) {
        // Actualizar la orden en la lista
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: newStatus as any, admin_notes: adminNotes }
            : order
        ));
        
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        setAdminNotes('');
        
        alert('Estado de la orden actualizado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error de conexión');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Función helper para formatear montos de manera segura
  const formatAmount = (amount: any): string => {
    if (amount === null || amount === undefined) return '0.00';
    const numAmount = Number(amount);
    return isNaN(numAmount) ? '0.00' : numAmount.toFixed(2);
  };

  // Función para abrir WhatsApp con el mensaje del pedido
  const openWhatsApp = (order: Order) => {
    if (!order.whatsapp_message) {
      alert('Este pedido no tiene mensaje de WhatsApp generado');
      return;
    }

    const whatsappUrl = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(order.whatsapp_message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Función para reenviar mensaje a WhatsApp
  const resendWhatsApp = async (order: Order) => {
    try {
      // Aquí podrías implementar la lógica para regenerar el mensaje
      // Por ahora, solo abrimos WhatsApp con el mensaje existente
      openWhatsApp(order);
    } catch (error) {
      console.error('Error reenviando WhatsApp:', error);
      alert('Error al reenviar el mensaje de WhatsApp');
    }
  };

  // Función para obtener el estado de WhatsApp
  const getWhatsAppStatus = (order: Order) => {
    if (!order.whatsapp_message) {
      return { status: 'not-sent', label: 'No enviado', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
    
    if (order.whatsapp_sent_at) {
      return { status: 'sent', label: 'Enviado', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
    
    return { status: 'pending', label: 'Pendiente', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'En Preparación';
      case 'ready': return 'Listo';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Play className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'delivered': return <Truck className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Cargar órdenes al montar el componente
  useEffect(() => {
    loadOrders();
  }, []);

  // Recargar órdenes cuando cambien los filtros
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('🔄 Filtros cambiaron, recargando órdenes...');
      loadOrders(1);
    }
  }, [searchTerm, selectedStatus, selectedCustomerType, selectedLocation, startDate, endDate]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (timeString: string) => {
    return timeString;
  };

  // Función para cambiar el estado de manera rápida
  const handleQuickStatusChange = async (orderId: number, newStatus: string) => {
    const orderToUpdate = orders.find(order => order.id === orderId);
    if (!orderToUpdate) return;

    setUpdatingStatus(true);

    try {
      const response = await fetch(`${config.apiUrl}/orders/${orderToUpdate.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: orderToUpdate.admin_notes || null
        })
      });

      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderToUpdate.id 
            ? { ...order, status: newStatus as any, admin_notes: orderToUpdate.admin_notes }
            : order
        ));
        alert('Estado de la orden actualizado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error actualizando estado rápidamente:', error);
      alert('Error de conexión');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="text-center text-gray-500">Acceso denegado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Órdenes</h3>
          <p className="text-sm text-gray-600">
            Total de órdenes: {totalOrders} | Página {currentPage} de {totalPages}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Búsqueda */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o número de orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="preparing">En Preparación</option>
              <option value="ready">Listo</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Tipo de cliente */}
          <div>
            <select
              value={selectedCustomerType}
              onChange={(e) => setSelectedCustomerType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              <option value="registered">Registrado</option>
              <option value="guest">Invitado</option>
            </select>
          </div>

          {/* Fecha inicio */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Fecha inicio"
            />
          </div>

          {/* Fecha fin */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Fecha fin"
            />
          </div>
        </div>

        {/* Botones de filtros */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Aplicar Filtros
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Limpiar
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Los filtros se aplican automáticamente</span>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(searchTerm || selectedStatus || selectedCustomerType || selectedLocation || startDate || endDate) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros activos:</span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Búsqueda: "{searchTerm}"
                  </span>
                )}
                {selectedStatus && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Estado: {getStatusText(selectedStatus)}
                  </span>
                )}
                {selectedCustomerType && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Tipo: {selectedCustomerType === 'guest' ? 'Invitado' : 'Registrado'}
                  </span>
                )}
                {selectedLocation && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Ubicación: {selectedLocation}
                  </span>
                )}
                {startDate && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Desde: {formatDate(startDate)}
                  </span>
                )}
                {endDate && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Hasta: {formatDate(endDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header con contador */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Pedidos {totalOrders > 0 && `(${totalOrders} total)`}
            </h3>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Cargando...
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando órdenes...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : orders.length > 0 ? (
          <>
            {/* Tabla para pantallas grandes */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orden
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrega
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.order_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.customer_type === 'guest' ? 'Invitado' : 'Registrado'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customer_phone}
                          </div>
                          {order.customer_email && (
                            <div className="text-sm text-gray-500">
                              {order.customer_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.delivery_location_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(order.delivery_date)} a las {formatTime(order.delivery_time)}
                          </div>
                          {order.delivery_address && (
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              {order.delivery_address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ${formatAmount(order.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.item_count} productos
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="preparing">En Preparación</option>
                            <option value="ready">Listo</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openWhatsApp(order)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => resendWhatsApp(order)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Reenviar WhatsApp"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setAdminNotes(order.admin_notes || '');
                              setShowStatusModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Cambiar estado"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openWhatsApp(order)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para móvil */}
            <div className="lg:hidden space-y-3 p-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        #{order.order_number}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.created_at)} • {order.customer_type === 'guest' ? 'Invitado' : 'Registrado'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{order.customer_name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{order.customer_phone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{order.delivery_location_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {formatDate(order.delivery_date)} a las {formatTime(order.delivery_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {order.item_count} productos • ${formatAmount(order.total_amount)}
                      </span>
                    </div>
                    
                    {/* Estado de WhatsApp */}
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getWhatsAppStatus(order).bgColor} ${getWhatsAppStatus(order).color}`}>
                        {getWhatsAppStatus(order).label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => openWhatsApp(order)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => resendWhatsApp(order)}
                      className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Reenviar WhatsApp"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 p-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p>No se encontraron órdenes</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => loadOrders(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => loadOrders(page)}
                className={`px-3 py-2 border rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => loadOrders(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de detalles de la orden */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowOrderDetails(false)} />
            <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Orden #{selectedOrder.order_number}
                  </h3>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Información del cliente */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Nombre</p>
                        <p className="font-medium">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Teléfono</p>
                        <p className="font-medium">{selectedOrder.customer_phone}</p>
                      </div>
                      {selectedOrder.customer_email && (
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-medium">{selectedOrder.customer_email}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-600">Tipo</p>
                        <p className="font-medium">
                          {selectedOrder.customer_type === 'guest' ? 'Invitado' : 'Registrado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información de entrega */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Información de Entrega</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Lugar</p>
                        <p className="font-medium">{selectedOrder.delivery_location_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha y Hora</p>
                        <p className="font-medium">
                          {formatDate(selectedOrder.delivery_date)} a las {formatTime(selectedOrder.delivery_time)}
                        </p>
                      </div>
                      {selectedOrder.delivery_address && (
                        <div className="sm:col-span-2">
                          <p className="text-gray-600">Dirección específica</p>
                          <p className="font-medium">{selectedOrder.delivery_address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Productos</h4>
                    <div className="space-y-2">
                      {/* Aquí se mostrarían los productos de la orden */}
                      <p className="text-sm text-gray-600">
                        {selectedOrder.item_count} productos • Total: ${formatAmount(selectedOrder.total_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Estado de WhatsApp */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Estado de WhatsApp</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getWhatsAppStatus(selectedOrder).bgColor} ${getWhatsAppStatus(selectedOrder).color}`}>
                          {getWhatsAppStatus(selectedOrder).label}
                        </span>
                      </div>
                      {selectedOrder.whatsapp_sent_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Enviado:</span>
                          <span className="text-sm text-gray-900">
                            {formatDate(selectedOrder.whatsapp_sent_at)}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openWhatsApp(selectedOrder)}
                          className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 inline mr-2" />
                          Enviar WhatsApp
                        </button>
                        <button
                          onClick={() => resendWhatsApp(selectedOrder)}
                          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 inline mr-2" />
                          Reenviar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  {(selectedOrder.notes || selectedOrder.admin_notes) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                      {selectedOrder.notes && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">Cliente:</p>
                          <p className="text-sm">{selectedOrder.notes}</p>
                        </div>
                      )}
                      {selectedOrder.admin_notes && (
                        <div>
                          <p className="text-sm text-gray-600">Administrador:</p>
                          <p className="text-sm">{selectedOrder.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar estado */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowStatusModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cambiar Estado de la Orden #{selectedOrder.order_number}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nuevo Estado
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="preparing">En Preparación</option>
                      <option value="ready">Listo</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas del Administrador (opcional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Notas adicionales..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={updateOrderStatus}
                    disabled={updatingStatus}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {updatingStatus ? 'Actualizando...' : 'Actualizar Estado'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 