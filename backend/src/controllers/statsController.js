const { query, getConnection } = require('../config/database');

// Obtener estadísticas generales del sistema (admin)
const getSystemStats = async (req, res) => {
  try {
    // Estadísticas de usuarios
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as total_clients,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_users_today,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week
      FROM users
      WHERE is_active = true
    `);

    // Estadísticas de productos
    const productStats = await query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_products,
        SUM(stock_total) as total_stock,
        AVG(price) as average_price,
        SUM(CASE WHEN stock_total = 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM products
    `);

    // Estadísticas de carritos
    const cartStats = await query(`
      SELECT 
        COUNT(*) as total_carts,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_carts,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_carts,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_carts,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as carts_today
      FROM carts
    `);

    // Estadísticas de apartados
    const reservationStats = await query(`
      SELECT 
        COUNT(*) as total_reservations,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_reservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_reservations,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reservations,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_reservations,
        SUM(CASE WHEN DATE(expires_at) = CURDATE() THEN 1 ELSE 0 END) as expiring_today
      FROM reservations
    `);

    // Estadísticas de encuestas
    const surveyStats = await query(`
      SELECT 
        COUNT(*) as total_surveys,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_surveys,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_surveys
      FROM surveys
    `);

    // Total de votos en encuestas
    const totalVotes = await query(`
      SELECT COUNT(*) as total_votes FROM survey_votes
    `);

    res.json({
      success: true,
      data: {
        users: userStats[0],
        products: productStats[0],
        carts: cartStats[0],
        reservations: reservationStats[0],
        surveys: {
          ...surveyStats[0],
          total_votes: totalVotes[0].total_votes
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de clientes frecuentes
const getClientStats = async (req, res) => {
  try {
    const { limit = 10, period = '30' } = req.query;

    // Clientes con más actividad en el período especificado
    const topClients = await query(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.created_at,
        COUNT(DISTINCT c.id) as total_carts,
        COUNT(DISTINCT r.id) as total_reservations,
        COUNT(DISTINCT sv.survey_id) as surveys_participated,
        SUM(CASE WHEN c.status = 'sent' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_reservations,
        (COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id)) as total_activity_score
      FROM users u
      LEFT JOIN carts c ON u.id = c.user_id 
        AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      LEFT JOIN reservations r ON u.id = r.user_id 
        AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      LEFT JOIN survey_votes sv ON u.id = sv.user_id 
        AND sv.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      WHERE u.role = 'client' AND u.is_active = true
      GROUP BY u.id, u.name, u.phone, u.email, u.created_at
      ORDER BY total_activity_score DESC
      LIMIT ?
    `, [parseInt(period), parseInt(period), parseInt(period), parseInt(limit)]);

    // Clientes nuevos en el período
    const newClients = await query(`
      SELECT 
        id,
        name,
        phone,
        email,
        created_at,
        DATEDIFF(CURDATE(), DATE(created_at)) as days_since_registration
      FROM users 
      WHERE role = 'client' 
        AND is_active = true 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY created_at DESC
    `, [parseInt(period)]);

    // Clientes inactivos (sin actividad en el período)
    const inactiveClients = await query(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.email,
        u.created_at,
        DATEDIFF(CURDATE(), DATE(u.created_at)) as days_since_registration
      FROM users u
      WHERE u.role = 'client' 
        AND u.is_active = true
        AND u.id NOT IN (
          SELECT DISTINCT user_id FROM carts 
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          UNION
          SELECT DISTINCT user_id FROM reservations 
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          UNION
          SELECT DISTINCT user_id FROM survey_votes 
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        )
      ORDER BY u.created_at DESC
    `, [parseInt(period), parseInt(period), parseInt(period)]);

    res.json({
      success: true,
      data: {
        top_clients: topClients,
        new_clients: newClients,
        inactive_clients: inactiveClients,
        period_days: parseInt(period),
        total_clients_analyzed: topClients.length + newClients.length + inactiveClients.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de productos
const getProductStats = async (req, res) => {
  try {
    const { limit = 10, period = '30' } = req.query;

    // Productos más populares (por apartados y carritos)
    const popularProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.stock_total,
        pt.name as product_type,
        c.name as category,
        COUNT(DISTINCT r.id) as total_reservations,
        COUNT(DISTINCT ci.cart_id) as total_carts,
        SUM(CASE WHEN r.status = 'active' THEN r.quantity ELSE 0 END) as active_reservations,
        SUM(CASE WHEN ci.id IS NOT NULL THEN ci.quantity ELSE 0 END) as total_cart_quantity,
        (COUNT(DISTINCT r.id) + COUNT(DISTINCT ci.cart_id)) as popularity_score
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      LEFT JOIN reservations r ON p.id = r.product_id 
        AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      LEFT JOIN cart_items ci ON p.id = ci.product_id
        AND ci.cart_id IN (
          SELECT id FROM carts 
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        )
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.price, p.stock_total, pt.name, c.name
      ORDER BY popularity_score DESC
      LIMIT ?
    `, [parseInt(period), parseInt(period), parseInt(limit)]);

    // Productos con bajo stock
    const lowStockProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.stock_total,
        p.price,
        pt.name as product_type,
        c.name as category,
        CASE 
          WHEN p.stock_total = 0 THEN 'Sin stock'
          WHEN p.stock_total <= 5 THEN 'Stock bajo'
          WHEN p.stock_total <= 15 THEN 'Stock medio'
          ELSE 'Stock alto'
        END as stock_level
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.stock_total ASC
      LIMIT ?
    `, [parseInt(limit)]);

    // Productos más caros
    const expensiveProducts = await query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.stock_total,
        pt.name as product_type,
        c.name as category
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY p.price DESC
      LIMIT ?
    `, [parseInt(limit)]);

    // Estadísticas por categoría
    const categoryStats = await query(`
      SELECT 
        c.id,
        c.name as category_name,
        COUNT(p.id) as total_products,
        SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_products,
        AVG(p.price) as average_price,
        SUM(p.stock_total) as total_stock,
        COUNT(DISTINCT pt.id) as product_types
      FROM categories c
      LEFT JOIN product_types pt ON c.id = pt.category_id
      LEFT JOIN products p ON pt.id = p.product_type_id
      GROUP BY c.id, c.name
      ORDER BY total_products DESC
    `);

    res.json({
      success: true,
      data: {
        popular_products: popularProducts,
        low_stock_products: lowStockProducts,
        expensive_products: expensiveProducts,
        category_stats: categoryStats,
        period_days: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de ventas y actividad
const getSalesStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Actividad por día en el período
    const dailyActivity = await query(`
      SELECT 
        DATE(date_activity) as date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(DISTINCT cart_id) as cart_activities,
        COUNT(DISTINCT reservation_id) as reservation_activities,
        COUNT(DISTINCT survey_vote_id) as survey_activities
      FROM (
        SELECT 
          created_at as date_activity,
          user_id,
          id as cart_id,
          NULL as reservation_id,
          NULL as survey_vote_id
        FROM carts
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        
        UNION ALL
        
        SELECT 
          created_at as date_activity,
          user_id,
          NULL as cart_id,
          id as reservation_id,
          NULL as survey_vote_id
        FROM reservations
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        
        UNION ALL
        
        SELECT 
          created_at as date_activity,
          user_id,
          NULL as cart_id,
          NULL as reservation_id,
          id as survey_vote_id
        FROM survey_votes
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ) combined_activity
      GROUP BY DATE(date_activity)
      ORDER BY date DESC
    `, [parseInt(period), parseInt(period), parseInt(period)]);

    // Resumen de actividad del período
    const periodSummary = await query(`
      SELECT 
        COUNT(DISTINCT c.user_id) as unique_cart_users,
        COUNT(DISTINCT r.user_id) as unique_reservation_users,
        COUNT(DISTINCT sv.user_id) as unique_survey_users,
        COUNT(c.id) as total_carts,
        COUNT(r.id) as total_reservations,
        COUNT(sv.id) as total_survey_votes,
        SUM(CASE WHEN c.status = 'sent' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_reservations
      FROM users u
      LEFT JOIN carts c ON u.id = c.user_id 
        AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      LEFT JOIN reservations r ON u.id = r.user_id 
        AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      LEFT JOIN survey_votes sv ON u.id = sv.user_id 
        AND sv.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      WHERE u.role = 'client' AND u.is_active = true
    `, [parseInt(period), parseInt(period), parseInt(period)]);

    // Horas pico de actividad
    const peakHours = await query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as activity_count
      FROM (
        SELECT created_at FROM carts 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        UNION ALL
        SELECT created_at FROM reservations 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        UNION ALL
        SELECT created_at FROM survey_votes 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ) all_activity
      GROUP BY HOUR(created_at)
      ORDER BY activity_count DESC
      LIMIT 5
    `, [parseInt(period)]);

    res.json({
      success: true,
      data: {
        daily_activity: dailyActivity,
        period_summary: periodSummary[0],
        peak_hours: peakHours,
        period_days: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de engagement
const getEngagementStats = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Métricas de engagement por usuario
    const userEngagement = await query(`
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.created_at,
        COUNT(DISTINCT c.id) as cart_sessions,
        COUNT(DISTINCT r.id) as reservation_sessions,
        COUNT(DISTINCT sv.survey_id) as survey_participations,
        COUNT(DISTINCT sv.id) as total_votes,
        DATEDIFF(CURDATE(), DATE(u.created_at)) as days_since_registration,
        CASE 
          WHEN COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id) >= 10 THEN 'Alto'
          WHEN COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id) >= 5 THEN 'Medio'
          ELSE 'Bajo'
        END as engagement_level
      FROM users u
      LEFT JOIN carts c ON u.id = c.user_id 
        AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      LEFT JOIN reservations r ON u.id = r.user_id 
        AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      LEFT JOIN survey_votes sv ON u.id = sv.user_id 
        AND sv.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      WHERE u.role = 'client' AND u.is_active = true
      GROUP BY u.id, u.name, u.phone, u.created_at
      ORDER BY (COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id)) DESC
    `, [parseInt(period), parseInt(period), parseInt(period)]);

    // Resumen de engagement
    const engagementSummary = await query(`
      SELECT 
        COUNT(CASE WHEN engagement_level = 'Alto' THEN 1 END) as high_engagement_users,
        COUNT(CASE WHEN engagement_level = 'Medio' THEN 1 END) as medium_engagement_users,
        COUNT(CASE WHEN engagement_level = 'Bajo' THEN 1 END) as low_engagement_users,
        AVG(total_activities) as average_activities_per_user
      FROM (
        SELECT 
          u.id,
          CASE 
            WHEN (COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id)) >= 10 THEN 'Alto'
            WHEN (COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id)) >= 5 THEN 'Medio'
            ELSE 'Bajo'
          END as engagement_level,
          (COUNT(DISTINCT c.id) + COUNT(DISTINCT r.id) + COUNT(DISTINCT sv.survey_id)) as total_activities
        FROM users u
        LEFT JOIN carts c ON u.id = c.user_id 
          AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        LEFT JOIN reservations r ON u.id = r.user_id 
          AND r.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        LEFT JOIN survey_votes sv ON u.id = sv.user_id 
          AND sv.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        WHERE u.role = 'client' AND u.is_active = true
        GROUP BY u.id
      ) user_engagement
    `, [parseInt(period), parseInt(period), parseInt(period)]);

    res.json({
      success: true,
      data: {
        user_engagement: userEngagement,
        engagement_summary: engagementSummary[0],
        period_days: parseInt(period)
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de engagement:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Generar reporte completo (admin)
const generateFullReport = async (req, res) => {
  try {
    const { period = '30', format = 'json' } = req.query;

    // Obtener todas las estadísticas
    const [systemStats, clientStats, productStats, salesStats, engagementStats] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'client' THEN 1 END) as total_clients,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
        FROM users WHERE is_active = true
      `),
      query(`
        SELECT COUNT(*) as total_products FROM products WHERE status = 'active'
      `),
      query(`
        SELECT COUNT(*) as total_carts FROM carts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      `, [parseInt(period)]),
      query(`
        SELECT COUNT(*) as total_reservations FROM reservations WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      `, [parseInt(period)]),
      query(`
        SELECT COUNT(*) as total_surveys FROM surveys
      `)
    ]);

    const report = {
      report_info: {
        generated_at: new Date().toISOString(),
        period_days: parseInt(period),
        format: format
      },
      system_overview: {
        users: systemStats[0],
        products: productStats[0],
        activity: {
          carts: salesStats[0],
          reservations: engagementStats[0],
          surveys: salesStats[0]
        }
      },
      recommendations: [
        "Revisar productos con bajo stock",
        "Identificar clientes inactivos para re-engagement",
        "Analizar horarios pico para optimizar atención",
        "Evaluar encuestas con baja participación"
      ]
    };

    if (format === 'csv') {
      // Aquí se podría generar CSV si se implementa
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${period}d_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('Reporte CSV no implementado aún');
    } else {
      res.json({
        success: true,
        data: report
      });
    }

  } catch (error) {
    console.error('Error generando reporte completo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getSystemStats,
  getClientStats,
  getProductStats,
  getSalesStats,
  getEngagementStats,
  generateFullReport
}; 