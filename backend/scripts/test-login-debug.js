const { getConnection, query } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function testLoginDebug() {
  let connection;
  
  try {
    console.log('🔍 DEBUG: Probando conexión y login...');
    
    // 1. Probar conexión
    console.log('📡 Probando conexión a la base de datos...');
    connection = await getConnection();
    console.log('✅ Conexión exitosa');
    
    // 2. Verificar que la tabla users existe
    console.log('📋 Verificando tabla users...');
    const [tables] = await connection.query('SHOW TABLES LIKE "users"');
    if (tables.length === 0) {
      console.log('❌ Tabla users no existe');
      return;
    }
    console.log('✅ Tabla users existe');
    
    // 3. Verificar estructura de la tabla users
    console.log('🔍 Verificando estructura de la tabla users...');
    const [columns] = await connection.query('DESCRIBE users');
    console.log('📋 Columnas de la tabla users:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 4. Buscar usuario Miriam Herrera
    console.log('👤 Buscando usuario Miriam Herrera...');
    const [users] = await connection.query(
      'SELECT id, name, phone, email, password, role, is_active FROM users WHERE phone = ?',
      ['8124307494']
    );
    
    if (users.length === 0) {
      console.log('❌ Usuario Miriam Herrera no encontrado');
      console.log('🔍 Buscando todos los usuarios...');
      const [allUsers] = await connection.query('SELECT id, name, phone, role FROM users LIMIT 5');
      console.log('📋 Usuarios encontrados:', allUsers.length);
      allUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Nombre: ${user.name}, Teléfono: ${user.phone}, Rol: ${user.role}`);
      });
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuario encontrado:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Nombre: ${user.name}`);
    console.log(`  - Teléfono: ${user.phone}`);
    console.log(`  - Email: ${user.email || 'No tiene'}`);
    console.log(`  - Rol: ${user.role}`);
    console.log(`  - Activo: ${user.is_active ? 'Sí' : 'No'}`);
    console.log(`  - Password hash: ${user.password ? `${user.password.substring(0, 20)}...` : 'No tiene'}`);
    
    // 5. Probar autenticación con password
    console.log('🔐 Probando autenticación...');
    const testPassword = 'password123'; // Cambiar por el password real si lo conoces
    
    if (user.password) {
      try {
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`🔍 Password "${testPassword}" válido: ${isPasswordValid}`);
        
        if (!isPasswordValid) {
          console.log('⚠️ El password de prueba no coincide con el hash almacenado');
          console.log('💡 Esto es normal si no conoces el password real');
        }
      } catch (bcryptError) {
        console.error('❌ Error en bcrypt.compare:', bcryptError);
      }
    } else {
      console.log('❌ El usuario no tiene password hash');
    }
    
    // 6. Verificar si hay problemas de permisos
    console.log('🔒 Verificando permisos de la base de datos...');
    try {
      const [permissions] = await connection.query('SHOW GRANTS');
      console.log('✅ Permisos verificados');
    } catch (permError) {
      console.error('❌ Error verificando permisos:', permError.message);
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    console.error('Stack trace:', error.stack);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('SQL Message:', error.sqlMessage);
    }
    if (error.sqlState) {
      console.error('SQL State:', error.sqlState);
    }
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
}

// Ejecutar el debug
testLoginDebug()
  .then(() => {
    console.log('✅ Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal en debug:', error);
    process.exit(1);
  });
