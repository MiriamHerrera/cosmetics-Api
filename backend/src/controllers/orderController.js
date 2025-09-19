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
      
      console.log('🕐 [DeliveryTimes] Request recibido:', { locationId, date });
      console.log('🚀 [DeliveryTimes] USING UPDATED VERSION - FORCE COMMIT!');
      
      if (!locationId || !date) {
        console.log('❌ [DeliveryTimes] Faltan parámetros requeridos');
        return res.status(400).json({
          success: false,
          message: 'Se requiere locationId y date',
          received: { locationId, date }
        });
      }

      // Validar que la fecha sea válida
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        console.log('❌ [DeliveryTimes] Fecha inválida:', date);
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use YYYY-MM-DD',
          received: { date }
        });
      }

      // Parsear fecha evitando problemas de timezone UTC
      const [year, month, day] = date.split('-').map(Number);
      const localDateObj = new Date(year, month - 1, day); // <- siempre local
      const dayOfWeek = localDateObj.getDay();
      
      // Debug detallado
      console.log('🛠️ [DeliveryTimes] Fecha original:', date);
      console.log('🛠️ [DeliveryTimes] Date object UTC:', dateObj.toISOString());
      console.log('🛠️ [DeliveryTimes] Date object LOCAL:', localDateObj.toString());
      console.log('🛠️ [DeliveryTimes] Día calculado (getDay):', dayOfWeek);
      console.log('📅 [DeliveryTimes] Procesando:', { locationId, date, dayOfWeek });
      
      // Verificar que la ubicación existe
      const locationExists = await query(`
        SELECT id, name, is_active FROM delivery_locations WHERE id = ?
      `, [locationId]);
      
      if (locationExists.length === 0) {
        console.log('❌ [DeliveryTimes] Ubicación no encontrada:', locationId);
        return res.status(404).json({
          success: false,
          message: 'Ubicación de entrega no encontrada',
          locationId: locationId
        });
      }

      if (!locationExists[0].is_active) {
        console.log('❌ [DeliveryTimes] Ubicación inactiva:', locationId);
        return res.status(400).json({
          success: false,
          message: 'Ubicación de entrega no disponible',
          locationId: locationId
        });
      }

      console.log('✅ [DeliveryTimes] Ubicación válida:', locationExists[0]);
      
      // Debug: Verificar qué datos tenemos en la tabla para esta ubicación
      const debugSlots = await query(`
        SELECT location_id, day_of_week, time_slot, is_active 
        FROM delivery_time_slots 
        WHERE location_id = ? 
        ORDER BY day_of_week, time_slot
      `, [locationId]);
      console.log('🔍 [DeliveryTimes] Todos los slots para location', locationId, ':', debugSlots);
      
      // Verificar si es el día actual para filtrar horarios pasados
      const today = new Date();
      const isToday = localDateObj.toDateString() === today.toDateString();
      const currentTime = today.toTimeString().slice(0, 5); // HH:MM format
      
      console.log('🕐 [DeliveryTimes] Validación de horarios:', {
        isToday,
        currentTime,
        selectedDate: localDateObj.toDateString(),
        todayDate: today.toDateString()
      });

      // Obtener horarios específicos disponibles para ese lugar y día
      // Solo usamos delivery_time_slots, no rangos
      let timeSlots;
      
      if (isToday) {
        // Si es hoy, solo mostrar horarios que aún no han pasado
        timeSlots = await query(`
          SELECT 
            time_slot,
            TIME_FORMAT(time_slot, '%H:%i') as formatted_time,
            TIME_FORMAT(time_slot, '%h:%i %p') as display_time
          FROM delivery_time_slots
          WHERE location_id = ? 
            AND day_of_week = ?
            AND is_active = TRUE
            AND time_slot > ?
          ORDER BY time_slot
        `, [locationId, dayOfWeek, currentTime]);
        
        console.log('🕐 [DeliveryTimes] Filtrando horarios pasados del día actual');
      } else {
        // Si no es hoy, mostrar todos los horarios disponibles
        timeSlots = await query(`
          SELECT 
            time_slot,
            TIME_FORMAT(time_slot, '%H:%i') as formatted_time,
            TIME_FORMAT(time_slot, '%h:%i %p') as display_time
          FROM delivery_time_slots
          WHERE location_id = ? 
            AND day_of_week = ?
            AND is_active = TRUE
          ORDER BY time_slot
        `, [locationId, dayOfWeek]);
        
        console.log('🕐 [DeliveryTimes] Mostrando todos los horarios disponibles');
      }

      console.log('🔍 [DeliveryTimes] Horarios específicos encontrados:', timeSlots.length);

      if (timeSlots.length > 0) {
        console.log('✅ [DeliveryTimes] Devolviendo horarios específicos');
        // Formatear los datos para el frontend
        const formattedSlots = timeSlots.map(slot => ({
          time_slot: slot.formatted_time, // HH:MM format
          display_time: slot.display_time, // 12-hour format with AM/PM
          value: slot.formatted_time // Para usar como value en el frontend
        }));
        
        return res.json({
          success: true,
          data: formattedSlots,
          location: locationExists[0],
          requestInfo: { locationId, date, dayOfWeek },
          count: formattedSlots.length,
          isToday: isToday,
          currentTime: currentTime,
          hasAvailableSlots: true
        });
      }

      // No hay horarios disponibles para este día
      console.log('❌ [DeliveryTimes] No hay horarios disponibles para este día');
      
      let message = 'No hay horarios de entrega disponibles para este día';
      if (isToday) {
        message = 'Ya no hay horarios de entrega disponibles para hoy. Por favor, selecciona otro día.';
      }
      
      res.json({
        success: true,
        data: [],
        location: locationExists[0],
        requestInfo: { locationId, date, dayOfWeek },
        message: message,
        count: 0,
        isToday: isToday,
        currentTime: currentTime,
        hasAvailableSlots: false
      });
      
    } catch (error) {
      console.error('❌ [DeliveryTimes] Error obteniendo horarios disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error de base de datos'
      });
    }
  };

  // Crear nueva orden
  createOrder = async (req, res) => {
    try {
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
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos'
        });
      }

      // Validar fecha de entrega según tipo de usuario
      const today = new Date();
      const deliveryDateObj = new Date(deliveryDate);
      const daysDiff = Math.ceil((deliveryDateObj - today) / (1000 * 60 * 60 * 24));
      
      // No se puede seleccionar el día actual (daysDiff debe ser >= 1)
      if (daysDiff < 1) {
        return res.status(400).json({
          success: false,
          message: 'No se puede seleccionar el día actual. La fecha de entrega debe ser desde mañana en adelante'
        });
      }
      
      if (customerType === 'guest' && daysDiff > 3) {
        return res.status(400).json({
          success: false,
          message: 'Los usuarios invitados solo pueden elegir fechas desde mañana hasta 3 días posteriores'
        });
      }
      
      if (customerType === 'registered' && daysDiff > 7) {
        return res.status(400).json({
          success: false,
          message: 'Los usuarios registrados pueden elegir fechas desde mañana hasta 7 días posteriores'
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
      
      const unifiedCart = await query(cartQuery, cartParams);

      if (!unifiedCart || unifiedCart.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Carrito no encontrado o expirado'
        });
      }

      // Generar número de orden único
      const orderNumberResult = await query('CALL GenerateOrderNumber(@orderNumber)');
      const orderNumberSelect = await query('SELECT @orderNumber as orderNumber');
      const orderNumber = orderNumberSelect[0].orderNumber;
      
      // Validar que se generó un número de orden
      if (!orderNumber) {
        return res.status(500).json({
          success: false,
          message: 'Error generando número de orden'
        });
      }

      // Crear la orden
      const orderResult = await query(`
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
      `, [
        orderNumber,
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
        notes,
        'pending'
      ]);

      const orderId = orderResult.insertId;

      // Crear los items de la orden y recolectar información para WhatsApp
      const productsForWhatsApp = [];
      
      for (const item of cartItems) {
        // Obtener información del producto desde la base de datos
        const productRows = await query(`
          SELECT id, name, price FROM products WHERE id = ?
        `, [item.productId]);

        const product = productRows[0];
        
        if (!product) {
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

        // Crear item de la orden
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
          product.id,
          product.name,
          product.price,
          item.quantity,
          product.price * item.quantity
        ]);
      }

      // Obtener información del punto de entrega para determinar el número de WhatsApp
      const deliveryLocation = await query(`
        SELECT name, whatsapp_number 
        FROM delivery_locations 
        WHERE id = ?
      `, [deliveryLocationId]);

      const locationWhatsappType = deliveryLocation[0]?.whatsapp_number || 'DEFAULT';
      const locationName = deliveryLocation[0]?.name || 'Punto de entrega';

      // Generar mensaje de WhatsApp
      const whatsappMessage = this.generateWhatsAppMessage(
        orderNumber, 
        customerName, 
        productsForWhatsApp, 
        totalAmount, 
        deliveryDate, 
        deliveryTime,
        locationName,
        locationWhatsappType
      );

      // Actualizar orden con mensaje de WhatsApp
      await query(`
        UPDATE orders 
        SET whatsapp_message = ?, whatsapp_sent_at = NOW()
        WHERE id = ?
      `, [whatsappMessage, orderId]);

      // Marcar carrito unificado como completado
      let updateQuery, updateParams;
      
      if (customerType === 'guest') {
        updateQuery = 'UPDATE carts_unified SET status = "completed", updated_at = NOW() WHERE session_id = ?';
        updateParams = [sessionId];
      } else {
        updateQuery = 'UPDATE carts_unified SET status = "completed", updated_at = NOW() WHERE user_id = ?';
        updateParams = [userId];
      }
      
      await query(updateQuery, updateParams);

      // Limpiar los items del carrito después de crear la orden
      let clearItemsQuery, clearItemsParams;
      
      if (customerType === 'guest') {
        clearItemsQuery = 'DELETE FROM cart_items_unified WHERE cart_id IN (SELECT id FROM carts_unified WHERE session_id = ?)';
        clearItemsParams = [sessionId];
      } else {
        clearItemsQuery = 'DELETE FROM cart_items_unified WHERE cart_id IN (SELECT id FROM carts_unified WHERE user_id = ?)';
        clearItemsParams = [userId];
      }
      
      await query(clearItemsQuery, clearItemsParams);

      // Obtener la orden creada con detalles
      const orderDetails = await query(`
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
      console.error('Error creando orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
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



      // Validar fecha de entrega para invitados (desde mañana hasta 3 días posteriores)
      const today = new Date();
      const deliveryDateObj = new Date(deliveryDate);
      const daysDiff = Math.ceil((deliveryDateObj - today) / (1000 * 60 * 60 * 24));
      
      // No se puede seleccionar el día actual
      if (daysDiff < 1) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'No se puede seleccionar el día actual. La fecha de entrega debe ser desde mañana en adelante'
        });
      }
      
      if (daysDiff > 3) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Los usuarios invitados solo pueden elegir fechas desde mañana hasta 3 días posteriores'
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

      // Obtener información del punto de entrega para determinar el número de WhatsApp
      const [deliveryLocation] = await connection.execute(`
        SELECT name, whatsapp_number 
        FROM delivery_locations 
        WHERE id = ?
      `, [deliveryLocationId]);

      const locationWhatsappType = deliveryLocation[0]?.whatsapp_number || 'DEFAULT';
      const locationName = deliveryLocation[0]?.name || 'Punto de entrega';

      // Generar mensaje de WhatsApp
      const whatsappMessage = this.generateWhatsAppMessage(
        orderNumber, 
        customerName, 
        productsForWhatsApp, 
        totalAmount, 
        deliveryDate, 
        deliveryTime,
        locationName,
        locationWhatsappType
      );

      // Actualizar orden con mensaje de WhatsApp
      await connection.execute(`
        UPDATE orders 
        SET whatsapp_message = ?, whatsapp_sent_at = NOW()
        WHERE id = ?
      `, [whatsappMessage, orderId]);

      // Marcar carrito unificado como procesado
      await connection.execute(`
        UPDATE carts_unified 
        SET status = 'completed', updated_at = NOW()
        WHERE session_id = ?
      `, [sessionId]);

      // Limpiar los items del carrito después de crear la orden
      await connection.execute(`
        DELETE FROM cart_items_unified 
        WHERE cart_id IN (SELECT id FROM carts_unified WHERE session_id = ?)
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
  generateWhatsAppMessage = (orderNumber, customerName, cartItems, totalAmount, deliveryDate, deliveryTime, locationName, locationWhatsappType) => {
    const itemsList = cartItems.map(item => 
      `• ${item.product.name} - Cantidad: ${item.quantity} - $${item.product.price}`
    ).join('\n');

    const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Obtener el número de WhatsApp correcto según el punto de entrega
    const whatsappNumber = whatsappConfig.getNumberForLocation(locationWhatsappType);
    const whatsappNumberFormatted = whatsappNumber.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');

    return `🛍️ *NUEVO PEDIDO #${orderNumber}*

👤 *Cliente:* ${customerName}
📍 *Punto de entrega:* ${locationName}
📅 *Fecha de entrega:* ${deliveryDateFormatted}
⏰ *Hora de entrega:* ${deliveryTime}

🛒 *Productos:*
${itemsList}

💰 *Total:* $${totalAmount.toFixed(2)}

📱 *Confirmar pedido respondiendo:* CONFIRMAR ${orderNumber}
📞 *WhatsApp:* ${whatsappNumberFormatted}`;
  };
}

module.exports = new OrderController(); 