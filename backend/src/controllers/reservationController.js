const { query, getConnection } = require('../config/database');

// Crear apartado (reservación)
const createReservation = async (req, res) => {
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

    // Verificar si ya existe una reservación activa del mismo usuario para el mismo producto
    const existingReservations = await connection.execute(`
      SELECT id, quantity, expires_at
      FROM reservations 
      WHERE user_id = ? AND product_id = ? AND status = 'active'
    `, [userId, product_id]);

    if (existingReservations[0].length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una reservación activa para este producto'
      });
    }

    // Crear reservación por 7 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const result = await connection.execute(`
      INSERT INTO reservations (user_id, product_id, quantity, expires_at, status)
      VALUES (?, ?, ?, ?, 'active')
    `, [userId, product_id, quantity, expiresAt]);

    // Reducir stock disponible
    await connection.execute(`
      UPDATE products 
      SET stock_total = stock_total - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [quantity, product_id]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Producto apartado exitosamente por 7 días',
      data: {
        reservation_id: result[0].insertId,
        product_name: product.name,
        quantity,
        expires_at: expiresAt,
        total_price: (product.price * quantity).toFixed(2)
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creando apartado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Obtener apartados del usuario
const getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id;

    const reservations = await query(`
      SELECT 
        r.id,
        r.quantity,
        r.reserved_at,
        r.expires_at,
        r.status,
        p.id as product_id,
        p.name as product_name,
        p.description,
        p.price,
        p.image_url,
        pt.name as product_type_name,
        c.name as category_name,
        DATEDIFF(r.expires_at, NOW()) as days_remaining
      FROM reservations r
      INNER JOIN products p ON r.product_id = p.id
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.expires_at ASC
    `, [userId]);

    // Calcular total de apartados
    const total = reservations.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    res.json({
      success: true,
      data: {
        reservations,
        total: parseFloat(total.toFixed(2)),
        count: reservations.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo apartados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener apartado específico
const getReservationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const reservations = await query(`
      SELECT 
        r.id,
        r.quantity,
        r.reserved_at,
        r.expires_at,
        r.status,
        p.id as product_id,
        p.name as product_name,
        p.description,
        p.price,
        p.image_url,
        pt.name as product_type_name,
        c.name as category_name,
        DATEDIFF(r.expires_at, NOW()) as days_remaining
      FROM reservations r
      INNER JOIN products p ON r.product_id = p.id
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE r.id = ? AND r.user_id = ?
    `, [id, userId]);

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Apartado no encontrado'
      });
    }

    res.json({
      success: true,
      data: reservations[0]
    });

  } catch (error) {
    console.error('Error obteniendo apartado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cancelar apartado
const cancelReservation = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { id } = req.params;

    // Verificar que la reservación existe y pertenece al usuario
    const reservations = await connection.execute(`
      SELECT id, product_id, quantity, status
      FROM reservations 
      WHERE id = ? AND user_id = ? AND status = 'active'
    `, [id, userId]);

    if (reservations[0].length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Apartado no encontrado o ya cancelado'
      });
    }

    const reservation = reservations[0][0];

    // Marcar como cancelado
    await connection.execute(`
      UPDATE reservations 
      SET status = 'cancelled' 
      WHERE id = ?
    `, [id]);

    // Devolver stock al producto
    await connection.execute(`
      UPDATE products 
      SET stock_total = stock_total + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reservation.quantity, reservation.product_id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Apartado cancelado exitosamente. El stock ha sido devuelto.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error cancelando apartado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Completar apartado (convertir en compra)
const completeReservation = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { id } = req.params;

    // Verificar que la reservación existe y está activa
    const reservations = await connection.execute(`
      SELECT id, product_id, quantity, status
      FROM reservations 
      WHERE id = ? AND user_id = ? AND status = 'active'
    `, [id, userId]);

    if (reservations[0].length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Apartado no encontrado o ya procesado'
      });
    }

    // Marcar como completado
    await connection.execute(`
      UPDATE reservations 
      SET status = 'completed' 
      WHERE id = ?
    `, [id]);

    // Aquí se podría integrar con el sistema de ventas
    // Por ahora solo marcamos como completado

    await connection.commit();

    res.json({
      success: true,
      message: 'Apartado completado exitosamente'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error completando apartado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Obtener apartados expirados (para limpieza automática)
const getExpiredReservations = async (req, res) => {
  try {
    const reservations = await query(`
      SELECT 
        r.id,
        r.user_id,
        r.product_id,
        r.quantity,
        r.expires_at,
        p.name as product_name,
        u.name as user_name,
        u.phone as user_phone
      FROM reservations r
      INNER JOIN products p ON r.product_id = p.id
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.status = 'active' AND r.expires_at < NOW()
      ORDER BY r.expires_at ASC
    `);

    res.json({
      success: true,
      data: reservations
    });

  } catch (error) {
    console.error('Error obteniendo apartados expirados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Limpiar apartados expirados automáticamente
const cleanupExpiredReservations = async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Obtener apartados expirados
    const expiredReservations = await connection.execute(`
      SELECT id, product_id, quantity
      FROM reservations 
      WHERE status = 'active' AND expires_at < NOW()
    `);

    if (expiredReservations[0].length === 0) {
      await connection.rollback();
      return res.json({
        success: true,
        message: 'No hay apartados expirados para limpiar'
      });
    }

    // Marcar como expirados
    await connection.execute(`
      UPDATE reservations 
      SET status = 'expired' 
      WHERE status = 'active' AND expires_at < NOW()
    `);

    // Devolver stock a los productos
    for (const reservation of expiredReservations[0]) {
      await connection.execute(`
        UPDATE products 
        SET stock_total = stock_total + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [reservation.quantity, reservation.product_id]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: `${expiredReservations[0].length} apartados expirados han sido limpiados y el stock devuelto`
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error limpiando apartados expirados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Obtener estadísticas de apartados del usuario
const getUserReservationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await query(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_reservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_reservations,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reservations,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_reservations,
        SUM(quantity) as total_items_reserved
      FROM reservations 
      WHERE user_id = ?
    `, [userId]);

    // Obtener apartados próximos a expirar (5 días o menos)
    const expiringSoon = await query(`
      SELECT 
        r.id,
        r.quantity,
        r.expires_at,
        p.name as product_name,
        DATEDIFF(r.expires_at, NOW()) as days_remaining
      FROM reservations r
      INNER JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ? AND r.status = 'active' AND DATEDIFF(r.expires_at, NOW()) <= 5
      ORDER BY r.expires_at ASC
    `, [userId]);

    res.json({
      success: true,
      data: {
        statistics: stats[0],
        expiring_soon: expiringSoon
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  completeReservation,
  getExpiredReservations,
  cleanupExpiredReservations,
  getUserReservationStats
}; 