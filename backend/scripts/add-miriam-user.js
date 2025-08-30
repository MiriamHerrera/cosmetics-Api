const { getConnection } = require('../src/config/database');

async function addMiriamUser() {
  let connection;
  
  try {
    console.log('👤 Agregando usuario Miriam Herrera...');
    
    connection = await getConnection();
    
    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.query(`
      SELECT id, name, phone, role, is_active 
      FROM users 
      WHERE phone = ?
    `, ['8124307494']);
    
    if (existingUsers.length > 0) {
      console.log('⚠️ El usuario ya existe:');
      const user = existingUsers[0];
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Nombre: ${user.name}`);
      console.log(`  - Teléfono: ${user.phone}`);
      console.log(`  - Rol: ${user.role}`);
      console.log(`  - Activo: ${user.is_active ? 'Sí' : 'No'}`);
      return;
    }
    
    // Insertar el usuario Miriam Herrera
    const [result] = await connection.query(`
      INSERT INTO users (name, phone, password, role, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'Miriam Herrera',
      '8124307494',
      '$2a$12$Jl4zC7Oj53pq8FALHTf1yuaLWNZjshqY206Amq8gjCCf.3crc0sWi',
      'client',
      1
    ]);
    
    console.log('✅ Usuario Miriam Herrera creado exitosamente');
    console.log(`  - ID asignado: ${result.insertId}`);
    
    // Verificar que el usuario fue creado
    const [newUser] = await connection.query(`
      SELECT id, name, phone, role, is_active, created_at
      FROM users 
      WHERE id = ?
    `, [result.insertId]);
    
    if (newUser.length > 0) {
      const user = newUser[0];
      console.log('📋 Detalles del usuario creado:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Nombre: ${user.name}`);
      console.log(`  - Teléfono: ${user.phone}`);
      console.log(`  - Rol: ${user.role}`);
      console.log(`  - Activo: ${user.is_active ? 'Sí' : 'No'}`);
      console.log(`  - Fecha de creación: ${user.created_at}`);
    }
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
}

// Ejecutar la creación del usuario
addMiriamUser()
  .then(() => {
    console.log('✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  });
