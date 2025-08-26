const { query, getConnection } = require('../config/database');

class UnifiedCartController {
  // Obtener carrito (usuario autenticado o invitado)
  async getCart(req, res) {
    try {
      console.log('🛒 [UnifiedCart] getCart iniciado');
      console.log('📝 [UnifiedCart] Body recibido:', req.body);
      
      const { userId, sessionId } = req.body;
      
      console.log('👤 [UnifiedCart] userId:', userId);
      console.log('🔑 [UnifiedCart] sessionId:', sessionId);
      
          if (!userId && !sessionId) {
      console.log('❌ [UnifiedCart] Error: Se requiere userId o sessionId');
      return res.status(400).json({
        success: false,
        message: 'Se requiere userId o sessionId'
      });
    }

    // Si es usuario autenticado, verificar si hay carrito de invitado para migrar
    if (userId && sessionId) {
      console.log('🔄 [UnifiedCart] Usuario autenticado con sessionId, verificando migración...');
      
      // Buscar carrito de invitado
      const guestCarts = await query(
        'SELECT * FROM carts_unified WHERE session_id = ? AND cart_type = "guest" AND status = "active"',
        [sessionId]
      );
      
      if (guestCarts.length > 0) {
        console.log('📦 [UnifiedCart] Carrito de invitado encontrado, iniciando migración...');
        
        // Buscar carrito del usuario
        const userCarts = await query(
          'SELECT * FROM carts_unified WHERE user_id = ? AND cart_type = "registered" AND status = "active"',
          [userId]
        );
        
        let targetCartId;
        
        if (userCarts.length === 0) {
          // Crear carrito para el usuario
          const result = await query(
            'INSERT INTO carts_unified (user_id, cart_type, status) VALUES (?, "registered", "active")',
            [userId]
          );
          targetCartId = result.insertId;
          console.log('✅ [UnifiedCart] Nuevo carrito creado para usuario:', targetCartId);
        } else {
          targetCartId = userCarts[0].id;
          console.log('✅ [UnifiedCart] Usando carrito existente del usuario:', targetCartId);
        }
        
        // Migrar items del carrito de invitado al carrito del usuario
        await query(
          'UPDATE cart_items_unified SET cart_id = ? WHERE cart_id = ?',
          [targetCartId, guestCarts[0].id]
        );
        console.log('🔄 [UnifiedCart] Items migrados al carrito del usuario');
        
        // Marcar carrito de invitado como migrado
        await query(
          'UPDATE carts_unified SET status = "migrated" WHERE id = ?',
          [guestCarts[0].id]
        );
        console.log('✅ [UnifiedCart] Carrito de invitado marcado como migrado');
      }
    }

      // Buscar carrito en la tabla unificada
      let cartQuery = '';
      let cartParams = [];
      
      if (userId) {
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND status = "active"';
        cartParams = [userId];
        console.log('🔍 [UnifiedCart] Buscando carrito para usuario:', userId);
      } else {
        cartQuery = 'SELECT * FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
        console.log('🔍 [UnifiedCart] Buscando carrito para sesión:', sessionId);
      }

      console.log('📝 [UnifiedCart] Query:', cartQuery);
      console.log('📝 [UnifiedCart] Params:', cartParams);

      const carts = await query(cartQuery, cartParams);
      
      console.log('📊 [UnifiedCart] Carritos encontrados:', carts.length);
      
      if (carts.length === 0) {
        console.log('🆕 [UnifiedCart] Creando carrito vacío');
        
        // Crear carrito vacío si no existe
        let createQuery = '';
        let createParams = [];
        
        if (userId) {
          createQuery = 'INSERT INTO carts_unified (user_id, cart_type, status) VALUES (?, "registered", "active")';
          createParams = [userId];
        } else {
          createQuery = 'INSERT INTO carts_unified (session_id, cart_type, status, expires_at) VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 HOUR))';
          createParams = [sessionId];
        }
        
        console.log('📝 [UnifiedCart] Query de creación:', createQuery);
        console.log('📝 [UnifiedCart] Params de creación:', createParams);
        
        const result = await query(createQuery, createParams);
        const cartId = result.insertId;
        
        console.log('✅ [UnifiedCart] Carrito creado con ID:', cartId);
        
        return res.json({
          success: true,
          data: {
            id: cartId,
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
      
      // Obtener items del carrito
      const itemsQuery = 'SELECT ci.*, p.name as product_name, p.price, p.image_url FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?';
      console.log('📝 [UnifiedCart] Query de items:', itemsQuery);
      console.log('📝 [UnifiedCart] Cart ID para items:', cart.id);
      
      const items = await query(itemsQuery, [cart.id]);
      
      console.log('📊 [UnifiedCart] Items encontrados:', items.length);

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

      console.log('✅ [UnifiedCart] Carrito preparado para respuesta:', cartData);

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
      const { productId, quantity, userId, sessionId } = req.body;
      
      if (!productId || !quantity || (!userId && !sessionId)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere productId, quantity y userId o sessionId'
        });
      }

      // Verificar que el producto existe y tiene stock
      const products = await query(
        'SELECT * FROM products WHERE id = ? AND is_approved = 1',
        [productId]
      );

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado o no aprobado'
        });
      }

      const product = products[0];
      if (product.stock_total < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente'
        });
      }

      // Buscar o crear carrito
      let cartQuery = '';
      let cartParams = [];
      
      if (userId) {
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND status = "active"';
        cartParams = [userId];
      } else {
        cartQuery = 'SELECT * FROM carts_unified WHERE session_id = ? AND status = "active"';
        cartParams = [sessionId];
      }

      const carts = await query(cartQuery, cartParams);
      let cartId;

      if (carts.length === 0) {
        // Crear carrito si no existe
        let createQuery = '';
        let createParams = [];
        
        if (userId) {
          createQuery = 'INSERT INTO carts_unified (user_id, cart_type, status) VALUES (?, "registered", "active")';
          createParams = [userId];
        } else {
          createQuery = 'INSERT INTO carts_unified (session_id, cart_type, status, expires_at) VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 HOUR))';
          createParams = [sessionId];
        }
        
        const result = await query(createQuery, createParams);
        cartId = result.insertId;
      } else {
        cartId = carts[0].id;
      }

      // Verificar si el item ya existe
      const existingItems = await query(
        'SELECT * FROM cart_items_unified WHERE cart_id = ? AND product_id = ?',
        [cartId, productId]
      );

      if (existingItems.length > 0) {
        // Actualizar cantidad
        const newQuantity = existingItems[0].quantity + quantity;
        await query(
          'UPDATE cart_items_unified SET quantity = ? WHERE cart_id = ? AND product_id = ?',
          [newQuantity, cartId, productId]
        );
        
        // Reservar stock adicional
        await query(
          'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
          [quantity, productId]
        );
        console.log(`🔄 [UnifiedCart] Stock reservado: -${quantity} para producto ${productId}`);
      } else {
        // Agregar nuevo item
        await query(
          'INSERT INTO cart_items_unified (cart_id, product_id, quantity, reserved_until) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
          [cartId, productId, quantity]
        );
        
        // Reservar stock
        await query(
          'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
          [quantity, productId]
        );
        console.log(`🔄 [UnifiedCart] Stock reservado: -${quantity} para producto ${productId}`);
      }

      // Obtener carrito actualizado
      const updatedCarts = await query(
        'SELECT * FROM carts_unified WHERE id = ?',
        [cartId]
      );

      if (updatedCarts.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al crear carrito'
        });
      }

      const cart = updatedCarts[0];

      // Obtener items actualizados
      const items = await query(
        'SELECT ci.*, p.name as product_name, p.price, p.image_url FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?',
        [cartId]
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
      console.error('Error agregando item al carrito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
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

      // Verificar si el usuario ya tiene un carrito activo
      const userCarts = await query(
        'SELECT * FROM carts_unified WHERE user_id = ? AND cart_type = "registered" AND status = "active"',
        [userId]
      );

      let targetCartId;

      if (userCarts.length === 0) {
        // Crear nuevo carrito para el usuario
        const result = await query(
          'INSERT INTO carts_unified (user_id, cart_type, status) VALUES (?, "registered", "active")',
          [userId]
        );
        targetCartId = result.insertId;
      } else {
        targetCartId = userCarts[0].id;
      }

      // Migrar items del carrito de invitado al carrito del usuario
      await query(
        'UPDATE cart_items_unified SET cart_id = ? WHERE cart_id = ?',
        [targetCartId, guestCart.id]
      );

      // Marcar carrito de invitado como migrado
      await query(
        'UPDATE carts_unified SET status = "cleaned" WHERE id = ?',
        [guestCart.id]
      );

      // Obtener carrito migrado
      const migratedCarts = await query(
        'SELECT * FROM carts_unified WHERE id = ?',
        [targetCartId]
      );

      if (migratedCarts.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Error al migrar carrito'
        });
      }

      const cart = migratedCarts[0];

      // Obtener items migrados
      const items = await query(
        'SELECT ci.*, p.name as product_name, p.price, p.image_url FROM cart_items_unified ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = ?',
        [targetCartId]
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
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND status = "active"';
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

        // Ajustar stock según la diferencia
        if (quantityDifference !== 0) {
          await query(
            'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
            [quantityDifference, productId]
          );
          console.log(`🔄 [UnifiedCart] Stock ajustado: ${quantityDifference > 0 ? '-' : '+'}${Math.abs(quantityDifference)} para producto ${productId}`);
        }
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
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND status = "active"';
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
        cartQuery = 'SELECT * FROM carts_unified WHERE user_id = ? AND status = "active"';
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