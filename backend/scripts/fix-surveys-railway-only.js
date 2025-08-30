const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración específica para Railway
const dbConfig = {
  host: process.env.DB_HOST || 'mysql.railway.internal',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Función para crear tablas individuales
const createTable = async (connection, tableName, createSQL) => {
  try {
    await connection.query(createSQL);
    console.log(`✅ Tabla ${tableName} creada/verificada`);
    return true;
  } catch (error) {
    console.error(`❌ Error creando tabla ${tableName}:`, error.message);
    return false;
  }
};

// Función principal para aplicar el fix en Railway
const fixSurveysTablesRailway = async () => {
  let connection;
  
  try {
    console.log('🔧 Aplicando fix para tablas de encuestas en Railway...');
    console.log('📊 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Conectar a la base de datos de Railway
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL de Railway establecida');
    
    // Verificar si las tablas ya existen
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log('📋 Tablas existentes en Railway:', tableNames);
    
    // Crear tabla de encuestas
    console.log('🔧 Creando tabla surveys...');
    const surveysTableSQL = `
      CREATE TABLE IF NOT EXISTS surveys (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        question varchar(255) NOT NULL,
        description text DEFAULT NULL,
        status enum('draft','active','closed') DEFAULT 'draft',
        created_by bigint(20) NOT NULL DEFAULT 1,
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        closed_by bigint(20) DEFAULT NULL,
        closed_at datetime DEFAULT NULL,
        PRIMARY KEY (id),
        KEY surveys_closed_by_fk (closed_by),
        KEY idx_surveys_status (status),
        KEY idx_surveys_created_by (created_by),
        KEY idx_surveys_status_created (status,created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    const surveysCreated = await createTable(connection, 'surveys', surveysTableSQL);
    
    // Crear tabla de opciones de encuesta
    console.log('🔧 Creando tabla survey_options...');
    const surveyOptionsTableSQL = `
      CREATE TABLE IF NOT EXISTS survey_options (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        survey_id bigint(20) NOT NULL,
        option_text varchar(200) NOT NULL,
        description text DEFAULT NULL,
        product_id bigint(20) DEFAULT NULL,
        created_by bigint(20) NOT NULL DEFAULT 1,
        is_approved tinyint(1) DEFAULT 0,
        admin_notes text DEFAULT NULL,
        approved_by bigint(20) DEFAULT NULL,
        approved_at datetime DEFAULT NULL,
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        KEY product_id (product_id),
        KEY survey_options_approved_by_fk (approved_by),
        KEY idx_survey_options_survey_id (survey_id),
        KEY idx_survey_options_approved (is_approved),
        KEY idx_survey_options_created_by (created_by),
        KEY idx_survey_options_survey_approved (survey_id,is_approved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    const surveyOptionsCreated = await createTable(connection, 'survey_options', surveyOptionsTableSQL);
    
    // Crear tabla de votos de encuesta
    console.log('🔧 Creando tabla survey_votes...');
    const surveyVotesTableSQL = `
      CREATE TABLE IF NOT EXISTS survey_votes (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        survey_id bigint(20) NOT NULL,
        option_id bigint(20) NOT NULL,
        user_id bigint(20) NOT NULL,
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_option (user_id,option_id),
        KEY idx_survey_votes_survey_id (survey_id),
        KEY idx_survey_votes_option_id (option_id),
        KEY idx_survey_votes_user_id (user_id),
        KEY idx_survey_votes_survey_user (survey_id,user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    const surveyVotesCreated = await createTable(connection, 'survey_votes', surveyVotesTableSQL);
    
    // Insertar datos mínimos si las tablas se crearon correctamente
    if (surveysCreated && surveyOptionsCreated && surveyVotesCreated) {
      console.log('📝 Insertando datos mínimos de prueba...');
      
      try {
        // Verificar si ya existe un usuario admin
        const [adminUsers] = await connection.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        let adminUserId = 1;
        
        if (adminUsers.length > 0) {
          adminUserId = adminUsers[0].id;
          console.log(`✅ Usuario admin encontrado con ID: ${adminUserId}`);
        } else {
          // Crear usuario admin si no existe
          await connection.query(`
            INSERT IGNORE INTO users (id, username, name, phone, email, password, role, is_active) VALUES
            (1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1)
          `);
          console.log('✅ Usuario admin creado');
        }
        
        // Insertar encuesta de prueba
        await connection.query(`
          INSERT IGNORE INTO surveys (id, question, description, status, created_by) VALUES
          (1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', ?)
        `, [adminUserId]);
        console.log('✅ Encuesta de prueba creada/verificada');
        
        // Insertar opción de encuesta
        await connection.query(`
          INSERT IGNORE INTO survey_options (id, survey_id, option_text, description, created_by, is_approved) VALUES
          (1, 1, 'Sí, me gusta mucho', 'Opción de prueba para verificar funcionamiento', ?, 1)
        `, [adminUserId]);
        console.log('✅ Opción de encuesta creada/verificada');
        
      } catch (error) {
        console.error('⚠️ Error insertando datos mínimos:', error.message);
      }
    }
    
    // Verificar que las tablas se crearon correctamente
    console.log('🔍 Verificando tablas creadas...');
    const [results] = await connection.query(`
      SELECT 'surveys' as tabla, COUNT(*) as registros FROM surveys
      UNION ALL
      SELECT 'survey_options', COUNT(*) FROM survey_options
      UNION ALL
      SELECT 'survey_votes', COUNT(*) FROM survey_votes
    `);
    
    console.log('📊 Resumen de tablas:');
    results.forEach(row => {
      console.log(`   ${row.tabla}: ${row.registros} registros`);
    });
    
    console.log('🎉 ¡Fix aplicado exitosamente en Railway!');
    console.log('✅ Las tablas de encuestas están listas para usar');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error aplicando fix:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  fixSurveysTablesRailway()
    .then((success) => {
      if (success) {
        console.log('✅ Script ejecutado exitosamente');
        process.exit(0);
      } else {
        console.log('❌ Script falló');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { fixSurveysTablesRailway };
