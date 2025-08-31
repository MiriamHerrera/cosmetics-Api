'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, MapPin, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { useCart } from '@/hooks/useCart';
import { getImageUrl } from '@/lib/config';

interface CartItem {
  productId: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_url?: string;
  };
  quantity: number;
}

interface Cart {
  items: CartItem[];
  total: number;
}

interface DeliveryLocation {
  id: number;
  name: string;
  address: string;
  description: string;
}

interface DeliveryTimeSlot {
  time_slot: string;
  start_time: string;
  end_time: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  sessionId: string | null;
}

export default function CheckoutModal({ isOpen, onClose, cart, sessionId }: CheckoutModalProps) {
  const { user } = useAuth();
  const { sessionId: guestSessionId } = useGuestSession();
  
  // Hook para prevenir salida accidental durante el proceso de orden
  const { setOrderProcessing } = useBeforeUnload();
  
  // Hook para limpiar el carrito
  const { clearCart } = useCart();
  
  // Estados del formulario
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  
  // Estados de entrega
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Estados de la interfaz
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de datos
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [availableTimes, setAvailableTimes] = useState<DeliveryTimeSlot[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  
  // Determinar tipo de usuario y restricciones de fecha
  const isGuest = !user;
  const maxDaysAhead = isGuest ? 3 : 7;
  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + maxDaysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Cargar lugares de entrega al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadDeliveryLocations();
      // Pre-llenar información del usuario si está logueado
      if (user) {
        setCustomerInfo({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || ''
        });
      }
    }
  }, [isOpen, user]);

  // Cargar horarios disponibles cuando cambie la ubicación o fecha
  useEffect(() => {
    if (selectedLocation && selectedDate) {
      loadAvailableTimes(selectedLocation, selectedDate);
    }
  }, [selectedLocation, selectedDate]);

  // Cargar lugares de entrega
  const loadDeliveryLocations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/orders/delivery-locations`);
      if (response.ok) {
        const data = await response.json();
        setDeliveryLocations(data.data);
      }
    } catch (error) {
      console.error('Error cargando lugares de entrega:', error);
      setError('Error cargando lugares de entrega');
    }
  };

  // Cargar horarios disponibles
  const loadAvailableTimes = async (locationId: number, date: string) => {
    setIsLoadingTimes(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/orders/delivery-times?locationId=${locationId}&date=${date}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableTimes(data.data);
      }
    } catch (error) {
      console.error('Error cargando horarios:', error);
      setError('Error cargando horarios disponibles');
    } finally {
      setIsLoadingTimes(false);
    }
  };

  // Validar formulario
  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    if (!selectedLocation) {
      setError('Debes seleccionar un lugar de entrega');
      return false;
    }
    if (!selectedDate) {
      setError('Debes seleccionar una fecha de entrega');
      return false;
    }
    if (!selectedTime) {
      setError('Debes seleccionar un horario de entrega');
      return false;
    }
    return true;
  };

  // Enviar pedido
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const orderData = {
        customerType: isGuest ? 'guest' : 'registered',
        userId: user?.id || null,
        sessionId: isGuest ? guestSessionId : null,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email || null,
        deliveryLocationId: selectedLocation,
        deliveryDate: selectedDate,
        deliveryTime: selectedTime,
        deliveryAddress: deliveryAddress || null,
        totalAmount: cart?.total || 0,
        cartItems: cart?.items || [],
        notes: notes || null
      };

      // Determinar la URL correcta según el tipo de usuario
      const orderUrl = user ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/orders` : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/orders/guest`;
      
      const response = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user && { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` })
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        console.log('✅ [DEBUG] Respuesta exitosa del servidor');
        
        let result;
        try {
          result = await response.json();
          console.log('✅ [DEBUG] JSON parseado exitosamente:', result);
        } catch (parseError) {
          console.error('❌ [ERROR] Error al parsear JSON:', parseError);
          setError('Error al procesar la respuesta del servidor');
          return;
        }
        
        // Verificar que result.data existe
        if (!result || !result.data) {
          console.error('❌ [ERROR] Respuesta del servidor inválida:', result);
          setError('Respuesta del servidor inválida');
          return;
        }
        
        // Generar enlace de WhatsApp
        console.log('📝 [DEBUG] Verificando campos de WhatsApp...');
        console.log('📝 [DEBUG] result.data:', result.data);
        
        if (!result.data.whatsappMessage) {
          console.error('❌ [ERROR] whatsappMessage no está presente en la respuesta');
          setError('Mensaje de WhatsApp no disponible');
          return;
        }
        
        const whatsappMessage = encodeURIComponent(result.data.whatsappMessage);
        console.log('📝 [DEBUG] whatsappMessage codificado:', whatsappMessage);
        
        // Usar el número de WhatsApp del negocio desde las variables de entorno
        const businessWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
        console.log('📱 [DEBUG] businessWhatsAppNumber desde .env:', businessWhatsAppNumber);
        console.log('📱 [DEBUG] process.env:', process.env);
        
        if (!businessWhatsAppNumber) {
          console.error('❌ [ERROR] NEXT_PUBLIC_WHATSAPP_NUMBER no está definido en .env');
          setError('Error de configuración: número de WhatsApp no disponible');
          return;
        }
        
        // Formatear número del negocio para WhatsApp (eliminar espacios, guiones, paréntesis)
        const cleanBusinessPhone = businessWhatsAppNumber.replace(/[\s\-\(\)]/g, '');
        
        // Agregar código de país si no lo tiene (asumiendo México +52)
        const formattedBusinessPhone = cleanBusinessPhone.startsWith('52') ? cleanBusinessPhone : `52${cleanBusinessPhone}`;
        
        const whatsappUrl = `https://wa.me/${formattedBusinessPhone}?text=${whatsappMessage}`;
        
        console.log('📱 [DEBUG] WhatsApp URL generada:', {
          businessPhone: businessWhatsAppNumber,
          cleanBusinessPhone,
          formattedBusinessPhone,
          whatsappUrl,
          customerPhone: customerInfo.phone
        });
        
        // Marcar que se está procesando una orden para evitar el modal de confirmación
        setOrderProcessing(true);
        
        console.log('🚀 [DEBUG] Abriendo WhatsApp con URL:', whatsappUrl);
        
        try {
          // Abrir WhatsApp
          window.open(whatsappUrl, '_blank');
          console.log('✅ [DEBUG] WhatsApp abierto exitosamente');
        } catch (windowError) {
          console.error('❌ [ERROR] Error al abrir WhatsApp:', windowError);
          setError('Error al abrir WhatsApp');
          return;
        }
        
        // El carrito se limpia automáticamente en el backend al crear la orden
        // No es necesario limpiarlo manualmente aquí
        
        // Mostrar confirmación
        console.log('🎉 [DEBUG] Mostrando alert de confirmación');
        console.log('🎉 [DEBUG] Número de orden:', result.data.order?.order_number);
        
        try {
          alert(`¡Pedido #${result.data.order?.order_number || 'N/A'} creado exitosamente! 

✅ Tu carrito se ha limpiado automáticamente.
📱 Revisa tu WhatsApp para completar la compra.`);
          console.log('✅ [DEBUG] Alert mostrado exitosamente');
        } catch (alertError) {
          console.error('❌ [ERROR] Error al mostrar alert:', alertError);
        }
        
        // Cerrar modal
        console.log('🚪 [DEBUG] Cerrando modal');
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al crear el pedido');
      }
    } catch (error) {
      console.error('❌ [ERROR] Error en handleSubmit:', error);
      console.error('❌ [ERROR] Tipo de error:', typeof error);
      
      // Mostrar error más específico
      if (error instanceof Error) {
        console.error('❌ [ERROR] Mensaje de error:', error.message);
        console.error('❌ [ERROR] Stack trace:', error.stack);
        
        if (error.name === 'TypeError' && error.message.includes('JSON')) {
          setError('Error al procesar la respuesta del servidor');
        } else if (error.name === 'NetworkError') {
          setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
        } else {
          setError(`Error inesperado: ${error.message}`);
        }
      } else {
        console.error('❌ [ERROR] Error desconocido:', error);
        setError('Error de conexión. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navegar entre pasos
  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setError(null);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      setError(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  // Validar primer paso
  const validateStep1 = () => {
    if (!customerInfo.name.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      setError('El teléfono es requerido');
      return false;
    }
    return true;
  };

  // Validar segundo paso
  const validateStep2 = () => {
    if (!selectedLocation) {
      setError('Debes seleccionar un lugar de entrega');
      return false;
    }
    if (!selectedDate) {
      setError('Debes seleccionar una fecha de entrega');
      return false;
    }
    if (!selectedTime) {
      setError('Debes seleccionar un horario de entrega');
      return false;
    }
    return true;
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen || !cart) return null;

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
          relative w-full max-w-2xl bg-white rounded-lg shadow-xl
          transform transition-all duration-300 ease-in-out
          animate-in fade-in-0 zoom-in-95
          mx-2
        ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Finalizar Compra</h2>
              <p className="text-sm text-gray-600">
                Paso {currentStep} de 3: {
                  currentStep === 1 ? 'Información del Cliente' :
                  currentStep === 2 ? 'Lugar y Horario de Entrega' :
                  'Confirmación del Pedido'
                }
              </p>
            </div>
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
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            {/* Indicador de progreso */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${currentStep >= step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`
                        w-16 h-1 mx-2
                        ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Paso 1: Información del Cliente */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Cliente
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+52 123 456 7890"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            )}

            {/* Paso 2: Lugar y Horario de Entrega */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Lugar y Horario de Entrega
                </h3>
                
                {/* Lugar de entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugar de entrega *
                  </label>
                  <select
                    value={selectedLocation || ''}
                    onChange={(e) => setSelectedLocation(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un lugar</option>
                    {deliveryLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                  {selectedLocation && (
                    <p className="mt-1 text-sm text-gray-600">
                      {deliveryLocations.find(l => l.id === selectedLocation)?.description}
                    </p>
                  )}
                </div>

                {/* Fecha de entrega */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de entrega *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={minDate}
                      max={maxDate}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {isGuest 
                      ? 'Usuarios invitados: reserva de máximo 3 días posteriores'
                      : 'Usuarios registrados: reserva de hasta 7 días posteriores'
                    }
                  </p>
                </div>

                {/* Horario de entrega */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horario de entrega *
                    </label>
                    {isLoadingTimes ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Cargando horarios...</span>
                      </div>
                    ) : availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableTimes.map((timeSlot, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedTime(timeSlot.time_slot)}
                            className={`
                              p-2 text-sm font-medium rounded-lg border transition-colors
                              ${selectedTime === timeSlot.time_slot
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            {timeSlot.time_slot}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No hay horarios disponibles para la fecha seleccionada
                      </p>
                    )}
                  </div>
                )}

                {/* Dirección específica */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección específica (opcional)
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detalles adicionales de ubicación..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Paso 3: Confirmación del Pedido */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Confirmación del Pedido
                </h3>
                
                {/* Resumen del pedido */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Resumen del pedido</h4>
                  
                  {/* Información del cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-medium text-gray-900">{customerInfo.name}</p>
                      <p className="text-sm text-gray-700">{customerInfo.phone}</p>
                      {customerInfo.email && (
                        <p className="text-sm text-gray-600">{customerInfo.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Entrega</p>
                      <p className="font-medium text-gray-900">
                        {deliveryLocations.find(l => l.id === selectedLocation)?.name}
                      </p>
                      <p className="text-sm text-gray-700">
                        {formatDate(selectedDate)} a las {selectedTime}
                      </p>
                      {deliveryAddress && (
                        <p className="text-sm text-gray-600">{deliveryAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Productos</h5>
                    <div className="space-y-2">
                      {cart.items.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {item.product.image_url ? (
                              <img 
                                src={getImageUrl(item.product.image_url)}
                                alt={item.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">IMG</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm text-gray-700">{item.product.name}</p>
                              <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-medium text-gray-800">${(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">${cart.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notas adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Instrucciones especiales, comentarios..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }
                `}
              >
                Anterior
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    px-6 py-2 bg-green-600 text-white rounded-lg font-medium 
                    hover:bg-green-700 transition-colors disabled:opacity-50
                    flex items-center gap-2
                  "
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Enviar Pedido por WhatsApp
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 