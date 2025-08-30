const express = require('express');
const app = express();

console.log('🔍 PROBANDO IMPORTACIÓN DE RUTAS...');

try {
  console.log('📡 Importando authRoutes...');
  const authRoutes = require('./src/routes/auth');
  console.log('✅ authRoutes importado correctamente');
  
  console.log('📡 Importando publicProductRoutes...');
  const publicProductRoutes = require('./src/routes/publicProducts');
  console.log('✅ publicProductRoutes importado correctamente');
  
  console.log('📡 Importando productRoutes...');
  const productRoutes = require('./src/routes/products');
  console.log('✅ productRoutes importado correctamente');
  
  console.log('📡 Importando reservationRoutes...');
  const reservationRoutes = require('./src/routes/reservations');
  console.log('✅ reservationRoutes importado correctamente');
  
  console.log('📡 Importando surveyRoutes...');
  const surveyRoutes = require('./src/routes/surveys');
  console.log('✅ surveyRoutes importado correctamente');
  
  console.log('📡 Importando enhancedSurveyRoutes...');
  const enhancedSurveyRoutes = require('./src/routes/enhancedSurveys');
  console.log('✅ enhancedSurveyRoutes importado correctamente');
  
  console.log('📡 Importando statsRoutes...');
  const statsRoutes = require('./src/routes/stats');
  console.log('✅ statsRoutes importado correctamente');
  
  console.log('📡 Importando adminRoutes...');
  const adminRoutes = require('./src/routes/admin');
  console.log('✅ adminRoutes importado correctamente');
  
  console.log('📡 Importando orderRoutes...');
  const orderRoutes = require('./src/routes/orders');
  console.log('✅ orderRoutes importado correctamente');
  
  console.log('📡 Importando reportRoutes...');
  const reportRoutes = require('./src/routes/reports');
  console.log('✅ reportRoutes importado correctamente');
  
  console.log('📡 Importando unifiedCartRoutes...');
  const unifiedCartRoutes = require('./src/routes/unifiedCart');
  console.log('✅ unifiedCartRoutes importado correctamente');
  
  console.log('✅ TODAS LAS RUTAS SE IMPORTARON CORRECTAMENTE');
  
  // Probar que las rutas tienen métodos
  console.log('\n🔍 VERIFICANDO MÉTODOS DE LAS RUTAS...');
  
  console.log('📋 authRoutes methods:', Object.keys(authRoutes.stack || {}));
  console.log('📋 publicProductRoutes methods:', Object.keys(publicProductRoutes.stack || {}));
  console.log('📋 productRoutes methods:', Object.keys(productRoutes.stack || {}));
  
} catch (error) {
  console.error('❌ ERROR IMPORTANDO RUTAS:', error);
  console.error('Stack trace:', error.stack);
}

console.log('\n🏁 PRUEBA COMPLETADA');
