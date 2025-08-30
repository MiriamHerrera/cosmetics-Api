const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos de Railway
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

// Script SQL para crear las tablas de encuestas
const createSurveysTablesSQL = `
-- Crear tabla de encuestas
CREATE TABLE IF NOT EXISTS \`surveys\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
  \`question\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL COMMENT 'Descripción adicional de la encuesta',
  \`status\` enum('draft','active','closed') DEFAULT 'draft' COMMENT 'Estado de la encuesta',
  \`created_by\` bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que creó la encuesta',
  \`created_at\` datetime DEFAULT current_timestamp(),
  \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  \`closed_by\` bigint(20) DEFAULT NULL COMMENT 'ID del admin que cerró la encuesta',
  \`closed_at\` datetime DEFAULT NULL COMMENT 'Fecha de cierre',
  PRIMARY KEY (\`id\`),
  KEY \`surveys_closed_by_fk\` (\`closed_by\`),
  KEY \`idx_surveys_status\` (\`status\`),
  KEY \`idx_surveys_created_by\` (\`created_by\`),
  KEY \`idx_surveys_status_created\` (\`status\`,\`created_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de opciones de encuesta
CREATE TABLE IF NOT EXISTS \`survey_options\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
  \`survey_id\` bigint(20) NOT NULL,
  \`option_text\` varchar(200) NOT NULL,
  \`description\` text DEFAULT NULL COMMENT 'Descripción adicional de la opción',
  \`product_id\` bigint(20) DEFAULT NULL,
  \`created_by\` bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que sugirió la opción',
  \`is_approved\` tinyint(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Aprobada',
  \`admin_notes\` text DEFAULT NULL COMMENT 'Notas del administrador sobre la aprobación',
  \`approved_by\` bigint(20) DEFAULT NULL COMMENT 'ID del admin que aprobó/rechazó',
  \`approved_at\` datetime DEFAULT NULL COMMENT 'Fecha de aprobación/rechazo',
  \`created_at\` datetime DEFAULT current_timestamp() COMMENT 'Fecha de creación de la opción',
  \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  KEY \`product_id\` (\`product_id\`),
  KEY \`survey_options_approved_by_fk\` (\`approved_by\`),
  KEY \`idx_survey_options_survey_id\` (\`survey_id\`),
  KEY \`idx_survey_options_approved\` (\`is_approved\`),
  KEY \`idx_survey_options_created_by\` (\`created_by\`),
  KEY \`idx_survey_options_survey_approved\` (\`survey_id\`,\`is_approved\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de votos de encuesta
CREATE TABLE IF NOT EXISTS \`survey_votes\` (
  \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
  \`survey_id\` bigint(20) NOT NULL,
  \`option_id\` bigint(20) NOT NULL,
  \`user_id\` bigint(20) NOT NULL,
  \`created_at\` datetime DEFAULT current_timestamp(),
  \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`unique_user_option\` (\`user_id\`,\`option_id\`),
  KEY \`idx_survey_votes_survey_id\` (\`survey_id\`),
  KEY \`idx_survey_votes_option_id\` (\`option_id\`),
  KEY \`idx_survey_votes_user_id\` (\`user_id\`),
  KEY \`idx_survey_votes_survey_user\` (\`survey_id\`,\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// Script para insertar datos mínimos
const insertMinimalDataSQL = `
-- Insertar datos mínimos de prueba si no existen
INSERT IGNORE INTO \`surveys\` (\`id\`, \`question\`, \`description\`, \`status\`, \`created_by\`) VALUES
(1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1);

INSERT IGNORE INTO \`survey_options\` (\`id\`, \`survey_id\`, \`option_text\`, \`description\`, \`created_by\`, \`is_approved\`) VALUES
(1, 1, 'Sí, me gusta mucho', 'Opción de prueba para verificar funcionamiento', 1, 1);
`;

// Función principal para aplicar el fix
const fixSurveysTables = async () => {
  let connection;
  
  try {
    console.log('🔧 Aplicando fix para tablas de encuestas en Railway...');
    console.log('📊 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL establecida');
    
    // Verificar si las tablas ya existen
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log('📋 Tablas existentes:', tableNames);
    
    // Crear las tablas de encuestas
    console.log('🔧 Creando tablas de encuestas...');
    await connection.query(createSurveysTablesSQL);
    console.log('✅ Tablas de encuestas creadas');
    
    // Insertar datos mínimos
    console.log('📝 Insertando datos mínimos...');
    await connection.query(insertMinimalDataSQL);
    console.log('✅ Datos mínimos insertados');
    
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
    
    console.log('🎉 ¡Fix aplicado exitosamente!');
    console.log('✅ Las tablas de encuestas están listas para usar');
    
  } catch (error) {
    console.error('❌ Error aplicando fix:', error);
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
  fixSurveysTables()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { fixSurveysTables };
