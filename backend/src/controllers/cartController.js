const { query, getConnection } = require('../config/database');

// Obtener carrito del usuario
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener carrito activo del usuario
    const carts = await query(`
      SELECT id, status, created_at, updated_at
      FROM carts 
      WHERE user_id = ? AND status = 'open'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    let cart;
    let cartItems = [];

    if (carts.length === 0) {
      // Crear nuevo carrito si no existe
      const result = await query(
        'INSERT INTO carts (user_id, status) VALUES (?, ?)',
        [userId, 'open']
      );
      cart = {
        id: result.insertId,
        user_id: userId,
        status: 'open',
        created_at: new Date(),
        updated_at: new Date()
      };
    } else {
      cart = carts[0];
      
      // Obtener items del carrito
      cartItems = await query(`
        SELECT 
          ci.id,
          ci.quantity,
          ci.reserved_until,
          p.id as product_id,
          p.name,
          p.description,
          p.price,
          p.image_url,
          p.stock_total,
          pt.name as product_type_name,
          c.name as category_name
        FROM cart_items ci
        INNER JOIN products p ON ci.product_id = p.id
        INNER JOIN product_types pt ON p.product_type_id = pt.id
        INNER JOIN categories c ON pt.category_id = c.id
        WHERE ci.cart_id = ?
        ORDER BY ci.id DESC
      `, [cart.id]);
    }

    // Calcular total del carrito
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        cart: {
          ...cart,
          total: parseFloat(total.toFixed(2)),
          item_count: cartItems.length
        },
        items: cartItems
      }
    });

  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Agregar producto al carrito
const addItemToCart = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    // Validar que el producto existe y tiene stock
    const products = await connection.execute(`
      SELECT id, name, price, stock_total, status 
      FROM products 
      WHERE id = ? AND status = 'active'
    `, [product_id]);

    if (products[0].length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const product = products[0][0];

    // Verificar stock disponible
    if (product.stock_total < quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Solo hay ${product.stock_total} unidades disponibles`
      });
    }

    // Obtener o crear carrito activo
    let carts = await connection.execute(`
      SELECT id FROM carts 
      WHERE user_id = ? AND status = 'open'
      LIMIT 1
    `, [userId]);

    let cartId;
    if (carts[0].length === 0) {
      const result = await connection.execute(
        'INSERT INTO carts (user_id, status) VALUES (?, ?)',
        [userId, 'open']
      );
      cartId = result[0].insertId;
    } else {
      cartId = carts[0][0].id;
    }

    // Verificar si el producto ya está en el carrito
    const existingItems = await connection.execute(`
      SELECT id, quantity FROM cart_items 
      WHERE cart_id = ? AND product_id = ?
    `, [cartId, product_id]);

    if (existingItems[0].length > 0) {
      // Actualizar cantidad existente
      const newQuantity = existingItems[0][0].quantity + quantity;
      
      if (newQuantity > product.stock_total) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para agregar ${quantity} unidades más`
        });
      }

      await connection.execute(`
        UPDATE cart_items 
        SET quantity = ?, reserved_until = DATE_ADD(NOW(), INTERVAL 7 DAY)
        WHERE id = ?
      `, [newQuantity, existingItems[0][0].id]);
    } else {
      // Agregar nuevo item
      await connection.execute(`
        INSERT INTO cart_items (cart_id, product_id, quantity, reserved_until)
        VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `, [cartId, product_id, quantity]);
    }

    // Actualizar timestamp del carrito
    await connection.execute(`
      UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [cartId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Producto agregado al carrito exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error agregando item al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Actualizar cantidad de item en el carrito
const updateItemQuantity = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { id: itemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Verificar que el item pertenece al usuario
    const items = await connection.execute(`
      SELECT ci.id, ci.quantity, p.stock_total, p.name
      FROM cart_items ci
      INNER JOIN carts c ON ci.cart_id = c.id
      INNER JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ? AND c.user_id = ? AND c.status = 'open'
    `, [itemId, userId]);

    if (items[0].length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Item del carrito no encontrado'
      });
    }

    const item = items[0][0];

    // Verificar stock disponible
    if (quantity > item.stock_total) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Solo hay ${item.stock_total} unidades disponibles`
      });
    }

    // Actualizar cantidad
    await connection.execute(`
      UPDATE cart_items 
      SET quantity = ?, reserved_until = DATE_ADD(NOW(), INTERVAL 7 DAY)
      WHERE id = ?
    `, [quantity, itemId]);

    // Actualizar timestamp del carrito
    await connection.execute(`
      UPDATE carts c
      INNER JOIN cart_items ci ON c.id = ci.cart_id
      SET c.updated_at = CURRENT_TIMESTAMP
      WHERE ci.id = ?
    `, [itemId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Cantidad actualizada exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando cantidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Remover item del carrito
const removeItemFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: itemId } = req.params;

    // Verificar que el item pertenece al usuario
    const items = await query(`
      SELECT ci.id
      FROM cart_items ci
      INNER JOIN carts c ON ci.cart_id = c.id
      WHERE ci.id = ? AND c.user_id = ? AND c.status = 'open'
    `, [itemId, userId]);

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item del carrito no encontrado'
      });
    }

    // Eliminar item
    await query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    // Actualizar timestamp del carrito
    await query(`
      UPDATE carts c
      INNER JOIN cart_items ci ON c.id = ci.cart_id
      SET c.updated_at = CURRENT_TIMESTAMP
      WHERE ci.id = ?
    `, [itemId]);

    res.json({
      success: true,
      message: 'Producto removido del carrito exitosamente'
    });

  } catch (error) {
    console.error('Error removiendo item del carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Limpiar carrito completo
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener carrito activo
    const carts = await query(`
      SELECT id FROM carts 
      WHERE user_id = ? AND status = 'open'
      LIMIT 1
    `, [userId]);

    if (carts.length === 0) {
      return res.json({
        success: true,
        message: 'El carrito ya está vacío'
      });
    }

    // Eliminar todos los items del carrito
    await query('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id]);

    // Actualizar timestamp del carrito
    await query(`
      UPDATE carts 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [carts[0].id]);

    res.json({
      success: true,
      message: 'Carrito limpiado exitosamente'
    });

  } catch (error) {
    console.error('Error limpiando carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Enviar carrito por WhatsApp (simular)
const sendCartToWhatsApp = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener carrito con items
    const carts = await query(`
      SELECT id, created_at
      FROM carts 
      WHERE user_id = ? AND status = 'open'
      LIMIT 1
    `, [userId]);

    if (carts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay carrito activo para enviar'
      });
    }

    const cart = carts[0];

    // Obtener items del carrito
    const cartItems = await query(`
      SELECT 
        ci.quantity,
        p.name,
        p.price,
        pt.name as product_type_name
      FROM cart_items ci
      INNER JOIN products p ON ci.product_id = p.id
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      WHERE ci.cart_id = ?
      ORDER BY p.name
    `, [cart.id]);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // Calcular total
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Generar mensaje de WhatsApp
    let message = `🛒 *PEDIDO DE COSMÉTICOS*\n\n`;
    message += `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
    message += `⏰ Hora: ${new Date().toLocaleTimeString('es-ES')}\n\n`;
    message += `📋 *PRODUCTOS:*\n`;
    
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name} (${item.product_type_name})\n`;
      message += `   Cantidad: ${item.quantity} x $${item.price}\n`;
      message += `   Subtotal: $${(item.quantity * item.price).toFixed(2)}\n\n`;
    });
    
    message += `💰 *TOTAL: $${total.toFixed(2)}*\n\n`;
    message += `📱 *Enviado desde la app de Cosméticos*\n`;
    message += `🔗 Link para confirmar: [Pendiente de implementar]`;

    // Marcar carrito como enviado
    await query(`
      UPDATE carts 
      SET status = 'sent', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [cart.id]);

    // Aquí se integraría con la API de WhatsApp
    // Por ahora solo simulamos el envío

    res.json({
      success: true,
      message: 'Carrito enviado por WhatsApp exitosamente',
      data: {
        whatsapp_message: message,
        cart_id: cart.id,
        total: parseFloat(total.toFixed(2)),
        item_count: cartItems.length
      }
    });

  } catch (error) {
    console.error('Error enviando carrito por WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCart,
  sendCartToWhatsApp
}; 