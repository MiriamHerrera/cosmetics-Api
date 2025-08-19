'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CartItem {
  id: string;
  product: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface Cart {
  items: CartItem[];
  total: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
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
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/guest-cart/checkout/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerInfo
        })
      });
      
      if (response.ok) {
        // Mostrar confirmación
        alert('¡Pedido enviado por WhatsApp exitosamente!');
        onClose();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          relative w-full max-w-md bg-white rounded-lg shadow-xl
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
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Resumen del Pedido:</h3>
              {cart?.items.map(item => (
                <div key={item.id} className="flex justify-between py-1">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>${item.product.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 font-bold">
                <span>Total: ${cart?.total}</span>
              </div>
            </div>

            {/* Formulario del cliente */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre completo"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
              
              <input
                type="tel"
                placeholder="Teléfono"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                required
                className="w-full p-2 border rounded"
              />
              
              <textarea
                placeholder="Dirección de envío"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                required
                className="w-full p-2 border rounded h-20"
              />
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white p-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : '📱 Enviar Pedido por WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}