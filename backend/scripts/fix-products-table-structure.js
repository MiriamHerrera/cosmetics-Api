const { getConnection } = require('../src/config/database');

async function fixProductsTableStructure() {
  let connection;
  
  try {
    console.log('🔧 Corrigiendo estructura de la tabla products...');
    
    connection = await getConnection();
    
    // 1. Verificar si las columnas existen
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME IN ('cost_price', 'image_url', 'product_type_id')
    `);
    
    console.log('📋 Columnas encontradas:', columns.map(c => `${c.COLUMN_NAME} (${c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`));
    
    // 2. Hacer product_type_id NOT NULL
    console.log('🔒 Haciendo product_type_id NOT NULL...');
    await connection.query(`
      ALTER TABLE products 
      MODIFY COLUMN product_type_id INT NOT NULL 
      COMMENT 'ID del tipo de producto (obligatorio)'
    `);
    
    // 3. Agregar índice para product_type_id
    console.log('📊 Agregando índice para product_type_id...');
    try {
      await connection.query(`
        ALTER TABLE products 
        ADD INDEX idx_product_type_id (product_type_id)
      `);
      console.log('✅ Índice agregado exitosamente');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ El índice ya existe');
      } else {
        throw error;
      }
    }
    
    // 4. Agregar restricción de clave foránea
    console.log('🔗 Agregando restricción de clave foránea...');
    try {
      await connection.query(`
        ALTER TABLE products 
        ADD CONSTRAINT fk_products_product_type 
        FOREIGN KEY (product_type_id) REFERENCES product_types(id)
      `);
      console.log('✅ Restricción de clave foránea agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ La restricción ya existe');
      } else {
        console.log('⚠️ No se pudo agregar la restricción:', error.message);
      }
    }
    
    // 5. Verificar la estructura final
    const [finalStructure] = await connection.query('DESCRIBE products');
    console.log('📋 Estructura final de la tabla products:');
    finalStructure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // 6. Verificar que hay datos en product_types
    const [productTypes] = await connection.query('SELECT COUNT(*) as count FROM product_types');
    console.log(`📊 Tipos de producto disponibles: ${productTypes[0].count}`);
    
    // 7. Verificar que hay datos en categories
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`📊 Categorías disponibles: ${categories[0].count}`);
    
    console.log('✅ Estructura de tabla corregida exitosamente');
    
  } catch (error) {
    console.error('❌ Error corrigiendo estructura de tabla:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
}

// Ejecutar la corrección
fixProductsTableStructure()
  .then(() => {
    console.log('🎉 Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en el proceso:', error);
    process.exit(1);
  });
