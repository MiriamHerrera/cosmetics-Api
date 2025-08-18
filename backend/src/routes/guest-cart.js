const express = require('express');
const router = express.Router();
const guestCartController = require('../controllers/guestCartController');
const { validate, guestCartItemSchema } = require('../middleware/validation');

// Rutas para usuarios invitados (sin autenticación)
// Solo manejan stock y validaciones básicas

// Obtener carrito de invitado
router.get('/', guestCartController.getGuestCart);

// Agregar producto al carrito invitado (reserva stock)
router.post('/items', validate(guestCartItemSchema), guestCartController.addItemToGuestCart);

// Actualizar cantidad de item en carrito invitado
router.put('/items/:id', validate(guestCartItemSchema), guestCartController.updateGuestCartItemQuantity);

// Remover item del carrito invitado (libera stock)
router.delete('/items/:id', guestCartController.removeItemFromGuestCart);

// Limpiar carrito invitado completo (libera todo el stock)
router.delete('/', guestCartController.clearGuestCart);

// Verificar stock disponible
router.get('/stock/:productId', guestCartController.checkProductStock);

// Limpiar carritos expirados (admin)
router.post('/cleanup', guestCartController.cleanupExpiredCarts);

// Limpieza manual de carritos expirados (para testing)
router.post('/cleanup/manual', guestCartController.manualCleanup);

// Obtener estadísticas de carritos activos
router.get('/stats', guestCartController.getGuestCartStats);

module.exports = router; 