const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, registerSchema, loginSchema, profileUpdateSchema } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Rutas protegidas
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validate(profileUpdateSchema), authController.updateProfile);
router.post('/logout', authenticateToken, authController.logout);

// Endpoint temporal para inicializar la base de datos (público)
router.get('/init-database', async (req, res) => {
    try {
      console.log('🔧 Inicialización manual de base de datos solicitada...');
      const { createBasicTables } = require('../config/database');
      
      console.log('📡 Llamando a createBasicTables()...');
      const result = await createBasicTables();
      console.log('📊 Resultado de createBasicTables:', result);
      
      if (result) {
        console.log('✅ Base de datos inicializada correctamente');
        res.json({ 
          success: true, 
          message: 'Base de datos inicializada correctamente',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ Error en la inicialización de la base de datos');
        res.status(500).json({ 
          success: false, 
          message: 'Error en la inicialización de la base de datos',
          details: 'createBasicTables() retornó false'
        });
      }
    } catch (error) {
      console.error('❌ Error en endpoint de inicialización:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        details: 'Error capturado en try-catch'
      });
    }
  });
  

module.exports = router; 