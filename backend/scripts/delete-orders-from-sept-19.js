const mysql = require('mysql2/promise');
require('dotenv').config();

async function deleteOrdersFromSept19() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    // Configuración de la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cosmetics_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado a la base de datos');

    // 1. Primero, obtener información sobre los pedidos a eliminar
    console.log('\n📊 Analizando pedidos a partir del 19 de septiembre...');
    
    const [ordersToDelete] = await connection.execute(`
      SELECT 
        id, 
        order_number, 
        customer_name, 
        created_at,
        status
      FROM orders 
      WHERE created_at >= '2025-09-19 00:00:00'
      ORDER BY id ASC
    `);

    console.log(`📋 Encontrados ${ordersToDelete.length} pedidos a eliminar:`);
    ordersToDelete.forEach(order => {
      console.log(`   - ID: ${order.id} | ${order.order_number} | ${order.customer_name} | ${order.created_at} | ${order.status}`);
    });

    if (ordersToDelete.length === 0) {
      console.log('✅ No hay pedidos a eliminar');
      return;
    }

    // 2. Obtener el ID más alto antes del 19 de septiembre
    const [maxIdBefore] = await connection.execute(`
      SELECT COALESCE(MAX(id), 0) as max_id
      FROM orders 
      WHERE created_at < '2025-09-19 00:00:00'
    `);

    const nextId = maxIdBefore[0].max_id + 1;
    console.log(`\n🔢 El siguiente ID disponible será: ${nextId}`);

    // 3. Confirmar la eliminación
    console.log('\n⚠️  ADVERTENCIA: Esta operación eliminará permanentemente:');
    console.log(`   - ${ordersToDelete.length} pedidos`);
    console.log(`   - Todos los items de pedidos relacionados`);
    console.log(`   - Reseteará el AUTO_INCREMENT a ${nextId}`);
    
    // En un entorno de producción, aquí podrías agregar una confirmación manual
    // const readline = require('readline');
    // const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // const answer = await new Promise(resolve => rl.question('¿Continuar? (yes/no): ', resolve));
    // rl.close();
    // if (answer.toLowerCase() !== 'yes') {
    //   console.log('❌ Operación cancelada');
    //   return;
    // }

    console.log('\n🚀 Iniciando eliminación...');

    // 4. Deshabilitar verificación de claves foráneas temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🔓 Verificación de claves foráneas deshabilitada');

    // 5. Eliminar items de pedidos relacionados
    console.log('🗑️  Eliminando items de pedidos...');
    const [deletedItems] = await connection.execute(`
      DELETE oi FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= '2025-09-19 00:00:00'
    `);
    console.log(`✅ Eliminados ${deletedItems.affectedRows} items de pedidos`);

    // 6. Eliminar los pedidos
    console.log('🗑️  Eliminando pedidos...');
    const [deletedOrders] = await connection.execute(`
      DELETE FROM orders 
      WHERE created_at >= '2025-09-19 00:00:00'
    `);
    console.log(`✅ Eliminados ${deletedOrders.affectedRows} pedidos`);

    // 7. Resetear el AUTO_INCREMENT
    console.log('🔄 Reseteando AUTO_INCREMENT...');
    await connection.execute(`ALTER TABLE orders AUTO_INCREMENT = ${nextId}`);
    console.log(`✅ AUTO_INCREMENT reseteado a ${nextId}`);

    // 8. Rehabilitar verificación de claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('🔒 Verificación de claves foráneas rehabilitada');

    // 9. Verificar el resultado
    console.log('\n📊 Verificando resultado...');
    
    const [remainingOrders] = await connection.execute(`
      SELECT COUNT(*) as count FROM orders WHERE created_at >= '2025-09-19 00:00:00'
    `);
    
    const [currentAutoIncrement] = await connection.execute(`
      SELECT AUTO_INCREMENT FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
    `, [process.env.DB_NAME || 'cosmetics_db']);

    console.log(`✅ Pedidos restantes desde 19 sept: ${remainingOrders[0].count}`);
    console.log(`✅ AUTO_INCREMENT actual: ${currentAutoIncrement[0].AUTO_INCREMENT}`);

    // 10. Mostrar el último pedido válido
    const [lastValidOrder] = await connection.execute(`
      SELECT id, order_number, customer_name, created_at
      FROM orders 
      WHERE created_at < '2025-09-19 00:00:00'
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (lastValidOrder.length > 0) {
      console.log(`\n📋 Último pedido válido:`);
      console.log(`   - ID: ${lastValidOrder[0].id}`);
      console.log(`   - Número: ${lastValidOrder[0].order_number}`);
      console.log(`   - Cliente: ${lastValidOrder[0].customer_name}`);
      console.log(`   - Fecha: ${lastValidOrder[0].created_at}`);
    }

    console.log('\n🎉 ¡Eliminación completada exitosamente!');
    console.log(`📝 El próximo pedido tendrá ID: ${nextId}`);

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    
    // Intentar rehabilitar las claves foráneas en caso de error
    if (connection) {
      try {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🔒 Verificación de claves foráneas rehabilitada tras error');
      } catch (cleanupError) {
        console.error('❌ Error en cleanup:', cleanupError);
      }
    }
    
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  deleteOrdersFromSept19()
    .then(() => {
      console.log('\n✅ Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script falló:', error.message);
      process.exit(1);
    });
}

module.exports = deleteOrdersFromSept19;
