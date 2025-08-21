'use client';

import { useState } from 'react';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { useWhatsAppOrders, WhatsAppOrder } from '@/hooks/useWhatsAppOrders';

const statusConfig = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  confirmed: {
    label: 'Confirmado',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  preparing: {
    label: 'En Preparación',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  ready: {
    label: 'Listo',
    icon: Package,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  },
  delivered: {
    label: 'Entregado',
    icon: Truck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  }
};

export default function WhatsAppOrdersSection() {
  const { 
    orders, 
    updateOrderStatus, 
    getStats 
  } = useWhatsAppOrders();
  
  const [selectedOrder, setSelectedOrder] = useState<WhatsAppOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const stats = getStats();

  const handleStatusChange = (orderId: string, newStatus: WhatsAppOrder['status']) => {
    updateOrderStatus(orderId, newStatus);
  };

  const openOrderDetails = (order: WhatsAppOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pedidos WhatsApp</h2>
            <p className="text-gray-600">Gestiona los pedidos enviados por WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">En Preparación</p>
              <p className="text-2xl font-bold text-purple-600">{stats.preparing}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Entregados</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pedidos Recientes</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay pedidos aún</p>
              <p className="text-gray-400 text-sm">Los pedidos enviados por WhatsApp aparecerán aquí</p>
            </div>
          ) : (
            orders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;
              
              return (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${status.bgColor} ${status.borderColor} border`}>
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">
                            Pedido #{order.id}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mt-1">
                          <p><strong>{order.customerInfo.name}</strong> • {order.customerInfo.phone}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(order.createdAt)} • {order.cartItems.length} productos • ${order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as WhatsAppOrder['status'])}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="preparing">En Preparación</option>
                        <option value="ready">Listo</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de detalles del pedido */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeOrderDetails} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalles del Pedido #{selectedOrder.id}
                </h3>
                <button
                  onClick={closeOrderDetails}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Información del cliente */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Información del Cliente</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Nombre:</strong> {selectedOrder.customerInfo.name}</p>
                    <p><strong>Teléfono:</strong> {selectedOrder.customerInfo.phone}</p>
                    <p><strong>Dirección:</strong> {selectedOrder.customerInfo.address}</p>
                  </div>
                </div>
                
                {/* Productos */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Productos</h4>
                  <div className="space-y-3">
                    {selectedOrder.cartItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.quantity} x ${item.product.price}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${(item.quantity * item.product.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Total y estado */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      Total: ${selectedOrder.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Fecha: {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estado actual:</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      statusConfig[selectedOrder.status].bgColor
                    } ${
                      statusConfig[selectedOrder.status].color
                    }`}>
                      {statusConfig[selectedOrder.status].label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 