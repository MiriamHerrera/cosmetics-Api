const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas de reportes requieren autenticación y permisos de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// ========================================
// REPORTES FINANCIEROS PRINCIPALES
// ========================================

// Reporte de márgenes de ganancia
router.get('/profit-margin', reportController.getProfitMarginReport);

// Reporte de productos más rentables
router.get('/top-products', reportController.getTopProductsReport);

// Reporte de clientes más valiosos
router.get('/top-customers', reportController.getTopCustomersReport);

// Reporte de ventas por categoría
router.get('/category-sales', reportController.getCategorySalesReport);

// Reporte de tendencias de ventas
router.get('/sales-trends', reportController.getSalesTrendsReport);

// ========================================
// REPORTES DE INVENTARIO Y OPERACIONES
// ========================================

// Reporte de valor de inventario
router.get('/inventory-value', reportController.getInventoryValueReport);

// Reporte de conversión de reservas
router.get('/reservations-conversion', reportController.getReservationsConversionReport);

// ========================================
// REPORTES EJECUTIVOS Y RESUMEN
// ========================================

// Resumen ejecutivo completo
router.get('/executive-summary', reportController.getExecutiveSummary);

// Reporte personalizado combinado
router.post('/custom', reportController.getCustomReport);

// ========================================
// EXPORTACIÓN DE REPORTES
// ========================================

// Exportar reporte (futuro)
router.post('/export', reportController.exportReport);

// ========================================
// RUTAS DE DESARROLLO/TESTING
// ========================================

if (process.env.NODE_ENV === 'development') {
  // Ruta para probar el servicio de reportes
  router.get('/test/service', async (req, res) => {
    try {
      const ReportService = require('../services/reportService');
      
      // Generar un reporte de prueba
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 días atrás
      const endDate = new Date().toISOString().split('T')[0]; // Hoy
      
      const report = await ReportService.getProfitMarginReport(startDate, endDate, 'month');
      
      res.json({
        success: true,
        message: 'Servicio de reportes funcionando correctamente',
        data: report,
        test_parameters: {
          startDate,
          endDate,
          groupBy: 'month'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en el servicio de reportes',
        error: error.message
      });
    }
  });

  // Ruta para probar el reporte de márgenes sin autenticación (para debugging)
  router.get('/test/profit-margin', async (req, res) => {
    try {
      const ReportService = require('../services/reportService');
      
      const { startDate = '2024-01-01', endDate = '2025-12-31', groupBy = 'month' } = req.query;
      
      console.log('🧪 Probando reporte de márgenes con parámetros:', { startDate, endDate, groupBy });
      
      const report = await ReportService.getProfitMarginReport(startDate, endDate, groupBy);
      
      res.json({
        success: true,
        message: 'Reporte de márgenes generado exitosamente',
        data: report,
        test_parameters: {
          startDate,
          endDate,
          groupBy
        }
      });
    } catch (error) {
      console.error('❌ Error en test de reporte de márgenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el reporte de márgenes',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Ruta para probar múltiples reportes
  router.get('/test/multiple', async (req, res) => {
    try {
      const ReportService = require('../services/reportService');
      
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const [profitMargin, topProducts, inventoryValue] = await Promise.all([
        ReportService.getProfitMarginReport(startDate, endDate, 'month'),
        ReportService.getTopProductsReport(startDate, endDate, 5),
        ReportService.getInventoryValueReport()
      ]);
      
      res.json({
        success: true,
        message: 'Múltiples reportes generados exitosamente',
        data: {
          profitMargin,
          topProducts,
          inventoryValue
        },
        test_parameters: {
          startDate,
          endDate
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generando múltiples reportes',
        error: error.message
      });
    }
  });
}

// ========================================
// MANEJADOR DE ERRORES
// ========================================

router.use((err, req, res, next) => {
  console.error('❌ Error en ruta de reportes:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor en reportes',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

module.exports = router; 