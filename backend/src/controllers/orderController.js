const { query, getConnection } = require('../config/database');
const whatsappConfig = require('../config/whatsapp');

class OrderController {
  // Obtener lugares de entrega disponibles
  getDeliveryLocations = async (req, res) => {
    try {
      const locations = await query(`
        SELECT 
          id, 
          name, 
          address, 
          description,
          is_active
        FROM delivery_locations 
        WHERE is_active = TRUE
        ORDER BY name
      `);

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Error obteniendo lugares de entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Obtener horarios disponibles para un lugar y fecha específicos
  getAvailableDeliveryTimes = async (req, res) => {
    try {
      const { locationId, date } = req.query;
      
      if (!locationId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere locationId y date'
        });
      }

      // Obtener el día de la semana (0=Domingo, 1=Lunes, etc.)
      const dayOfWeek = new Date(date).getDay();
      
      // Obtener horarios disponibles para ese lugar y día
      const timeSlots = await query(`
        SELECT 
          dts.time_slot,
          ds.start_time,
          ds.end_time
        FROM delivery_time_slots dts
        INNER JOIN delivery_schedules ds ON dts.location_id = ds.location_id 
          AND dts.day_of_week = ds.day_of_week
        WHERE dts.location_id = ? 
          AND dts.day_of_week = ?
          AND dts.is_active = TRUE
          AND ds.is_active = TRUE
        ORDER BY dts.time_slot
      `, [locationId, dayOfWeek]);

      // Si no hay horarios específicos, usar el rango general
      if (timeSlots.length === 0) {
        const generalSchedule = await query(`
          SELECT start_time, end_time
          FROM delivery_schedules
          WHERE location_id = ? 
            AND day_of_week = ?
            AND is_active = TRUE
        `, [locationId, dayOfWeek]);

        if (generalSchedule.length > 0) {
          const { start_time, end_time } = generalSchedule[0];
          // Generar horarios cada 30 minutos
          const times = [];
          let currentTime = new Date(`2000-01-01 ${start_time}`);
          const endTime = new Date(`2000-01-01 ${end_time}`);
          
          while (currentTime <= endTime) {
            times.push({
              time_slot: currentTime.toTimeString().slice(0, 5),
              start_time: start_time,
              end_time: end_time
            });
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }
          
          return res.json({
            success: true,
            data: times,
            flexible: true
          });
        }
      }

      res.json({
        success: true,
        data: timeSlots,
        flexible: false
      });
    } catch (error) {
      console.error('Error obteniendo horarios disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Crear nueva orden
  createOrder = async (req, res) => {
    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        customerType,
        userId,
        sessionId,
        customerName,
        customerPhone,
        customerEmail,
        deliveryLocationId,
        deliveryDate,
        deliveryTime,
        deliveryAddress,
        totalAmount,
        cartItems,
        notes
      } = req.body;

      // Validar datos requeridos
      if (!customerType || !customerName || !customerPhone || !deliveryLocationId || 
          !deliveryDate || !deliveryTime || !totalAmount || !cartItems || cartItems.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos'
        });
      }

      // Validar fecha de entrega según tipo de usuario
      const today = new Date();
      const deliveryDateObj = new Date(deliveryDate);
      const daysDiff = Math.ceil((deliveryDateObj - today) / (1000 * 60 * 60 * 24));
      
      if (customerType === 'guest' && (daysDiff < 0 || daysDiff > 3)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Los usuarios invitados solo pueden elegir fechas de hoy hasta 3 días posteriores'
        });
      }
      
      if (customerType === 'registered' && (daysDiff < 0 || daysDiff > 7)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Los usuarios registrados pueden elegir fechas de hoy hasta 7 días posteriores'
        });
      }

      // Generar número de orden único
      const [orderNumberResult] = await connection.execute('CALL GenerateOrderNumber(?)', ['']);
      const orderNumber = orderNumberResult[0][0].orderNumber;

      // Crear la orden
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          order_number,
          customer_type,
          user_id,
          session_id,
          customer_name,
          customer_phone,
          customer_email,
          delivery_location_id,
          delivery_date,
          delivery_time,
          delivery_address,
          total_amount,
          notes,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        orderNumber,
        customerType,
        userId || null,
        sessionId || null,
        customerName,
        customerPhone,
        customerEmail || null,
        deliveryLocationId,
        deliveryDate,
        deliveryTime,
        deliveryAddress || null,
        totalAmount,
        notes || null
      ]);

      const orderId = orderResult.insertId;

      // Crear los items de la orden y recolectar información para WhatsApp
      const productsForWhatsApp = [];
      
      for (const item of cartItems) {
        // Obtener información del producto desde la base de datos
        const [product] = await connection.execute(`
          SELECT id, name, price FROM products WHERE id = ?
        `, [item.productId]);

        if (!product) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }

        // Guardar información para WhatsApp
        productsForWhatsApp.push({
          product: {
            name: product.name,
            price: product.price
          },
          quantity: item.quantity
        });

        await connection.execute(`
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
          product.id,
          product.name,
          product.price,
          item.quantity,
          product.price * item.quantity
        ]);
      }

      // Generar mensaje de WhatsApp
      const whatsappMessage = this.generateWhatsAppMessage(orderNumber, customerName, productsForWhatsApp, totalAmount, deliveryDate, deliveryTime);

      // Actualizar orden con mensaje de WhatsApp
      await connection.execute(`
        UPDATE orders 
        SET whatsapp_message = ?, whatsapp_sent_at = NOW()
        WHERE id = ?
      `, [whatsappMessage, orderId]);

      await connection.commit();

      // Obtener la orden creada con detalles
      const [orderDetails] = await query(`
        SELECT * FROM orders_with_details WHERE id = ?
      `, [orderId]);

      res.json({
        success: true,
        message: 'Orden creada exitosamente',
        data: {
          order: orderDetails[0],
          whatsappMessage
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error creando orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    } finally {
      connection.release();
    }
  };

  // Crear orden para invitados (sin autenticación)
  createGuestOrder = async (req, res) => {
    const connection = await getConnection();
    let orderNumber; // Declarar la variable aquí para que esté disponible en todo el método
    
    try {
      console.log('🚀 Iniciando creación de orden para invitado');
      console.log('📋 Datos recibidos:', JSON.stringify(req.body, null, 2));
      
      await connection.beginTransaction();
      
      const {
        sessionId,
        customerName,
        customerPhone,
        customerEmail,
        deliveryLocationId,
        deliveryDate,
        deliveryTime,
        deliveryAddress,
        totalAmount,
        cartItems,
        notes
      } = req.body;

      console.log('🔍 Validando datos requeridos...');
      
      // Validar datos requeridos
      if (!sessionId || !customerName || !customerPhone || !deliveryLocationId || 
          !deliveryDate || !deliveryTime || !totalAmount || !cartItems || cartItems.length === 0) {
        console.log('❌ Datos requeridos faltantes:', {
          sessionId: !!sessionId,
          customerName: !!customerName,
          customerPhone: !!customerPhone,
          deliveryLocationId: !!deliveryLocationId,
          deliveryDate: !!deliveryDate,
          deliveryTime: !!deliveryTime,
          totalAmount: !!totalAmount,
          cartItems: !!cartItems,
          cartItemsLength: cartItems?.length
        });
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos'
        });
      }

      console.log('✅ Datos requeridos validados correctamente');
      
      // Validar número de WhatsApp
      if (!whatsappConfig.validateNumber(whatsappConfig.number)) {
        console.log('❌ Número de WhatsApp inválido:', whatsappConfig.number);
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'Error de configuración: Número de WhatsApp inválido'
        });
      }
      
      console.log('✅ Número de WhatsApp válido:', whatsappConfig.number);

      console.log('🛒 Estructura del carrito recibido:');
      console.log('  - cartItems:', JSON.stringify(cartItems, null, 2));
      console.log('  - Tipo de cartItems:', typeof cartItems);
      console.log('  - Es array:', Array.isArray(cartItems));
      if (Array.isArray(cartItems)) {
        console.log('  - Longitud del array:', cartItems.length);
        cartItems.forEach((item, index) => {
          console.log(`    Item ${index}:`, {
            productId: item.productId,
            quantity: item.quantity,
            hasProduct: !!item.product,
            productKeys: item.product ? Object.keys(item.product) : 'No product'
          });
        });
      }

      // Validar fecha de entrega para invitados (hoy hasta 3 días posteriores)
      const today = new Date();
      const deliveryDateObj = new Date(deliveryDate);
      const daysDiff = Math.ceil((deliveryDateObj - today) / (1000 * 60 * 60 * 24));
      
      console.log('📅 Validando fecha de entrega:', {
        today: today.toISOString(),
        deliveryDate: deliveryDate,
        daysDiff: daysDiff
      });
      
      if (daysDiff < 0 || daysDiff > 3) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Los usuarios invitados solo pueden elegir fechas de hoy hasta 3 días posteriores'
        });
      }

      console.log('✅ Fecha de entrega válida');

      // Verificar que el carrito de invitado existe y tiene items
      console.log('🔍 Verificando carrito de invitado para sessionId:', sessionId);
      const [guestCart] = await connection.execute(`
        SELECT id FROM guest_carts WHERE session_id = ? AND status = 'active'
      `, [sessionId]);

      console.log('📦 Resultado de verificación de carrito:', guestCart);

      if (!guestCart) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Carrito de invitado no encontrado o expirado'
        });
      }

      console.log('✅ Carrito de invitado verificado');

      // Generar número de orden único
      console.log('🔢 Generando número de orden...');
      try {
        // Llamar al procedimiento almacenado
        await connection.execute('CALL GenerateOrderNumber(@orderNumber)');
        
        // Obtener el resultado de la variable de salida usando query
        const orderNumberResult = await connection.query('SELECT @orderNumber as orderNumber');
        console.log('🔍 Resultado del procedimiento:', orderNumberResult);
        
        // Extraer el número de orden del resultado
        orderNumber = orderNumberResult[0][0].orderNumber;
        
        console.log('✅ Número de orden generado:', orderNumber);
        
        if (!orderNumber) {
          throw new Error('No se pudo generar el número de orden');
        }
      } catch (error) {
        console.error('❌ Error generando número de orden:', error);
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'Error generando número de orden'
        });
      }

      // Crear la orden
      console.log('📝 Creando orden en base de datos...');
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          order_number,
          customer_type,
          user_id,
          session_id,
          customer_name,
          customer_phone,
          customer_email,
          delivery_location_id,
          delivery_date,
          delivery_time,
          delivery_address,
          total_amount,
          notes,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        orderNumber,
        'guest',
        null,
        sessionId,
        customerName,
        customerPhone,
        customerEmail || null,
        deliveryLocationId,
        deliveryDate,
        deliveryTime,
        deliveryAddress || null,
        totalAmount,
        notes || null
      ]);

      const orderId = orderResult.insertId;
      console.log('✅ Orden creada con ID:', orderId);

      // Crear los items de la orden y recolectar información para WhatsApp
      const productsForWhatsApp = [];
      
      console.log('🛒 Procesando items del carrito:', cartItems);
      
      for (const item of cartItems) {
        console.log('📦 Procesando item:', item);
        
        // El frontend envía { productId, quantity, product } pero solo necesitamos productId y quantity
        const productId = item.productId;
        const quantity = item.quantity;
        
        if (!productId || !quantity) {
          console.log('❌ Item inválido:', item);
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Item inválido: productId=${productId}, quantity=${quantity}`
          });
        }
        
        // Obtener información del producto desde la base de datos
        const productResult = await connection.execute(`
          SELECT id, name, price FROM products WHERE id = ?
        `, [productId]);

        console.log('🔍 Producto encontrado:', productResult);

        // Extraer el producto del resultado (connection.execute devuelve [rows, fields])
        const product = productResult[0][0];
        
        if (!product) {
          console.log('❌ Producto no encontrado para ID:', productId);
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Producto con ID ${productId} no encontrado`
          });
        }

        console.log('✅ Producto extraído correctamente:', product);

        // Guardar información para WhatsApp
        productsForWhatsApp.push({
          product: {
            name: product.name,
            price: product.price
          },
          quantity: quantity
        });

        console.log('💾 Guardando item de orden...');
        await connection.execute(`
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
          product.id,
          product.name,
          product.price,
          quantity,
          product.price * quantity
        ]);
        
        console.log('✅ Item de orden guardado');
      }

      console.log('📱 Generando mensaje de WhatsApp...');
      // Generar mensaje de WhatsApp
      const whatsappMessage = this.generateWhatsAppMessage(orderNumber, customerName, productsForWhatsApp, totalAmount, deliveryDate, deliveryTime);

      console.log('💬 Mensaje de WhatsApp generado:', whatsappMessage);

      // Actualizar orden con mensaje de WhatsApp
      await connection.execute(`
        UPDATE orders 
        SET whatsapp_message = ?, whatsapp_sent_at = NOW()
        WHERE id = ?
      `, [whatsappMessage, orderId]);

      console.log('✅ Mensaje de WhatsApp guardado en la orden');

      // Marcar carrito de invitado como procesado
      await connection.execute(`
        UPDATE guest_carts 
        SET status = 'processed', updated_at = NOW()
        WHERE session_id = ?
      `, [sessionId]);

      console.log('✅ Carrito de invitado marcado como procesado');

      await connection.commit();
      console.log('✅ Transacción confirmada');

      // Obtener la orden creada con detalles
      const [orderDetails] = await query(`
        SELECT 
          o.*,
          dl.name as delivery_location_name,
          dl.address as delivery_location_address
        FROM orders o
        LEFT JOIN delivery_locations dl ON o.delivery_location_id = dl.id
        WHERE o.id = ?
      `, [orderId]);

      console.log('🎉 Orden completada exitosamente');

      res.json({
        success: true,
        message: 'Orden creada exitosamente',
        data: {
          order: orderDetails,
          whatsappMessage,
          orderNumber
        }
      });

    } catch (error) {
      console.error('💥 Error creando orden de invitado:', error);
      console.error('📋 Stack trace:', error.stack);
      await connection.rollback();
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    } finally {
      connection.release();
    }
  };

  // Obtener órdenes del usuario
  getUserOrders = async (req, res) => {
    try {
      const userId = req.user.id;
      
      const orders = await query(`
        SELECT * FROM orders_with_details 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `, [userId]);

      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error obteniendo órdenes del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Obtener orden por ID
  getOrderById = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const [order] = await query(`
        SELECT * FROM orders_with_details WHERE id = ?
      `, [id]);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      // Verificar que el usuario solo vea sus propias órdenes
      if (order.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta orden'
        });
      }

      // Obtener items de la orden
      const orderItems = await query(`
        SELECT 
          oi.*,
          p.image_url,
          p.description
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `, [id]);

      res.json({
        success: true,
        data: {
          order: { ...order, items: orderItems }
        }
      });
    } catch (error) {
      console.error('Error obteniendo orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Obtener todas las órdenes (admin)
  getAllOrders = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        customerType, 
        locationId,
        startDate,
        endDate,
        search
      } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (status) {
        whereClause += ' AND o.status = ?';
        params.push(status);
      }

      if (customerType) {
        whereClause += ' AND o.customer_type = ?';
        params.push(customerType);
      }

      if (locationId) {
        whereClause += ' AND o.delivery_location_id = ?';
        params.push(locationId);
      }

      if (startDate) {
        whereClause += ' AND o.delivery_date >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND o.delivery_date <= ?';
        params.push(endDate);
      }

      if (search) {
        whereClause += ' AND (o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.order_number LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Contar total de órdenes
      const [countResult] = await query(`
        SELECT COUNT(*) as total FROM orders_with_details o ${whereClause}
      `, params);
      
      const total = countResult.total;
      const offset = (page - 1) * limit;

      // Obtener órdenes paginadas
      const orders = await query(`
        SELECT * FROM orders_with_details o 
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error obteniendo órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Actualizar estado de la orden (admin)
  updateOrderStatus = async (req, res) => {
    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const adminId = req.user.id;

      // Validar estado
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
      }

      // Obtener estado actual
      const [currentOrder] = await query(`
        SELECT status FROM orders WHERE id = ?
      `, [id]);

      if (!currentOrder) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      // Actualizar estado
      await connection.execute(`
        UPDATE orders 
        SET status = ?, admin_notes = ?, updated_at = NOW()
        WHERE id = ?
      `, [status, adminNotes || null, id]);

      // Registrar cambio en historial
      await connection.execute(`
        INSERT INTO order_status_history (
          order_id, 
          previous_status, 
          new_status, 
          changed_by, 
          admin_id, 
          notes
        ) VALUES (?, ?, ?, 'admin', ?, ?)
      `, [id, currentOrder.status, status, adminId, adminNotes || null]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Estado de la orden actualizado exitosamente'
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error actualizando estado de la orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    } finally {
      connection.release();
    }
  };

  // Generar mensaje de WhatsApp
  generateWhatsAppMessage = (orderNumber, customerName, cartItems, totalAmount, deliveryDate, deliveryTime) => {
    const itemsList = cartItems.map(item => 
      `• ${item.product.name} - Cantidad: ${item.quantity} - $${item.product.price}`
    ).join('\n');

    const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `🛍️ *NUEVO PEDIDO #${orderNumber}*

👤 *Cliente:* ${customerName}
📅 *Fecha de entrega:* ${deliveryDateFormatted}
⏰ *Hora de entrega:* ${deliveryTime}

🛒 *Productos:*
${itemsList}

💰 *Total:* $${totalAmount.toFixed(2)}

📱 *Confirmar pedido respondiendo:* CONFIRMAR ${orderNumber}`;
  };
}

module.exports = new OrderController(); 