const { query, getConnection } = require('../config/database');

class ReportService {
  
  // Obtener reporte de márgenes de ganancia
  static async getProfitMarginReport(startDate, endDate, groupBy = 'month') {
    try {
      console.log('📊 Generando reporte de márgenes de ganancia...');
      
      let dateFormat, groupClause;
      
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          groupClause = 'DATE(o.created_at)';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          groupClause = 'YEARWEEK(o.created_at)';
          break;
        case 'month':
        default:
          dateFormat = '%Y-%m';
          groupClause = 'DATE_FORMAT(o.created_at, "%Y-%m")';
          break;
        case 'quarter':
          dateFormat = '%Y-Q%q';
          groupClause = 'CONCAT(YEAR(o.created_at), "-Q", QUARTER(o.created_at))';
          break;
        case 'year':
          dateFormat = '%Y';
          groupClause = 'YEAR(o.created_at)';
          break;
      }

      const report = await query(`
        SELECT 
          ${groupClause} as period,
          DATE_FORMAT(o.created_at, '${dateFormat}') as formatted_period,
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(oi.id) as total_items,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * p.price) as total_revenue,
          SUM(oi.quantity * p.cost_price) as total_cost,
          SUM(oi.quantity * (p.price - p.cost_price)) as total_profit,
          ROUND(
            (SUM(oi.quantity * (p.price - p.cost_price)) / SUM(oi.quantity * p.price)) * 100, 2
          ) as profit_margin_percentage,
          ROUND(
            (SUM(oi.quantity * p.price) - SUM(oi.quantity * p.cost_price)) / SUM(oi.quantity * p.cost_price) * 100, 2
          ) as markup_percentage,
          AVG(p.price) as average_price,
          AVG(p.cost_price) as average_cost,
          MIN(o.created_at) as period_start,
          MAX(o.created_at) as period_end
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id
        WHERE o.status = 'completed'
          AND o.created_at BETWEEN ? AND ?
        GROUP BY ${groupClause}
        ORDER BY period_start DESC
      `, [startDate, endDate]);

      // Calcular totales generales
      const totals = await query(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(oi.id) as total_items,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * p.price) as total_revenue,
          SUM(oi.quantity * p.cost_price) as total_cost,
          SUM(oi.quantity * (p.price - p.cost_price)) as total_profit,
          ROUND(
            (SUM(oi.quantity * (p.price - p.cost_price)) / SUM(oi.quantity * p.price)) * 100, 2
          ) as overall_profit_margin,
          ROUND(
            (SUM(oi.quantity * p.price) - SUM(oi.quantity * p.cost_price)) / SUM(oi.quantity * p.cost_price) * 100, 2
          ) as overall_markup
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id
        WHERE o.status = 'completed'
          AND o.created_at BETWEEN ? AND ?
      `, [startDate, endDate]);

      return {
        success: true,
        data: {
          periods: report,
          totals: totals[0] || {},
          period_type: groupBy,
          date_range: {
            start: startDate,
            end: endDate
          }
        }
      };

    } catch (error) {
      console.error('❌ Error generando reporte de márgenes:', error);
      throw error;
    }
  }

  // Obtener reporte de productos más rentables
  static async getTopProductsReport(startDate, endDate, limit = 10) {
    try {
      console.log('📦 Generando reporte de productos más rentables...');

      const products = await query(`
        SELECT 
          p.id,
          p.name as product_name,
          p.description,
          p.price,
          p.cost_price,
          p.stock_total,
          p.image_url,
          c.name as category_name,
          pt.name as product_type_name,
          COUNT(oi.id) as times_ordered,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.quantity * p.price) as total_revenue,
          SUM(oi.quantity * p.cost_price) as total_cost,
          SUM(oi.quantity * (p.price - p.cost_price)) as total_profit,
          ROUND(
            (SUM(oi.quantity * (p.price - p.cost_price)) / SUM(oi.quantity * p.price)) * 100, 2
          ) as profit_margin_percentage,
          ROUND(
            (SUM(oi.quantity * p.price) - SUM(oi.quantity * p.cost_price)) / SUM(oi.quantity * p.cost_price) * 100, 2
          ) as markup_percentage,
          AVG(p.price) as average_selling_price,
          ROUND(
            SUM(oi.quantity * (p.price - p.cost_price)) / SUM(oi.quantity), 2
          ) as profit_per_unit
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_types pt ON p.product_type_id = pt.id
        WHERE (o.status = 'completed' OR o.status IS NULL)
          AND (o.created_at BETWEEN ? AND ? OR o.created_at IS NULL)
        GROUP BY p.id, p.name, p.description, p.price, p.cost_price, p.stock_total, p.image_url, c.name, pt.name
        HAVING total_revenue > 0
        ORDER BY total_profit DESC
        LIMIT ?
      `, [startDate, endDate, limit]);

      return {
        success: true,
        data: products
      };

    } catch (error) {
      console.error('❌ Error generando reporte de productos:', error);
      throw error;
    }
  }

  // Obtener reporte de clientes más valiosos
  static async getTopCustomersReport(startDate, endDate, limit = 10) {
    try {
      console.log('👥 Generando reporte de clientes más valiosos...');

      const customers = await query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          u.created_at as customer_since,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(oi.quantity * p.price) as total_spent,
          AVG(oi.quantity * p.price) as average_order_value,
          SUM(oi.quantity) as total_items_purchased,
          MAX(o.created_at) as last_order_date,
          ROUND(
            SUM(oi.quantity * p.price) / COUNT(DISTINCT o.id), 2
          ) as average_order_value_calculated
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.status = 'completed'
          AND o.created_at BETWEEN ? AND ?
          AND u.role = 'client'
        GROUP BY u.id, u.name, u.email, u.phone, u.created_at
        HAVING total_orders > 0
        ORDER BY total_spent DESC
        LIMIT ?
      `, [startDate, endDate, limit]);

      return {
        success: true,
        data: customers
      };

    } catch (error) {
      console.error('❌ Error generando reporte de clientes:', error);
      throw error;
    }
  }

  // Obtener reporte de ventas por categoría
  static async getCategorySalesReport(startDate, endDate) {
    try {
      console.log('🏷️ Generando reporte de ventas por categoría...');

      const categories = await query(`
        SELECT 
          c.id,
          c.name as category_name,
          c.description,
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(oi.id) as total_items,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.quantity * p.price) as total_revenue,
          SUM(oi.quantity * p.cost_price) as total_cost,
          SUM(oi.quantity * (p.price - p.cost_price)) as total_profit,
          ROUND(
            (SUM(oi.quantity * (p.price - p.cost_price)) / SUM(oi.quantity * p.price)) * 100, 2
          ) as profit_margin_percentage,
          ROUND(
            (SUM(oi.quantity * p.price) - SUM(oi.quantity * p.cost_price)) / SUM(oi.quantity * p.cost_price) * 100, 2
          ) as markup_percentage,
          COUNT(DISTINCT p.id) as unique_products_sold,
          AVG(p.price) as average_price
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'completed'
          AND o.created_at BETWEEN ? AND ?
        GROUP BY c.id, c.name, c.description
        HAVING total_revenue > 0
        ORDER BY total_profit DESC
      `, [startDate, endDate]);

      return {
        success: true,
        data: categories
      };

    } catch (error) {
      console.error('❌ Error generando reporte de categorías:', error);
      throw error;
    }
  }

  // Obtener reporte de tendencias de ventas
  static async getSalesTrendsReport(startDate, endDate, groupBy = 'day') {
    try {
      console.log('📈 Generando reporte de tendencias de ventas...');

      let dateFormat, groupClause;
      
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          groupClause = 'DATE(o.created_at)';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          groupClause = 'YEARWEEK(o.created_at)';
          break;
        case 'month':
        default:
          dateFormat = '%Y-%m';
          groupClause = 'DATE_FORMAT(o.created_at, "%Y-%m")';
          break;
      }

      const trends = await query(`
        SELECT 
          ${groupClause} as period,
          DATE_FORMAT(o.created_at, '${dateFormat}') as formatted_period,
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(oi.id) as total_items,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * p.price) as total_revenue,
          SUM(oi.quantity * p.cost_price) as total_cost,
          SUM(oi.quantity * (p.price - p.cost_price)) as total_profit,
          COUNT(DISTINCT o.user_id) as unique_customers,
          ROUND(
            (SUM(oi.quantity * (p.price - p.cost_price)) / SUM(oi.quantity * p.price)) * 100, 2
          ) as profit_margin_percentage
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id
        WHERE o.status = 'completed'
          AND o.created_at BETWEEN ? AND ?
        GROUP BY ${groupClause}
        ORDER BY period ASC
      `, [startDate, endDate]);

      return {
        success: true,
        data: trends
      };

    } catch (error) {
      console.error('❌ Error generando reporte de tendencias:', error);
      throw error;
    }
  }

  // Obtener reporte de inventario y valor
  static async getInventoryValueReport() {
    try {
      console.log('📦 Generando reporte de valor de inventario...');

      const inventory = await query(`
        SELECT 
          p.id,
          p.name as product_name,
          p.description,
          p.price,
          p.cost_price,
          p.stock_total,
          p.image_url,
          c.name as category_name,
          pt.name as product_type_name,
          (p.stock_total * p.cost_price) as inventory_cost_value,
          (p.stock_total * p.price) as inventory_retail_value,
          (p.stock_total * (p.price - p.cost_price)) as potential_profit,
          ROUND(
            ((p.price - p.cost_price) / p.cost_price) * 100, 2
          ) as markup_percentage,
          ROUND(
            ((p.price - p.cost_price) / p.price) * 100, 2
          ) as profit_margin_percentage,
          CASE 
            WHEN p.stock_total = 0 THEN 'out_of_stock'
            WHEN p.stock_total <= 5 THEN 'low_stock'
            WHEN p.stock_total <= 20 THEN 'medium_stock'
            ELSE 'high_stock'
          END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_types pt ON p.product_type_id = pt.id
        WHERE p.status = 'active'
        ORDER BY inventory_cost_value DESC
      `);

      // Calcular totales del inventario
      const totals = await query(`
        SELECT 
          COUNT(*) as total_products,
          SUM(stock_total) as total_units,
          SUM(stock_total * cost_price) as total_inventory_cost,
          SUM(stock_total * price) as total_inventory_retail_value,
          SUM(stock_total * (price - cost_price)) as total_potential_profit,
          ROUND(
            (SUM(stock_total * (price - cost_price)) / SUM(stock_total * price)) * 100, 2
          ) as overall_profit_margin
        FROM products
        WHERE status = 'active'
      `);

      return {
        success: true,
        data: {
          products: inventory,
          totals: totals[0] || {}
        }
      };

    } catch (error) {
      console.error('❌ Error generando reporte de inventario:', error);
      throw error;
    }
  }

  // Obtener reporte de reservas y conversión
  static async getReservationsConversionReport(startDate, endDate) {
    try {
      console.log('📅 Generando reporte de conversión de reservas...');

      const report = await query(`
        SELECT 
          DATE_FORMAT(r.created_at, '%Y-%m') as month,
          COUNT(*) as total_reservations,
          SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as completed_reservations,
          SUM(CASE WHEN r.status = 'expired' THEN 1 ELSE 0 END) as expired_reservations,
          SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reservations,
          ROUND(
            (SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
          ) as conversion_rate_percentage,
          SUM(CASE WHEN r.user_type = 'guest' THEN 1 ELSE 0 END) as guest_reservations,
          SUM(CASE WHEN r.user_type = 'registered' THEN 1 ELSE 0 END) as registered_reservations,
          AVG(CASE WHEN r.status = 'completed' THEN 
            TIMESTAMPDIFF(HOUR, r.created_at, 
              (SELECT MIN(created_at) FROM orders WHERE user_id = r.user_id AND created_at > r.created_at)
            ) ELSE NULL END
          ) as avg_time_to_conversion_hours
        FROM reservations r
        WHERE r.created_at BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(r.created_at, '%Y-%m')
        ORDER BY month DESC
      `, [startDate, endDate]);

      return {
        success: true,
        data: report
      };

    } catch (error) {
      console.error('❌ Error generando reporte de reservas:', error);
      throw error;
    }
  }

  // Obtener resumen ejecutivo
  static async getExecutiveSummary(startDate, endDate) {
    try {
      console.log('📋 Generando resumen ejecutivo...');

      // Obtener métricas principales
      const metrics = await query(`
        SELECT 
          -- Ventas
          COUNT(DISTINCT o.id) as total_orders,
          SUM(oi.quantity * p.price) as total_revenue,
          SUM(oi.quantity * p.cost_price) as total_cost,
          SUM(oi.quantity * (p.price - p.cost_price)) as total_profit,
          
          -- Clientes
          COUNT(DISTINCT o.user_id) as unique_customers,
          COUNT(DISTINCT u.id) as total_customers,
          
          -- Productos
          COUNT(DISTINCT oi.product_id) as unique_products_sold,
          SUM(oi.quantity) as total_units_sold,
          
          -- Reservas
          (SELECT COUNT(*) FROM reservations WHERE created_at BETWEEN ? AND ?) as total_reservations,
          (SELECT COUNT(*) FROM reservations WHERE status = 'completed' AND created_at BETWEEN ? AND ?) as completed_reservations,
          
          -- Cálculos
          ROUND(
            (SUM(oi.quantity * (p.price - p.cost_price)) / SUM(oi.quantity * p.price)) * 100, 2
          ) as profit_margin_percentage,
          ROUND(
            (SUM(oi.quantity * p.price) - SUM(oi.quantity * p.cost_price)) / SUM(oi.quantity * p.cost_price) * 100, 2
          ) as markup_percentage,
          ROUND(
            SUM(oi.quantity * p.price) / COUNT(DISTINCT o.id), 2
          ) as average_order_value,
          ROUND(
            SUM(oi.quantity * p.price) / COUNT(DISTINCT o.user_id), 2
          ) as average_customer_value
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id
        INNER JOIN users u ON o.user_id = u.id
        WHERE o.status = 'completed'
          AND o.created_at BETWEEN ? AND ?
      `, [startDate, endDate, startDate, endDate, startDate, endDate]);

      // Obtener comparación con período anterior
      const previousPeriod = await query(`
        SELECT 
          SUM(oi.quantity * p.price) as previous_revenue,
          SUM(oi.quantity * (p.price - p.cost_price)) as previous_profit,
          COUNT(DISTINCT o.id) as previous_orders
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id
        WHERE o.status = 'completed'
          AND o.created_at BETWEEN DATE_SUB(?, INTERVAL DATEDIFF(?, ?) DAY) AND ?
      `, [startDate, endDate, startDate, startDate]);

      const summary = {
        current_period: metrics[0] || {},
        previous_period: previousPeriod[0] || {},
        growth_metrics: {
          revenue_growth: metrics[0] && previousPeriod[0] ? 
            ((metrics[0].total_revenue - previousPeriod[0].previous_revenue) / previousPeriod[0].previous_revenue) * 100 : 0,
          profit_growth: metrics[0] && previousPeriod[0] ? 
            ((metrics[0].total_profit - previousPeriod[0].previous_profit) / previousPeriod[0].previous_profit) * 100 : 0,
          orders_growth: metrics[0] && previousPeriod[0] ? 
            ((metrics[0].total_orders - previousPeriod[0].previous_orders) / previousPeriod[0].previous_orders) * 100 : 0
        }
      };

      return {
        success: true,
        data: summary
      };

    } catch (error) {
      console.error('❌ Error generando resumen ejecutivo:', error);
      throw error;
    }
  }
}

module.exports = ReportService; 