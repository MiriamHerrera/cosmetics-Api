const { query, getConnection } = require('../src/config/database');

async function checkOrdersStatus() {
  console.log('🔍 VERIFICANDO ESTADO DEL SISTEMA DE ÓRDENES');
  console.log('=============================================\n');

  try {
    // 1. Verificar si existe la tabla orders
    console.log('1️⃣ VERIFICANDO TABLA ORDERS:');
    try {
      const [ordersTable] = await query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'cosmetics_db' AND table_name = 'orders'
      `);
      
      if (ordersTable.count > 0) {
        console.log('✅ Tabla orders existe');
        
        // Verificar estructura
        const columns = await query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
          FROM information_schema.columns 
          WHERE table_schema = 'cosmetics_db' AND table_name = 'orders'
          ORDER BY ORDINAL_POSITION
        `);
        
        console.log('📋 Estructura de la tabla orders:');
        columns.forEach(col => {
          console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      } else {
        console.log('❌ Tabla orders NO EXISTE');
      }
    } catch (error) {
      console.log('❌ Error verificando tabla orders:', error.message);
    }

    console.log('\n2️⃣ VERIFICANDO TABLA ORDER_ITEMS:');
    try {
      const [orderItemsTable] = await query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'cosmetics_db' AND table_name = 'order_items'
      `);
      
      if (orderItemsTable.count > 0) {
        console.log('✅ Tabla order_items existe');
      } else {
        console.log('❌ Tabla order_items NO EXISTE');
      }
    } catch (error) {
      console.log('❌ Error verificando tabla order_items:', error.message);
    }

    console.log('\n3️⃣ VERIFICANDO TABLA DELIVERY_LOCATIONS:');
    try {
      const [deliveryLocationsTable] = await query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'cosmetics_db' AND table_name = 'delivery_locations'
      `);
      
      if (deliveryLocationsTable.count > 0) {
        console.log('✅ Tabla delivery_locations existe');
        
        // Verificar si tiene datos
        const [locations] = await query('SELECT COUNT(*) as count FROM delivery_locations');
        console.log(`📍 Total de ubicaciones de entrega: ${locations.count}`);
      } else {
        console.log('❌ Tabla delivery_locations NO EXISTE');
      }
    } catch (error) {
      console.log('❌ Error verificando tabla delivery_locations:', error.message);
    }

    console.log('\n4️⃣ VERIFICANDO TABLA GUEST_CARTS:');
    try {
      const [guestCartsTable] = await query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'cosmetics_db' AND table_name = 'guest_carts'
      `);
      
      if (guestCartsTable.count > 0) {
        console.log('✅ Tabla guest_carts existe');
        
        // Verificar si tiene datos
        const [carts] = await query('SELECT COUNT(*) as count FROM guest_carts');
        console.log(`🛒 Total de carritos de invitados: ${carts.count}`);
      } else {
        console.log('❌ Tabla guest_carts NO EXISTE');
      }
    } catch (error) {
      console.log('❌ Error verificando tabla guest_carts:', error.message);
    }

    console.log('\n5️⃣ VERIFICANDO PROCEDIMIENTO GENERATEORDERNUMBER:');
    try {
      const [procedure] = await query(`
        SELECT COUNT(*) as count FROM information_schema.routines 
        WHERE routine_schema = 'cosmetics_db' AND routine_name = 'GenerateOrderNumber'
      `);
      
      if (procedure.count > 0) {
        console.log('✅ Procedimiento GenerateOrderNumber existe');
        
        // Probar el procedimiento
        try {
          await query('CALL GenerateOrderNumber(@testOrderNumber)');
          const [orderNumber] = await query('SELECT @testOrderNumber as orderNumber');
          console.log(`🔢 Número de orden de prueba generado: ${orderNumber.orderNumber}`);
        } catch (testError) {
          console.log('❌ Error probando procedimiento GenerateOrderNumber:', testError.message);
        }
      } else {
        console.log('❌ Procedimiento GenerateOrderNumber NO EXISTE');
      }
    } catch (error) {
      console.log('❌ Error verificando procedimiento GenerateOrderNumber:', error.message);
    }

    console.log('\n6️⃣ VERIFICANDO VISTA ORDERS_WITH_DETAILS:');
    try {
      const [view] = await query(`
        SELECT COUNT(*) as count FROM information_schema.views 
        WHERE table_schema = 'cosmetics_db' AND table_name = 'orders_with_details'
      `);
      
      if (view.count > 0) {
        console.log('✅ Vista orders_with_details existe');
      } else {
        console.log('❌ Vista orders_with_details NO EXISTE');
      }
    } catch (error) {
      console.log('❌ Error verificando vista orders_with_details:', error.message);
    }

    console.log('\n7️⃣ VERIFICANDO DATOS DE PRODUCTOS:');
    try {
      const [products] = await query('SELECT COUNT(*) as count FROM products');
      console.log(`📦 Total de productos: ${products.count}`);
      
      if (products.count > 0) {
        const [sampleProduct] = await query('SELECT id, name, price FROM products LIMIT 1');
        console.log(`🔍 Producto de ejemplo: ID ${sampleProduct.id} - ${sampleProduct.name} - $${sampleProduct.price}`);
      }
    } catch (error) {
      console.log('❌ Error verificando productos:', error.message);
    }

    console.log('\n8️⃣ VERIFICANDO CARROS DE INVITADOS ACTIVOS:');
    try {
      const [activeCarts] = await query(`
        SELECT COUNT(*) as count FROM guest_carts WHERE status = 'active'
      `);
      console.log(`🛒 Carros de invitados activos: ${activeCarts.count}`);
      
      if (activeCarts.count > 0) {
        const sampleCart = await query(`
          SELECT gc.session_id, gc.status, gci.quantity, p.name as product_name
          FROM guest_carts gc
          INNER JOIN guest_cart_items gci ON gc.id = gci.guest_cart_id
          INNER JOIN products p ON gci.product_id = p.id
          WHERE gc.status = 'active'
          LIMIT 1
        `);
        
        if (sampleCart && sampleCart.length > 0) {
          const cart = sampleCart[0];
          console.log(`📋 Carro de ejemplo: Session ${cart.session_id} - ${cart.product_name} x${cart.quantity}`);
        }
      }
    } catch (error) {
      console.log('❌ Error verificando carros de invitados:', error.message);
    }

    console.log('\n9️⃣ VERIFICANDO CARRO DE INVITADO ESPECÍFICO:');
    try {
      const sessionId = 'guest_1755791797727_pdusy7ffx08';
      const [cartDetails] = await query(`
        SELECT gc.id, gc.session_id, gc.status, gc.total_amount
        FROM guest_carts gc
        WHERE gc.session_id = ?
      `, [sessionId]);
      
      if (cartDetails) {
        console.log(`🛒 Carro encontrado para session ${sessionId}:`);
        console.log(`  - ID: ${cartDetails.id}`);
        console.log(`  - Status: ${cartDetails.status}`);
        console.log(`  - Total: $${cartDetails.total_amount}`);
        
        // Verificar items del carro
        const cartItems = await query(`
          SELECT gci.id, gci.product_id, gci.quantity, p.name, p.price
          FROM guest_cart_items gci
          INNER JOIN products p ON gci.product_id = p.id
          WHERE gci.guest_cart_id = ?
        `, [cartDetails.id]);
        
        console.log(`  - Items en el carro: ${cartItems.length}`);
        cartItems.forEach(item => {
          console.log(`    • ${item.name} x${item.quantity} - $${item.price}`);
        });
      } else {
        console.log(`❌ No se encontró carro para session ${sessionId}`);
      }
    } catch (error) {
      console.log('❌ Error verificando carro específico:', error.message);
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  } finally {
    process.exit(0);
  }
}

checkOrdersStatus(); 