const { query } = require('./src/config/database');

async function testCartMigration() {
  try {
    console.log('🧪 Iniciando prueba de migración del carrito...');
    
    // 1. Verificar estructura de la tabla
    console.log('\n📊 Verificando estructura de la tabla carts_unified...');
    const tableStructure = await query('DESCRIBE carts_unified');
    console.log('Estructura de la tabla:', tableStructure);
    
    // 2. Verificar valores del enum cart_type
    console.log('\n🔍 Verificando valores del enum cart_type...');
    const enumValues = await query("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carts_unified' AND COLUMN_NAME = 'cart_type'");
    console.log('Valores del enum cart_type:', enumValues[0]?.COLUMN_TYPE);
    
    // 3. Verificar carritos existentes
    console.log('\n📦 Verificando carritos existentes...');
    const existingCarts = await query('SELECT * FROM carts_unified ORDER BY created_at DESC LIMIT 10');
    console.log('Carritos existentes:', existingCarts);
    
    // 4. Verificar items de carrito existentes
    console.log('\n🛍️ Verificando items de carrito existentes...');
    const existingItems = await query('SELECT * FROM cart_items_unified ORDER BY created_at DESC LIMIT 10');
    console.log('Items existentes:', existingItems);
    
    // 5. Simular migración manual
    console.log('\n🔄 Simulando migración manual...');
    
    // Buscar un carrito de invitado activo
    const guestCarts = await query('SELECT * FROM carts_unified WHERE cart_type = "guest" AND status = "active" LIMIT 1');
    
    if (guestCarts.length > 0) {
      const guestCart = guestCarts[0];
      console.log('Carrito de invitado encontrado:', guestCart);
      
      // Buscar un usuario para la migración
      const users = await query('SELECT * FROM users WHERE role = "client" LIMIT 1');
      
      if (users.length > 0) {
        const user = users[0];
        console.log('Usuario encontrado para migración:', user);
        
        // Verificar si el usuario ya tiene un carrito
        const userCarts = await query('SELECT * FROM carts_unified WHERE user_id = ? AND cart_type = "registered" AND (status = "active" OR status = "cleaned") ORDER BY created_at DESC LIMIT 1', [user.id]);
        
        let targetCartId;
        
        if (userCarts.length === 0) {
          // Crear nuevo carrito para el usuario
          const result = await query('INSERT INTO carts_unified (user_id, cart_type, status) VALUES (?, "registered", "active")', [user.id]);
          targetCartId = result.insertId;
          console.log('✅ Nuevo carrito creado para usuario:', targetCartId);
        } else {
          targetCartId = userCarts[0].id;
          console.log('✅ Usando carrito existente del usuario:', targetCartId);
        }
        
        // Migrar items del carrito de invitado al carrito del usuario
        const updateResult = await query('UPDATE cart_items_unified SET cart_id = ? WHERE cart_id = ?', [targetCartId, guestCart.id]);
        console.log('🔄 Items migrados:', updateResult.affectedRows);
        
        // Marcar carrito de invitado como cleaned
        const statusResult = await query('UPDATE carts_unified SET status = "cleaned" WHERE id = ?', [guestCart.id]);
        console.log('✅ Carrito de invitado marcado como cleaned:', statusResult.affectedRows);
        
        // Verificar el resultado
        const finalCart = await query('SELECT * FROM carts_unified WHERE id = ?', [targetCartId]);
        const finalItems = await query('SELECT * FROM cart_items_unified WHERE cart_id = ?', [targetCartId]);
        
        console.log('\n🎯 RESULTADO DE LA MIGRACIÓN:');
        console.log('Carrito final:', finalCart[0]);
        console.log('Items finales:', finalItems);
        
      } else {
        console.log('❌ No se encontraron usuarios para la migración');
      }
    } else {
      console.log('❌ No se encontraron carritos de invitado activos');
    }
    
    console.log('\n✅ Prueba de migración completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    process.exit(0);
  }
}

testCartMigration();
