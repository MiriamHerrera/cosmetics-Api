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

// Función para corregir la incompatibilidad de tipos
const fixOrdersForeignKey = async () => {
  let connection;
  
  try {
    console.log('🔧 Corrigiendo incompatibilidad de tipos en tabla orders...');
    console.log('📊 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Conectar a la base de datos de Railway
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL de Railway establecida');
    
    // ========================================
    // PASO 1: Verificar tipos actuales
    // ========================================
    console.log('\n🔍 PASO 1: Verificando tipos actuales...');
    
    // Verificar estructura de tabla users
    const [usersStructure] = await connection.query('DESCRIBE users');
    const userIdColumn = usersStructure.find(col => col.Field === 'id');
    console.log('📋 users.id:', userIdColumn ? userIdColumn.Type : 'NO ENCONTRADO');
    
    // Verificar estructura de tabla orders
    const [ordersStructure] = await connection.query('DESCRIBE orders');
    const orderUserIdColumn = ordersStructure.find(col => col.Field === 'user_id');
    console.log('📋 orders.user_id:', orderUserIdColumn ? orderUserIdColumn.Type : 'NO ENCONTRADO');
    
    if (!userIdColumn || !orderUserIdColumn) {
      console.log('❌ No se pudo verificar la estructura de las tablas');
      return false;
    }
    
    // ========================================
    // PASO 2: Corregir tipos de datos
    // ========================================
    console.log('\n🛠️  PASO 2: Corrigiendo tipos de datos...');
    
    try {
      // Eliminar la restricción de clave foránea existente
      console.log('🔧 Eliminando restricción de clave foránea existente...');
      await connection.query('ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1');
      console.log('✅ Restricción eliminada');
      
      // Modificar el tipo de user_id para que coincida con users.id
      console.log('🔧 Modificando tipo de orders.user_id...');
      if (userIdColumn.Type.includes('bigint')) {
        await connection.query('ALTER TABLE orders MODIFY COLUMN user_id bigint(20) NULL');
        console.log('✅ orders.user_id cambiado a bigint(20)');
      } else if (userIdColumn.Type.includes('int')) {
        await connection.query('ALTER TABLE orders MODIFY COLUMN user_id int(11) NULL');
        console.log('✅ orders.user_id cambiado a int(11)');
      } else {
        console.log('⚠️ Tipo de users.id no reconocido:', userIdColumn.Type);
        return false;
      }
      
      // Recrear la restricción de clave foránea
      console.log('🔧 Recreando restricción de clave foránea...');
      await connection.query(`
        ALTER TABLE orders ADD CONSTRAINT orders_ibfk_1 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Restricción recreada exitosamente');
      
    } catch (error) {
      console.error('❌ Error en la corrección:', error.message);
      
      // Si falla, intentar la alternativa
      console.log('\n🔄 Intentando alternativa...');
      return await tryAlternativeFix(connection, userIdColumn);
    }
    
    // ========================================
    // PASO 3: Verificar la corrección
    // ========================================
    console.log('\n🔍 PASO 3: Verificando la corrección...');
    
    // Verificar que la restricción se creó correctamente
    const [constraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'orders' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database]);
    
    console.log('📋 Restricciones de orders:');
    constraints.forEach(constraint => {
      console.log(`   ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
    // Verificar estructura final
    const [finalOrdersStructure] = await connection.query('DESCRIBE orders');
    const finalOrderUserIdColumn = finalOrdersStructure.find(col => col.Field === 'user_id');
    console.log('📋 Estructura final de orders.user_id:', finalOrderUserIdColumn ? finalOrderUserIdColumn.Type : 'NO ENCONTRADO');
    
    // ========================================
    // PASO 4: Verificación final
    // ========================================
    console.log('\n🔍 PASO 4: Verificación final...');
    
    // Probar que la restricción funciona
    const [typeComparison] = await connection.query(`
      SELECT 
        'users.id' as tabla_columna,
        COLUMN_TYPE as tipo
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'id'
      
      UNION ALL
      
      SELECT 
        'orders.user_id' as tabla_columna,
        COLUMN_TYPE as tipo
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME = 'user_id'
    `, [dbConfig.database, dbConfig.database]);
    
    console.log('📊 Comparación de tipos:');
    typeComparison.forEach(row => {
      console.log(`   ${row.tabla_columna}: ${row.tipo}`);
    });
    
    // Verificar compatibilidad
    const usersIdType = typeComparison.find(row => row.tabla_columna === 'users.id')?.tipo;
    const ordersUserIdType = typeComparison.find(row => row.tabla_columna === 'orders.user_id')?.tipo;
    
    if (usersIdType && ordersUserIdType) {
      if (usersIdType.includes('bigint') && ordersUserIdType.includes('bigint')) {
        console.log('✅ Tipos compatibles: ambos son bigint');
      } else if (usersIdType.includes('int') && ordersUserIdType.includes('int')) {
        console.log('✅ Tipos compatibles: ambos son int');
      } else {
        console.log('⚠️ Tipos pueden no ser completamente compatibles');
      }
    }
    
    console.log('\n🎉 ¡Corrección aplicada exitosamente!');
    console.log('✅ La restricción de clave foránea orders_ibfk_1 está funcionando');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error aplicando corrección:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
};

// Función alternativa si la primera opción falla
const tryAlternativeFix = async (connection, userIdColumn) => {
  try {
    console.log('🔄 Aplicando corrección alternativa...');
    
    // Eliminar todas las restricciones que dependan de users.id
    const constraintsToDrop = [
      'orders_ibfk_1',
      'surveys_created_by_fk',
      'surveys_closed_by_fk',
      'survey_options_created_by_fk',
      'survey_options_approved_by_fk',
      'survey_votes_user_fk'
    ];
    
    for (const constraint of constraintsToDrop) {
      try {
        await connection.query(`ALTER TABLE orders DROP FOREIGN KEY ${constraint}`);
        console.log(`✅ Restricción ${constraint} eliminada`);
      } catch (error) {
        // La restricción puede no existir
        console.log(`⚠️ Restricción ${constraint} no existe o ya fue eliminada`);
      }
    }
    
    // Modificar users.id para que coincida con orders.user_id
    if (userIdColumn.Type.includes('bigint')) {
      await connection.query('ALTER TABLE users MODIFY COLUMN id int(11) NOT NULL AUTO_INCREMENT');
      console.log('✅ users.id cambiado a int(11)');
    } else {
      await connection.query('ALTER TABLE users MODIFY COLUMN id bigint(20) NOT NULL AUTO_INCREMENT');
      console.log('✅ users.id cambiado a bigint(20)');
    }
    
    // Recrear todas las restricciones
    console.log('🔧 Recreando restricciones...');
    
    await connection.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_ibfk_1 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    await connection.query(`
      ALTER TABLE surveys ADD CONSTRAINT surveys_created_by_fk 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE surveys ADD CONSTRAINT surveys_closed_by_fk 
      FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    await connection.query(`
      ALTER TABLE survey_options ADD CONSTRAINT survey_options_created_by_fk 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    await connection.query(`
      ALTER TABLE survey_options ADD CONSTRAINT survey_options_approved_by_fk 
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    `);
    
    await connection.query(`
      ALTER TABLE survey_votes ADD CONSTRAINT survey_votes_user_fk 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    console.log('✅ Todas las restricciones recreadas');
    return true;
    
  } catch (error) {
    console.error('❌ Error en corrección alternativa:', error.message);
    return false;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  fixOrdersForeignKey()
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

module.exports = { fixOrdersForeignKey };
