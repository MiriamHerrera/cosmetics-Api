const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStructure() {
  let connection;
  
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cosmetics_db'
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar estructura de orders
    console.log('\n📋 Estructura de la tabla orders:');
    const [orderColumns] = await connection.execute('DESCRIBE orders');
    orderColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Verificar estructura de order_items
    console.log('\n📋 Estructura de la tabla order_items:');
    const [orderItemColumns] = await connection.execute('DESCRIBE order_items');
    orderItemColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Verificar estructura de products
    console.log('\n📋 Estructura de la tabla products:');
    const [productColumns] = await connection.execute('DESCRIBE products');
    productColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Verificar si hay datos en las tablas
    console.log('\n📊 Datos en las tablas:');
    
    const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    console.log(`  - Orders: ${orderCount[0].count} registros`);
    
    const [orderItemCount] = await connection.execute('SELECT COUNT(*) as count FROM order_items');
    console.log(`  - Order Items: ${orderItemCount[0].count} registros`);
    
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`  - Products: ${productCount[0].count} registros`);

    // Verificar si order_items tiene la columna price
    const hasPriceColumn = orderItemColumns.some(col => col.Field === 'price');
    console.log(`\n🔍 ¿order_items tiene columna price? ${hasPriceColumn ? '✅ SÍ' : '❌ NO'}`);

    if (!hasPriceColumn) {
      console.log('\n💡 Solución: Necesitamos agregar la columna price a order_items');
      console.log('   Esto es necesario para que los reportes funcionen correctamente');
    }

    // Mostrar algunos registros de ejemplo
    if (orderCount[0].count > 0) {
      console.log('\n📝 Ejemplo de orders:');
      const [orders] = await connection.execute('SELECT * FROM orders LIMIT 3');
      orders.forEach(order => {
        console.log(`  - ID: ${order.id}, Status: ${order.status}, Total: $${order.total_amount}, Fecha: ${order.created_at}`);
      });
    }

    if (orderItemCount[0].count > 0) {
      console.log('\n📝 Ejemplo de order_items:');
      const [orderItems] = await connection.execute('SELECT * FROM order_items LIMIT 3');
      orderItems.forEach(item => {
        console.log(`  - Order ID: ${item.order_id}, Product ID: ${item.product_id}, Quantity: ${item.quantity}`);
      });
    }

    // Verificar relaciones entre tablas
    console.log('\n🔗 Verificando relaciones entre tablas...');
    
    try {
      const [joinTest] = await connection.execute(`
        SELECT 
          o.id as order_id,
          o.order_number,
          oi.id as item_id,
          p.name as product_name,
          oi.quantity
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LIMIT 5
      `);
      
      console.log('✅ JOIN entre orders, order_items y products funciona');
      console.log('📋 Datos de ejemplo del JOIN:');
      joinTest.forEach(row => {
        console.log(`  - Order: ${row.order_number}, Item: ${row.item_id || 'N/A'}, Product: ${row.product_name || 'N/A'}, Qty: ${row.quantity || 'N/A'}`);
      });
      
    } catch (error) {
      console.log('❌ Error en JOIN:', error.message);
    }

    // Verificar si podemos calcular precios
    console.log('\n💰 Verificando cálculo de precios...');
    
    try {
      // Intentar calcular usando el precio del producto (no del order_item)
      const [priceTest] = await connection.execute(`
        SELECT 
          o.id as order_id,
          o.order_number,
          oi.quantity,
          p.price as product_price,
          p.cost_price as product_cost,
          (oi.quantity * p.price) as total_revenue,
          (oi.quantity * p.cost_price) as total_cost,
          (oi.quantity * (p.price - p.cost_price)) as total_profit
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id
        WHERE o.status = 'completed'
        LIMIT 5
      `);
      
      console.log('✅ Cálculo de precios usando precio del producto funciona');
      console.log('📊 Ejemplo de cálculos:');
      priceTest.forEach(row => {
        console.log(`  - Order ${row.order_number}: Qty ${row.quantity}, Precio $${row.product_price}, Costo $${row.product_cost}, Ganancia $${row.total_profit}`);
      });
      
    } catch (error) {
      console.log('❌ Error en cálculo de precios:', error.message);
    }

    console.log('\n📋 Resumen de verificación:');
    console.log(`  ✅ Tabla orders: ${orderCount[0].count} registros`);
    console.log(`  ✅ Tabla order_items: ${orderItemCount[0].count} registros`);
    console.log(`  ✅ Tabla products: ${productCount[0].count} registros`);
    console.log(`  ${hasPriceColumn ? '✅' : '❌'} Columna price en order_items`);
    
    if (!hasPriceColumn) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('   La tabla order_items no tiene la columna price');
      console.log('   Esto es necesario para que los reportes funcionen');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   Necesitamos agregar la columna price a order_items');
      console.log('   O modificar los reportes para usar el precio del producto');
    }

  } catch (error) {
    console.error('❌ Error verificando la base de datos:', error);
    console.error('Detalles del error:', error.message);
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  checkDatabaseStructure()
    .then(() => {
      console.log('\n✨ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la verificación:', error);
      process.exit(1);
    });
}

module.exports = checkDatabaseStructure; 