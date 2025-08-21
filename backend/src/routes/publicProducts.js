const express = require('express');
const router = express.Router();
const publicProductController = require('../controllers/publicProductController');

// Rutas públicas para productos aprobados (sin autenticación requerida)
router.get('/', publicProductController.getPublicProducts);
router.get('/search', publicProductController.searchPublicProducts);
router.get('/categories', publicProductController.getPublicCategories);
router.get('/types', publicProductController.getPublicProductTypes);
router.get('/category/:category_name', publicProductController.getPublicProductsByCategory);

// IMPORTANTE: Las rutas con parámetros deben ir al final
router.get('/:id', publicProductController.getPublicProductById);

module.exports = router; 