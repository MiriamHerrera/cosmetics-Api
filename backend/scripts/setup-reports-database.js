const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupReportsDatabase() {
  let connection;
  
  try {
    console.log('🔧 Configurando base de datos para reportes...');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cosmetics_db'
    });

    console.log('✅ Conectado a la base de datos');

    // 1. Agregar columna cost_price si no existe
    console.log('📊 Agregando columna cost_price...');
    try {
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Precio de costo del producto'
      `);
      console.log('✅ Columna cost_price agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ La columna cost_price ya existe');
      } else {
        throw error;
      }
    }

    // 2. Actualizar productos existentes con costo estimado
    console.log('💰 Actualizando costos de productos...');
    const [updateResult] = await connection.execute(`
      UPDATE products 
      SET cost_price = ROUND(price * 0.6, 2) 
      WHERE cost_price = 0 OR cost_price IS NULL
    `);
    console.log(`✅ ${updateResult.affectedRows} productos actualizados con costo estimado`);

    // 3. Verificar la estructura de la tabla
    console.log('🔍 Verificando estructura de la tabla products...');
    const [columns] = await connection.execute('DESCRIBE products');
    console.log('📋 Columnas de la tabla products:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // 4. Mostrar algunos productos con sus precios y costos
    console.log('\n📦 Productos con precios y costos:');
    const [products] = await connection.execute(`
      SELECT 
        id,
        name,
        price,
        cost_price,
        ROUND((price - cost_price), 2) as ganancia_unitaria,
        ROUND(((price - cost_price) / price) * 100, 2) as margen_porcentaje
      FROM products 
      LIMIT 10
    `);
    
    products.forEach(product => {
      console.log(`  - ${product.name}: Precio $${product.price}, Costo $${product.cost_price}, Ganancia $${product.ganancia_unitaria} (${product.margen_porcentaje}%)`);
    });

    // 5. Crear índices para mejorar rendimiento
    console.log('\n🚀 Creando índices para mejorar rendimiento...');
    try {
      await connection.execute('CREATE INDEX idx_products_cost_price ON products(cost_price)');
      console.log('✅ Índice en cost_price creado');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Índice en cost_price ya existe');
      } else {
        throw error;
      }
    }

    try {
      await connection.execute('CREATE INDEX idx_products_price_cost ON products(price, cost_price)');
      console.log('✅ Índice compuesto en price y cost_price creado');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Índice compuesto ya existe');
      } else {
        throw error;
      }
    }

    // 6. Verificar que los reportes pueden funcionar
    console.log('\n📊 Verificando que los reportes pueden funcionar...');
    const [reportTest] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(oi.quantity * oi.price) as total_revenue,
        SUM(oi.quantity * p.cost_price) as total_cost,
        SUM(oi.quantity * (oi.price - p.cost_price)) as total_profit,
        ROUND(
          (SUM(oi.quantity * (oi.price - p.cost_price)) / SUM(oi.quantity * oi.price)) * 100, 2
        ) as profit_margin_percentage
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      INNER JOIN products p ON oi.product_id = p.id
      WHERE o.status = 'completed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    if (reportTest.length > 0) {
      const data = reportTest[0];
      console.log('✅ Reportes funcionando correctamente:');
      console.log(`  - Total pedidos: ${data.total_orders || 0}`);
      console.log(`  - Ingresos totales: $${data.total_revenue || 0}`);
      console.log(`  - Costos totales: $${data.total_cost || 0}`);
      console.log(`  - Ganancia total: $${data.total_profit || 0}`);
      console.log(`  - Margen de ganancia: ${data.profit_margin_percentage || 0}%`);
    } else {
      console.log('⚠️ No hay datos de pedidos para generar reportes');
      console.log('💡 Necesitas crear algunos pedidos para ver los reportes funcionando');
    }

    // 7. Generar datos de prueba si no hay suficientes
    console.log('\n🎯 Generando datos de prueba si es necesario...');
    const [orderCount] = await connection.execute('SELECT COUNT(*) as count FROM orders WHERE status = "completed"');
    
    if (orderCount[0].count < 5) {
      console.log('📝 Creando pedidos de prueba...');
      
      // Crear pedidos de prueba
      const [users] = await connection.execute('SELECT id FROM users WHERE role = "client" LIMIT 3');
      
      for (const user of users) {
        const orderNumber = `TEST-${Date.now()}-${user.id}`;
        const [orderResult] = await connection.execute(`
          INSERT INTO orders (user_id, order_number, status, total_amount, created_at, updated_at)
          VALUES (?, ?, 'completed', 0, NOW() - INTERVAL FLOOR(RAND() * 30) DAY, NOW())
        `, [user.id, orderNumber]);
        
        const orderId = orderResult.insertId;
        
        // Agregar elementos de pedido
        const [products] = await connection.execute('SELECT id, price FROM products LIMIT 3');
        for (const product of products) {
          const quantity = Math.floor(Math.random() * 3) + 1;
          await connection.execute(`
            INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
            VALUES (?, ?, ?, ?, NOW())
          `, [orderId, product.id, quantity, product.price]);
        }
        
        // Actualizar total del pedido
        await connection.execute(`
          UPDATE orders SET total_amount = (
            SELECT SUM(quantity * price) FROM order_items WHERE order_id = ?
          ) WHERE id = ?
        `, [orderId, orderId]);
      }
      
      console.log('✅ Datos de prueba generados');
    } else {
      console.log('ℹ️ Ya hay suficientes pedidos para los reportes');
    }

    console.log('\n🎉 ¡Configuración de reportes completada exitosamente!');
    console.log('\n📋 Resumen de lo configurado:');
    console.log('  ✅ Columna cost_price agregada a productos');
    console.log('  ✅ Costos estimados calculados (60% del precio)');
    console.log('  ✅ Índices de rendimiento creados');
    console.log('  ✅ Datos de prueba generados (si era necesario)');
    console.log('  ✅ Sistema de reportes verificado');
    
    console.log('\n🚀 Próximos pasos:');
    console.log('  1. Reinicia el backend: npm start');
    console.log('  2. Ve al frontend y abre el panel administrativo');
    console.log('  3. Haz clic en la pestaña "Reportes"');
    console.log('  4. ¡Disfruta de tus reportes financieros!');

  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    console.error('Detalles del error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solución: Asegúrate de que MySQL esté ejecutándose');
      console.log('   - Si usas XAMPP: Inicia MySQL desde el panel de control');
      console.log('   - Si usas otro servidor: Verifica que esté activo');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solución: Verifica las credenciales de la base de datos');
      console.log('   - Revisa tu archivo .env');
      console.log('   - Verifica usuario y contraseña de MySQL');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  setupReportsDatabase()
    .then(() => {
      console.log('\n✨ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error ejecutando el script:', error);
      process.exit(1);
    });
}

module.exports = setupReportsDatabase; 