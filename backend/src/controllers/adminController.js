const { query, getConnection } = require('../config/database');

// Dashboard principal del administrador
const getDashboard = async (req, res) => {
  try {
    console.log('🔍 Iniciando carga del dashboard...');
    
    // Métricas principales del día
    console.log('📊 Cargando estadísticas del día...');
    const todayStats = await query(`
      SELECT 
        COUNT(DISTINCT u.id) as new_users_today,
        COUNT(DISTINCT c.id) as new_carts_today,
        COUNT(DISTINCT r.id) as new_reservations_today,
        COUNT(DISTINCT sv.id) as new_votes_today
      FROM users u
      LEFT JOIN carts c ON DATE(c.created_at) = CURDATE()
      LEFT JOIN reservations r ON DATE(r.created_at) = CURDATE()
      LEFT JOIN survey_votes sv ON DATE(sv.created_at) = CURDATE()
      WHERE DATE(u.created_at) = CURDATE() AND u.role = 'client'
    `);
    console.log('✅ Estadísticas del día cargadas:', todayStats);

    // Métricas de la semana
    console.log('📊 Cargando estadísticas de la semana...');
    const weekStats = await query(`
      SELECT 
        COUNT(DISTINCT u.id) as new_users_week,
        COUNT(DISTINCT c.id) as new_carts_week,
        COUNT(DISTINCT r.id) as new_reservations_week,
        COUNT(DISTINCT sv.id) as new_votes_week,
        SUM(CASE WHEN c.status = 'sent' THEN 1 ELSE 0 END) as completed_orders_week
      FROM users u
      LEFT JOIN carts c ON c.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      LEFT JOIN reservations r ON r.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      LEFT JOIN survey_votes sv ON sv.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND u.role = 'client'
    `);
    console.log('✅ Estadísticas de la semana cargadas:', weekStats);

    // Productos con bajo stock
    console.log('📦 Cargando productos con bajo stock...');
    const lowStockProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.stock_total,
        p.price,
        pt.name as product_type,
        c.name as category
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE p.status = 'active' AND p.stock_total <= 10
      ORDER BY p.stock_total ASC
      LIMIT 10
    `);
    console.log('✅ Productos con bajo stock cargados:', lowStockProducts.length);

    // Apartados próximos a expirar
    console.log('⏰ Cargando apartados próximos a expirar...');
    const expiringReservations = await query(`
      SELECT 
        r.id,
        r.quantity,
        r.expires_at,
        DATEDIFF(r.expires_at, NOW()) as days_remaining,
        p.name as product_name,
        u.name as user_name,
        u.phone as user_phone
      FROM reservations r
      INNER JOIN products p ON r.product_id = p.id
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.status = 'active' AND DATEDIFF(r.expires_at, NOW()) <= 3
      ORDER BY r.expires_at ASC
      LIMIT 10
    `);
    console.log('✅ Apartados próximos a expirar cargados:', expiringReservations.length);

    // Actividad reciente
    const recentActivity = await query(`
      SELECT 
        'cart' as activity_type,
        c.id,
        c.status,
        c.created_at,
        u.name as user_name,
        u.phone as user_phone,
        CONCAT('Carrito ', c.status) as description
      FROM carts c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      
      UNION ALL
      
      SELECT 
        'reservation' as activity_type,
        r.id,
        r.status,
        r.created_at,
        u.name as user_name,
        u.phone as user_phone,
        CONCAT('Apartado ', r.status) as description
      FROM reservations r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      
      UNION ALL
      
      SELECT 
        'survey_vote' as activity_type,
        sv.id,
        'voted' as status,
        sv.created_at,
        u.name as user_name,
        u.phone as user_phone,
        'Voto en encuesta' as description
      FROM survey_votes sv
      INNER JOIN users u ON sv.user_id = u.id
      WHERE sv.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      
      ORDER BY created_at DESC
      LIMIT 20
    `);

    // Top productos del día
    const topProductsToday = await query(`
      SELECT 
        p.name,
        COUNT(DISTINCT ci.cart_id) as cart_count,
        COUNT(DISTINCT r.id) as reservation_count,
        (COUNT(DISTINCT ci.cart_id) + COUNT(DISTINCT r.id)) as total_activity
      FROM products p
      LEFT JOIN cart_items ci ON p.id = ci.product_id
        AND ci.cart_id IN (
          SELECT id FROM carts 
          WHERE DATE(created_at) = CURDATE()
        )
      LEFT JOIN reservations r ON p.id = r.product_id 
        AND DATE(r.created_at) = CURDATE()
      WHERE p.status = 'active'
      GROUP BY p.id, p.name
      HAVING total_activity > 0
      ORDER BY total_activity DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        today_stats: todayStats[0],
        week_stats: weekStats[0],
        low_stock_products: lowStockProducts,
        expiring_reservations: expiringReservations,
        recent_activity: recentActivity,
        top_products_today: topProductsToday,
        last_updated: new Date().toISOString()
      }
    });

    console.log('✅ Dashboard cargado exitosamente');

  } catch (error) {
    console.error('❌ Error obteniendo dashboard:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Proporcionar información más detallada del error
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      timestamp: new Date().toISOString()
    });
  }
};

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

    // Obtener usuarios con estadísticas
    const users = await query(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT c.id) as total_carts,
        COUNT(DISTINCT r.id) as total_reservations,
        COUNT(DISTINCT sv.survey_id) as surveys_participated,
        (COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id)) as total_activity
      FROM users u
      LEFT JOIN carts c ON u.id = c.user_id
      LEFT JOIN reservations r ON u.id = r.user_id
      LEFT JOIN survey_votes sv ON u.id = sv.user_id
      ${whereClause}
      GROUP BY u.id, u.name, u.phone, u.email, u.role, u.is_active, u.created_at, u.updated_at
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
      message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente`
    });

  } catch (error) {
    console.error('Error actualizando estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de productos con estadísticas
const getProductsWithStats = async (req, res) => {
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
      whereClause += ' AND c.id = ?';
      whereParams.push(category);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      whereParams.push(status);
    }

    // Obtener productos con estadísticas
    const products = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock_total,
        p.status,
        p.is_approved,
        p.created_at,
        p.updated_at,
        pt.name as product_type,
        c.name as category,
        COUNT(DISTINCT r.id) as total_reservations,
        COUNT(DISTINCT ci.cart_id) as total_carts,
        SUM(CASE WHEN r.status = 'active' THEN r.quantity ELSE 0 END) as active_reservations,
        (COUNT(DISTINCT r.id) + COUNT(DISTINCT ci.cart_id)) as popularity_score
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      LEFT JOIN reservations r ON p.id = r.product_id
      LEFT JOIN cart_items ci ON p.id = ci.product_id
      ${whereClause}
      GROUP BY p.id, p.name, p.description, p.price, p.image_url, p.stock_total, p.status, p.is_approved, p.created_at, p.updated_at, pt.name, c.name
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...whereParams, parseInt(limit), offset]);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
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
    console.error('Error obteniendo productos con estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de carritos
const getCartsWithDetails = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', period = '7' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const whereParams = [];

    if (status) {
      whereClause += ' AND c.status = ?';
      whereParams.push(status);
    }

    whereClause += ' AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
    whereParams.push(parseInt(period));

    // Obtener carritos con detalles
    const carts = await query(`
      SELECT 
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        u.id as user_id,
        u.name as user_name,
        u.phone as user_phone,
        COUNT(ci.id) as total_items,
        SUM(ci.quantity * p.price) as total_value
      FROM carts c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN products p ON ci.product_id = p.id
      ${whereClause}
      GROUP BY c.id, c.status, c.created_at, c.updated_at, u.id, u.name, u.phone
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...whereParams, parseInt(limit), offset]);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM carts c
      ${whereClause}
    `, whereParams);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: carts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo carritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Gestión de apartados
const getReservationsWithDetails = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', period = '7' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const whereParams = [];

    if (status) {
      whereClause += ' AND r.status = ?';
      whereParams.push(status);
    }

    whereClause += ' AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
    whereParams.push(parseInt(period));

    // Obtener apartados con detalles
    const reservations = await query(`
      SELECT 
        r.id,
        r.quantity,
        r.status,
        r.reserved_at,
        r.expires_at,
        DATEDIFF(r.expires_at, NOW()) as days_remaining,
        u.id as user_id,
        u.name as user_name,
        u.phone as user_phone,
        p.id as product_id,
        p.name as product_name,
        p.price,
        (r.quantity * p.price) as total_value
      FROM reservations r
      INNER JOIN users u ON r.user_id = u.id
      INNER JOIN products p ON r.product_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...whereParams, parseInt(limit), offset]);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM reservations r
      ${whereClause}
    `, whereParams);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: reservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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

// Gestión de encuestas
const getSurveysWithStats = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const whereParams = [];

    if (status) {
      whereClause += ' AND s.status = ?';
      whereParams.push(status);
    }

    // Obtener encuestas con estadísticas
    const surveys = await query(`
      SELECT 
        s.id,
        s.question,
        s.status,
        s.created_at,
        COUNT(DISTINCT so.id) as total_options,
        COUNT(DISTINCT sv.id) as total_votes,
        COUNT(DISTINCT sv.user_id) as unique_voters,
        CASE 
          WHEN COUNT(DISTINCT sv.id) > 0 THEN 
            CONCAT(ROUND((COUNT(DISTINCT sv.user_id) / (SELECT COUNT(*) FROM users WHERE role = 'client')) * 100, 1), '%')
          ELSE '0%'
        END as participation_rate
      FROM surveys s
      LEFT JOIN survey_options so ON s.id = so.survey_id
      LEFT JOIN survey_votes sv ON s.id = sv.survey_id
      ${whereClause}
      GROUP BY s.id, s.question, s.status, s.created_at
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...whereParams, parseInt(limit), offset]);

    // Contar total para paginación
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM surveys s
      ${whereClause}
    `, whereParams);

    const total = countResult[0].total;

    res.json({
      success: true,
      data: surveys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo encuestas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getDashboard,
  getDashboardSimple,
  getUsers,
  updateUserStatus,
  getProductsWithStats,
  getCartsWithDetails,
  getReservationsWithDetails,
  getSurveysWithStats
}; 