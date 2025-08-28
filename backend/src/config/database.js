const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cosmetics_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para crear todas las tablas necesarias
const createBasicTables = async () => {
  try {
    console.log('🔧 Verificando estructura de base de datos...');
    
    // Verificar si la base de datos cosmetics_db existe
    const connection = await pool.getConnection();
    
    // Intentar crear la base de datos si no existe (usando query directo)
    try {
      await connection.query('CREATE DATABASE IF NOT EXISTS `cosmetics_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ Base de datos cosmetics_db verificada/creada');
    } catch (error) {
      console.log('ℹ️ Base de datos ya existe o no se puede crear');
    }
    
    // Usar la base de datos cosmetics_db
    await connection.query('USE `cosmetics_db`');
    
    // Verificar si las tablas principales existen
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    if (tableNames.length === 0) {
      console.log('🔧 Base de datos vacía, creando estructura completa...');
      
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
          KEY idx_cart_type (cart_type)
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
      
      // 9. Crear tabla de items de orden
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
          CONSTRAINT reservations_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id),
          CONSTRAINT reservations_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // 11. Crear tabla de encuestas
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
        INSERT IGNORE INTO survey_options (id, survey_id, option_text, is_correct) VALUES
        (1, 1, 'Sí, me gusta mucho', 1)
      `);
      
      // Una ubicación de entrega
      await connection.query(`
        INSERT IGNORE INTO delivery_locations (id, name, address, description, is_active) VALUES
        (1, 'Oficina Central', 'Av. Principal 123, Centro', 'Entrega en oficina central', 1)
      `);
      
      console.log('✅ Datos mínimos de prueba insertados');
      console.log('📊 Resumen: 1 usuario, 1 categoría, 1 tipo, 1 producto, 1 encuesta, 1 opción, 1 ubicación');
    } else {
      console.log(`✅ Base de datos ya tiene ${tableNames.length} tablas`);
      
      // Verificar si faltan tablas críticas
      const criticalTables = ['carts_unified', 'cart_items_unified', 'products', 'orders'];
      const missingTables = criticalTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length > 0) {
        console.log(`⚠️ Faltan tablas críticas: ${missingTables.join(', ')}`);
        console.log('🔧 Creando tablas faltantes...');
        
        // Crear solo las tablas que faltan
        if (!tableNames.includes('carts_unified')) {
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
        }
        
        if (!tableNames.includes('cart_items_unified')) {
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
        }
      }
    }
    
    connection.release();
    console.log('✅ Estructura de base de datos verificada correctamente');
  } catch (error) {
    console.error('❌ Error verificando estructura de base de datos:', error.message);
  }
};

// Función para probar la conexión
const testConnection = async () => {
  try {
    console.log('🔍 CONFIGURACIÓN DE BASE DE DATOS:');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('Usuario:', process.env.DB_USER || 'root');
    console.log('Base de datos:', process.env.DB_NAME || 'cosmetics_db');
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
    const [rows] = await pool.execute(sql, params);
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
  getConnection
}; 