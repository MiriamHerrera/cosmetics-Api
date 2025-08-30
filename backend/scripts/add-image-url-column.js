const { getConnection } = require('../src/config/database');

async function addImageUrlColumn() {
  let connection;
  
  try {
    console.log('🔧 Agregando columna image_url a la tabla products...');
    
    connection = await getConnection();
    
    // Verificar si la columna ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'image_url'
    `);
    
    if (columns.length > 0) {
      console.log('✅ La columna image_url ya existe en la tabla products');
      return;
    }
    
    // Agregar la columna image_url
    await connection.query(`
      ALTER TABLE products 
      ADD COLUMN image_url text DEFAULT NULL COMMENT 'URL de la imagen del producto' 
      AFTER price
    `);
    
    console.log('✅ Columna image_url agregada exitosamente a la tabla products');
    
    // Verificar la estructura actualizada
    const [tableStructure] = await connection.query('DESCRIBE products');
    console.log('📋 Estructura actualizada de la tabla products:');
    tableStructure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error agregando columna image_url:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
}

// Ejecutar la migración
addImageUrlColumn()
  .then(() => {
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  });
