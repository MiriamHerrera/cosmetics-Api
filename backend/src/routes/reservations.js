const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { validate, reservationSchema } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas de apartados requieren autenticación
router.use(authenticateToken);

// Rutas para usuarios
router.post('/', validate(reservationSchema), reservationController.createReservation);
router.get('/', reservationController.getUserReservations);
router.get('/stats', reservationController.getUserReservationStats);
router.get('/:id', reservationController.getReservationById);
router.put('/:id/cancel', reservationController.cancelReservation);
router.put('/:id/complete', reservationController.completeReservation);

// Rutas solo para administradores
router.get('/admin/expired', requireAdmin, reservationController.getExpiredReservations);
router.post('/admin/cleanup', requireAdmin, reservationController.cleanupExpiredReservations);

module.exports = router; 