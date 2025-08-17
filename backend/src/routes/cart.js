const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { validate, cartItemSchema } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas del carrito requieren autenticación
router.use(authenticateToken);

// Obtener carrito del usuario
router.get('/', cartController.getCart);

// Agregar producto al carrito
router.post('/items', validate(cartItemSchema), cartController.addItemToCart);

// Actualizar cantidad de item
router.put('/items/:id', validate(cartItemSchema), cartController.updateItemQuantity);

// Remover item del carrito
router.delete('/items/:id', cartController.removeItemFromCart);

// Limpiar carrito completo
router.delete('/', cartController.clearCart);

// Enviar carrito por WhatsApp
router.post('/send', cartController.sendCartToWhatsApp);

module.exports = router; 