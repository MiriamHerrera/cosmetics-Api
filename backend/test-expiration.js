const { query } = require('./src/config/database');

async function testExpiration() {
  try {
    console.log('🧪 Iniciando prueba de expiración y migración de carritos...');
    
    // 1. Verificar hora del servidor
    console.log('\n🕐 Verificando hora del servidor...');
    const serverTime = new Date();
    console.log('Hora del servidor (UTC):', serverTime.toISOString());
    console.log('Hora del servidor (local):', serverTime.toString());
    
    // 2. Verificar carritos existentes
    console.log('\n📦 Verificando carritos existentes...');
    const existingCarts = await query(`
      SELECT 
        id, cart_type, user_id, session_id, status, expires_at,
        TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry
      FROM carts_unified 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('Carritos encontrados:', existingCarts.length);
    existingCarts.forEach(cart => {
      console.log(`  - ID: ${cart.id}, Tipo: ${cart.cart_type}, Status: ${cart.status}, Expira en: ${cart.minutes_until_expiry} minutos`);
    });
    
    // 3. Crear carrito de prueba (invitado)
    console.log('\n🆕 Creando carrito de prueba para invitado...');
    const guestCartResult = await query(`
      INSERT INTO carts_unified (session_id, cart_type, status, expires_at) 
      VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 HOUR))
    `, [`test_guest_${Date.now()}`]);
    
    const guestCartId = guestCartResult.insertId;
    console.log('✅ Carrito de invitado creado con ID:', guestCartId);
    
    // 4. Agregar item de prueba al carrito de invitado
    console.log('\n🛍️ Agregando item de prueba al carrito de invitado...');
    await query(`
      INSERT INTO cart_items_unified (cart_id, product_id, quantity) 
      VALUES (?, 1, 2)
    `, [guestCartId]);
    console.log('✅ Item agregado al carrito de invitado');
    
    // 5. Simular migración a usuario registrado
    console.log('\n🔄 Simulando migración a usuario registrado...');
    await query(`
      UPDATE carts_unified 
      SET user_id = ?, cart_type = "registered", expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) 
      WHERE id = ?
    `, [1, guestCartId]);
    
    console.log('✅ Carrito migrado a usuario registrado');
    console.log('🕐 Tiempo de expiración actualizado a 7 días');
    
    // 6. Verificar carrito migrado
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
      console.log(`  - ID: ${cart.id}, Tipo: ${cart.cart_type}, Usuario: ${cart.user_id}, Expira en: ${cart.minutes_until_expiry} minutos`);
      
      // Verificar items del carrito migrado
      const items = await query(`
        SELECT * FROM cart_items_unified WHERE cart_id = ?
      `, [guestCartId]);
      
      console.log(`  - Items en el carrito: ${items.length}`);
    }
    
    // 7. Simular expiración de carrito de invitado (crear otro para la prueba)
    console.log('\n⏰ Creando carrito de invitado para probar expiración...');
    const expiringCartResult = await query(`
      INSERT INTO carts_unified (session_id, cart_type, status, expires_at) 
      VALUES (?, "guest", "active", DATE_ADD(NOW(), INTERVAL 1 MINUTE))
    `, [`expiring_guest_${Date.now()}`]);
    
    const expiringCartId = expiringCartResult.insertId;
    console.log('✅ Carrito de invitado para expiración creado con ID:', expiringCartId);
    
    // 8. Verificar carritos próximos a expirar
    console.log('\n🔍 Verificando carritos próximos a expirar...');
    const expiringSoon = await query(`
      SELECT 
        id, cart_type, user_id, session_id, status, expires_at,
        TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_until_expiry
      FROM carts_unified 
      WHERE expires_at > NOW() AND expires_at < DATE_ADD(NOW(), INTERVAL 1 HOUR) AND status = 'active'
    `);
    
    console.log('Carritos próximos a expirar:', expiringSoon.length);
    expiringSoon.forEach(cart => {
      console.log(`  - ID: ${cart.id}, Tipo: ${cart.cart_type}, Expira en: ${cart.minutes_until_expiry} minutos`);
    });
    
    // 9. Limpiar carritos de prueba
    console.log('\n🧹 Limpiando carritos de prueba...');
    await query('DELETE FROM carts_unified WHERE id IN (?, ?)', [guestCartId, expiringCartId]);
    await query('DELETE FROM cart_items_unified WHERE cart_id IN (?, ?)', [guestCartId, expiringCartId]);
    console.log('✅ Carritos de prueba eliminados');
    
    console.log('\n✅ Prueba de expiración y migración completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testExpiration();
