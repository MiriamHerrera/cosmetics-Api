// frontend/src/components/ui/GuestCheckoutModal.tsx
export default function GuestCheckoutModal({ isOpen, onClose, cart, sessionId }) {
    const [customerInfo, setCustomerInfo] = useState({
      name: '',
      phone: '',
      address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    const handleSubmit = async (e) => {
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
  
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Finalizar Compra</h2>
          
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
      </Modal>
    );
  }