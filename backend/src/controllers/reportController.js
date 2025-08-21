const ReportService = require('../services/reportService');

class ReportController {

  // Obtener reporte de márgenes de ganancia
  getProfitMarginReport = async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('📊 Generando reporte de márgenes de ganancia...');
      
      const report = await ReportService.getProfitMarginReport(startDate, endDate, groupBy);
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en reporte de márgenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reporte de productos más rentables
  getTopProductsReport = async (req, res) => {
    try {
      const { startDate, endDate, limit = 10 } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('📦 Generando reporte de productos más rentables...');
      
      const report = await ReportService.getTopProductsReport(startDate, endDate, parseInt(limit));
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en reporte de productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reporte de clientes más valiosos
  getTopCustomersReport = async (req, res) => {
    try {
      const { startDate, endDate, limit = 10 } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('👥 Generando reporte de clientes más valiosos...');
      
      const report = await ReportService.getTopCustomersReport(startDate, endDate, parseInt(limit));
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en reporte de clientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reporte de ventas por categoría
  getCategorySalesReport = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('🏷️ Generando reporte de ventas por categoría...');
      
      const report = await ReportService.getCategorySalesReport(startDate, endDate);
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en reporte de categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reporte de tendencias de ventas
  getSalesTrendsReport = async (req, res) => {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('📈 Generando reporte de tendencias de ventas...');
      
      const report = await ReportService.getSalesTrendsReport(startDate, endDate, groupBy);
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en reporte de tendencias:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reporte de inventario y valor
  getInventoryValueReport = async (req, res) => {
    try {
      console.log('📦 Generando reporte de valor de inventario...');
      
      const report = await ReportService.getInventoryValueReport();
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en reporte de inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reporte de conversión de reservas
  getReservationsConversionReport = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('📅 Generando reporte de conversión de reservas...');
      
      const report = await ReportService.getReservationsConversionReport(startDate, endDate);
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en reporte de reservas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener resumen ejecutivo
  getExecutiveSummary = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('📋 Generando resumen ejecutivo...');
      
      const report = await ReportService.getExecutiveSummary(startDate, endDate);
      
      res.json(report);

    } catch (error) {
      console.error('❌ Error en resumen ejecutivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reporte personalizado combinado
  getCustomReport = async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        reportTypes = ['profit_margin', 'top_products', 'top_customers'],
        groupBy = 'month',
        limit = 10
      } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechas de inicio y fin'
        });
      }

      console.log('🎯 Generando reporte personalizado...');
      
      const results = {};
      
      // Generar reportes solicitados
      if (reportTypes.includes('profit_margin')) {
        results.profitMargin = await ReportService.getProfitMarginReport(startDate, endDate, groupBy);
      }
      
      if (reportTypes.includes('top_products')) {
        results.topProducts = await ReportService.getTopProductsReport(startDate, endDate, limit);
      }
      
      if (reportTypes.includes('top_customers')) {
        results.topCustomers = await ReportService.getTopCustomersReport(startDate, endDate, limit);
      }
      
      if (reportTypes.includes('category_sales')) {
        results.categorySales = await ReportService.getCategorySalesReport(startDate, endDate);
      }
      
      if (reportTypes.includes('sales_trends')) {
        results.salesTrends = await ReportService.getSalesTrendsReport(startDate, endDate, groupBy);
      }
      
      if (reportTypes.includes('executive_summary')) {
        results.executiveSummary = await ReportService.getExecutiveSummary(startDate, endDate);
      }

      res.json({
        success: true,
        data: results,
        parameters: {
          startDate,
          endDate,
          reportTypes,
          groupBy,
          limit
        }
      });

    } catch (error) {
      console.error('❌ Error en reporte personalizado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Exportar reporte a CSV/Excel (futuro)
  exportReport = async (req, res) => {
    try {
      const { reportType, format = 'csv', ...params } = req.body;
      
      console.log(`📤 Exportando reporte ${reportType} en formato ${format}...`);
      
      // Por ahora solo retornamos un mensaje
      // En el futuro implementaremos exportación real
      res.json({
        success: true,
        message: `Reporte ${reportType} exportado en formato ${format}`,
        note: 'Funcionalidad de exportación en desarrollo'
      });

    } catch (error) {
      console.error('❌ Error exportando reporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };
}

module.exports = new ReportController(); 