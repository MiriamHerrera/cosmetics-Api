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
    console.log('🔧 Creando tablas básicas si no existen...');
    
    // Crear tabla de usuarios
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de productos
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_total INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de carritos unificados
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS carts_unified (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        cart_type ENUM('guest', 'user') DEFAULT 'guest',
        status ENUM('active', 'completed', 'expired') DEFAULT 'active',
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_expires_at (expires_at)
      )
    `);

    // Crear tabla de items del carrito
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts_unified(id) ON DELETE CASCADE,
        INDEX idx_cart_id (cart_id),
        INDEX idx_product_id (product_id)
      )
    `);

    console.log('✅ Tablas básicas creadas/verificadas correctamente');
  } catch (error) {
    console.error('❌ Error creando tablas básicas:', error.message);
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

    // Crear tablas básicas después de conectar
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