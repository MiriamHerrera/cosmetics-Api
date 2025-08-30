const express = require('express');
const { testConnection } = require('../src/config/database');

async function checkServerStatus() {
  console.log('🔍 VERIFICANDO ESTADO DEL SERVIDOR...');
  console.log('=====================================');
  
  try {
    // 1. Verificar conexión a la base de datos
    console.log('📡 Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      console.log('✅ Base de datos conectada correctamente');
    } else {
      console.log('❌ Error conectando a la base de datos');
      return;
    }
    
    // 2. Verificar que las rutas están configuradas correctamente
    console.log('\n🔍 Verificando configuración de rutas...');
    
    // Importar las rutas
    const authRoutes = require('../src/routes/auth');
    const publicProductRoutes = require('../src/routes/publicProducts');
    const productRoutes = require('../src/routes/products');
    const reservationRoutes = require('../src/routes/reservations');
    const surveyRoutes = require('../src/routes/surveys');
    const enhancedSurveyRoutes = require('../src/routes/enhancedSurveys');
    const statsRoutes = require('../src/routes/stats');
    const adminRoutes = require('../src/routes/admin');
    const orderRoutes = require('../src/routes/orders');
    const reportRoutes = require('../src/routes/reports');
    const unifiedCartRoutes = require('../src/routes/unifiedCart');
    
    console.log('✅ Todas las rutas importadas correctamente');
    
    // 3. Verificar que los controladores están disponibles
    console.log('\n🔍 Verificando controladores...');
    
    const authController = require('../src/controllers/authController');
    const productController = require('../src/controllers/productController');
    const publicProductController = require('../src/controllers/publicProductController');
    
    if (authController.login && authController.register) {
      console.log('✅ Controlador de autenticación disponible');
    } else {
      console.log('❌ Controlador de autenticación incompleto');
    }
    
    if (productController.getAllProducts) {
      console.log('✅ Controlador de productos disponible');
    } else {
      console.log('❌ Controlador de productos incompleto');
    }
    
    // 4. Verificar middleware
    console.log('\n🔍 Verificando middleware...');
    
    try {
      const { validate, loginSchema } = require('../src/middleware/validation');
      const { authenticateToken } = require('../src/middleware/auth');
      
      if (validate && loginSchema) {
        console.log('✅ Middleware de validación disponible');
      } else {
        console.log('❌ Middleware de validación incompleto');
      }
      
      if (authenticateToken) {
        console.log('✅ Middleware de autenticación disponible');
      } else {
        console.log('❌ Middleware de autenticación incompleto');
      }
    } catch (middlewareError) {
      console.log('❌ Error cargando middleware:', middlewareError.message);
    }
    
    // 5. Verificar configuración de la aplicación
    console.log('\n🔍 Verificando configuración de la aplicación...');
    
    const app = express();
    
    // Registrar rutas de prueba
    app.use('/api/auth', authRoutes);
    app.use('/api/public/products', publicProductRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/unified-cart', unifiedCartRoutes);
    app.use('/api/reservations', reservationRoutes);
    app.use('/api/surveys', surveyRoutes);
    app.use('/api/enhanced-surveys', enhancedSurveyRoutes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/reports', reportRoutes);
    
    console.log('✅ Rutas registradas en la aplicación de prueba');
    
    // 6. Verificar variables de entorno
    console.log('\n🔍 Verificando variables de entorno...');
    
    const requiredEnvVars = [
      'DB_HOST',
      'DB_USER', 
      'DB_PASSWORD',
      'DB_NAME',
      'JWT_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length === 0) {
      console.log('✅ Todas las variables de entorno requeridas están configuradas');
    } else {
      console.log('❌ Variables de entorno faltantes:', missingEnvVars.join(', '));
    }
    
    // 7. Verificar puerto
    const PORT = process.env.PORT || 8000;
    console.log(`🌐 Puerto configurado: ${PORT}`);
    
    // 8. Verificar ambiente
    const NODE_ENV = process.env.NODE_ENV || 'development';
    console.log(`🌍 Ambiente: ${NODE_ENV}`);
    
    console.log('\n=====================================');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('\n💡 Si todo está correcto, el problema puede ser:');
    console.log('   - El servidor necesita reiniciarse');
    console.log('   - Hay un problema de despliegue');
    console.log('   - El código no se ha sincronizado con el servidor');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar la verificación
checkServerStatus()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en la verificación:', error);
    process.exit(1);
  });
