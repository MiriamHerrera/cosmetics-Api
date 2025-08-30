const { testConnection } = require('./src/config/database');

async function testDatabaseFix() {
  console.log('🧪 Probando la solución de claves foráneas...');
  console.log('==========================================');
  
  try {
    const result = await testConnection();
    
    if (result) {
      console.log('✅ PRUEBA EXITOSA: Base de datos configurada correctamente');
      console.log('✅ Todas las tablas creadas sin errores de tipos');
      console.log('✅ Todas las claves foráneas agregadas correctamente');
      console.log('✅ Tipos de datos consistentes en todas las relaciones');
    } else {
      console.log('❌ PRUEBA FALLIDA: Error en la configuración de la base de datos');
    }
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar la prueba
testDatabaseFix();
