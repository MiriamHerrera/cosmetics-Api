const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

// Crear reserva (invitados y usuarios registrados)
router.post('/create', reservationController.createReservation);

// Obtener reservas de un usuario específico (por userId o sessionId)
router.get('/user/:userId', reservationController.getUserReservations);
router.get('/session/:sessionId', reservationController.getUserReservations);

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

// Obtener reservas del usuario autenticado
router.get('/my-reservations', authenticateToken, (req, res) => {
  req.params.userId = req.user.id;
  reservationController.getUserReservations(req, res);
});

// Cancelar reserva propia
router.put('/cancel/:reservationId', authenticateToken, reservationController.cancelReservation);

// Completar reserva (convertir en pedido)
router.put('/complete/:reservationId', authenticateToken, reservationController.completeReservation);

// ========================================
// RUTAS DE ADMINISTRADOR
// ========================================

// Obtener todas las reservas (con filtros y paginación)
router.get('/admin/all', authenticateToken, requireAdmin, reservationController.getAllReservations);

// Obtener estadísticas de reservas
router.get('/admin/stats', authenticateToken, requireAdmin, reservationController.getReservationStats);

// Extender plazo de reserva
router.put('/admin/extend/:reservationId', authenticateToken, requireAdmin, reservationController.extendReservation);

// Cancelar cualquier reserva
router.put('/admin/cancel/:reservationId', authenticateToken, requireAdmin, reservationController.cancelReservation);

// Limpiar reservas expiradas manualmente
router.post('/admin/cleanup', authenticateToken, requireAdmin, reservationController.cleanupExpiredReservations);

// Obtener historial de extensiones de una reserva
router.get('/admin/extensions/:reservationId', authenticateToken, requireAdmin, reservationController.getReservationExtensions);

// Enviar recordatorio de WhatsApp
router.post('/admin/reminder/:reservationId', authenticateToken, requireAdmin, reservationController.sendWhatsAppReminder);

// ========================================
// RUTAS DE DESARROLLO/TESTING (opcional)
// ========================================

if (process.env.NODE_ENV === 'development') {
  // Ruta para probar el servicio de reservas
  router.get('/test/service', async (req, res) => {
    try {
      const ReservationService = require('../services/reservationService');
      const stats = await ReservationService.getReservationStats();
      res.json({
        success: true,
        message: 'Servicio de reservas funcionando correctamente',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en el servicio de reservas',
        error: error.message
      });
    }
  });

  // Ruta para probar la limpieza automática
  router.post('/test/cleanup', async (req, res) => {
    try {
      const ReservationService = require('../services/reservationService');
      const result = await ReservationService.cleanupExpiredReservations();
      res.json({
        success: true,
        message: 'Limpieza de prueba completada',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en limpieza de prueba',
        error: error.message
      });
    }
  });
}

// ========================================
// RUTAS DE INTEGRACIÓN CON CARRITO
// ========================================

// Crear reserva desde el carrito (cuando se agrega producto)
router.post('/from-cart', reservationController.createReservation);

// Obtener reservas activas de un carrito específico
router.get('/cart/:cartId', (req, res) => {
  req.params.sessionId = req.params.cartId;
  reservationController.getUserReservations(req, res);
});

// ========================================
// MANEJADOR DE ERRORES
// ========================================

router.use((err, req, res, next) => {
  console.error('❌ Error en ruta de reservas:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor en reservas',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

module.exports = router; 