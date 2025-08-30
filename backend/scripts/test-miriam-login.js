const { getConnection } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function testMiriamLogin() {
  let connection;
  
  try {
    console.log('🔐 PROBANDO LOGIN DE MIRIAM HERRERA...');
    console.log('=====================================');
    
    connection = await getConnection();
    
    // Datos del usuario
    const phone = '8124307494';
    const password = 'password123'; // Cambiar por el password real si lo conoces
    
    console.log(`📱 Teléfono: ${phone}`);
    console.log(`🔑 Password: ${password}`);
    
    // 1. Limpiar teléfono (como lo hace el controlador)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    console.log(`🧹 Teléfono limpio: ${cleanPhone}`);
    
    // 2. Buscar usuario
    console.log('🔍 Buscando usuario en la base de datos...');
    const [users] = await connection.query(
      'SELECT id, name, phone, email, password, role, is_active FROM users WHERE phone = ?',
      [cleanPhone]
    );
    
    if (users.length === 0) {
      console.log('❌ USUARIO NO ENCONTRADO');
      console.log('💡 Posibles causas:');
      console.log('   - El usuario no fue creado');
      console.log('   - El teléfono no coincide');
      console.log('   - Problema en la base de datos');
      
      // Mostrar todos los usuarios para debug
      console.log('\n🔍 Mostrando todos los usuarios disponibles:');
      const [allUsers] = await connection.query('SELECT id, name, phone, role FROM users ORDER BY id');
      if (allUsers.length === 0) {
        console.log('   - No hay usuarios en la base de datos');
      } else {
        allUsers.forEach(user => {
          console.log(`   - ID: ${user.id}, Nombre: ${user.name}, Teléfono: ${user.phone}, Rol: ${user.role}`);
        });
      }
      return;
    }
    
    const user = users[0];
    console.log('✅ USUARIO ENCONTRADO:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nombre: ${user.name}`);
    console.log(`   - Teléfono: ${user.phone}`);
    console.log(`   - Email: ${user.email || 'No tiene'}`);
    console.log(`   - Rol: ${user.role}`);
    console.log(`   - Activo: ${user.is_active ? 'Sí' : 'No'}`);
    
    // 3. Verificar password
    if (!user.password) {
      console.log('❌ ERROR: El usuario no tiene password hash');
      console.log('💡 Solución: El usuario necesita un password válido');
      return;
    }
    
    console.log(`🔐 Password hash encontrado: ${user.password.substring(0, 30)}...`);
    
    // 4. Probar autenticación
    console.log('\n🔐 PROBANDO AUTENTICACIÓN...');
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`✅ Password válido: ${isPasswordValid}`);
      
      if (isPasswordValid) {
        console.log('🎉 LOGIN EXITOSO - Las credenciales son correctas');
        console.log('💡 El problema puede estar en:');
        console.log('   - El frontend no está enviando los datos correctos');
        console.log('   - Error en el controlador de autenticación');
        console.log('   - Problema de CORS o middleware');
      } else {
        console.log('❌ PASSWORD INCORRECTO');
        console.log('💡 Posibles causas:');
        console.log('   - El password proporcionado no es el correcto');
        console.log('   - El hash en la BD no corresponde al password');
        console.log('   - Problema en la generación del hash');
        
        // Mostrar información del hash
        console.log(`🔍 Hash en BD: ${user.password}`);
        console.log(`🔍 Longitud del hash: ${user.password.length}`);
        console.log(`🔍 Formato del hash: ${user.password.startsWith('$2a$') ? 'bcrypt válido' : 'Formato incorrecto'}`);
      }
    } catch (bcryptError) {
      console.error('❌ ERROR EN BCRYPT:', bcryptError);
      console.log('💡 Posibles causas:');
      console.log('   - Hash corrupto en la base de datos');
      console.log('   - Problema con la librería bcrypt');
    }
    
    // 5. Verificar si el usuario está activo
    if (!user.is_active) {
      console.log('⚠️ ADVERTENCIA: El usuario está inactivo');
      console.log('💡 Esto puede causar problemas de login');
    }
    
  } catch (error) {
    console.error('❌ ERROR FATAL:', error);
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
      console.log('\n🔓 Conexión liberada');
    }
  }
}

// Ejecutar la prueba
testMiriamLogin()
  .then(() => {
    console.log('\n✅ PRUEBA COMPLETADA');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ERROR FATAL:', error);
    process.exit(1);
  });
