const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllerSimple');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas del panel administrativo requieren autenticación de administrador
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard principal
router.get('/dashboard', adminController.getDashboardSimple);

// Gestión de usuarios
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

// Gestión de productos
router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.patch('/products/:id/approve', adminController.approveProduct);
router.delete('/products/:id', adminController.deleteProduct);

module.exports = router; 