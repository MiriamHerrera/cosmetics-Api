#!/usr/bin/env node

console.log('🔍 DIAGNÓSTICO DE INICIO DEL SERVIDOR');
console.log('=====================================');

// Verificar variables de entorno
console.log('\n📋 VARIABLES DE ENTORNO:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NO DEFINIDA');
console.log('PORT:', process.env.PORT || 'NO DEFINIDA');
console.log('DB_HOST:', process.env.DB_HOST || 'NO DEFINIDA');
console.log('DB_USER:', process.env.DB_USER || 'NO DEFINIDA');
console.log('DB_NAME:', process.env.DB_NAME || 'NO DEFINIDA');
console.log('DB_PORT:', process.env.DB_PORT || 'NO DEFINIDA');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'DEFINIDA' : 'NO DEFINIDA');

// Verificar si los módulos existen
console.log('\n📦 VERIFICANDO MÓDULOS:');
try {
  require('./src/app');
  console.log('✅ app.js - OK');
} catch (error) {
  console.log('❌ app.js - ERROR:', error.message);
}

try {
  require('./src/config/database');
  console.log('✅ database.js - OK');
} catch (error) {
  console.log('❌ database.js - ERROR:', error.message);
}

try {
  require('./src/socket');
  console.log('✅ socket.js - OK');
} catch (error) {
  console.log('❌ socket.js - ERROR:', error.message);
}

try {
  require('./src/services/cartCleanupService');
  console.log('✅ cartCleanupService.js - OK');
} catch (error) {
  console.log('❌ cartCleanupService.js - ERROR:', error.message);
}

// Verificar package.json
console.log('\n📄 VERIFICANDO PACKAGE.JSON:');
try {
  const packageJson = require('./package.json');
  console.log('✅ package.json - OK');
  console.log('   Main:', packageJson.main || 'NO DEFINIDO');
  console.log('   Scripts:', Object.keys(packageJson.scripts || {}));
} catch (error) {
  console.log('❌ package.json - ERROR:', error.message);
}

console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
console.log('=====================================');
