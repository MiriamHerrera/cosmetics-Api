const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'mysql.railway.internal',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para crear todas las tablas desde cero
const createAllTables = async (connection) => {
  try {
    console.log('🔧 Creando todas las tablas del sistema...');
    
    // 1. Crear tabla de usuarios
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
    
    // 2. Crear tabla de categorías
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 3. Crear tabla de tipos de producto
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
    
    // 4. Crear tabla de productos
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
        KEY idx_products_cost_price (cost_price),
        KEY idx_products_price_cost (price, cost_price),
        CONSTRAINT products_ibfk_1 FOREIGN KEY (product_type_id) REFERENCES product_types (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 5. Crear tabla de carritos unificados
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
        KEY idx_cart_type (cart_type),
        KEY idx_user_session (user_id, session_id),
        KEY idx_cart_user_status (user_id, status),
        KEY idx_cart_session_status (session_id, status),
        KEY idx_cart_type_status (cart_type, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 6. Crear tabla de items del carrito
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
    
    // 7. Crear tabla de ubicaciones de entrega
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
    
    // 8. Crear tabla de órdenes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id bigint(20) NOT NULL AUTO_INCREMENT,
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
        KEY idx_order_number (order_number),
        KEY idx_customer_type (customer_type),
        KEY idx_user_id (user_id),
        KEY idx_session_id (session_id),
        KEY idx_status (status),
        KEY idx_delivery_date (delivery_date),
        KEY idx_created_at (created_at),
        CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT orders_ibfk_2 FOREIGN KEY (delivery_location_id) REFERENCES delivery_locations (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 9. Crear tabla de items de orden
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id int(11) NOT NULL AUTO_INCREMENT,
        order_id bigint(20) NOT NULL,
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
    
    // 10. Crear tabla de reservaciones
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
        KEY idx_reserved_until (reserved_until),
        KEY idx_user_type (user_type),
        KEY idx_status (status),
        CONSTRAINT reservations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT reservations_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 11. Crear tabla de encuestas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        question varchar(255) NOT NULL,
        description text DEFAULT NULL COMMENT 'Descripción adicional de la encuesta',
        status enum('draft','active','closed') DEFAULT 'draft' COMMENT 'Estado de la encuesta',
        created_by bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que creó la encuesta',
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        closed_by bigint(20) DEFAULT NULL COMMENT 'ID del admin que cerró la encuesta',
        closed_at datetime DEFAULT NULL COMMENT 'Fecha de cierre',
        PRIMARY KEY (id),
        KEY surveys_closed_by_fk (closed_by),
        KEY idx_surveys_status (status),
        KEY idx_surveys_created_by (created_by),
        KEY idx_surveys_status_created (status, created_at),
        CONSTRAINT surveys_closed_by_fk FOREIGN KEY (closed_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT surveys_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 12. Crear tabla de opciones de encuesta
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
        KEY idx_survey_options_survey_approved (survey_id, is_approved),
        CONSTRAINT survey_options_approved_by_fk FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT survey_options_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT survey_options_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
        CONSTRAINT survey_options_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 13. Crear tabla de votos de encuesta
    await connection.query(`
      CREATE TABLE IF NOT EXISTS survey_votes (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        survey_id bigint(20) NOT NULL,
        option_id bigint(20) NOT NULL,
        user_id bigint(20) NOT NULL,
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_option (user_id, option_id),
        KEY idx_survey_votes_survey_id (survey_id),
        KEY idx_survey_votes_option_id (option_id),
        KEY idx_survey_votes_user_id (user_id),
        KEY idx_survey_votes_survey_user (survey_id, user_id),
        CONSTRAINT survey_votes_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
        CONSTRAINT survey_votes_ibfk_2 FOREIGN KEY (option_id) REFERENCES survey_options (id) ON DELETE CASCADE,
        CONSTRAINT survey_votes_ibfk_3 FOREIGN KEY (user_id) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 14. Crear tabla de horarios de entrega
    await connection.query(`
      CREATE TABLE IF NOT EXISTS delivery_schedules (
        id int(11) NOT NULL AUTO_INCREMENT,
        location_id int(11) NOT NULL,
        day_of_week int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
        start_time time NOT NULL,
        end_time time NOT NULL,
        is_active tinyint(1) DEFAULT 1,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_location_day (location_id, day_of_week),
        KEY idx_location_day (location_id, day_of_week),
        CONSTRAINT delivery_schedules_ibfk_1 FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 15. Crear tabla de franjas horarias de entrega
    await connection.query(`
      CREATE TABLE IF NOT EXISTS delivery_time_slots (
        id int(11) NOT NULL AUTO_INCREMENT,
        location_id int(11) NOT NULL,
        day_of_week int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
        time_slot time NOT NULL COMMENT 'Horario específico disponible',
        is_active tinyint(1) DEFAULT 1,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_location_day_time (location_id, day_of_week, time_slot),
        KEY idx_location_day_time (location_id, day_of_week, time_slot),
        CONSTRAINT delivery_time_slots_ibfk_1 FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 16. Crear tabla de programación de inventario
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_schedule (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        product_id bigint(20) NOT NULL,
        arrival_date datetime NOT NULL,
        quantity int(11) NOT NULL,
        status enum('scheduled','received','cancelled') DEFAULT 'scheduled',
        created_by bigint(20) NOT NULL,
        PRIMARY KEY (id),
        KEY product_id (product_id),
        KEY created_by (created_by),
        CONSTRAINT inventory_schedule_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id),
        CONSTRAINT inventory_schedule_ibfk_2 FOREIGN KEY (created_by) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 17. Crear tabla de historial de estados de órdenes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id int(11) NOT NULL AUTO_INCREMENT,
        order_id bigint(20) NOT NULL,
        previous_status enum('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT NULL,
        new_status enum('pending','confirmed','preparing','ready','delivered','cancelled') NOT NULL,
        changed_by enum('system','admin','customer') NOT NULL,
        admin_id bigint(20) DEFAULT NULL COMMENT 'ID del admin si fue cambiado por admin',
        notes text DEFAULT NULL COMMENT 'Notas del cambio de estado',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        KEY admin_id (admin_id),
        KEY idx_order_id (order_id),
        KEY idx_new_status (new_status),
        KEY idx_created_at (created_at),
        CONSTRAINT order_status_history_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        CONSTRAINT order_status_history_ibfk_2 FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 18. Crear tabla de estadísticas de clientes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS client_statistics (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        total_purchases int(11) DEFAULT 0,
        total_spent decimal(10,2) DEFAULT 0.00,
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        KEY user_id (user_id),
        CONSTRAINT client_statistics_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Insertar datos básicos mínimos para prueba
    console.log('📝 Insertando datos mínimos de prueba...');
    
    // Usuario admin
    await connection.query(`
      INSERT IGNORE INTO users (id, username, name, phone, email, password, role, is_active) VALUES
      (1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1)
    `);
    
    // Una sola categoría
    await connection.query(`
      INSERT IGNORE INTO categories (id, name) VALUES
      (1, 'Cosméticos')
    `);
    
    // Un solo tipo de producto
    await connection.query(`
      INSERT IGNORE INTO product_types (id, category_id, name) VALUES
      (1, 1, 'Maquillaje')
    `);
    
    // Un solo producto
    await connection.query(`
      INSERT IGNORE INTO products (id, product_type_id, name, description, price, stock_total, status, is_approved) VALUES
      (1, 1, 'Labial de Prueba', 'Labial de color rojo para pruebas del sistema', 19.99, 100, 'active', 1)
    `);
    
    // Una sola encuesta
    await connection.query(`
      INSERT IGNORE INTO surveys (id, question, description, status, created_by) VALUES
      (1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1)
    `);
    
    // Una sola opción para la encuesta
    await connection.query(`
      INSERT IGNORE INTO survey_options (id, survey_id, option_text, is_approved) VALUES
      (1, 1, 'Sí, me gusta mucho', 1)
    `);
    
    // Una ubicación de entrega
    await connection.query(`
      INSERT IGNORE INTO delivery_locations (id, name, address, description, is_active) VALUES
      (1, 'Oficina Central', 'Av. Principal 123, Centro', 'Entrega en oficina central', 1)
    `);
    
    console.log('✅ Datos mínimos de prueba insertados');
    console.log('📊 Resumen: 1 usuario, 1 categoría, 1 tipo, 1 producto, 1 encuesta, 1 opción, 1 ubicación');
    console.log('🏗️ Estructura completa: 18 tablas creadas con todas las funcionalidades del sistema');
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
};

// Función para verificar y crear tablas faltantes
const createMissingTables = async (connection, existingTables) => {
  try {
    console.log('🔍 Verificando tablas faltantes...');
    
    // Lista de todas las tablas que deberían existir
    const requiredTables = [
      'users', 'categories', 'product_types', 'products', 
      'carts_unified', 'cart_items_unified', 'delivery_locations',
      'orders', 'order_items', 'reservations', 'surveys', 
      'survey_options', 'survey_votes', 'delivery_schedules',
      'delivery_time_slots', 'inventory_schedule', 'order_status_history',
      'client_statistics'
    ];
    
    // Encontrar tablas faltantes
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ Todas las tablas requeridas ya existen');
      return;
    }
    
    console.log(`⚠️ Faltan ${missingTables.length} tablas: ${missingTables.join(', ')}`);
    console.log('🔧 Creando tablas faltantes...');
    
    // Crear solo las tablas faltantes
    for (const tableName of missingTables) {
      await createSingleTable(connection, tableName);
    }
    
    console.log('✅ Todas las tablas faltantes han sido creadas');
    
  } catch (error) {
    console.error('❌ Error creando tablas faltantes:', error);
    throw error;
  }
};

// Función para crear una tabla específica
const createSingleTable = async (connection, tableName) => {
  try {
    switch (tableName) {
      case 'categories':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id int(11) NOT NULL AUTO_INCREMENT,
            name varchar(100) NOT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'product_types':
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
        break;
        
      case 'delivery_locations':
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
        break;
        
      case 'orders':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS orders (
            id bigint(20) NOT NULL AUTO_INCREMENT,
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
            KEY idx_order_number (order_number),
            KEY idx_customer_type (customer_type),
            KEY idx_user_id (user_id),
            KEY idx_session_id (session_id),
            KEY idx_status (status),
            KEY idx_delivery_date (delivery_date),
            KEY idx_created_at (created_at),
            CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
            CONSTRAINT orders_ibfk_2 FOREIGN KEY (delivery_location_id) REFERENCES delivery_locations (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'order_items':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS order_items (
            id int(11) NOT NULL AUTO_INCREMENT,
            order_id bigint(20) NOT NULL,
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
        break;
        
      case 'reservations':
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
            KEY idx_reserved_until (reserved_until),
            KEY idx_user_type (user_type),
            KEY idx_status (status),
            CONSTRAINT reservations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
            CONSTRAINT reservations_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'surveys':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS surveys (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            question varchar(255) NOT NULL,
            description text DEFAULT NULL COMMENT 'Descripción adicional de la encuesta',
            status enum('draft','active','closed') DEFAULT 'draft' COMMENT 'Estado de la encuesta',
            created_by bigint(20) NOT NULL DEFAULT 1 COMMENT 'ID del usuario que creó la encuesta',
            created_at datetime DEFAULT current_timestamp(),
            updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            closed_by bigint(20) DEFAULT NULL COMMENT 'ID del admin que cerró la encuesta',
            closed_at datetime DEFAULT NULL COMMENT 'Fecha de cierre',
            PRIMARY KEY (id),
            KEY surveys_closed_by_fk (closed_by),
            KEY idx_surveys_status (status),
            KEY idx_surveys_created_by (created_by),
            KEY idx_surveys_status_created (status, created_at),
            CONSTRAINT surveys_closed_by_fk FOREIGN KEY (closed_by) REFERENCES users (id) ON DELETE SET NULL,
            CONSTRAINT surveys_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'survey_options':
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
            KEY idx_survey_options_survey_approved (survey_id, is_approved),
            CONSTRAINT survey_options_approved_by_fk FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
            CONSTRAINT survey_options_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
            CONSTRAINT survey_options_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
            CONSTRAINT survey_options_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'survey_votes':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS survey_votes (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            survey_id bigint(20) NOT NULL,
            option_id bigint(20) NOT NULL,
            user_id bigint(20) NOT NULL,
            created_at datetime DEFAULT current_timestamp(),
            updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            UNIQUE KEY unique_user_option (user_id, option_id),
            KEY idx_survey_votes_survey_id (survey_id),
            KEY idx_survey_votes_option_id (option_id),
            KEY idx_survey_votes_user_id (user_id),
            KEY idx_survey_votes_survey_user (survey_id, user_id),
            CONSTRAINT survey_votes_ibfk_1 FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE,
            CONSTRAINT survey_votes_ibfk_2 FOREIGN KEY (option_id) REFERENCES survey_options (id) ON DELETE CASCADE,
            CONSTRAINT survey_votes_ibfk_3 FOREIGN KEY (user_id) REFERENCES users (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'delivery_schedules':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS delivery_schedules (
            id int(11) NOT NULL AUTO_INCREMENT,
            location_id int(11) NOT NULL,
            day_of_week int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
            start_time time NOT NULL,
            end_time time NOT NULL,
            is_active tinyint(1) DEFAULT 1,
            created_at timestamp NOT NULL DEFAULT current_timestamp(),
            updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            UNIQUE KEY unique_location_day (location_id, day_of_week),
            KEY idx_location_day (location_id, day_of_week),
            CONSTRAINT delivery_schedules_ibfk_1 FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'delivery_time_slots':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS delivery_time_slots (
            id int(11) NOT NULL AUTO_INCREMENT,
            location_id int(11) NOT NULL,
            day_of_week int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
            time_slot time NOT NULL COMMENT 'Horario específico disponible',
            is_active tinyint(1) DEFAULT 1,
            created_at timestamp NOT NULL DEFAULT current_timestamp(),
            updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            UNIQUE KEY unique_location_day_time (location_id, day_of_week, time_slot),
            KEY idx_location_day_time (location_id, day_of_week, time_slot),
            CONSTRAINT delivery_time_slots_ibfk_1 FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'inventory_schedule':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS inventory_schedule (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_id bigint(20) NOT NULL,
            arrival_date datetime NOT NULL,
            quantity int(11) NOT NULL,
            status enum('scheduled','received','cancelled') DEFAULT 'scheduled',
            created_by bigint(20) NOT NULL,
            PRIMARY KEY (id),
            KEY product_id (product_id),
            KEY created_by (created_by),
            CONSTRAINT inventory_schedule_ibfk_1 FOREIGN KEY (product_id) REFERENCES products (id),
            CONSTRAINT inventory_schedule_ibfk_2 FOREIGN KEY (created_by) REFERENCES users (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'order_status_history':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS order_status_history (
            id int(11) NOT NULL AUTO_INCREMENT,
            order_id bigint(20) NOT NULL,
            previous_status enum('pending','confirmed','preparing','ready','delivered','cancelled') DEFAULT NULL,
            new_status enum('pending','confirmed','preparing','ready','delivered','cancelled') NOT NULL,
            changed_by enum('system','admin','customer') NOT NULL,
            admin_id bigint(20) DEFAULT NULL COMMENT 'ID del admin si fue cambiado por admin',
            notes text DEFAULT NULL COMMENT 'Notas del cambio de estado',
            created_at timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (id),
            KEY admin_id (admin_id),
            KEY idx_order_id (order_id),
            KEY idx_new_status (new_status),
            KEY idx_created_at (created_at),
            CONSTRAINT order_status_history_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            CONSTRAINT order_status_history_ibfk_2 FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      case 'client_statistics':
        await connection.query(`
          CREATE TABLE IF NOT EXISTS client_statistics (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            total_purchases int(11) DEFAULT 0,
            total_spent decimal(10,2) DEFAULT 0.00,
            created_at datetime DEFAULT current_timestamp(),
            updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
            PRIMARY KEY (id),
            KEY user_id (user_id),
            CONSTRAINT client_statistics_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        break;
        
      default:
        console.log(`⚠️ Tabla ${tableName} no reconocida, saltando...`);
        return;
    }
    
    console.log(`✅ Tabla ${tableName} creada exitosamente`);
    
  } catch (error) {
    console.error(`❌ Error creando tabla ${tableName}:`, error);
    throw error;
  }
};

// Función para crear todas las tablas necesarias
const createBasicTables = async () => {
  try {
    console.log('🔧 Verificando estructura de base de datos...');
    
    // Obtener conexión del pool
    const connection = await pool.getConnection();
    
    try {
      // Verificar si las tablas principales existen
      const [tables] = await connection.query('SHOW TABLES');
      const tableNames = tables.map(row => Object.values(row)[0]);
      
      if (tableNames.length === 0) {
        console.log('🔧 Base de datos vacía, creando estructura completa...');
        
        // Crear todas las tablas desde cero
        await createAllTables(connection);
        
      } else {
        console.log(`✅ Base de datos ya tiene ${tableNames.length} tablas`);
        
        // Verificar si faltan tablas críticas y crearlas
        await createMissingTables(connection, tableNames);
      }
      
    } finally {
      // Liberar la conexión
      connection.release();
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura de base de datos:', error.message);
    return false;
  }
  
  return true;
};

// Función para probar la conexión
const testConnection = async () => {
  try {
    console.log('🔍 CONFIGURACIÓN DE BASE DE DATOS:');
    console.log('Host:', process.env.DB_HOST || 'mysql.railway.internal');
    console.log('Usuario:', process.env.DB_USER || 'root');
    console.log('Base de datos:', process.env.DB_NAME || 'railway');
    console.log('Puerto:', process.env.DB_PORT || 3306);
    console.log('¿Tiene contraseña?', process.env.DB_PASSWORD ? 'SÍ' : 'NO');
    
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();

    // Verificar estructura de base de datos después de conectar
    await createBasicTables();
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
};

// Función para ejecutar consultas
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en consulta SQL:', error);
    throw error;
  }
};

// Función para obtener una conexión individual
const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = {
  pool,
  testConnection,
  query,
  getConnection,
  createBasicTables,
  createAllTables,
  createMissingTables,
  createSingleTable
}; 