const express = require('express');
const router = express.Router();
const publicProductController = require('../controllers/publicProductController');

// Rutas públicas para productos aprobados (sin autenticación requerida)
router.get('/', publicProductController.getPublicProducts);
router.get('/search', publicProductController.searchPublicProducts);
router.get('/categories', publicProductController.getPublicCategories);
router.get('/types', publicProductController.getPublicProductTypes);
router.get('/category/:category_name', publicProductController.getPublicProductsByCategory);

// Endpoint de debug para WhatsApp (sin autenticación)
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

// IMPORTANTE: Las rutas con parámetros deben ir al final
router.get('/:id', publicProductController.getPublicProductById);

module.exports = router; 