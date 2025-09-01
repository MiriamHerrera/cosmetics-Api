const { query, getConnection } = require('./src/config/database');

async function testUnifiedCartTables() {
  let connection;
  
  try {
    console.log('🔍 [Test] Verificando tablas del carrito unificado...');
    
    // Verificar que la tabla carts_unified existe
    console.log('\n📋 [Test] Verificando tabla carts_unified...');
    const cartsTable = await query(`
      SELECT TABLE_NAME, TABLE_ROWS, ENGINE, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts_unified'
    `);
    
    if (cartsTable.length === 0) {
      console.log('❌ [Test] Tabla carts_unified NO existe');
      return false;
    }
    
    console.log('✅ [Test] Tabla carts_unified existe:', cartsTable[0]);
    
    // Verificar estructura de carts_unified
    console.log('\n🔍 [Test] Estructura de carts_unified:');
    const cartsStructure = await query('DESCRIBE carts_unified');
    cartsStructure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // Verificar que la tabla cart_items_unified existe
    console.log('\n📋 [Test] Verificando tabla cart_items_unified...');
    const itemsTable = await query(`
      SELECT TABLE_NAME, TABLE_ROWS, ENGINE, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items_unified'
    `);
    
    if (itemsTable.length === 0) {
      console.log('❌ [Test] Tabla cart_items_unified NO existe');
      return false;
    }
    
    console.log('✅ [Test] Tabla cart_items_unified existe:', itemsTable[0]);
    
    // Verificar estructura de cart_items_unified
    console.log('\n🔍 [Test] Estructura de cart_items_unified:');
    const itemsStructure = await query('DESCRIBE cart_items_unified');
    itemsStructure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });
    
    // Verificar que la tabla products existe y tiene datos
    console.log('\n📋 [Test] Verificando tabla products...');
    const productsTable = await query(`
      SELECT TABLE_NAME, TABLE_ROWS, ENGINE, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'
    `);
    
    if (productsTable.length === 0) {
      console.log('❌ [Test] Tabla products NO existe');
      return false;
    }
    
    console.log('✅ [Test] Tabla products existe:', productsTable[0]);
    
    // Verificar que hay productos disponibles
    const products = await query('SELECT id, name, stock_total, is_approved FROM products WHERE is_approved = 1 LIMIT 5');
    console.log('\n📦 [Test] Productos disponibles:', products.length);
    products.forEach(product => {
      console.log(`  - ID: ${product.id}, Nombre: ${product.name}, Stock: ${product.stock_total}`);
    });
    
    // Verificar carritos existentes
    console.log('\n🛒 [Test] Verificando carritos existentes...');
    const existingCarts = await query('SELECT id, user_id, session_id, cart_type, status FROM carts_unified LIMIT 5');
    console.log('📊 [Test] Carritos existentes:', existingCarts.length);
    existingCarts.forEach(cart => {
      console.log(`  - ID: ${cart.id}, User: ${cart.user_id}, Session: ${cart.session_id}, Type: ${cart.cart_type}, Status: ${cart.status}`);
    });
    
    // Verificar items de carrito existentes
    console.log('\n📦 [Test] Verificando items de carrito...');
    const existingItems = await query('SELECT id, cart_id, product_id, quantity FROM cart_items_unified LIMIT 5');
    console.log('📊 [Test] Items existentes:', existingItems.length);
    existingItems.forEach(item => {
      console.log(`  - ID: ${item.id}, Cart: ${item.cart_id}, Product: ${item.product_id}, Quantity: ${item.quantity}`);
    });
    
    console.log('\n✅ [Test] Verificación completada exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ [Test] Error durante la verificación:', error);
    console.error('❌ [Test] Stack trace:', error.stack);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testUnifiedCartTables()
    .then(success => {
      if (success) {
        console.log('\n🎉 [Test] Todas las verificaciones pasaron');
        process.exit(0);
      } else {
        console.log('\n💥 [Test] Algunas verificaciones fallaron');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 [Test] Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testUnifiedCartTables };
