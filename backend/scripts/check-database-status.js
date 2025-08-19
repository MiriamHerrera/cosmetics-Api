const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStatus() {
  let connection;
  
  try {
    console.log('🔍 VERIFICANDO ESTADO DE LA BASE DE DATOS');
    console.log('==========================================');
    
    // Configuración de conexión
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cosmetics_db',
      port: process.env.DB_PORT || 3306
    };
    
    console.log('\n1️⃣ CONFIGURACIÓN DE BASE DE DATOS:');
    console.log('Host:', dbConfig.host);
    console.log('Usuario:', dbConfig.user);
    console.log('Base de datos:', dbConfig.database);
    console.log('Puerto:', dbConfig.port);
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('\n✅ Conexión a MySQL establecida correctamente');
    
    // Verificar si existe la tabla users
    console.log('\n2️⃣ VERIFICANDO TABLA USERS:');
    const [tables] = await connection.execute('SHOW TABLES LIKE "users"');
    if (tables.length > 0) {
      console.log('✅ Tabla users existe');
    } else {
      console.log('❌ Tabla users NO existe');
      return;
    }
    
    // Verificar estructura de la tabla users
    console.log('\n3️⃣ ESTRUCTURA DE LA TABLA USERS:');
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Columnas encontradas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar si existe el usuario administrador
    console.log('\n4️⃣ VERIFICANDO USUARIO ADMINISTRADOR:');
    const [users] = await connection.execute(
      'SELECT id, name, phone, email, role, LENGTH(password) as password_length FROM users WHERE phone = ?',
      ['+1234567890']
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Usuario administrador encontrado:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Nombre: ${user.name}`);
      console.log(`  - Teléfono: ${user.phone}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Rol: ${user.role}`);
      console.log(`  - Longitud de contraseña: ${user.password_length}`);
      
      // Verificar si la contraseña es la correcta
      if (user.password_length === 60) {
        console.log('✅ Longitud de contraseña correcta (60 caracteres)');
      } else {
        console.log('❌ Longitud de contraseña incorrecta');
      }
    } else {
      console.log('❌ Usuario administrador NO encontrado');
    }
    
    // Verificar todos los usuarios
    console.log('\n5️⃣ TODOS LOS USUARIOS EN LA BASE DE DATOS:');
    const [allUsers] = await connection.execute('SELECT id, name, phone, role, LENGTH(password) as password_length FROM users');
    console.log(`Total de usuarios: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.phone}) - ${user.role} - Password: ${user.password_length} chars`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

checkDatabaseStatus(); 