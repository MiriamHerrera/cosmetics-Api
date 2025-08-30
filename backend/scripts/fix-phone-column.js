const { query, getConnection } = require('../src/config/database');

const fixPhoneColumn = async () => {
  let connection;
  
  try {
    console.log('🔧 INICIANDO CORRECCIÓN DE COLUMNA PHONE...');
    
    // Obtener conexión
    connection = await getConnection();
    console.log('✅ Conexión obtenida');
    
    // Verificar estructura actual
    console.log('🔍 Verificando estructura actual de la tabla users...');
    const [currentStructure] = await connection.query('DESCRIBE users');
    
    const phoneColumn = currentStructure.find(col => col.Field === 'phone');
    if (phoneColumn) {
      console.log('📱 Columna phone actual:', {
        field: phoneColumn.Field,
        type: phoneColumn.Type,
        null: phoneColumn.Null,
        key: phoneColumn.Key,
        default: phoneColumn.Default
      });
    }
    
    // Verificar si ya está corregida
    if (phoneColumn && phoneColumn.Type.includes('varchar')) {
      console.log('✅ La columna phone ya está corregida (VARCHAR)');
      return true;
    }
    
    // Ejecutar la corrección
    console.log('🔧 Cambiando tipo de dato de phone a VARCHAR(20)...');
    await connection.query('ALTER TABLE users MODIFY COLUMN phone VARCHAR(20) NOT NULL');
    console.log('✅ Columna phone corregida exitosamente');
    
    // Verificar que el cambio se aplicó
    console.log('🔍 Verificando cambio aplicado...');
    const [newStructure] = await connection.query('DESCRIBE users');
    const newPhoneColumn = newStructure.find(col => col.Field === 'phone');
    
    console.log('📱 Nueva estructura de columna phone:', {
      field: newPhoneColumn.Field,
      type: newPhoneColumn.Type,
      null: newPhoneColumn.Null,
      key: newPhoneColumn.Key,
      default: newPhoneColumn.Default
    });
    
    // Verificar que los datos existentes se mantuvieron
    console.log('🔍 Verificando datos existentes...');
    const [users] = await connection.query('SELECT id, phone, email, role FROM users LIMIT 5');
    console.log('📋 Usuarios encontrados:', users.length);
    users.forEach(user => {
      console.log(`   ID: ${user.id}, Phone: ${user.phone}, Role: ${user.role}`);
    });
    
    console.log('✅ CORRECCIÓN COMPLETADA EXITOSAMENTE');
    return true;
    
  } catch (error) {
    console.error('❌ ERROR EN CORRECCIÓN:', error);
    console.error('   Stack trace:', error.stack);
    console.error('   Error code:', error.code);
    console.error('   SQL Message:', error.sqlMessage);
    return false;
    
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  fixPhoneColumn()
    .then(success => {
      if (success) {
        console.log('🎉 Script ejecutado exitosamente');
        process.exit(0);
      } else {
        console.log('💥 Script falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Error inesperado:', error);
      process.exit(1);
    });
}

module.exports = { fixPhoneColumn };
