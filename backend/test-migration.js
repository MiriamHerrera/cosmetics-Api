const { query } = require('./src/config/database');

async function testMigration() {
  try {
    console.log('🧪 Iniciando prueba de migración de carritos...');
    
    // 1. Crear carrito de invitado con items
    console.log('\n🆕 Creando carrito de invitado...');
    const guestCartResult = await query(`
      INSERT INTO carts_unified (session_id, cart_type, status, expires_at) 
      VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 HOUR))
    `, [`test_migration_${Date.now()}`]);
    
    const guestCartId = guestCartResult.insertId;
    console.log('✅ Carrito de invitado creado con ID:', guestCartId);
    
    // 2. Agregar items al carrito de invitado
    console.log('\n🛍️ Agregando items al carrito de invitado...');
    
    // Agregar producto 1
    await query(`
      INSERT INTO cart_items_unified (cart_id, product_id, quantity) 
      VALUES (?, 1, 2)
    `, [guestCartId]);
    
    // Agregar producto 2
    await query(`
      INSERT INTO cart_items_unified (cart_id, product_id, quantity) 
      VALUES (?, 2, 1)
    `, [guestCartId]);
    
    console.log('✅ Items agregados al carrito de invitado');
    
    // 3. Verificar carrito de invitado
    console.log('\n🔍 Verificando carrito de invitado...');
    const guestCart = await query(`
      SELECT 
        id, cart_type, user_id, session_id, status, expires_at,
        TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry
      FROM carts_unified 
      WHERE id = ?
    `, [guestCartId]);
    
    if (guestCart.length > 0) {
      const cart = guestCart[0];
      console.log(`  - ID: ${cart.id}`);
      console.log(`  - Tipo: ${cart.cart_type}`);
      console.log(`  - Usuario: ${cart.user_id || 'NULL (invitado)'}`);
      console.log(`  - Sesión: ${cart.session_id}`);
      console.log(`  - Expira en: ${cart.minutes_until_expiry} minutos`);
    }
    
    // Verificar items
    const guestItems = await query(`
      SELECT ci.*, p.name as product_name 
      FROM cart_items_unified ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.cart_id = ?
    `, [guestCartId]);
    
    console.log(`  - Items en el carrito: ${guestItems.length}`);
    guestItems.forEach(item => {
      console.log(`    * Producto: ${item.product_name}, Cantidad: ${item.quantity}`);
    });
    
    // 4. Simular migración a usuario registrado
    console.log('\n🔄 Simulando migración a usuario registrado...');
    const userId = 1; // Usuario admin
    
    await query(`
      UPDATE carts_unified 
      SET user_id = ?, cart_type = "registered", expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) 
      WHERE id = ?
    `, [userId, guestCartId]);
    
    console.log('✅ Carrito migrado a usuario registrado');
    console.log('🕐 Tiempo de expiración actualizado a 7 días');
    
    // 5. Verificar carrito migrado
    console.log('\n🔍 Verificando carrito migrado...');
    const migratedCart = await query(`
      SELECT 
        id, cart_type, user_id, session_id, status, expires_at,
        TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry
      FROM carts_unified 
      WHERE id = ?
    `, [guestCartId]);
    
    if (migratedCart.length > 0) {
      const cart = migratedCart[0];
      console.log(`  - ID: ${cart.id}`);
      console.log(`  - Tipo: ${cart.cart_type}`);
      console.log(`  - Usuario: ${cart.user_id}`);
      console.log(`  - Sesión: ${cart.session_id}`);
      console.log(`  - Expira en: ${cart.minutes_until_expiry} minutos`);
    }
    
    // Verificar items del carrito migrado
    const migratedItems = await query(`
      SELECT ci.*, p.name as product_name 
      FROM cart_items_unified ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.cart_id = ?
    `, [guestCartId]);
    
    console.log(`  - Items en el carrito migrado: ${migratedItems.length}`);
    migratedItems.forEach(item => {
      console.log(`    * Producto: ${item.product_name}, Cantidad: ${item.quantity}`);
    });
    
    // 6. Verificar que el usuario puede acceder al carrito
    console.log('\n🔍 Verificando acceso del usuario al carrito...');
    const userCart = await query(`
      SELECT 
        id, cart_type, user_id, session_id, status, expires_at
      FROM carts_unified 
      WHERE user_id = ? AND cart_type = "registered" AND status = "active"
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);
    
    if (userCart.length > 0) {
      console.log('✅ Usuario puede acceder al carrito migrado');
      console.log(`  - Carrito ID: ${userCart[0].id}`);
      console.log(`  - Tipo: ${userCart[0].cart_type}`);
      console.log(`  - Status: ${userCart[0].status}`);
    } else {
      console.log('❌ Usuario no puede acceder al carrito migrado');
    }
    
    // 7. Limpiar carrito de prueba
    console.log('\n🧹 Limpiando carrito de prueba...');
    await query('DELETE FROM cart_items_unified WHERE cart_id = ?', [guestCartId]);
    await query('DELETE FROM carts_unified WHERE id = ?', [guestCartId]);
    console.log('✅ Carrito de prueba eliminado');
    
    console.log('\n✅ Prueba de migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testMigration();
