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

// Función para crear tablas de manera secuencial
const createTablesSequentially = async () => {
  let connection;
  
  try {
    console.log('🔧 Aplicando fix secuencial para Railway...');
    console.log('📊 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Conectar a la base de datos de Railway
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL de Railway establecida');
    
    // Verificar tablas existentes
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log('📋 Tablas existentes en Railway:', tableNames);
    
    // ========================================
    // PASO 1: Tablas base (sin dependencias)
    // ========================================
    console.log('\n🏗️  PASO 1: Creando tablas base...');
    
    // 1.1 Tabla de usuarios
    console.log('🔧 Creando tabla users...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        username varchar(50) DEFAULT NULL,
        name varchar(100) NOT NULL,
        phone varchar(20) NOT NULL,
        email varchar(120) DEFAULT NULL,
        password varchar(255) NOT NULL,
        role enum('client','admin') DEFAULT 'client',
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        is_active tinyint(1) DEFAULT 1,
        PRIMARY KEY (id),
        UNIQUE KEY phone (phone),
        UNIQUE KEY email (email),
        UNIQUE KEY username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla users creada/verificada');
    
    // 1.2 Tabla de categorías
    console.log('🔧 Creando tabla categories...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla categories creada/verificada');
    
    // 1.3 Tabla de tipos de producto
    console.log('🔧 Creando tabla product_types...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_types (
        id int(11) NOT NULL AUTO_INCREMENT,
        category_id int(11) NOT NULL,
        name varchar(100) NOT NULL,
        PRIMARY KEY (id),
        KEY category_id (category_id),
        CONSTRAINT product_types_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla product_types creada/verificada');
    
    // 1.4 Tabla de productos
    console.log('🔧 Creando tabla products...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        product_type_id int(11) NOT NULL,
        name varchar(200) NOT NULL,
        description text DEFAULT NULL,
        price decimal(10,2) NOT NULL,
        image_url varchar(255) DEFAULT NULL,
        stock_total int(11) DEFAULT 0,
        status enum('active','inactive') DEFAULT 'active',
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        is_approved tinyint(1) DEFAULT 1,
        cost_price decimal(10,2) DEFAULT 0.00,
        PRIMARY KEY (id),
        KEY product_type_id (product_type_id),
        CONSTRAINT products_ibfk_1 FOREIGN KEY (product_type_id) REFERENCES product_types (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla products creada/verificada');
    
    // ========================================
    // PASO 2: Tablas de encuestas (con dependencias)
    // ========================================
    console.log('\n🏗️  PASO 2: Creando tablas de encuestas...');
    
    // 2.1 Tabla de encuestas (depende de users)
    console.log('🔧 Creando tabla surveys...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        question varchar(255) NOT NULL,
        description text DEFAULT NULL,
        status enum('draft','active','closed') DEFAULT 'draft',
        created_by bigint(20) NOT NULL,
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        closed_by bigint(20) DEFAULT NULL,
        closed_at datetime DEFAULT NULL,
        PRIMARY KEY (id),
        KEY surveys_closed_by_fk (closed_by),
        KEY idx_surveys_status (status),
        KEY idx_surveys_created_by (created_by),
        KEY idx_surveys_status_created (status,created_at),
        CONSTRAINT surveys_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT surveys_closed_by_fk FOREIGN KEY (closed_by) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla surveys creada/verificada');
    
    // 2.2 Tabla de opciones de encuesta (depende de surveys y users)
    console.log('🔧 Creando tabla survey_options...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS survey_options (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        survey_id bigint(20) NOT NULL,
        option_text varchar(200) NOT NULL,
        description text DEFAULT NULL,
        product_id bigint(20) DEFAULT NULL,
        created_by bigint(20) NOT NULL,
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
        KEY idx_survey_options_survey_approved (survey_id,is_approved),
        CONSTRAINT survey_options_survey_fk FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
        CONSTRAINT survey_options_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT survey_options_approved_by_fk FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT survey_options_product_fk FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla survey_options creada/verificada');
    
    // 2.3 Tabla de votos de encuesta (depende de surveys, survey_options y users)
    console.log('🔧 Creando tabla survey_votes...');
    await connection.query(`
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
        KEY idx_survey_votes_survey_user (survey_id,user_id),
        CONSTRAINT survey_votes_survey_fk FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
        CONSTRAINT survey_votes_option_fk FOREIGN KEY (option_id) REFERENCES survey_options (id) ON DELETE CASCADE,
        CONSTRAINT survey_votes_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla survey_votes creada/verificada');
    
    // ========================================
    // PASO 3: Insertar datos mínimos
    // ========================================
    console.log('\n📝 PASO 3: Insertando datos mínimos...');
    
    try {
      // 3.1 Usuario admin
      await connection.query(`
        INSERT IGNORE INTO users (id, username, name, phone, email, password, role, is_active) VALUES
        (1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1)
      `);
      console.log('✅ Usuario admin creado/verificado');
      
      // 3.2 Categoría
      await connection.query(`
        INSERT IGNORE INTO categories (id, name) VALUES
        (1, 'Cosméticos')
      `);
      console.log('✅ Categoría creada/verificada');
      
      // 3.3 Tipo de producto
      await connection.query(`
        INSERT IGNORE INTO product_types (id, category_id, name) VALUES
        (1, 1, 'Maquillaje')
      `);
      console.log('✅ Tipo de producto creado/verificado');
      
      // 3.4 Producto
      await connection.query(`
        INSERT IGNORE INTO products (id, product_type_id, name, description, price, stock_total, status, is_approved) VALUES
        (1, 1, 'Labial de Prueba', 'Labial de color rojo para pruebas del sistema', 19.99, 100, 'active', 1)
      `);
      console.log('✅ Producto creado/verificado');
      
      // 3.5 Encuesta
      await connection.query(`
        INSERT IGNORE INTO surveys (id, question, description, status, created_by) VALUES
        (1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1)
      `);
      console.log('✅ Encuesta creada/verificada');
      
      // 3.6 Opción de encuesta
      await connection.query(`
        INSERT IGNORE INTO survey_options (id, survey_id, option_text, description, created_by, is_approved) VALUES
        (1, 1, 'Sí, me gusta mucho', 'Opción de prueba para verificar funcionamiento', 1, 1)
      `);
      console.log('✅ Opción de encuesta creada/verificada');
      
    } catch (error) {
      console.error('⚠️ Error insertando datos mínimos:', error.message);
    }
    
    // ========================================
    // PASO 4: Verificar creación exitosa
    // ========================================
    console.log('\n🔍 PASO 4: Verificando creación exitosa...');
    
    // Verificar tablas creadas
    const [finalTables] = await connection.query('SHOW TABLES');
    const finalTableNames = finalTables.map(row => Object.values(row)[0]);
    
    console.log('📊 Resumen final:');
    console.log(`   Total de tablas: ${finalTableNames.length}`);
    console.log(`   Tablas de encuestas: ${finalTableNames.filter(name => name.includes('survey')).length}`);
    
    // Verificar datos mínimos
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
    `);
    
    console.log('📊 Datos mínimos:');
    results.forEach(row => {
      console.log(`   ${row.tipo}: ${row.cantidad} registros`);
    });
    
    // Verificar tabla surveys específicamente
    if (finalTableNames.includes('surveys')) {
      console.log('✅ Tabla surveys verificada - ¡El fix fue exitoso!');
    } else {
      console.log('❌ Tabla surveys NO encontrada - El fix falló');
    }
    
    console.log('\n🎉 ¡Fix secuencial aplicado exitosamente en Railway!');
    console.log('✅ Todas las tablas están listas para usar');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error aplicando fix secuencial:', error);
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
  createTablesSequentially()
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

module.exports = { createTablesSequentially };
