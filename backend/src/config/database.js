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

// Función para crear tablas básicas si no existen
const createBasicTables = async () => {
  try {
    console.log('🔧 Verificando estructura de base de datos...');
    
    // Verificar si la base de datos cosmetics_db existe
    const connection = await pool.getConnection();
    
    // Intentar crear la base de datos si no existe
    try {
      await connection.execute('CREATE DATABASE IF NOT EXISTS `cosmetics_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ Base de datos cosmetics_db verificada/creada');
    } catch (error) {
      console.log('ℹ️ Base de datos ya existe o no se puede crear');
    }
    
    // Usar la base de datos cosmetics_db
    await connection.execute('USE `cosmetics_db`');
    
    // Verificar si las tablas principales existen
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    if (tableNames.length === 0) {
      console.log('🔧 Base de datos vacía, creando estructura básica...');
      
      // Crear tabla de usuarios si no existe
      await connection.execute(`
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
      
      // Insertar usuario admin básico
      await connection.execute(`
        INSERT IGNORE INTO users (id, username, name, phone, email, password, role, is_active) VALUES
        (1, 'admin', 'Administrador', '1234567890', 'admin@cosmetics.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1)
      `);
      
      console.log('✅ Usuario admin creado con ID 1');
    } else {
      console.log(`✅ Base de datos ya tiene ${tableNames.length} tablas`);
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