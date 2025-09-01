const express = require('express');
const router = express.Router();
const unifiedCartController = require('../controllers/unifiedCartController');
const { authenticateToken } = require('../middleware/auth');

// Ruta de prueba
router.get('/test', unifiedCartController.test);

// Rutas públicas (para invitados)
router.post('/get', unifiedCartController.getCart);
router.post('/add-item', unifiedCartController.addItem);

// Rutas para ambos tipos de usuario (autenticados e invitados)
router.put('/update-quantity', unifiedCartController.updateQuantity);
router.delete('/remove-item', unifiedCartController.removeItem);
router.delete('/clear', unifiedCartController.clearCart);

// Rutas especiales
router.post('/migrate-guest-to-user', authenticateToken, unifiedCartController.migrateGuestToUser);
router.post('/cleanup-expired', authenticateToken, unifiedCartController.cleanupExpired);
router.get('/expiration-info', unifiedCartController.getExpirationInfo);

module.exports = router; 