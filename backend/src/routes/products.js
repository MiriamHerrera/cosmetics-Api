const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validate, productSchema } = require('../middleware/validation');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// Rutas públicas (con autenticación opcional para personalización)
router.get('/', optionalAuth, productController.getAllProducts);
router.get('/search', optionalAuth, productController.searchProducts);
router.get('/categories', productController.getCategories);
router.get('/types', productController.getAllProductTypes);
router.get('/categories/:category_id/types', productController.getProductTypesByCategory);
router.get('/category/:category_name', productController.getProductsByCategory);

// IMPORTANTE: Las rutas con parámetros deben ir al final
router.get('/:id', optionalAuth, productController.getProductById);

// Rutas protegidas (solo admin)
router.post('/', authenticateToken, requireAdmin, validate(productSchema), productController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, validate(productSchema), productController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, productController.deleteProduct);

module.exports = router; 