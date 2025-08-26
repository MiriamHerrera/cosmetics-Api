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

      // Verificar que el carrito unificado existe y tiene items
      let cartQuery, cartParams;
      
      if (customerType === 'guest') {
        cartQuery = 'SELECT id FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
      } else {
        cartQuery = 'SELECT id FROM carts_unified WHERE user_id = ? AND status = "active"';
        cartParams = [userId];
      }
      
      const [unifiedCart] = await connection.execute(cartQuery, cartParams);

      if (!unifiedCart) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Carrito no encontrado o expirado'
        });
      }

      // Generar número de orden único
      await connection.execute('CALL GenerateOrderNumber(@orderNumber)');
      const [orderNumberResult] = await connection.execute('SELECT @orderNumber as orderNumber');
      const orderNumber = orderNumberResult[0].orderNumber;
      
             // Validar que se generó un número de orden
       if (!orderNumber) {
         await connection.rollback();
         return res.status(500).json({
           success: false,
           message: 'Error generando número de orden'
         });
       }

               // Función helper para convertir undefined a null
        const safeParam = (value) => {
          if (value === undefined) {
            console.log('🔍 [DEBUG] Valor undefined convertido a null:', value);
            return null;
          }
          if (value === null) {
            console.log('🔍 [DEBUG] Valor ya es null:', value);
            return null;
          }
          console.log('🔍 [DEBUG] Valor válido:', value, 'tipo:', typeof value);
          return value;
        };

               // Debug: Log de parámetros recibidos
        console.log('🔍 [DEBUG] Parámetros recibidos:', {
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
          notes
        });

        // Debug: Log de parámetros que se pasarán a SQL
        console.log('🔍 [DEBUG] Construyendo parámetros SQL...');
        
        const sqlParams = [
          orderNumber,
          safeParam(customerType),
          safeParam(userId),
          safeParam(sessionId),
          safeParam(customerName),
          safeParam(customerPhone),
          safeParam(customerEmail),
          safeParam(deliveryLocationId),
          safeParam(deliveryDate),
          safeParam(deliveryTime),
          safeParam(deliveryAddress),
          safeParam(totalAmount),
          safeParam(notes),
          'pending'
        ];
        
        console.log('🔍 [DEBUG] Parámetros SQL:', sqlParams);
        console.log('🔍 [DEBUG] Cantidad de parámetros:', sqlParams.length);
        
        // Verificar que no haya undefined en los parámetros
        const hasUndefined = sqlParams.some((param, index) => {
          if (param === undefined) {
            console.log(`❌ [ERROR] Parámetro ${index} es undefined:`, param);
            return true;
          }
          return false;
        });
        
        if (hasUndefined) {
          await connection.rollback();
          return res.status(500).json({
            success: false,
            message: 'Error: Parámetros undefined detectados'
          });
        }
        
        console.log('✅ [DEBUG] Todos los parámetros son válidos');



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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, sqlParams);

      const orderId = orderResult.insertId;

      // Crear los items de la orden y recolectar información para WhatsApp
      const productsForWhatsApp = [];
      
      for (const item of cartItems) {
        // Obtener información del producto desde la base de datos
        const [productRows] = await connection.execute(`
          SELECT id, name, price FROM products WHERE id = ?
        `, [item.productId]);

        const product = productRows[0];
        
        if (!product) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }
        
        // Debug: Log del producto obtenido
        console.log('🔍 [DEBUG] Producto obtenido:', {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        });

        // Guardar información para WhatsApp
        productsForWhatsApp.push({
          product: {
            name: product.name,
            price: product.price
          },
          quantity: item.quantity
        });

        // Preparar parámetros para order_items con validación
        const orderItemParams = [
          orderId,
          product.id,
          product.name,
          product.price,
          item.quantity,
          product.price * item.quantity
        ];
        
        // Debug: Log de parámetros de order_items
        console.log('🔍 [DEBUG] Parámetros order_items:', orderItemParams);
        
        // Verificar que no haya undefined en los parámetros de order_items
        const hasUndefinedOrderItem = orderItemParams.some((param, index) => {
          if (param === undefined) {
            console.log(`❌ [ERROR] Parámetro order_items ${index} es undefined:`, param);
            return true;
          }
          return false;
        });
        
        if (hasUndefinedOrderItem) {
          await connection.rollback();
          return res.status(500).json({
            success: false,
            message: 'Error: Parámetros undefined en order_items'
          });
        }

        await connection.execute(`
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_price,
            quantity,
            subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, orderItemParams);
      }

      // Generar mensaje de WhatsApp
      const whatsappMessage = this.generateWhatsAppMessage(orderNumber, customerName, productsForWhatsApp, totalAmount, deliveryDate, deliveryTime);

      // Actualizar orden con mensaje de WhatsApp
      await connection.execute(`
        UPDATE orders 
        SET whatsapp_message = ?, whatsapp_sent_at = NOW()
        WHERE id = ?
      `, [whatsappMessage, orderId]);

      // Marcar carrito unificado como procesado
      let updateQuery, updateParams;
      
      if (customerType === 'guest') {
        updateQuery = 'UPDATE carts_unified SET status = "cleaned", updated_at = NOW() WHERE session_id = ?';
        updateParams = [sessionId];
      } else {
        updateQuery = 'UPDATE carts_unified SET status = "cleaned", updated_at = NOW() WHERE user_id = ?';
        updateParams = [userId];
      }
      
      await connection.execute(updateQuery, updateParams);

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

      // Validar datos requeridos
      if (!sessionId || !customerName || !customerPhone || !deliveryLocationId || 
          !deliveryDate || !deliveryTime || !totalAmount || !cartItems || cartItems.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos'
        });
      }

              // Validar número de WhatsApp
        if (!whatsappConfig.validateNumber(whatsappConfig.number)) {
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'Error de configuración: Número de WhatsApp inválido'
        });
      }



      // Validar fecha de entrega para invitados (hoy hasta 3 días posteriores)
      const today = new Date();
      const deliveryDateObj = new Date(deliveryDate);
      const daysDiff = Math.ceil((deliveryDateObj - today) / (1000 * 60 * 60 * 24));
      
            if (daysDiff < 0 || daysDiff > 3) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Los usuarios invitados solo pueden elegir fechas de hoy hasta 3 días posteriores'
        });
      }

            // Verificar que el carrito unificado existe y tiene items
      const [unifiedCart] = await connection.execute(`
        SELECT id FROM carts_unified WHERE session_id = ? AND status = 'active'
      `, [sessionId]);

      if (!unifiedCart) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Carrito no encontrado o expirado'
        });
      }

      // Generar número de orden único
      try {
        // Llamar al procedimiento almacenado
        await connection.execute('CALL GenerateOrderNumber(@orderNumber)');
        
        // Obtener el resultado de la variable de salida usando query
        const orderNumberResult = await connection.query('SELECT @orderNumber as orderNumber');
        
        // Extraer el número de orden del resultado
        orderNumber = orderNumberResult[0][0].orderNumber;
        
        if (!orderNumber) {
          throw new Error('No se pudo generar el número de orden');
        }
      } catch (error) {
        await connection.rollback();
        return res.status(500).json({
          success: false,
          message: 'Error generando número de orden'
        });
      }

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
      
      // Crear los items de la orden y recolectar información para WhatsApp
      const productsForWhatsApp = [];
      
      for (const item of cartItems) {
        // El frontend envía { productId, quantity, product } pero solo necesitamos productId y quantity
        const productId = item.productId;
        const quantity = item.quantity;
        
        if (!productId || !quantity) {
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

        // Extraer el producto del resultado (connection.execute devuelve [rows, fields])
        const product = productResult[0][0];

        if (!product) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `Producto con ID ${productId} no encontrado`
          });
        }
        
        // Guardar información para WhatsApp
        productsForWhatsApp.push({
          product: {
            name: product.name,
            price: product.price
          },
          quantity: quantity
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
          quantity,
          product.price * quantity
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

      // Marcar carrito unificado como procesado
      await connection.execute(`
        UPDATE carts_unified 
        SET status = 'cleaned', updated_at = NOW()
        WHERE session_id = ?
      `, [sessionId]);

      await connection.commit();

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