const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas públicas (sin autenticación)
router.get('/delivery-locations', orderController.getDeliveryLocations);
router.get('/delivery-times', orderController.getAvailableDeliveryTimes);

// Ruta pública para checkout de invitados
router.post('/guest', orderController.createGuestOrder);

// Rutas protegidas para usuarios autenticados
router.post('/', authenticateToken, orderController.createOrder);
router.get('/user', authenticateToken, orderController.getUserOrders);
router.get('/user/:id', authenticateToken, orderController.getOrderById);

// Rutas de administrador
router.get('/', authenticateToken, requireAdmin, orderController.getAllOrders);
router.put('/:id/status', authenticateToken, requireAdmin, orderController.updateOrderStatus);

module.exports = router; 