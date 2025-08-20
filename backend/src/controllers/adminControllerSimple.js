const { query } = require('../config/database');

// Dashboard simplificado para evitar errores
const getDashboardSimple = async (req, res) => {
  try {
    console.log('🔍 Iniciando dashboard simplificado...');
    
    // Solo consultas básicas y seguras
    let dashboardData = {
      today_stats: {
        new_users_today: 0,
        new_carts_today: 0,
        new_reservations_today: 0,
        new_votes_today: 0
      },
      week_stats: {
        new_users_week: 0,
        new_carts_week: 0,
        new_reservations_week: 0,
        new_votes_week: 0,
        completed_orders_week: 0
      },
      low_stock_products: [],
      expiring_reservations: [],
      recent_activity: [],
      top_products_today: [],
      last_updated: new Date().toISOString()
    };
    
    try {
      // Contar usuarios totales
      const totalUsers = await query('SELECT COUNT(*) as total FROM users WHERE role = "client"');
      dashboardData.total_users = totalUsers[0]?.total || 0;
      console.log('✅ Usuarios totales:', dashboardData.total_users);
    } catch (error) {
      console.error('❌ Error contando usuarios:', error.message);
      dashboardData.total_users = 0;
    }
    
    try {
      // Contar productos totales
      const totalProducts = await query('SELECT COUNT(*) as total FROM products WHERE status = "active"');
      dashboardData.total_products = totalProducts[0]?.total || 0;
      console.log('✅ Productos totales:', dashboardData.total_products);
    } catch (error) {
      console.error('❌ Error contando productos:', error.message);
      dashboardData.total_products = 0;
    }
    
    try {
      // Contar carritos activos
      const activeCarts = await query('SELECT COUNT(*) as total FROM carts WHERE status = "active"');
      dashboardData.active_carts = activeCarts[0]?.total || 0;
      console.log('✅ Carritos activos:', dashboardData.active_carts);
    } catch (error) {
      console.error('❌ Error contando carritos:', error.message);
      dashboardData.active_carts = 0;
    }
    
    try {
      // Contar reservas activas
      const activeReservations = await query('SELECT COUNT(*) as total FROM reservations WHERE status = "active"');
      dashboardData.active_reservations = activeReservations[0]?.total || 0;
      console.log('✅ Reservas activas:', dashboardData.active_reservations);
    } catch (error) {
      console.error('❌ Error contando reservas:', error.message);
      dashboardData.active_reservations = 0;
    }
    
    res.json({
      success: true,
      data: dashboardData
    });
    
    console.log('✅ Dashboard simplificado cargado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en dashboard simplificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
};

// Gestión de usuarios
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const whereParams = [];

    if (search) {
      whereClause += ' AND (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)';
      whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND u.role = ?';
      whereParams.push(role);
    }

    if (status) {
      whereClause += ' AND u.is_active = ?';
      whereParams.push(status === 'active' ? 1 : 0);
    }

    // Obtener usuarios
    const users = await query(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...whereParams, parseInt(limit), offset]);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `, whereParams);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar estado de usuario
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Verificar que el usuario existe
    const users = await query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir desactivar administradores
    if (users[0].role === 'admin' && !is_active) {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar un administrador'
      });
    }

    // Actualizar estado
    await query(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: 'Estado de usuario actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de productos
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const whereParams = [];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      whereParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND c.name = ?';
      whereParams.push(category);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      whereParams.push(status);
    }

    // Obtener productos
    const products = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock_total,
        p.status,
        p.image_url,
        p.created_at,
        p.updated_at,
        pt.name as product_type,
        c.name as category
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      LEFT JOIN categories c ON pt.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...whereParams, parseInt(limit), offset]);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      LEFT JOIN categories c ON pt.category_id = c.id
      ${whereClause}
    `, whereParams);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear producto
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock_total, product_type_id, image_url, status = 'active' } = req.body;

    // Validaciones básicas
    if (!name || !price || !product_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio y tipo de producto son requeridos'
      });
    }

    // Crear producto
    const result = await query(`
      INSERT INTO products (name, description, price, stock_total, product_type_id, image_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description, price, stock_total || 0, product_type_id, image_url, status]);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_total, product_type_id, image_url, status } = req.body;

    // Verificar que el producto existe
    const products = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Actualizar producto
    await query(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock_total = ?, 
          product_type_id = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, price, stock_total, product_type_id, image_url, status, id]);

    res.json({
      success: true,
      message: 'Producto actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const products = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Eliminar producto (soft delete - cambiar status a inactive)
    await query('UPDATE products SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getDashboardSimple,
  getUsers,
  updateUserStatus,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
}; 