'use client';

import { useState } from 'react';
import { X, MessageCircle, User, Phone, MapPin } from 'lucide-react';
import { generateWhatsAppLink, generateOrderMessage } from '@/lib/config';
import { useWhatsAppOrders } from '@/hooks/useWhatsAppOrders';

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  cartTotal: number;
  onOrderSent?: () => void;
}

export default function WhatsAppOrderModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  cartTotal, 
  onOrderSent 
}: WhatsAppOrderModalProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addOrder } = useWhatsAppOrders();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generar mensaje del pedido
      const message = generateOrderMessage(cartItems, cartTotal, customerInfo);
      
      // Guardar el pedido en el sistema
      const newOrder = addOrder({
        customerInfo,
        cartItems,
        total: cartTotal,
        whatsappSent: true
      });
      
      // Generar enlace de WhatsApp
      const whatsappUrl = generateWhatsAppLink(message);
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Mostrar confirmación
      alert(`¡Pedido #${newOrder.id} enviado por WhatsApp! Revisa tu WhatsApp para completar la compra.`);
      
      // Notificar que el pedido fue enviado (esto vaciará el carrito y cerrará el modal)
      if (onOrderSent) {
        onOrderSent();
      }
      
    } catch (error) {
      console.error('Error enviando pedido:', error);
      alert('Error al enviar el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          relative w-full max-w-md bg-white rounded-lg shadow-xl
          transform transition-all duration-300 ease-in-out
          animate-in fade-in-0 zoom-in-95
          mx-2 whatsapp-modal
        ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Finalizar Compra</h2>
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
          <div className="p-4 sm:p-6">
            {/* Resumen del carrito */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3 text-gray-900">Resumen del Pedido:</h3>
              <div className="space-y-2">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario del cliente */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Nombre completo
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={customerInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  style={{ color: '#8b008b' }}
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  style={{ color: '#8b008b' }}
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  Dirección de envío
                </label>
                <textarea
                  placeholder="Tu dirección completa para la entrega"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                  style={{ color: '#8b008b' }}
                />
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
                  text-white font-bold py-4 px-6 rounded-lg
                  transition-all duration-300
                  flex items-center justify-center gap-3
                  focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
                  transform hover:scale-105 shadow-lg hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                "
              >
                <MessageCircle className="w-5 h-5" />
                {isSubmitting ? 'Enviando...' : 'Enviar Pedido por WhatsApp'}
              </button>
            </form>

            {/* Información adicional */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>¿Cómo funciona?</strong><br/>
                1. Completa tus datos y haz clic en "Enviar Pedido"<br/>
                2. Se abrirá WhatsApp con tu pedido pre-llenado<br/>
                3. Revisa el mensaje y envíalo<br/>
                4. Te contactaremos para confirmar y coordinar la entrega
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 