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

// Función para verificar y arreglar la tabla users
const fixUsersTable = async () => {
  let connection;
  
  try {
    console.log('🔧 Arreglando tabla users en Railway...');
    console.log('📊 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Conectar a la base de datos de Railway
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL de Railway establecida');
    
    // Verificar si la tabla users existe
    const [tables] = await connection.query('SHOW TABLES LIKE "users"');
    if (tables.length === 0) {
      console.log('❌ La tabla users no existe. Creándola...');
      await createUsersTable(connection);
      return;
    }
    
    console.log('✅ La tabla users existe');
    
    // Verificar la estructura de la tabla
    const [columns] = await connection.query('DESCRIBE users');
    const columnNames = columns.map(col => col.Field);
    console.log('📋 Columnas existentes:', columnNames);
    
    // Verificar si falta la columna phone
    if (!columnNames.includes('phone')) {
      console.log('❌ Falta la columna phone. Agregándola...');
      await addPhoneColumn(connection);
    } else {
      console.log('✅ La columna phone ya existe');
    }
    
    // Verificar si falta la columna email
    if (!columnNames.includes('email')) {
      console.log('❌ Falta la columna email. Agregándola...');
      await addEmailColumn(connection);
    } else {
      console.log('✅ La columna email ya existe');
    }
    
    // Verificar si falta la columna username
    if (!columnNames.includes('username')) {
      console.log('❌ Falta la columna username. Agregándola...');
      await addUsernameColumn(connection);
    } else {
      console.log('✅ La columna username ya existe');
    }
    
    // Verificar si falta la columna role
    if (!columnNames.includes('role')) {
      console.log('❌ Falta la columna role. Agregándola...');
      await addRoleColumn(connection);
    } else {
      console.log('✅ La columna role ya existe');
    }
    
    // Verificar si falta la columna is_active
    if (!columnNames.includes('is_active')) {
      console.log('❌ Falta la columna is_active. Agregándola...');
      await addIsActiveColumn(connection);
    } else {
      console.log('✅ La columna is_active ya existe');
    }
    
    // Verificar si falta la columna updated_at
    if (!columnNames.includes('updated_at')) {
      console.log('❌ Falta la columna updated_at. Agregándola...');
      await addUpdatedAtColumn(connection);
    } else {
      console.log('✅ La columna updated_at ya existe');
    }
    
    console.log('✅ Tabla users verificada y arreglada correctamente');
    
  } catch (error) {
    console.error('❌ Error arreglando tabla users:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
};

// Función para crear la tabla users desde cero
const createUsersTable = async (connection) => {
  const createTableSQL = `
    CREATE TABLE users (
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
  `;
  
  await connection.query(createTableSQL);
  console.log('✅ Tabla users creada correctamente');
};

// Función para agregar la columna phone
const addPhoneColumn = async (connection) => {
  try {
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN phone varchar(20) NOT NULL AFTER name,
      ADD UNIQUE KEY phone (phone)
    `);
    console.log('✅ Columna phone agregada correctamente');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️ La columna phone ya existe o hay conflicto de índices');
    } else {
      throw error;
    }
  }
};

// Función para agregar la columna email
const addEmailColumn = async (connection) => {
  try {
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN email varchar(120) DEFAULT NULL AFTER phone,
      ADD UNIQUE KEY email (email)
    `);
    console.log('✅ Columna email agregada correctamente');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️ La columna email ya existe o hay conflicto de índices');
    } else {
      throw error;
    }
  }
};

// Función para agregar la columna username
const addUsernameColumn = async (connection) => {
  try {
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN username varchar(50) DEFAULT NULL AFTER id,
      ADD UNIQUE KEY username (username)
    `);
    console.log('✅ Columna username agregada correctamente');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️ La columna username ya existe o hay conflicto de índices');
    } else {
      throw error;
    }
  }
};

// Función para agregar la columna role
const addRoleColumn = async (connection) => {
  try {
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN role enum('client','admin') DEFAULT 'client' AFTER password
    `);
    console.log('✅ Columna role agregada correctamente');
  } catch (error) {
    console.log('⚠️ Error agregando columna role:', error.message);
  }
};

// Función para agregar la columna is_active
const addIsActiveColumn = async (connection) => {
  try {
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN is_active tinyint(1) DEFAULT 1 AFTER updated_at
    `);
    console.log('✅ Columna is_active agregada correctamente');
  } catch (error) {
    console.log('⚠️ Error agregando columna is_active:', error.message);
  }
};

// Función para agregar la columna updated_at
const addUpdatedAtColumn = async (connection) => {
  try {
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN updated_at datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER created_at
    `);
    console.log('✅ Columna updated_at agregada correctamente');
  } catch (error) {
    console.log('⚠️ Error agregando columna updated_at:', error.message);
  }
};

// Ejecutar el fix
if (require.main === module) {
  fixUsersTable()
    .then(() => {
      console.log('🎉 Fix de tabla users completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en fix de tabla users:', error);
      process.exit(1);
    });
}

module.exports = { fixUsersTable };
