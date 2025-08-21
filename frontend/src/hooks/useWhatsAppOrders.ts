import { useState, useEffect } from 'react';

export interface WhatsAppOrder {
  id: string;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  cartItems: any[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: Date;
  whatsappSent: boolean;
}

export const useWhatsAppOrders = () => {
  const [orders, setOrders] = useState<WhatsAppOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar pedidos desde localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('whatsapp_orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt)
        })));
      } catch (error) {
        console.error('Error cargando pedidos:', error);
      }
    }
  }, []);

  // Guardar pedidos en localStorage
  const saveOrders = (newOrders: WhatsAppOrder[]) => {
    localStorage.setItem('whatsapp_orders', JSON.stringify(newOrders));
    setOrders(newOrders);
  };

  // Agregar nuevo pedido
  const addOrder = (order: Omit<WhatsAppOrder, 'id' | 'createdAt' | 'status'>) => {
    const newOrder: WhatsAppOrder = {
      ...order,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'pending'
    };

    const updatedOrders = [newOrder, ...orders];
    saveOrders(updatedOrders);
    return newOrder;
  };

  // Actualizar estado del pedido
  const updateOrderStatus = (orderId: string, newStatus: WhatsAppOrder['status']) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    );
    saveOrders(updatedOrders);
  };

  // Obtener pedidos por estado
  const getOrdersByStatus = (status: WhatsAppOrder['status']) => {
    return orders.filter(order => order.status === status);
  };

  // Obtener pedidos pendientes
  const getPendingOrders = () => getOrdersByStatus('pending');
  
  // Obtener pedidos confirmados
  const getConfirmedOrders = () => getOrdersByStatus('confirmed');
  
  // Obtener pedidos en preparación
  const getPreparingOrders = () => getOrdersByStatus('preparing');
  
  // Obtener pedidos listos
  const getReadyOrders = () => getOrdersByStatus('ready');
  
  // Obtener pedidos entregados
  const getDeliveredOrders = () => getOrdersByStatus('delivered');
  
  // Obtener pedidos cancelados
  const getCancelledOrders = () => getOrdersByStatus('cancelled');

  // Estadísticas
  const getStats = () => {
    const total = orders.length;
    const pending = getPendingOrders().length;
    const confirmed = getConfirmedOrders().length;
    const preparing = getPreparingOrders().length;
    const ready = getReadyOrders().length;
    const delivered = getDeliveredOrders().length;
    const cancelled = getCancelledOrders().length;

    return {
      total,
      pending,
      confirmed,
      preparing,
      ready,
      delivered,
      cancelled
    };
  };

  // Limpiar pedidos antiguos (más de 30 días)
  const cleanupOldOrders = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredOrders = orders.filter(order => 
      order.createdAt > thirtyDaysAgo
    );
    
    if (filteredOrders.length !== orders.length) {
      saveOrders(filteredOrders);
    }
  };

  // Ejecutar limpieza automáticamente
  useEffect(() => {
    cleanupOldOrders();
  }, []);

  return {
    orders,
    isLoading,
    addOrder,
    updateOrderStatus,
    getOrdersByStatus,
    getPendingOrders,
    getConfirmedOrders,
    getPreparingOrders,
    getReadyOrders,
    getDeliveredOrders,
    getCancelledOrders,
    getStats,
    cleanupOldOrders
  };
}; 