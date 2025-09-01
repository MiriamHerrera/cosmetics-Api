const { query } = require('./src/config/database');

async function fixCartTypeColumn() {
  try {
    console.log('🔧 Corrigiendo columna cart_type en carts_unified...');
    
    // Primero, verificar la estructura actual
    console.log('🔍 Verificando estructura actual...');
    const structure = await query('DESCRIBE carts_unified');
    const cartTypeColumn = structure.find(col => col.Field === 'cart_type');
    
    if (cartTypeColumn) {
      console.log(`📋 Estructura actual de cart_type: ${cartTypeColumn.Type}`);
      
      // Modificar la columna para aceptar los valores correctos
      console.log('🔧 Modificando columna cart_type...');
      await query(`
        ALTER TABLE carts_unified 
        MODIFY COLUMN cart_type ENUM('guest', 'registered') DEFAULT 'guest'
      `);
      
      console.log('✅ Columna cart_type corregida exitosamente');
      
      // Verificar la nueva estructura
      const newStructure = await query('DESCRIBE carts_unified');
      const newCartTypeColumn = newStructure.find(col => col.Field === 'cart_type');
      console.log(`📋 Nueva estructura de cart_type: ${newCartTypeColumn.Type}`);
      
    } else {
      console.log('❌ Columna cart_type no encontrada');
    }
    
  } catch (error) {
    console.error('❌ Error corrigiendo columna cart_type:', error);
  }
}

fixCartTypeColumn();
