const { query, getConnection } = require('../config/database');

class UnifiedCartController {
  // Método de prueba
  async test(req, res) {
    try {
      console.log('🧪 [UnifiedCart] Test endpoint llamado');
      res.json({
        success: true,
        message: 'Controlador de carrito unificado funcionando correctamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [UnifiedCart] Error en test:', error);
      res.status(500).json({
        success: false,
        message: 'Error en test endpoint'
      });
    }
  }

  // Obtener carrito (usuario autenticado o invitado)
  async getCart(req, res) {
    try {
      console.log('🛒 [UnifiedCart] getCart iniciado');
      console.log('📝 [UnifiedCart] Body recibido:', req.body);
      console.log('🔍 [UnifiedCart] Headers:', req.headers);
      console.log('🔍 [UnifiedCart] Authorization header:', req.headers.authorization);
      console.log('🔍 [UnifiedCart] Content-Type:', req.headers['content-type']);
      
      const { userId, sessionId } = req.body;
      
      console.log('👤 [UnifiedCart] userId extraído:', userId);
      console.log('👤 [UnifiedCart] userId tipo:', typeof userId);
      console.log('👤 [UnifiedCart] userId es null?', userId === null);
      console.log('👤 [UnifiedCart] userId es undefined?', userId === undefined);
      console.log('🔑 [UnifiedCart] sessionId extraído:', sessionId);
      console.log('🔑 [UnifiedCart] sessionId tipo:', typeof sessionId);
      
      if (!userId && !sessionId) {
        console.log('❌ [UnifiedCart] Error: Se requiere userId o sessionId');
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId o sessionId'
        });
      }

      // Si es usuario autenticado, verificar si hay carrito de invitado para migrar
      console.log('🔍 [UnifiedCart] Verificando condiciones para migración...');
      console.log('🔍 [UnifiedCart] userId existe?', !!userId);
      console.log('🔍 [UnifiedCart] sessionId existe?', !!sessionId);
      console.log('🔍 [UnifiedCart] userId && sessionId?', !!(userId && sessionId));
      
      // Bandera para saber si migramos un carrito (evitar INSERT posterior)
      let migratedCartId = null;
      if (userId && sessionId) {
        console.log('🔄 [UnifiedCart] Usuario autenticado con sessionId, verificando migración...');
        console.log('🔄 [UnifiedCart] userId para migración:', userId);
        console.log('🔄 [UnifiedCart] sessionId para migración:', sessionId);
        
        try {
          // Buscar carrito de invitado
          console.log('🔍 [UnifiedCart] Buscando carrito de invitado con sessionId:', sessionId);
          console.log('🔍 [UnifiedCart] Tipo de sessionId:', typeof sessionId);
          console.log('🔍 [UnifiedCart] sessionId es null?', sessionId === null);
          console.log('🔍 [UnifiedCart] sessionId es undefined?', sessionId === undefined);
          console.log('🔍 [UnifiedCart] sessionId length:', sessionId ? sessionId.length : 'N/A');
          
          let guestCarts;
          try {
            guestCarts = await query(
              'SELECT * FROM carts_unified WHERE session_id = ? AND cart_type = "guest" AND status = "active"',
              [sessionId]
            );
            console.log('✅ [UnifiedCart] Consulta de carritos de invitado exitosa');
          } catch (queryError) {
            console.error('❌ [UnifiedCart] Error en consulta de carritos de invitado:', queryError);
            console.error('❌ [UnifiedCart] SQL:', 'SELECT * FROM carts_unified WHERE session_id = ? AND cart_type = "guest" AND status = "active"');
            console.error('❌ [UnifiedCart] Params:', [sessionId]);
            throw queryError;
          }
          
          console.log('📊 [UnifiedCart] Carritos de invitado encontrados:', guestCarts.length);
          if (guestCarts.length > 0) {
            console.log('📦 [UnifiedCart] Carrito de invitado encontrado, iniciando migración...');
            console.log('📦 [UnifiedCart] Carrito ID a migrar:', guestCarts[0].id);
            console.log('📦 [UnifiedCart] Carrito actual - user_id:', guestCarts[0].user_id);
            console.log('📦 [UnifiedCart] Carrito actual - cart_type:', guestCarts[0].cart_type);
            
            // En lugar de crear un carrito nuevo, actualizar el carrito existente
            console.log('🔄 [UnifiedCart] Ejecutando UPDATE...');
            const updateResult = await query(
              'UPDATE carts_unified SET user_id = ?, cart_type = "registered", expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE session_id = ? AND cart_type = "guest" AND status = "active"',
              [userId, sessionId]
            );
            
            console.log('📊 [UnifiedCart] Resultado del UPDATE:', updateResult);
            console.log('✅ [UnifiedCart] Carrito de invitado migrado a usuario registrado');
            console.log('🔄 [UnifiedCart] Tiempo de expiración actualizado a 7 días');
            migratedCartId = guestCarts[0].id;
          } else {
            console.log('ℹ️ [UnifiedCart] No se encontraron carritos de invitado para migrar');
          }
        } catch (migrationError) {
          console.error('❌ [UnifiedCart] Error durante migración:', migrationError);
          // Continuar sin migración si falla
        }
      } else {
        console.log('ℹ️ [UnifiedCart] No se cumple condición para migración');
        console.log('ℹ️ [UnifiedCart] userId presente?', !!userId);
        console.log('ℹ️ [UnifiedCart] sessionId presente?', !!sessionId);
      }

      // Buscar carrito en la tabla unificada
      let cartQuery = '';
      let cartParams = [];
      
      console.log('🔍 [UnifiedCart] Iniciando búsqueda de carrito...');
      console.log('🔍 [UnifiedCart] userId para búsqueda:', userId);
      console.log('🔍 [UnifiedCart] sessionId para búsqueda:', sessionId);
      
      if (migratedCartId) {
        // Si migramos, garantizamos leer ese mismo carrito por id
        cartQuery = 'SELECT * FROM carts_unified WHERE id = ? LIMIT 1';
        cartParams = [migratedCartId];
        console.log('🔍 [UnifiedCart] Buscando carrito migrado por ID:', migratedCartId);
      } else if (userId) {
        // Buscar carrito por user_id O por session_id (para capturar carritos migrados)
        cartQuery = 'SELECT * FROM carts_unified WHERE (user_id = ? OR session_id = ?) AND (status = "active" OR status = "completed") ORDER BY created_at DESC LIMIT 1';
        cartParams = [userId, sessionId];
        console.log('🔍 [UnifiedCart] Buscando carrito para usuario (incluyendo migrados):', userId);
        console.log('🔍 [UnifiedCart] Query para usuario:', cartQuery);
        console.log('🔍 [UnifiedCart] Params para usuario:', cartParams);
      } else {
        cartQuery = 'SELECT * FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
        console.log('🔍 [UnifiedCart] Buscando carrito para sesión:', sessionId);
        console.log('🔍 [UnifiedCart] Query para sesión:', cartQuery);
        console.log('🔍 [UnifiedCart] Params para sesión:', cartParams);
      }

      console.log('📝 [UnifiedCart] Query:', cartQuery);
      console.log('📝 [UnifiedCart] Params:', cartParams);
      console.log('🔍 [UnifiedCart] Ejecutando consulta SQL...');

      let carts;
      try {
        carts = await query(cartQuery, cartParams);
        
        console.log('📊 [UnifiedCart] Carritos encontrados:', carts.length);
        console.log('📊 [UnifiedCart] Resultado de consulta:', carts);
      } catch (dbError) {
        console.error('❌ [UnifiedCart] Error de base de datos:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error de conexión a la base de datos',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
        });
      }
      
      if (carts.length === 0) {
        console.log('🆕 [UnifiedCart] Creando carrito vacío');
        
        // Crear carrito vacío si no existe
        let createQuery = '';
        let createParams = [];
        let createdCartId = null;
        
        if (userId) {
          // Usuario autenticado: carrito expira en 7 días
          createQuery = 'INSERT INTO carts_unified (user_id, cart_type, status, expires_at) VALUES (?, "registered", "active", DATE_ADD(NOW(), INTERVAL 7 DAY))';
          createParams = [userId];
        } else {
          // Usuario invitado: carrito expira en 1 hora
          createQuery = 'INSERT INTO carts_unified (session_id, cart_type, status, expires_at) VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 HOUR))';
          createParams = [sessionId];
        }
        
        console.log('📝 [UnifiedCart] Query de creación:', createQuery);
        console.log('📝 [UnifiedCart] Params de creación:', createParams);
        console.log('🔍 [UnifiedCart] Ejecutando INSERT...');
        
        try {
          const result = await query(createQuery, createParams);
          createdCartId = result.insertId;
          
          console.log('✅ [UnifiedCart] Carrito creado con ID:', createdCartId);
          console.log('📊 [UnifiedCart] Resultado del INSERT:', result);
        } catch (dbError) {
          console.error('❌ [UnifiedCart] Error creando carrito:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Error creando carrito',
            error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
          });
        }
        
        return res.json({
          success: true,
          data: {
            id: createdCartId,
            userId: userId || null,
            sessionId: sessionId || null,
            cartType: userId ? 'registered' : 'guest',
            status: 'active',
            items: [],
            total: 0,
            itemCount: 0
          }
        });
      }

      const cart = carts[0];
      console.log('📦 [UnifiedCart] Carrito encontrado:', cart);
      
      // Si el carrito está completado, crear uno nuevo activo
      if (cart.status === 'completed') {
        console.log('🔄 [UnifiedCart] Carrito completado encontrado, creando uno nuevo activo...');
        
        let createQuery = '';
        let createParams = [];
        
        if (userId) {
          // Usuario autenticado: carrito expira en 7 días
          createQuery = 'INSERT INTO carts_unified (user_id, cart_type, status, expires_at) VALUES (?, "registered", "active", DATE_ADD(NOW(), INTERVAL 7 DAY))';
          createParams = [userId];
        } else {
          // Usuario invitado: carrito expira en 1 hora
          createQuery = 'INSERT INTO carts_unified (session_id, cart_type, status, expires_at) VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 HOUR))';
          createParams = [sessionId];
        }
        
        console.log('📝 [UnifiedCart] Query de creación de carrito activo:', createQuery);
        console.log('📝 [UnifiedCart] Params de creación:', createParams);
        
        try {
          const result = await query(createQuery, createParams);
          const newCartId = result.insertId;
          
          console.log('✅ [UnifiedCart] Nuevo carrito activo creado con ID:', newCartId);
          
          // Actualizar la variable cart para usar el nuevo carrito
          cart.id = newCartId;
          cart.status = 'active';
          cart.user_id = userId;
          cart.session_id = sessionId;
          cart.cart_type = userId ? 'registered' : 'guest';
          
          console.log('🔄 [UnifiedCart] Carrito actualizado para usar el nuevo:', cart);
        } catch (dbError) {
          console.error('❌ [UnifiedCart] Error creando carrito activo:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Error creando carrito activo',
            error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
          });
        }
      }
      
      // Obtener items del carrito
      const itemsQuery = 'SELECT ci.*, p.name as product_name, p.price, p.image_url FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?';
      console.log('📝 [UnifiedCart] Query de items:', itemsQuery);
      console.log('📝 [UnifiedCart] Cart ID para items:', cart.id);
      console.log('🔍 [UnifiedCart] Ejecutando consulta de items...');
      
      let items;
      try {
        items = await query(itemsQuery, [cart.id]);
        console.log('📊 [UnifiedCart] Items encontrados:', items.length);
        console.log('📊 [UnifiedCart] Resultado de consulta de items:', items);
      } catch (dbError) {
        console.error('❌ [UnifiedCart] Error obteniendo items:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo items del carrito',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
        });
      }

      // Calcular totales
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      
      console.log('💰 [UnifiedCart] Total calculado:', total);
      console.log('🔢 [UnifiedCart] Cantidad de items:', itemCount);

      const cartData = {
        id: cart.id,
        userId: cart.user_id,
        sessionId: cart.session_id,
        cartType: cart.cart_type,
        status: cart.status,
        items: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image_url: item.image_url
          }
        })),
        total,
        itemCount,
        createdAt: cart.created_at,
        updatedAt: cart.updated_at
      };

      console.log('✅ [UnifiedCart] Carrito preparado para respuesta:');
      console.log('✅ [UnifiedCart] - ID:', cartData.id);
      console.log('✅ [UnifiedCart] - userId:', cartData.userId);
      console.log('✅ [UnifiedCart] - sessionId:', cartData.sessionId);
      console.log('✅ [UnifiedCart] - cartType:', cartData.cartType);
      console.log('✅ [UnifiedCart] - status:', cartData.status);
      console.log('✅ [UnifiedCart] - total:', cartData.total);
      console.log('✅ [UnifiedCart] - itemCount:', cartData.itemCount);

      res.json({
        success: true,
        data: cartData
      });

    } catch (error) {
      console.error('❌ [UnifiedCart] Error en getCart:', error);
      console.error('❌ [UnifiedCart] Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // Agregar item al carrito
  async addItem(req, res) {
    try {
      console.log('🛒 [UnifiedCart] addItem iniciado');
      console.log('📝 [UnifiedCart] Body recibido:', req.body);
      
      const { productId, quantity, userId, sessionId } = req.body;
      
      console.log('👤 [UnifiedCart] userId:', userId);
      console.log('🔑 [UnifiedCart] sessionId:', sessionId);
      console.log('📦 [UnifiedCart] productId:', productId);
      console.log('🔢 [UnifiedCart] quantity:', quantity);
      
      if (!productId || !quantity || (!userId && !sessionId)) {
        console.log('❌ [UnifiedCart] Error: Faltan parámetros requeridos');
        return res.status(400).json({
          success: false,
          message: 'Se requiere productId, quantity y userId o sessionId'
        });
      }

      // Verificar que el producto existe y tiene stock
      let products;
      try {
        products = await query(
          'SELECT * FROM products WHERE id = ? AND is_approved = 1',
          [productId]
        );
      } catch (dbError) {
        console.error('❌ [UnifiedCart] Error verificando producto:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error verificando producto',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
        });
      }

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado o no aprobado'
        });
      }

      const product = products[0];
      
      // Buscar o crear carrito PRIMERO
      let cartQuery = '';
      let cartParams = [];
      
      if (userId) {
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND (status = "active" OR status = "completed") ORDER BY created_at DESC LIMIT 1';
        cartParams = [userId];
      } else {
        cartQuery = 'SELECT * FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
      }

      let carts;
      try {
        carts = await query(cartQuery, cartParams);
      } catch (dbError) {
        console.error('❌ [UnifiedCart] Error buscando carrito:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error buscando carrito',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
        });
      }
      
      // Simplificar el cálculo de stock disponible - solo verificar stock total por ahora
      // TODO: Implementar lógica de stock reservado más adelante
      const availableStock = product.stock_total;
      
      console.log(`📊 [UnifiedCart] Stock del producto ${productId}: Total=${product.stock_total}, Disponible=${availableStock}`);
      
      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Solo hay ${availableStock} unidades disponibles.`
        });
      }

      let cartId;

      if (carts.length === 0) {
        // Crear carrito si no existe
        let createQuery = '';
        let createParams = [];
        
        if (userId) {
          // Usuario autenticado: carrito expira en 7 días
          createQuery = 'INSERT INTO carts_unified (user_id, cart_type, status, expires_at) VALUES (?, "registered", "active", DATE_ADD(NOW(), INTERVAL 7 DAY))';
          createParams = [userId];
        } else {
          // Usuario invitado: carrito expira en 1 hora
          createQuery = 'INSERT INTO carts_unified (session_id, cart_type, status, expires_at) VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 HOUR))';
          createParams = [sessionId];
        }
        
        let result;
        try {
          result = await query(createQuery, createParams);
        } catch (dbError) {
          console.error('❌ [UnifiedCart] Error creando carrito:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Error creando carrito',
            error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
          });
        }
        cartId = result.insertId;
      } else {
        cartId = carts[0].id;
      }

      // Verificar si el item ya existe
      let existingItems;
      try {
        existingItems = await query(
          'SELECT * FROM cart_items_unified WHERE cart_id = ? AND product_id = ?',
          [cartId, productId]
        );
      } catch (dbError) {
        console.error('❌ [UnifiedCart] Error verificando items existentes:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error verificando items del carrito',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
        });
      }

      if (existingItems.length > 0) {
        // Actualizar cantidad
        const newQuantity = existingItems[0].quantity + quantity;
        const additionalQuantity = quantity; // Solo la cantidad adicional
        
        try {
          await query(
            'UPDATE cart_items_unified SET quantity = ? WHERE cart_id = ? AND product_id = ?',
            [newQuantity, cartId, productId]
          );
          
          // Actualizar stock del producto (solo la cantidad adicional)
          await query(
            'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
            [additionalQuantity, productId]
          );
          
          console.log(`🔄 [UnifiedCart] Cantidad actualizada para producto ${productId}: ${existingItems[0].quantity} + ${quantity} = ${newQuantity}`);
          console.log(`📦 [UnifiedCart] Stock actualizado: -${additionalQuantity} unidades adicionales para producto ${productId}`);
        } catch (dbError) {
          console.error('❌ [UnifiedCart] Error actualizando cantidad:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Error actualizando cantidad del item',
            error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
          });
        }
      } else {
        // Agregar nuevo item
        try {
          await query(
            'INSERT INTO cart_items_unified (cart_id, product_id, quantity, reserved_until) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
            [cartId, productId, quantity]
          );
          
          // Actualizar stock del producto
          await query(
            'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
            [quantity, productId]
          );
          
          console.log(`🔄 [UnifiedCart] Item agregado al carrito: ${quantity} unidades del producto ${productId}`);
          console.log(`📦 [UnifiedCart] Stock actualizado: -${quantity} unidades para producto ${productId}`);
        } catch (dbError) {
          console.error('❌ [UnifiedCart] Error agregando item:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Error agregando item al carrito',
            error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
          });
        }
      }

      // Obtener carrito actualizado
      let updatedCarts;
      try {
        updatedCarts = await query(
          'SELECT * FROM carts_unified WHERE id = ?',
          [cartId]
        );
      } catch (dbError) {
        console.error('❌ [UnifiedCart] Error obteniendo carrito actualizado:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo carrito actualizado',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
        });
      }

      if (updatedCarts.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al crear carrito'
        });
      }

      const cart = updatedCarts[0];

      // Obtener items actualizados
      let items;
      try {
        items = await query(
          'SELECT ci.*, p.name as product_name, p.price, p.image_url FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?',
          [cartId]
        );
      } catch (dbError) {
        console.error('❌ [UnifiedCart] Error obteniendo items actualizados:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Error obteniendo items del carrito',
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Error de base de datos'
        });
      }

      // Calcular totales
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      const cartData = {
        id: cart.id,
        userId: cart.user_id,
        sessionId: cart.session_id,
        cartType: cart.cart_type,
        status: cart.status,
        items: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image_url: item.image_url
          }
        })),
        total,
        itemCount,
        createdAt: cart.created_at,
        updatedAt: cart.updated_at
      };

      console.log('✅ [UnifiedCart] Item agregado exitosamente al carrito');
      console.log('📦 [UnifiedCart] Carrito actualizado:', cartData);

      res.json({
        success: true,
        data: cartData
      });

    } catch (error) {
      console.error('❌ [UnifiedCart] Error en addItem:', error);
      console.error('❌ [UnifiedCart] Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
    }
  }

  // Migrar carrito de invitado a usuario autenticado
  async migrateGuestToUser(req, res) {
    try {
      const { sessionId, userId } = req.body;
      
      if (!sessionId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere sessionId y userId'
        });
      }

      // Buscar carrito de invitado
      const guestCarts = await query(
        'SELECT * FROM carts_unified WHERE session_id = ? AND cart_type = "guest" AND status = "active"',
        [sessionId]
      );

      if (guestCarts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Carrito de invitado no encontrado'
        });
      }

      const guestCart = guestCarts[0];

      // En lugar de crear un carrito nuevo, actualizar el carrito existente
      await query(
        'UPDATE carts_unified SET user_id = ?, cart_type = "registered", expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id = ?',
        [userId, guestCart.id]
      );

      // Obtener carrito migrado
      const migratedCarts = await query(
        'SELECT * FROM carts_unified WHERE id = ?',
        [guestCart.id]
      );

      if (migratedCarts.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al migrar carrito'
        });
      }

      const cart = migratedCarts[0];

      // Obtener items del carrito migrado
      const items = await query(
        'SELECT ci.*, p.name as product_name, p.price, p.image_url FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?',
        [guestCart.id]
      );

      // Calcular totales
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      const cartData = {
        id: cart.id,
        userId: cart.user_id,
        sessionId: cart.session_id,
        cartType: cart.cart_type,
        status: cart.status,
        items: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image_url: item.image_url
          }
        })),
        total,
        itemCount,
        createdAt: cart.created_at,
        updatedAt: cart.updated_at
      };

      res.json({
        success: true,
        data: cartData
      });

    } catch (error) {
      console.error('Error migrando carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Limpiar carritos expirados
  async cleanupExpired(req, res) {
    try {
      // Obtener items de carritos que van a expirar antes de marcarlos como expirados
      const expiringItems = await query(`
        SELECT ci.product_id, ci.quantity 
        FROM cart_items_unified ci 
        INNER JOIN carts_unified c ON ci.cart_id = c.id 
        WHERE c.cart_type = "guest" AND c.expires_at < NOW() AND c.status = "active"
      `);

      // Restaurar stock de cada producto
      let totalStockRestored = 0;
      for (const item of expiringItems) {
        await query(
          'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
        totalStockRestored += item.quantity;
        console.log(`🔄 [UnifiedCart] Stock restaurado por expiración: +${item.quantity} para producto ${item.product_id}`);
      }

      // Marcar carritos expirados
      const result = await query(
        'UPDATE carts_unified SET status = "expired" WHERE cart_type = "guest" AND expires_at < NOW() AND status = "active"'
      );

      // Eliminar items de carritos expirados
      await query(
        'DELETE ci FROM cart_items_unified ci INNER JOIN carts_unified c ON ci.cart_id = c.id WHERE c.status = "expired"'
      );

      res.json({
        success: true,
        data: { 
          cleaned: result.affectedRows,
          stockRestored: totalStockRestored
        }
      });

    } catch (error) {
      console.error('Error limpiando carritos expirados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener información de expiración y hora del servidor
  async getExpirationInfo(req, res) {
    try {
      // Hora actual del servidor
      const serverTime = new Date();
      
      // Hora local del usuario (aproximada)
      const userTime = new Date(serverTime.getTime() + (parseInt(process.env.TIMEZONE_OFFSET || '0') * 60 * 1000));
      
      // Estadísticas de carritos
      const cartStats = await query(`
        SELECT 
          cart_type,
          COUNT(*) as total_carts,
          SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_carts,
          SUM(CASE WHEN expires_at > NOW() AND expires_at < DATE_ADD(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) as expiring_soon,
          MIN(expires_at) as next_expiration,
          MAX(expires_at) as last_expiration
        FROM carts_unified 
        WHERE status = 'active'
        GROUP BY cart_type
      `);

      // Carritos próximos a expirar
      const expiringSoon = await query(`
        SELECT 
          id, cart_type, user_id, session_id, expires_at,
          TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry
        FROM carts_unified 
        WHERE status = 'active' 
        AND expires_at > NOW() 
        AND expires_at < DATE_ADD(NOW(), INTERVAL 1 HOUR)
        ORDER BY expires_at ASC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          serverTime: {
            utc: serverTime.toISOString(),
            local: serverTime.toString(),
            timestamp: serverTime.getTime()
          },
          userTime: {
            utc: userTime.toISOString(),
            local: userTime.toString(),
            timestamp: userTime.getTime()
          },
          timezone: {
            offset: process.env.TIMEZONE_OFFSET || '0',
            description: 'Offset en minutos desde UTC'
          },
          cartStats,
          expiringSoon,
          expirationRules: {
            guest: '1 hora',
            registered: '7 días'
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo información de expiración:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar cantidad de item
  async updateQuantity(req, res) {
    try {
      const { productId, quantity, userId, sessionId } = req.body;
      
      if (!productId || quantity < 0 || (!userId && !sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere productId, quantity válida y userId o sessionId'
        });
      }

      // Buscar carrito
      let cartQuery = '';
      let cartParams = [];
      
      if (userId) {
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND (status = "active" OR status = "completed") ORDER BY created_at DESC LIMIT 1';
        cartParams = [userId];
      } else {
        cartQuery = 'SELECT * FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
      }

      const carts = await query(cartQuery, cartParams);
      
      if (carts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado'
        });
      }

      const cart = carts[0];

      // Obtener cantidad actual del item en el carrito
      const currentItem = await query(
        'SELECT quantity FROM cart_items_unified WHERE cart_id = ? AND product_id = ?',
        [cart.id, productId]
      );

      if (currentItem.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Item no encontrado en el carrito'
        });
      }

      const currentQuantity = currentItem[0].quantity;
      const quantityDifference = quantity - currentQuantity;

      if (quantity === 0) {
        // Si cantidad es 0, remover el item y restaurar todo el stock
        await query(
          'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
          [currentQuantity, productId]
        );
        console.log(`🔄 [UnifiedCart] Stock restaurado: +${currentQuantity} para producto ${productId}`);

        await query(
          'DELETE FROM cart_items_unified WHERE cart_id = ? AND product_id = ?',
          [cart.id, productId]
        );
      } else {
        // Verificar stock disponible (considerando el stock ya reservado)
        const products = await query(
          'SELECT stock_total FROM products WHERE id = ?',
          [productId]
        );

        if (products.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
          });
        }

        // Si estamos aumentando la cantidad, verificar que haya stock disponible
        if (quantityDifference > 0) {
          if (products[0].stock_total < quantityDifference) {
            return res.status(400).json({
              success: false,
              message: 'Stock insuficiente para aumentar la cantidad'
            });
          }
        }

        // Actualizar cantidad
        await query(
          'UPDATE cart_items_unified SET quantity = ? WHERE cart_id = ? AND product_id = ?',
          [quantity, cart.id, productId]
        );

        // Ajustar stock según la diferencia de cantidad
        if (quantityDifference > 0) {
          // Aumentando cantidad: reducir stock
          await query(
            'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
            [quantityDifference, productId]
          );
          console.log(`📦 [UnifiedCart] Stock reducido: -${quantityDifference} unidades para producto ${productId}`);
        } else if (quantityDifference < 0) {
          // Disminuyendo cantidad: restaurar stock
          await query(
            'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
            [Math.abs(quantityDifference), productId]
          );
          console.log(`📦 [UnifiedCart] Stock restaurado: +${Math.abs(quantityDifference)} unidades para producto ${productId}`);
        }
        
        console.log(`🔄 [UnifiedCart] Cantidad actualizada: ${quantity} unidades del producto ${productId}`);
      }

      // Obtener carrito actualizado
      const updatedCarts = await query(
        'SELECT * FROM carts_unified WHERE id = ?',
        [cart.id]
      );

      if (updatedCarts.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar carrito'
        });
      }

      const updatedCart = updatedCarts[0];

      // Obtener items actualizados
      const items = await query(
        'SELECT ci.*, p.name as product_name, p.price, p.image_url FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?',
        [cart.id]
      );

      // Calcular totales
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      const cartData = {
        id: updatedCart.id,
        userId: updatedCart.user_id,
        sessionId: updatedCart.session_id,
        cartType: updatedCart.cart_type,
        status: updatedCart.status,
        items: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image_url: item.image_url
          }
        })),
        total,
        itemCount,
        createdAt: updatedCart.created_at,
        updatedAt: updatedCart.updated_at
      };

      res.json({
        success: true,
        data: cartData
      });

    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Remover item del carrito
  async removeItem(req, res) {
    try {
      const { productId, userId, sessionId } = req.body;
      
      if (!productId || (!userId && !sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere productId y userId o sessionId'
        });
      }

      // Buscar carrito
      let cartQuery = '';
      let cartParams = [];
      
      if (userId) {
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND (status = "active" OR status = "completed") ORDER BY created_at DESC LIMIT 1';
        cartParams = [userId];
      } else {
        cartQuery = 'SELECT * FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
      }

      const carts = await query(cartQuery, cartParams);
      
      if (carts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado'
        });
      }

      const cart = carts[0];

      // Obtener cantidad del item antes de eliminarlo para restaurar stock
      const itemToRemove = await query(
        'SELECT quantity FROM cart_items_unified WHERE cart_id = ? AND product_id = ?',
        [cart.id, productId]
      );

      if (itemToRemove.length > 0) {
        const quantity = itemToRemove[0].quantity;
        
        // Restaurar stock del producto
        await query(
          'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
          [quantity, productId]
        );
        console.log(`🔄 [UnifiedCart] Stock restaurado: +${quantity} para producto ${productId}`);
        
        // Verificar stock actualizado
        const [stockResult] = await query(
          'SELECT stock_total FROM products WHERE id = ?',
          [productId]
        );
        console.log(`📊 [UnifiedCart] Stock actualizado del producto ${productId}: ${stockResult.stock_total}`);
      }

      // Remover item
      await query(
        'DELETE FROM cart_items_unified WHERE cart_id = ? AND product_id = ?',
        [cart.id, productId]
      );

      // Obtener carrito actualizado
      const updatedCarts = await query(
        'SELECT * FROM carts_unified WHERE id = ?',
        [cart.id]
      );

      if (updatedCarts.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar carrito'
        });
      }

      const updatedCart = updatedCarts[0];

      // Obtener items actualizados con stock real
      const items = await query(
        'SELECT ci.*, p.name as product_name, p.price, p.image_url, p.stock_total FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?',
        [cart.id]
      );

      // Calcular totales
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      const cartData = {
        id: updatedCart.id,
        userId: updatedCart.user_id,
        sessionId: updatedCart.session_id,
        cartType: updatedCart.cart_type,
        status: updatedCart.status,
        items: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image_url: item.image_url
          }
        })),
        total,
        itemCount,
        createdAt: updatedCart.created_at,
        updatedAt: updatedCart.updated_at
      };

      res.json({
        success: true,
        data: cartData
      });

    } catch (error) {
      console.error('Error removiendo item:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Limpiar carrito completo
  async clearCart(req, res) {
    try {
      const { userId, sessionId } = req.body;
      
      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId o sessionId'
        });
      }

      // Buscar carrito
      let cartQuery = '';
      let cartParams = [];
      
      if (userId) {
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND (status = "active" OR status = "completed") ORDER BY created_at DESC LIMIT 1';
        cartParams = [userId];
      } else {
        cartQuery = 'SELECT * FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
      }

      const carts = await query(cartQuery, cartParams);
      
      if (carts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado'
        });
      }

      const cart = carts[0];

      // Obtener items antes de eliminarlos para restaurar stock
      const cartItems = await query(
        'SELECT product_id, quantity FROM cart_items_unified WHERE cart_id = ?',
        [cart.id]
      );

      // Restaurar stock de cada producto
      for (const item of cartItems) {
        await query(
          'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
        console.log(`🔄 [UnifiedCart] Stock restaurado: +${item.quantity} para producto ${item.product_id}`);
        
        // Verificar stock actualizado
        const [stockResult] = await query(
          'SELECT stock_total FROM products WHERE id = ?',
          [item.product_id]
        );
        console.log(`📊 [UnifiedCart] Stock actualizado del producto ${item.product_id}: ${stockResult.stock_total}`);
      }

      // Remover todos los items
      await query(
        'DELETE FROM cart_items_unified WHERE cart_id = ?',
        [cart.id]
      );

      // Obtener carrito actualizado
      const updatedCarts = await query(
        'SELECT * FROM carts_unified WHERE id = ?',
        [cart.id]
      );

      if (updatedCarts.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al actualizar carrito'
        });
      }

      const updatedCart = updatedCarts[0];

      const cartData = {
        id: updatedCart.id,
        userId: updatedCart.user_id,
        sessionId: updatedCart.session_id,
        cartType: updatedCart.cart_type,
        status: updatedCart.status,
        items: [],
        total: 0,
        itemCount: 0,
        createdAt: updatedCart.created_at,
        updatedAt: updatedCart.updated_at
      };

      res.json({
        success: true,
        data: cartData
      });

    } catch (error) {
      console.error('Error limpiando carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new UnifiedCartController(); 