const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticación y autorización de admin a todas las rutas
router.use(authenticateToken);
router.use(requireAdmin);

// ===== RUTAS PARA LUGARES DE ENTREGA =====

// GET /api/admin/delivery-locations - Obtener todos los lugares de entrega
router.get('/delivery-locations', availabilityController.getDeliveryLocations);

// POST /api/admin/delivery-locations - Crear nuevo lugar de entrega
router.post('/delivery-locations', availabilityController.createDeliveryLocation);

// PUT /api/admin/delivery-locations/:id - Actualizar lugar de entrega
router.put('/delivery-locations/:id', availabilityController.updateDeliveryLocation);

// DELETE /api/admin/delivery-locations/:id - Eliminar lugar de entrega
router.delete('/delivery-locations/:id', availabilityController.deleteDeliveryLocation);

// PATCH /api/admin/delivery-locations/:id/toggle-status - Cambiar estado de lugar de entrega
router.patch('/delivery-locations/:id/toggle-status', availabilityController.toggleDeliveryLocationStatus);

// ===== RUTAS PARA HORARIOS DE DISPONIBILIDAD =====

// GET /api/admin/time-slots - Obtener todos los horarios
router.get('/time-slots', availabilityController.getTimeSlots);

// POST /api/admin/time-slots - Crear nuevo horario
router.post('/time-slots', availabilityController.createTimeSlot);

// PUT /api/admin/time-slots/:id - Actualizar horario
router.put('/time-slots/:id', availabilityController.updateTimeSlot);

// DELETE /api/admin/time-slots/:id - Eliminar horario
router.delete('/time-slots/:id', availabilityController.deleteTimeSlot);

// PATCH /api/admin/time-slots/:id/toggle-status - Cambiar estado de horario
router.patch('/time-slots/:id/toggle-status', availabilityController.toggleTimeSlotStatus);

// GET /api/admin/time-slots/available/:locationId - Obtener horarios disponibles para un lugar
router.get('/time-slots/available/:locationId', availabilityController.getAvailableTimeSlots);

// ===== RUTAS PARA CONFIGURACIÓN DE WHATSAPP =====

// GET /api/admin/whatsapp-config - Obtener configuración de WhatsApp
router.get('/whatsapp-config', availabilityController.getWhatsAppConfig);

// GET /api/admin/whatsapp-debug - Debug de configuración de WhatsApp (sin autenticación para testing)
router.get('/whatsapp-debug', (req, res) => {
  const whatsappConfig = require('../config/whatsapp');
  
  res.json({
    success: true,
    data: {
      env: {
        NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
        NEXT_PUBLIC_WHATSAPP_NUMBER_2: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_2
      },
      config: {
        primaryNumber: whatsappConfig.primaryNumber,
        secondaryNumber: whatsappConfig.secondaryNumber
      },
      test: {
        DEFAULT: whatsappConfig.getNumberForLocation('DEFAULT'),
        SECONDARY: whatsappConfig.getNumberForLocation('SECONDARY')
      }
    }
  });
});

module.exports = router;
