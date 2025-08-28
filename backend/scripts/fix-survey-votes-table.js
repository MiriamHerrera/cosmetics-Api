const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Función para corregir la tabla survey_votes
const fixSurveyVotesTable = async () => {
  let connection;
  
  try {
    console.log('🔧 Corrigiendo tabla survey_votes...');
    console.log('📊 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: 'cosmetics_db',
      port: dbConfig.port
    });
    
    // 1. Conectar a la base de datos
    connection = await mysql.createConnection({
      ...dbConfig,
      database: 'cosmetics_db'
    });
    console.log('✅ Conexión a MySQL establecida');
    
    // 2. Eliminar la tabla problemática si existe
    try {
      await connection.query('DROP TABLE IF EXISTS survey_votes');
      console.log('✅ Tabla survey_votes anterior eliminada');
    } catch (error) {
      console.log('ℹ️ No había tabla survey_votes para eliminar');
    }
    
    // 3. Crear la tabla corregida
    await connection.query(`
      CREATE TABLE survey_votes (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        survey_id bigint(20) NOT NULL,
        option_id bigint(20) NOT NULL,
        user_id bigint(20) DEFAULT NULL,
        session_id varchar(255) DEFAULT NULL,
        user_type enum('guest','registered') NOT NULL DEFAULT 'guest',
        created_at datetime DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_vote (survey_id, option_id, user_id, session_id),
        KEY survey_id (survey_id),
        KEY option_id (option_id),
        KEY user_id (user_id),
        KEY session_id (session_id),
        CONSTRAINT survey_votes_survey_fk FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
        CONSTRAINT survey_votes_option_fk FOREIGN KEY (option_id) REFERENCES survey_options (id) ON DELETE CASCADE,
        CONSTRAINT survey_votes_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla survey_votes corregida creada');
    
    // 4. Verificar que todas las tablas existan
    console.log('🔍 Verificando estructura completa...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log('📊 Tablas existentes:');
    tableNames.forEach(table => {
      console.log(`   ✅ ${table}`);
    });
    
    // 5. Verificar datos mínimos
    console.log('🔍 Verificando datos mínimos...');
    const [results] = await connection.query(`
      SELECT 'Usuarios' as tipo, COUNT(*) as cantidad FROM users
      UNION ALL
      SELECT 'Categorías', COUNT(*) FROM categories
      UNION ALL
      SELECT 'Tipos de producto', COUNT(*) FROM product_types
      UNION ALL
      SELECT 'Productos', COUNT(*) FROM products
      UNION ALL
      SELECT 'Encuestas', COUNT(*) FROM surveys
      UNION ALL
      SELECT 'Opciones de encuesta', COUNT(*) FROM survey_options
      UNION ALL
      SELECT 'Ubicaciones de entrega', COUNT(*) FROM delivery_locations
    `);
    
    console.log('📊 Resumen de datos:');
    results.forEach(row => {
      console.log(`   ${row.tipo}: ${row.cantidad}`);
    });
    
    console.log('🎉 ¡Tabla survey_votes corregida exitosamente!');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: password');
    console.log('   Teléfono: 1234567890');
    
  } catch (error) {
    console.error('❌ Error corrigiendo tabla:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  fixSurveyVotesTable()
    .then(() => {
      console.log('✅ Script de corrección ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { fixSurveyVotesTable };
