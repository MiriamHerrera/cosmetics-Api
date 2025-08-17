const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas de estadísticas requieren autenticación de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// Estadísticas generales del sistema
router.get('/system', statsController.getSystemStats);

// Estadísticas de clientes
router.get('/clients', statsController.getClientStats);

// Estadísticas de productos
router.get('/products', statsController.getProductStats);

// Estadísticas de ventas y actividad
router.get('/sales', statsController.getSalesStats);

// Estadísticas de engagement
router.get('/engagement', statsController.getEngagementStats);

// Generar reporte completo
router.get('/report', statsController.generateFullReport);

module.exports = router; 