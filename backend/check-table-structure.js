const { query } = require('./src/config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de la tabla carts_unified...');
    
    // Verificar la estructura de la tabla
    const structure = await query('DESCRIBE carts_unified');
    console.log('📋 Estructura de la tabla:');
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // Verificar los valores permitidos para cart_type
    const cartTypeInfo = structure.find(col => col.Field === 'cart_type');
    if (cartTypeInfo) {
      console.log('\n🎯 Información de cart_type:');
      console.log(`  - Tipo: ${cartTypeInfo.Type}`);
      console.log(`  - Null: ${cartTypeInfo.Null}`);
      console.log(`  - Default: ${cartTypeInfo.Default}`);
    }
    
    // Verificar datos existentes
    const existingCarts = await query('SELECT cart_type, COUNT(*) as count FROM carts_unified GROUP BY cart_type');
    console.log('\n📊 Carritos existentes por tipo:');
    existingCarts.forEach(cart => {
      console.log(`  - ${cart.cart_type}: ${cart.count} carritos`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
}

checkTableStructure();
