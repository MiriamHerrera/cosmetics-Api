const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas del panel administrativo requieren autenticación de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard principal
router.get('/dashboard', adminController.getDashboard);

// Gestión de usuarios
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

// Gestión de productos con estadísticas
router.get('/products', adminController.getProductsWithStats);

// Gestión de carritos
router.get('/carts', adminController.getCartsWithDetails);

// Gestión de apartados
router.get('/reservations', adminController.getReservationsWithDetails);

// Gestión de encuestas
router.get('/surveys', adminController.getSurveysWithStats);

module.exports = router; 