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

// Función para crear todas las tablas en el orden correcto
const createAllTables = async (connection) => {
  try {
    console.log('🔧 Deshabilitando verificación de claves foráneas temporalmente...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('🔧 Creando todas las tablas del sistema...');
    
    // ORDEN 1: Tablas base sin dependencias
    console.log('📝 Creando tablas base...');
    
    // 1. Crear tabla de usuarios (base)
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
    
    // 2. Crear tabla de categorías (base)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 3. Crear tabla de ubicaciones de entrega (base)
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

    // ORDEN 2: Tablas que dependen de las base
    console.log('📝 Creando tablas de primer nivel...');
    
    // 4. Crear tabla de tipos de producto (depende de categories) - SIN FK inicialmente
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_types (
        id int(11) NOT NULL AUTO_INCREMENT,
        category_id int(11) NOT NULL,
        name varchar(100) NOT NULL,
        PRIMARY KEY (id),
        KEY category_id (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 5. Crear tabla de encuestas (depende de users) - SIN FK inicialmente
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
        KEY idx_surveys_status_created (status, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 6. Crear tabla de horarios de entrega (depende de delivery_locations) - SIN FK inicialmente
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
        KEY idx_location_day (location_id, day_of_week)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 7. Crear tabla de franjas horarias (depende de delivery_locations) - SIN FK inicialmente
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
        KEY idx_location_day_time (location_id, day_of_week, time_slot)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ORDEN 3: Tablas que dependen de segundo nivel
    console.log('📝 Creando tablas de segundo nivel...');
    
    // 8. Crear tabla de productos (depende de product_types) - SIN FK inicialmente
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        product_type_id int(11) NOT NULL,
        name varchar(200) NOT NULL,
        description text DEFAULT NULL,
        price decimal(10,2) NOT NULL,
        image_url text DEFAULT NULL COMMENT 'URL de la imagen del producto',
        stock_total int(11) DEFAULT 0,
        status enum('active','inactive') DEFAULT 'active',
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        is_approved tinyint(1) DEFAULT 1,
        cost_price decimal(10,2) DEFAULT 0.00,
        PRIMARY KEY (id),
        KEY product_type_id (product_type_id),
        KEY idx_products_cost_price (cost_price),
        KEY idx_products_price_cost (price, cost_price)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ORDEN 4: Tablas que dependen de products y users
    console.log('📝 Creando tablas de tercer nivel...');
    
    // 9. Crear tabla de carritos unificados - SIN FK inicialmente
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
    
    // 10. Crear tabla de items del carrito (depende de carts_unified y products) - SIN FK inicialmente
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
        KEY idx_cart_items_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 11. Crear tabla de órdenes (CORREGIDA: int en lugar de bigint) - SIN FK inicialmente
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
        KEY idx_order_number (order_number),
        KEY idx_customer_type (customer_type),
        KEY idx_user_id (user_id),
        KEY idx_session_id (session_id),
        KEY idx_status (status),
        KEY idx_delivery_date (delivery_date),
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 12. Crear tabla de items de orden (depende de orders y products) - SIN FK inicialmente
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
        KEY idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 13. Crear tabla de reservaciones (depende de users y products) - SIN FK inicialmente
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
        KEY idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 14. Crear tabla de opciones de encuesta (depende de surveys, products y users) - SIN FK inicialmente
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
        KEY idx_survey_options_survey_approved (survey_id, is_approved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 15. Crear tabla de votos de encuesta (depende de surveys, survey_options y users) - SIN FK inicialmente
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
        KEY idx_survey_votes_survey_user (survey_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 16. Crear tabla de programación de inventario (depende de products y users) - SIN FK inicialmente
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
        KEY created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 17. Crear tabla de historial de estados de órdenes (CORREGIDA: order_id int) - SIN FK inicialmente
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id int(11) NOT NULL AUTO_INCREMENT,
        order_id int(11) NOT NULL,
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
        KEY idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 18. Crear tabla de estadísticas de clientes (depende de users) - SIN FK inicialmente
    await connection.query(`
      CREATE TABLE IF NOT EXISTS client_statistics (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        total_purchases int(11) DEFAULT 0,
        total_spent decimal(10,2) DEFAULT 0.00,
        created_at datetime DEFAULT current_timestamp(),
        updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        KEY user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Todas las tablas creadas sin claves foráneas');
    
    // AGREGAR CLAVES FORÁNEAS DESPUÉS DE CREAR TODAS LAS TABLAS
    console.log('🔧 Agregando claves foráneas...');
    
    // 1. product_types -> categories
    await connection.query(`
      ALTER TABLE product_types 
      ADD CONSTRAINT product_types_ibfk_1 
      FOREIGN KEY (category_id) REFERENCES categories (id)
    `);
    
    // 2. surveys -> users (created_by y closed_by)
    await connection.query(`
      ALTER TABLE surveys 
      ADD CONSTRAINT surveys_created_by_fk 
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE surveys 
      ADD CONSTRAINT surveys_closed_by_fk 
      FOREIGN KEY (closed_by) REFERENCES users (id) ON DELETE SET NULL
    `);
    
    // 3. delivery_schedules -> delivery_locations
    await connection.query(`
      ALTER TABLE delivery_schedules 
      ADD CONSTRAINT delivery_schedules_ibfk_1 
      FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
    `);
    
    // 4. delivery_time_slots -> delivery_locations
    await connection.query(`
      ALTER TABLE delivery_time_slots 
      ADD CONSTRAINT delivery_time_slots_ibfk_1 
      FOREIGN KEY (location_id) REFERENCES delivery_locations (id) ON DELETE CASCADE
    `);
    
    // 5. products -> product_types
    await connection.query(`
      ALTER TABLE products 
      ADD CONSTRAINT products_ibfk_1 
      FOREIGN KEY (product_type_id) REFERENCES product_types (id)
    `);
    
    // 6. carts_unified -> users
    await connection.query(`
      ALTER TABLE carts_unified 
      ADD CONSTRAINT carts_unified_ibfk_1 
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    `);
    
    // 7. cart_items_unified -> carts_unified y products
    await connection.query(`
      ALTER TABLE cart_items_unified 
      ADD CONSTRAINT cart_items_unified_ibfk_1 
      FOREIGN KEY (cart_id) REFERENCES carts_unified (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE cart_items_unified 
      ADD CONSTRAINT cart_items_unified_ibfk_2 
      FOREIGN KEY (product_id) REFERENCES products (id)
    `);
    
    // 8. orders -> users y delivery_locations
    await connection.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_ibfk_1 
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    `);
    
    await connection.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_ibfk_2 
      FOREIGN KEY (delivery_location_id) REFERENCES delivery_locations (id)
    `);
    
    // 9. order_items -> orders y products
    await connection.query(`
      ALTER TABLE order_items 
      ADD CONSTRAINT order_items_ibfk_1 
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE order_items 
      ADD CONSTRAINT order_items_ibfk_2 
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    `);
    
    // 10. reservations -> users y products
    await connection.query(`
      ALTER TABLE reservations 
      ADD CONSTRAINT reservations_ibfk_1 
      FOREIGN KEY (user_id) REFERENCES users (id)
    `);
    
    await connection.query(`
      ALTER TABLE reservations 
      ADD CONSTRAINT reservations_ibfk_2 
      FOREIGN KEY (product_id) REFERENCES products (id)
    `);
    
    // 11. survey_options -> surveys, products y users
    await connection.query(`
      ALTER TABLE survey_options 
      ADD CONSTRAINT survey_options_ibfk_1 
      FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE survey_options 
      ADD CONSTRAINT survey_options_ibfk_2 
      FOREIGN KEY (product_id) REFERENCES products (id)
    `);
    
    await connection.query(`
      ALTER TABLE survey_options 
      ADD CONSTRAINT survey_options_created_by_fk 
      FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE survey_options 
      ADD CONSTRAINT survey_options_approved_by_fk 
      FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
    `);
    
    // 12. survey_votes -> surveys, survey_options y users
    await connection.query(`
      ALTER TABLE survey_votes 
      ADD CONSTRAINT survey_votes_ibfk_1 
      FOREIGN KEY (survey_id) REFERENCES surveys (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE survey_votes 
      ADD CONSTRAINT survey_votes_ibfk_2 
      FOREIGN KEY (option_id) REFERENCES survey_options (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE survey_votes 
      ADD CONSTRAINT survey_votes_ibfk_3 
      FOREIGN KEY (user_id) REFERENCES users (id)
    `);
    
    // 13. inventory_schedule -> products y users
    await connection.query(`
      ALTER TABLE inventory_schedule 
      ADD CONSTRAINT inventory_schedule_ibfk_1 
      FOREIGN KEY (product_id) REFERENCES products (id)
    `);
    
    await connection.query(`
      ALTER TABLE inventory_schedule 
      ADD CONSTRAINT inventory_schedule_ibfk_2 
      FOREIGN KEY (created_by) REFERENCES users (id)
    `);
    
    // 14. order_status_history -> orders y users
    await connection.query(`
      ALTER TABLE order_status_history 
      ADD CONSTRAINT order_status_history_ibfk_1 
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE order_status_history 
      ADD CONSTRAINT order_status_history_ibfk_2 
      FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
    `);
    
    // 15. client_statistics -> users
    await connection.query(`
      ALTER TABLE client_statistics 
      ADD CONSTRAINT client_statistics_ibfk_1 
      FOREIGN KEY (user_id) REFERENCES users (id)
    `);
    
    // Rehabilitar verificación de claves foráneas
    console.log('🔧 Rehabilitando verificación de claves foráneas...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    // INSERTAR DATOS DE PRUEBA (en orden correcto)
    console.log('📝 Insertando datos mínimos de prueba...');
    
    // 1. Usuario admin primero
    await connection.query(`
      INSERT IGNORE INTO users (id, username, name, phone, email, password, role, is_active) VALUES
      (1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1)
    `);
    
    // 2. Categoría
    await connection.query(`
      INSERT IGNORE INTO categories (id, name) VALUES
      (1, 'Cosméticos')
    `);
    
    // 3. Tipo de producto
    await connection.query(`
      INSERT IGNORE INTO product_types (id, category_id, name) VALUES
      (1, 1, 'Maquillaje')
    `);
    
    // 4. Producto
    await connection.query(`
      INSERT IGNORE INTO products (id, product_type_id, name, description, price, stock_total, status, is_approved) VALUES
      (1, 1, 'Labial de Prueba', 'Labial de color rojo para pruebas del sistema', 19.99, 100, 'active', 1)
    `);
    
    // 5. Ubicación de entrega
    await connection.query(`
      INSERT IGNORE INTO delivery_locations (id, name, address, description, is_active) VALUES
      (1, 'Oficina Central', 'Av. Principal 123, Centro', 'Entrega en oficina central', 1)
    `);
    
    // 6. Encuesta
    await connection.query(`
      INSERT IGNORE INTO surveys (id, question, description, status, created_by) VALUES
      (1, '¿Te gusta el nuevo sistema?', 'Encuesta de prueba para verificar funcionamiento', 'active', 1)
    `);
    
    // 7. Opción de encuesta
    await connection.query(`
      INSERT IGNORE INTO survey_options (id, survey_id, option_text, is_approved, created_by) VALUES
      (1, 1, 'Sí, me gusta mucho', 1, 1)
    `);
    
    console.log('✅ Todas las tablas creadas exitosamente en orden correcto');
    console.log('✅ Todas las claves foráneas agregadas correctamente');
    console.log('✅ Datos de prueba insertados correctamente');
    console.log('📊 Estructura completa: 18 tablas con relaciones correctas');
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    // Asegurar que se rehabiliten las claves foráneas incluso si hay error
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (fkError) {
      console.error('❌ Error rehabilitando claves foráneas:', fkError);
    }
    throw error;
  }
};

// Resto de funciones sin cambios...
const createBasicTables = async () => {
  try {
    console.log('🔧 Verificando estructura de base de datos...');
    
    const connection = await pool.getConnection();
    console.log('✅ Conexión obtenida del pool');
    
    try {
      console.log('🔍 Ejecutando SHOW TABLES...');
      const [tables] = await connection.query('SHOW TABLES');
      const tableNames = tables.map(row => Object.values(row)[0]);
      console.log(`📋 Tablas encontradas: ${tableNames.length} - ${tableNames.join(', ')}`);
      
      if (tableNames.length === 0) {
        console.log('🔧 Base de datos vacía, creando estructura completa...');
        await createAllTables(connection);
      } else {
        console.log(`✅ Base de datos ya tiene ${tableNames.length} tablas`);
        
        // Verificar si tenemos todas las tablas requeridas
        const requiredTables = [
          'users', 'categories', 'product_types', 'products', 
          'carts_unified', 'cart_items_unified', 'delivery_locations',
          'orders', 'order_items', 'reservations', 'surveys', 
          'survey_options', 'survey_votes', 'delivery_schedules',
          'delivery_time_slots', 'inventory_schedule', 'order_status_history',
          'client_statistics'
        ];
        
        const missingTables = requiredTables.filter(table => !tableNames.includes(table));
        
        if (missingTables.length > 0) {
          console.log(`⚠️ Faltan ${missingTables.length} tablas: ${missingTables.join(', ')}`);
          console.log('🔧 Recreando estructura completa para evitar problemas de dependencias...');
          await createAllTables(connection);
        }
      }
      
    } finally {
      connection.release();
      console.log('🔓 Conexión liberada del pool');
    }
    
    console.log('✅ createBasicTables completado exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando estructura de base de datos:', error.message);
    console.error('❌ Stack trace completo:', error.stack);
    return false;
  }
};

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

    await createBasicTables();
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
};

const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en consulta SQL:', error);
    throw error;
  }
};

const getConnection = async () => {
  return await pool.getConnection();
};

module.exports = {
  pool,
  testConnection,
  query,
  getConnection,
  createBasicTables,
  createAllTables
};