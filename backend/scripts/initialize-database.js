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

// Función para inicializar la base de datos completa
const initializeDatabase = async () => {
  let connection;
  
  try {
    console.log('🚀 Iniciando inicialización completa de la base de datos...');
    console.log('📊 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: 'cosmetics_db',
      port: dbConfig.port
    });
    
    // 1. Conectar sin especificar base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL establecida');
    
    // 2. Crear base de datos si no existe
    await connection.query('CREATE DATABASE IF NOT EXISTS `cosmetics_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Base de datos cosmetics_db verificada/creada');
    
    // 3. Usar la base de datos
    await connection.query('USE `cosmetics_db`');
    
    // 4. Crear todas las tablas necesarias
    console.log('🔧 Creando estructura de tablas...');
    
    // Tabla de usuarios
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
    console.log('✅ Tabla users creada');
    
    // Tabla de categorías
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla categories creada');
    
    // Tabla de tipos de producto
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
    console.log('✅ Tabla product_types creada');
    
    // Tabla de productos
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
    console.log('✅ Tabla products creada');
    
    // Tabla de carritos unificados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS carts_unified (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) DEFAULT NULL,
        session_id varchar(255) DEFAULT NULL,
        status enum('active','expired','cleaned') DEFAULT 'active',
        cart_type enum('guest','registered') DEFAULT 'guest',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        expires_at timestamp NULL DEFAULT NULL,
        PRIMARY KEY (id),
        KEY idx_user_id (user_id),
        KEY idx_session_id (session_id),
        KEY idx_expires_at (expires_at),
        KEY idx_cart_type (cart_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla carts_unified creada');
    
    // Tabla de items del carrito
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items_unified (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        cart_id bigint(20) NOT NULL,
        product_id bigint(20) NOT NULL,
        quantity int(11) NOT NULL,
        reserved_until timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        KEY idx_cart_items_cart_id (cart_id),
        KEY idx_cart_items_product_id (product_id),
        CONSTRAINT cart_items_unified_ibfk_1 FOREIGN KEY (cart_id) REFERENCES carts_unified (id) ON DELETE CASCADE,
        CONSTRAINT cart_items_unified_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla cart_items_unified creada');
    
    // Tabla de ubicaciones de entrega
    await connection.query(`
      CREATE TABLE IF NOT EXISTS delivery_locations (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        address text NOT NULL,
        description text DEFAULT NULL,
        is_active tinyint(1) DEFAULT 1,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla delivery_locations creada');
    
    // Tabla de órdenes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id int(11) NOT NULL AUTO_INCREMENT,
        order_number varchar(50) NOT NULL,
        customer_type enum('registered','guest') NOT NULL,
        user_id bigint(20) DEFAULT NULL,
        session_id varchar(255) DEFAULT NULL,
        customer_name varchar(255) NOT NULL,
        customer_phone varchar(20) NOT NULL,
        customer_email varchar(255) DEFAULT NULL,
        delivery_location_id int(11) NOT NULL,
        delivery_date date NOT NULL,
        delivery_time time NOT NULL,
        delivery_address text DEFAULT NULL,
        total_amount decimal(10,2) NOT NULL,
        status enum('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT 'pending',
        whatsapp_message text DEFAULT NULL,
        whatsapp_sent_at timestamp NULL DEFAULT NULL,
        notes text DEFAULT NULL,
        admin_notes text DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY order_number (order_number),
        KEY delivery_location_id (delivery_location_id),
        CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT orders_ibfk_2 FOREIGN KEY (delivery_location_id) REFERENCES delivery_locations (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla orders creada');
    
    // Tabla de items de orden
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id int(11) NOT NULL AUTO_INCREMENT,
        order_id int(11) NOT NULL,
        product_id bigint(20) NOT NULL,
        product_name varchar(255) NOT NULL,
        product_price decimal(10,2) NOT NULL,
        quantity int(11) NOT NULL,
        subtotal decimal(10,2) NOT NULL,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        KEY idx_order_id (order_id),
        KEY idx_product_id (product_id),
        CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        CONSTRAINT order_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla order_items creada');
    
    // Tabla de reservaciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        product_id bigint(20) NOT NULL,
        quantity int(11) NOT NULL,
        reserved_at datetime DEFAULT current_timestamp(),
        expires_at datetime NOT NULL,
        status enum('active','cancelled','expired','completed') DEFAULT 'active',
        reserved_until datetime NOT NULL DEFAULT (current_timestamp() + interval 1 hour),
        user_type enum('guest','registered') NOT NULL DEFAULT 'guest',
        notes text DEFAULT NULL,
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY product_id (product_id),
        CONSTRAINT reservations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT reservations_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla reservations creada');
    
    // Tabla de encuestas
    await connection.query(`
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
        CONSTRAINT surveys_closed_by_fk FOREIGN KEY (closed_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT surveys_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla surveys creada');
    
          // Tabla de opciones de encuesta
      await connection.query(`
        CREATE TABLE IF NOT EXISTS survey_options (
          id bigint(20) NOT NULL AUTO_INCREMENT,
          survey_id bigint(20) NOT NULL,
          option_text varchar(200) NOT NULL,
          description text DEFAULT NULL COMMENT 'Descripción adicional de la opción',
          product_id bigint(20) DEFAULT NULL,
          created_by bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que sugirió la opción',
          is_approved tinyint(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Aprobada',
          admin_notes text DEFAULT NULL COMMENT 'Notas del administrador sobre la aprobación',
          approved_by bigint(20) DEFAULT NULL COMMENT 'ID del admin que aprobó/rechazó',
          approved_at datetime DEFAULT NULL COMMENT 'Fecha de aprobación/rechazo',
          created_at datetime DEFAULT current_timestamp() COMMENT 'Fecha de creación de la opción',
          updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id),
          KEY product_id (product_id),
          KEY survey_options_approved_by_fk (approved_by),
          KEY idx_survey_options_survey_id (survey_id),
          KEY idx_survey_options_approved (is_approved),
          KEY idx_survey_options_created_by (created_by),
          KEY idx_survey_options_survey_approved (survey_id,is_approved),
          CONSTRAINT survey_options_approved_by_fk FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
          CONSTRAINT survey_options_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT survey_options_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
          CONSTRAINT survey_options_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    console.log('✅ Tabla survey_options creada');
    
          // Tabla de votos de encuesta
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
          CONSTRAINT survey_votes_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
          CONSTRAINT survey_votes_ibfk_2 FOREIGN KEY (option_id) REFERENCES survey_options (id) ON DELETE CASCADE,
          CONSTRAINT survey_votes_ibfk_3 FOREIGN KEY (user_id) REFERENCES users (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    console.log('✅ Tabla survey_votes creada');
    
    // 5. Insertar datos mínimos de prueba
    console.log('📝 Insertando datos mínimos de prueba...');
    
    // Usuario admin
    await connection.query(`
      INSERT IGNORE INTO users (id, username, name, phone, email, password, role, is_active) VALUES
      (1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1)
    `);
    console.log('✅ Usuario admin creado');
    
    // Categoría
    await connection.query(`
      INSERT IGNORE INTO categories (id, name) VALUES
      (1, 'Cosméticos')
    `);
    console.log('✅ Categoría creada');
    
    // Tipo de producto
    await connection.query(`
      INSERT IGNORE INTO product_types (id, category_id, name) VALUES
      (1, 1, 'Maquillaje')
    `);
    console.log('✅ Tipo de producto creado');
    
    // Producto
    await connection.query(`
      INSERT IGNORE INTO products (id, product_type_id, name, description, price, stock_total, status, is_approved) VALUES
      (1, 1, 'Labial de Prueba', 'Labial de color rojo para pruebas del sistema', 19.99, 100, 'active', 1)
    `);
    console.log('✅ Producto de prueba creado');
    
    // Encuesta
    await connection.query(`
      INSERT IGNORE INTO surveys (id, question, description, status, created_by) VALUES
      (1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1)
    `);
    console.log('✅ Encuesta de prueba creada');
    
          // Opción de encuesta
      await connection.query(`
        INSERT IGNORE INTO survey_options (id, survey_id, option_text, description, created_by, is_approved) VALUES
        (1, 1, 'Sí, me gusta mucho', 'Opción de prueba para verificar funcionamiento', 1, 1)
      `);
    console.log('✅ Opción de encuesta creada');
    
    // Ubicación de entrega
    await connection.query(`
      INSERT IGNORE INTO delivery_locations (id, name, address, description, is_active) VALUES
      (1, 'Oficina Central', 'Av. Principal 123, Centro', 'Entrega en oficina central', 1)
    `);
    console.log('✅ Ubicación de entrega creada');
    
    // 6. Verificar datos creados
    console.log('🔍 Verificando datos creados...');
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
    
    console.log('🎉 ¡Inicialización de base de datos completada exitosamente!');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: password');
    console.log('   Teléfono: 1234567890');
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
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
  initializeDatabase()
    .then(() => {
      console.log('✅ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
