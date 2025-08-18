// backend/src/controllers/guestCheckoutController.js
class GuestCheckoutController {
    // Generar mensaje de WhatsApp
    generateWhatsAppMessage = (cartItems, customerInfo, total) => {
      const message = `🛒 *NUEVO PEDIDO - MODO INVITADO*
  
  👤 *Cliente:* ${customerInfo.name}
  📱 *Teléfono:* ${customerInfo.phone}
  📍 *Dirección:* ${customerInfo.address}
  
  📦 *Productos:*
  ${cartItems.map(item => 
    `• ${item.product.name} x${item.quantity} - $${item.product.price * item.quantity}`
  ).join('\n')}
  
  💰 *Total:* $${total}
  
  ⏰ *Fecha:* ${new Date().toLocaleString()}
  🆔 *Session:* ${customerInfo.sessionId}
  
  _Pedido generado desde la web en modo invitado_`;
  
      return message;
    };
  
    // Marcar pedido como pendiente (NO restaurar stock)
    markOrderAsPending = async (sessionId, customerInfo, whatsappMessage, cartItems, total) => {
      try {
        // Crear la orden principal
        const [orderResult] = await query(`
          INSERT INTO orders (
            customer_type,
            session_id,
            customer_name,
            customer_phone,
            customer_address,
            total_amount,
            status,
            whatsapp_message,
            whatsapp_sent_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
        `, [
          'guest',           // customer_type
          sessionId,         // session_id
          customerInfo.name, // customer_name
          customerInfo.phone,// customer_phone
          customerInfo.address, // customer_address
          total,             // total_amount
          whatsappMessage    // whatsapp_message
        ]);

        const orderId = orderResult.insertId;
        console.log(`📋 Orden creada con ID: ${orderId}`);

        // Crear los items de la orden
        for (const item of cartItems) {
          await query(`
            INSERT INTO order_items (
              order_id, 
              product_id, 
              product_name, 
              product_price, 
              quantity, 
              subtotal
            ) VALUES (?, ?, ?, ?, ?, ?)
          `, [
            orderId,
            item.product.id,
            item.product.name,
            item.product.price,
            item.quantity,
            item.product.price * item.quantity
          ]);
        }

        console.log(` ${cartItems.length} items agregados a la orden ${orderId}`);
        console.log('✅ Pedido marcado como PENDIENTE - Stock permanece reservado');
        
        return orderId;
        
      } catch (error) {
        console.error('Error marcando pedido como pendiente:', error);
        throw error;
      }
    };

    // Enviar pedido por WhatsApp
    sendOrderByWhatsApp = async (req, res) => {
      try {
        const { sessionId, customerInfo } = req.body;
        
        // Obtener carrito del invitado
        const cart = await this.getGuestCart(sessionId);
        
        // Generar mensaje
        const message = this.generateWhatsAppMessage(
          cart.items, 
          customerInfo, 
          cart.total
        );
        
        // Enviar por WhatsApp
        const whatsappResult = await this.sendWhatsAppMessage(message);
        
        // ✅ IMPORTANTE: NO limpiar carrito, solo marcar como "PENDIENTE"
        const orderId = await this.markOrderAsPending(
          sessionId, 
          customerInfo, 
          message, 
          cart.items, 
          cart.total
        );
        
        res.json({
          success: true,
          message: 'Pedido enviado por WhatsApp exitosamente',
          data: {
            orderId,
            whatsappSent: true,
            orderDetails: message,
            orderStatus: 'pending'
          }
        });
        
      } catch (error) {
        console.error('Error enviando pedido por WhatsApp:', error);
        res.status(500).json({
          success: false,
          message: 'Error enviando pedido'
        });
      }
    };
  }