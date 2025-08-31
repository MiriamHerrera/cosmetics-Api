// backend/src/routes/images.js
const express = require('express');
const router = express.Router();
const { upload, uploadImages } = require('../controllers/imageController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Subir múltiples imágenes (admin)
router.post('/upload', authenticateToken, requireAdmin, upload.array('images', 10), uploadImages);

module.exports = router;