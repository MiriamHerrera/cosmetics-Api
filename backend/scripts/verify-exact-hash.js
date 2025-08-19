const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyExactHash() {
  let connection;
  
  try {
    console.log('🔍 VERIFICANDO HASH EXACTO EN LA BASE DE DATOS');
    console.log('================================================');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cosmetics_db',
      port: process.env.DB_PORT || 3306
    });
    
    // Obtener el hash exacto del usuario administrador
    const [users] = await connection.execute(
      'SELECT password FROM users WHERE phone = ? AND role = ?',
      ['+1234567890', 'admin']
    );
    
    if (users.length > 0) {
      const storedHash = users[0].password;
      
      console.log('📋 HASH ALMACENADO EN LA BASE DE DATOS:');
      console.log('Hash completo:', storedHash);
      console.log('Longitud:', storedHash.length);
      console.log('Primeros 10 caracteres:', storedHash.substring(0, 10));
      console.log('Últimos 10 caracteres:', storedHash.substring(storedHash.length - 10));
      
      // Comparar con el hash que debería estar
      const expectedHash = '$2a$12$Jl4zC7Oj53pq8FALHTf1yuaLWNZjshqY206Amq8gjCCf.3crc0sWi';
      
      console.log('\n🔍 COMPARACIÓN:');
      console.log('Hash esperado:', expectedHash);
      console.log('Hash almacenado:', storedHash);
      console.log('¿Son iguales?', storedHash === expectedHash ? '✅ SÍ' : '❌ NO');
      
      if (storedHash !== expectedHash) {
        console.log('\n❌ PROBLEMA IDENTIFICADO:');
        console.log('El hash en la base de datos NO coincide con el esperado');
        console.log('\n📝 SQL para corregir:');
        console.log(`UPDATE users SET password = '${expectedHash}' WHERE phone = '+1234567890' AND role = 'admin';`);
      } else {
        console.log('\n✅ El hash está correcto en la base de datos');
        console.log('El problema debe estar en otro lugar');
      }
      
    } else {
      console.log('❌ Usuario administrador no encontrado');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyExactHash(); 