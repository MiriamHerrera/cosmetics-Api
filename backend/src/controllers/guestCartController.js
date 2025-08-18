const { query } = require('../config/database');
const crypto = require('crypto');

// Carrito de usuarios invitados - solo maneja stock
class GuestCartController {
  
  // Generar ID de sesión único para invitados
  generateSessionId = () => {
    return crypto.randomBytes(16).toString('hex');
  }

  // Obtener o crear carrito de invitado
  getOrCreateGuestCart = async (sessionId) => {
    try {
      // Buscar carrito existente
      let [cart] = await query(
        'SELECT id FROM guest_carts WHERE session_id = ?',
        [sessionId]
      );

      if (!cart) {
        // Crear nuevo carrito
        const result = await query(
          'INSERT INTO guest_carts (session_id) VALUES (?)',
          [sessionId]
        );
        cart = { id: result.insertId };
      }

      return cart;
    } catch (error) {
      console.error('Error obteniendo/creando carrito invitado:', error);
      throw error;
    }
  }

  // Agregar producto al carrito invitado (reserva stock)
  addItemToGuestCart = async (req, res) => {
    try {
      console.log('🔍 Iniciando addItemToGuestCart...');
      const { productId, quantity, sessionId } = req.body;
      
      console.log('📦 Datos recibidos:', { productId, quantity, sessionId });
      
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Producto ID y cantidad son requeridos'
        });
      }

      // Generar sessionId si no se proporciona
      const guestSessionId = sessionId || this.generateSessionId();
      console.log('🆔 Session ID generado:', guestSessionId);

      // Verificar stock disponible
      console.log('🔍 Verificando stock para producto:', productId);
      const [product] = await query(
        'SELECT id, name, stock_total, price FROM products WHERE id = ? AND status = "active"',
        [productId]
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      console.log('📦 Producto encontrado:', product);

      if (product.stock_total < quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Solo hay ${product.stock_total} unidades disponibles`
        });
      }

      // Obtener o crear carrito de invitado
      console.log('🛒 Obteniendo/creando carrito...');
      const cart = await this.getOrCreateGuestCart(guestSessionId);
      console.log('🛒 Carrito obtenido:', cart);

      // Verificar si el producto ya está en el carrito
      console.log('🔍 Verificando si producto ya está en carrito...');
      const [existingItem] = await query(
        'SELECT id, quantity FROM guest_cart_items WHERE guest_cart_id = ? AND product_id = ?',
        [cart.id, productId]
      );

      if (existingItem) {
        console.log('📝 Actualizando cantidad existente...');
        // Actualizar cantidad existente
        const newQuantity = existingItem.quantity + quantity;
        await query(
          'UPDATE guest_cart_items SET quantity = ? WHERE id = ?',
          [newQuantity, existingItem.id]
        );
      } else {
        console.log('➕ Agregando nuevo item al carrito...');
        // Agregar nuevo item al carrito
        await query(
          'INSERT INTO guest_cart_items (guest_cart_id, product_id, quantity, reserved_until) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
          [cart.id, productId, quantity]
        );
      }

      // Reservar stock (reducir stock disponible)
      console.log('📉 Reduciendo stock...');
      await query(
        'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
        [quantity, productId]
      );

      // Obtener stock actualizado
      const [updatedProduct] = await query(
        'SELECT stock_total FROM products WHERE id = ?',
        [productId]
      );

      console.log(`✅ Producto ${product.name} agregado al carrito invitado: ${quantity} unidades`);

      res.json({
        success: true,
        message: 'Producto agregado al carrito',
        data: {
          sessionId: guestSessionId,
          productId,
          quantity,
          reservedStock: quantity,
          remainingStock: updatedProduct.stock_total,
          totalPrice: product.price * quantity
        }
      });

    } catch (error) {
      console.error('❌ Error completo en addItemToGuestCart:', error);
      console.error('❌ Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar cantidad en carrito invitado
  updateGuestCartItemQuantity = async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, sessionId } = req.body;
      
      if (!quantity || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad válida es requerida'
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID es requerido'
        });
      }

      // Obtener carrito de invitado
      const [cart] = await query(
        'SELECT id FROM guest_carts WHERE session_id = ?',
        [sessionId]
      );

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado'
        });
      }

      // Obtener item del carrito
      const [cartItem] = await query(
        'SELECT id, quantity, product_id FROM guest_cart_items WHERE guest_cart_id = ? AND product_id = ?',
        [cart.id, id]
      );

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Item no encontrado en el carrito'
        });
      }

      // Obtener información del producto
      const [product] = await query(
        'SELECT id, name, stock_total, price FROM products WHERE id = ? AND status = "active"',
        [id]
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      if (quantity === 0) {
        // Remover item del carrito y liberar stock
        await query(
          'DELETE FROM guest_cart_items WHERE id = ?',
          [cartItem.id]
        );

        // Liberar stock reservado
        await query(
          'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
          [cartItem.quantity, id]
        );

        res.json({
          success: true,
          message: 'Item removido del carrito',
          data: { productId: id, quantity: 0 }
        });
        return;
      }

      // Calcular diferencia de cantidad
      const quantityDiff = quantity - cartItem.quantity;

      if (quantityDiff > 0) {
        // Aumentando cantidad - verificar stock disponible
        if (product.stock_total < quantityDiff) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente. Solo hay ${product.stock_total} unidades disponibles`
          });
        }

        // Reservar stock adicional
        await query(
          'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
          [quantityDiff, id]
        );
      } else if (quantityDiff < 0) {
        // Reduciendo cantidad - liberar stock
        await query(
          'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
          [Math.abs(quantityDiff), id]
        );
      }

      // Actualizar cantidad en el carrito
      await query(
        'UPDATE guest_cart_items SET quantity = ? WHERE id = ?',
        [quantity, cartItem.id]
      );

      // Obtener stock actualizado
      const [updatedProduct] = await query(
        'SELECT stock_total FROM products WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Cantidad actualizada',
        data: {
          productId: id,
          quantity,
          remainingStock: updatedProduct.stock_total,
          totalPrice: product.price * quantity
        }
      });

    } catch (error) {
      console.error('Error actualizando cantidad en carrito invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Remover item del carrito invitado (libera stock)
  removeItemFromGuestCart = async (req, res) => {
    try {
      const { id } = req.params;
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID es requerido'
        });
      }

      // Obtener carrito de invitado
      const [cart] = await query(
        'SELECT id FROM guest_carts WHERE session_id = ?',
        [sessionId]
      );

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado'
        });
      }

      // Obtener item del carrito
      const [cartItem] = await query(
        'SELECT id, quantity, product_id FROM guest_cart_items WHERE guest_cart_id = ? AND product_id = ?',
        [cart.id, id]
      );

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Item no encontrado en el carrito'
        });
      }

      // Remover item del carrito
      await query(
        'DELETE FROM guest_cart_items WHERE id = ?',
        [cartItem.id]
      );

      // Liberar stock reservado
      await query(
        'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
        [cartItem.quantity, id]
      );

      console.log(`✅ Item removido del carrito invitado: ${id}, stock liberado: ${cartItem.quantity}`);

      res.json({
        success: true,
        message: 'Item removido del carrito',
        data: { 
          productId: id, 
          quantity: 0,
          stockReleased: cartItem.quantity
        }
      });

    } catch (error) {
      console.error('Error removiendo item del carrito invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Limpiar carrito invitado completo
  clearGuestCart = async (req, res) => {
    try {
      console.log('🧹 Iniciando limpieza de carrito invitado...');
      const { sessionId } = req.body;
      
      console.log('🆔 Session ID recibido:', sessionId);
      
      if (!sessionId) {
        console.log('❌ No se proporcionó sessionId');
        return res.status(400).json({
          success: false,
          message: 'Session ID es requerido'
        });
      }

      // Obtener carrito de invitado
      console.log('🔍 Buscando carrito para sessionId:', sessionId);
      const [cart] = await query(
        'SELECT id FROM guest_carts WHERE session_id = ?',
        [sessionId]
      );

      if (!cart) {
        console.log('❌ Carrito no encontrado para sessionId:', sessionId);
        return res.status(404).json({
          success: false,
          message: 'Carrito no encontrado'
        });
      }

      console.log('✅ Carrito encontrado con ID:', cart.id);

      // Obtener todos los items del carrito para liberar stock
      console.log('📦 Obteniendo items del carrito...');
      const cartItems = await query(
        'SELECT product_id, quantity FROM guest_cart_items WHERE guest_cart_id = ?',
        [cart.id]
      );

      console.log(`📋 Items encontrados: ${cartItems.length}`, cartItems);

      if (cartItems.length === 0) {
        console.log('⚠️ Carrito vacío, no hay stock que restaurar');
      } else {
        // Liberar todo el stock reservado
        console.log('💰 Restaurando stock...');
        for (const item of cartItems) {
          try {
            // Obtener stock actual antes de restaurar
            const [currentStock] = await query(
              'SELECT stock_total, name FROM products WHERE id = ?',
              [item.product_id]
            );
            
            console.log(`📊 Producto ID ${item.product_id} (${currentStock.name}):`);
            console.log(`   Stock actual: ${currentStock.stock_total}`);
            console.log(`   Cantidad a restaurar: ${item.quantity}`);
            console.log(`   Stock después de restaurar: ${currentStock.stock_total + item.quantity}`);

            // Restaurar stock
            const result = await query(
              'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );

            console.log(`✅ Stock restaurado para producto ${item.product_id}:`, result);

            // Verificar stock después de la actualización
            const [updatedStock] = await query(
              'SELECT stock_total FROM products WHERE id = ?',
              [item.product_id]
            );
            console.log(`   Stock verificado después de restaurar: ${updatedStock.stock_total}`);

          } catch (error) {
            console.error(`❌ Error restaurando stock del producto ${item.product_id}:`, error);
          }
        }
      }

      // Eliminar todos los items del carrito
      console.log('🗑️ Eliminando items del carrito...');
      const deletedItems = await query(
        'DELETE FROM guest_cart_items WHERE guest_cart_id = ?',
        [cart.id]
      );
      console.log(`✅ Items eliminados: ${deletedItems.affectedRows}`);

      // Eliminar el carrito
      console.log('🗑️ Eliminando carrito...');
      const deletedCart = await query(
        'DELETE FROM guest_carts WHERE id = ?',
        [cart.id]
      );
      console.log(`✅ Carrito eliminado: ${deletedCart.affectedRows}`);
      
      const totalStockReleased = cartItems.reduce((total, item) => total + item.quantity, 0);
      console.log(`✅ Carrito invitado limpiado, stock liberado: ${totalStockReleased} unidades`);

      res.json({
        success: true,
        message: 'Carrito limpiado',
        data: { 
          cleared: true,
          stockReleased: totalStockReleased,
          itemsCleaned: cartItems.length
        }
      });

    } catch (error) {
      console.error('❌ Error limpiando carrito invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener carrito de invitado
  getGuestCart = async (req, res) => {
    try {
      const { sessionId } = req.query;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID es requerido'
        });
      }

      // Obtener carrito de invitado
      const [cart] = await query(
        'SELECT id, session_id, created_at, updated_at FROM guest_carts WHERE session_id = ?',
        [sessionId]
      );

      if (!cart) {
        return res.json({
          success: true,
          data: {
            items: [],
            total: 0,
            itemCount: 0
          }
        });
      }

      // Obtener items del carrito con información del producto
      const items = await query(`
        SELECT 
          gci.id,
          gci.product_id,
          gci.quantity,
          gci.reserved_until,
          p.name,
          p.price,
          p.image_url,
          p.stock_total,
          p.category_name
        FROM guest_cart_items gci
        INNER JOIN products p ON gci.product_id = p.id
        WHERE gci.guest_cart_id = ?
        ORDER BY gci.created_at DESC
      `, [cart.id]);

      // Calcular total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      res.json({
        success: true,
        data: {
          sessionId: cart.session_id,
          items,
          total,
          itemCount,
          createdAt: cart.created_at,
          updatedAt: cart.updated_at
        }
      });

    } catch (error) {
      console.error('Error obteniendo carrito invitado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar stock disponible de un producto
  checkProductStock = async (req, res) => {
    try {
      const { productId } = req.params;
      
      const [product] = await query(
        'SELECT id, name, stock_total, price FROM products WHERE id = ? AND status = "active"',
        [productId]
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          productId: product.id,
          name: product.name,
          availableStock: product.stock_total,
          price: product.price
        }
      });

    } catch (error) {
      console.error('Error verificando stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Limpiar carritos expirados automáticamente (1 hora)
  cleanupExpiredCarts = async () => {
    try {
      console.log('🧹 Iniciando limpieza automática de carritos expirados (1 hora)...');
      
      // Buscar carritos con items expirados (más de 1 hora)
      const expiredItems = await query(`
        SELECT 
          gci.id,
          gci.guest_cart_id,
          gci.product_id,
          gci.quantity,
          gci.reserved_until,
          p.name as product_name
        FROM guest_cart_items gci
        INNER JOIN products p ON gci.product_id = p.id
        WHERE gci.reserved_until < (NOW() - INTERVAL 1 HOUR)
      `);

      if (expiredItems.length === 0) {
        console.log('✅ No hay carritos expirados para limpiar');
        return {
          success: true,
          message: 'No hay carritos expirados',
          cleaned: 0,
          stockRestored: 0
        };
      }

      console.log(`🔍 Encontrados ${expiredItems.length} items expirados`);

      let totalStockRestored = 0;
      let cleanedItems = 0;

      // Liberar stock de cada item expirado
      for (const item of expiredItems) {
        try {
          // Restaurar stock del producto
          await query(
            'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          totalStockRestored += item.quantity;
          cleanedItems++;

          console.log(`✅ Stock restaurado: ${item.quantity} unidades de "${item.product_name}" (ID: ${item.product_id})`);
        } catch (error) {
          console.error(`❌ Error restaurando stock del producto ${item.product_id}:`, error);
        }
      }

      // Eliminar items expirados
      const deletedItems = await query(
        'DELETE FROM guest_cart_items WHERE reserved_until < (NOW() - INTERVAL 1 HOUR)'
      );

      // Eliminar carritos vacíos
      const deletedCarts = await query(`
        DELETE gc FROM guest_carts gc
        LEFT JOIN guest_cart_items gci ON gc.id = gci.guest_cart_id
        WHERE gci.id IS NULL
      `);

      console.log(`🧹 Limpieza completada: ${deletedItems.affectedRows} items eliminados, ${deletedCarts.affectedRows} carritos eliminados, ${totalStockRestored} stock restaurado`);

      return {
        success: true,
        message: 'Limpieza completada exitosamente',
        cleaned: cleanedItems,
        stockRestored: totalStockRestored,
        deletedItems: deletedItems.affectedRows,
        deletedCarts: deletedCarts.affectedRows
      };

    } catch (error) {
      console.error('❌ Error en limpieza automática:', error);
      return {
        success: false,
        message: 'Error en limpieza automática',
        error: error.message
      };
    }
  }

  // Limpiar carritos expirados manualmente (para testing)
  manualCleanup = async (req, res) => {
    try {
      console.log('🔧 Iniciando limpieza manual de carritos expirados...');
      
      const result = await this.cleanupExpiredCarts();
      
      res.json({
        success: true,
        message: 'Limpieza manual ejecutada',
        data: result
      });

    } catch (error) {
      console.error('Error en limpieza manual:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de carritos activos
  getGuestCartStats = async (req, res) => {
    try {
      const [stats] = await query(`
        SELECT 
          COUNT(DISTINCT gc.id) as activeCarts,
          COUNT(gci.id) as totalItems,
          SUM(gci.quantity) as totalReservedStock
        FROM guest_carts gc
        LEFT JOIN guest_cart_items gci ON gc.id = gci.guest_cart_id
        WHERE gci.reserved_until > NOW()
      `);

      res.json({
        success: true,
        data: {
          activeCarts: stats.activeCarts || 0,
          totalItems: stats.totalItems || 0,
          totalReservedStock: stats.totalReservedStock || 0
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new GuestCartController(); 