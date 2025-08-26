const express = require('express');
const router = express.Router();
const unifiedCartController = require('../controllers/unifiedCartController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (para invitados)
router.post('/get', unifiedCartController.getCart);
router.post('/add-item', unifiedCartController.addItem);

// Rutas protegidas (requieren autenticación)
router.put('/update-quantity', authenticateToken, unifiedCartController.updateQuantity);
router.delete('/remove-item', authenticateToken, unifiedCartController.removeItem);
router.delete('/clear', authenticateToken, unifiedCartController.clearCart);

// Rutas especiales
router.post('/migrate-guest-to-user', authenticateToken, unifiedCartController.migrateGuestToUser);
router.post('/cleanup-expired', authenticateToken, unifiedCartController.cleanupExpired);

module.exports = router; 