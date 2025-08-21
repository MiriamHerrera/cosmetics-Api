'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { Cart, CartItem } from '@/types';
import { useCart } from '@/hooks/useCart';
import { config, generateWhatsAppLink } from '@/lib/config';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

interface DeliveryLocation {
  id: number;
  name: string;
  address: string;
  description: string;
}

interface DeliveryTime {
  time_slot: string;
  start_time: string;
  end_time: string;
}

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  sessionId: string | null;
}

export default function GuestCheckoutModal({ isOpen, onClose, cart, sessionId }: GuestCheckoutModalProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: ''
  });
  const [deliveryLocation, setDeliveryLocation] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para las opciones de entrega
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [availableTimes, setAvailableTimes] = useState<DeliveryTime[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar lugares de entrega disponibles
  useEffect(() => {
    if (isOpen) {
      loadDeliveryLocations();
    }
  }, [isOpen]);

  // Cargar horarios disponibles cuando cambie la fecha y lugar
  useEffect(() => {
    if (deliveryLocation && deliveryDate) {
      loadAvailableTimes();
    }
  }, [deliveryLocation, deliveryDate]);

  const loadDeliveryLocations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/orders/delivery-locations');
      if (response.ok) {
        const data = await response.json();
        setDeliveryLocations(data.data);
      }
    } catch (error) {
      console.error('Error cargando lugares de entrega:', error);
    }
  };

  const loadAvailableTimes = async () => {
    if (!deliveryLocation || !deliveryDate) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/orders/delivery-times?locationId=${deliveryLocation}&date=${deliveryDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableTimes(data.data);
      }
    } catch (error) {
      console.error('Error cargando horarios disponibles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (!deliveryLocation || !deliveryDate || !deliveryTime) {
      setError('Por favor selecciona lugar, fecha y hora de entrega');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderData = {
        sessionId,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email || null,
        deliveryLocationId: deliveryLocation,
        deliveryDate,
        deliveryTime,
        deliveryAddress: null, // Ya no se solicita dirección personalizada
        totalAmount: cart?.total || 0,
        cartItems: cart?.items || [],
        notes: notes || null
      };

      const response = await fetch('http://localhost:8000/api/orders/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Generar enlace de WhatsApp
        const whatsappMessage = encodeURIComponent(result.data.whatsappMessage);
        const whatsappUrl = generateWhatsAppLink(result.data.whatsappMessage);
        
        console.log('📱 Enlace de WhatsApp generado:', whatsappUrl);
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Mostrar confirmación
        alert(`¡Pedido #${result.data.orderNumber} creado exitosamente! 

Se abrirá WhatsApp automáticamente para que puedas confirmar tu pedido.

📱 Número de WhatsApp: ${config.whatsappNumber}
📋 Número de Pedido: ${result.data.orderNumber}
💰 Total: $${cart?.total?.toFixed(2)}

Si WhatsApp no se abre automáticamente, puedes contactarnos directamente al ${config.whatsappNumber}`);
        
        // Cerrar modal
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al crear el pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generar fecha mínima (hoy) y máxima (3 días desde hoy)
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 3);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay de fondo oscuro */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal centrado */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="
          relative w-full max-w-lg bg-white rounded-lg shadow-xl
          transform transition-all duration-300 ease-in-out
          animate-in fade-in-0 zoom-in-95
          mx-2
        ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Finalizar Compra</h2>
            <button
              onClick={onClose}
              className="
                p-2 text-gray-400 hover:text-gray-600
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full
              "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-4 sm:p-6">
            {/* Resumen del carrito */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-800">Resumen del Pedido:</h3>
              {cart?.items.map(item => (
                <div key={item.productId} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700">{item.product.name} x{item.quantity}</span>
                  <span className="font-medium text-gray-700">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 font-bold text-lg">
                <span className='text-gray-900'>Total: ${cart?.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Formulario del cliente */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Información del cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="tel"
                  placeholder="Teléfono *"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <input
                type="email"
                placeholder="Email (opcional)"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Opciones de entrega */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Opciones de Entrega
                </h4>
                
                <select
                  value={deliveryLocation || ''}
                  onChange={(e) => setDeliveryLocation(Number(e.target.value) || null)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona lugar de entrega *</option>
                  {deliveryLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.address}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Fecha de entrega *
                    </label>
                    <input
                      type="date"
                      min={today}
                      max={maxDateStr}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora de entrega *
                    </label>
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      required
                      disabled={!deliveryDate || !deliveryLocation || loading}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loading ? 'Cargando...' : !deliveryDate || !deliveryLocation ? 'Selecciona fecha y lugar primero' : 'Selecciona hora'}
                      </option>
                      {availableTimes.map(time => (
                        <option key={time.time_slot} value={time.time_slot}>
                          {time.time_slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <textarea
                placeholder="Notas adicionales (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
              />

              {/* Mensaje de error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    📱 Enviar Pedido por WhatsApp
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}