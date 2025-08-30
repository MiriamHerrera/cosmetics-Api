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

// Función para crear todas las tablas necesarias
const createBasicTables = async () => {
    try {
      console.log('🔧 Verificando estructura de base de datos...');
      
      // Obtener conexión del pool
      const connection = await pool.getConnection();
      console.log('✅ Conexión obtenida del pool');
      
      try {
        // Verificar si las tablas principales existen
        console.log('🔍 Ejecutando SHOW TABLES...');
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);
        console.log(`�� Tablas encontradas: ${tableNames.length} - ${tableNames.join(', ')}`);
        
        if (tableNames.length === 0) {
          console.log('🔧 Base de datos vacía, creando estructura completa...');
          
          // Crear todas las tablas desde cero
          await createAllTables(connection);
          
        } else {
          console.log(`✅ Base de datos ya tiene ${tableNames.length} tablas`);
          
          // Verificar si faltan tablas críticas y crearlas
          await createMissingTables(connection, tableNames);
        }
        
      } finally {
        // Liberar la conexión
        connection.release();
        console.log('🔓 Conexión liberada del pool');
      }
      
      console.log('✅ createBasicTables completado exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error verificando estructura de base de datos:', error.message);
      console.error('❌ Stack trace completo:', error.stack);
      return false;
    }
  };

module.exports = router; 