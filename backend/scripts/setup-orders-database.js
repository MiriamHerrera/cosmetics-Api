const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupOrdersDatabase() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'cosmetics_db',
      multipleStatements: true
    });

    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'fix-orders-system-simple.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Dividir el contenido en declaraciones individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} declaraciones SQL...`);

    // Ejecutar cada declaración
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('DELIMITER')) {
        continue; // Saltar declaraciones DELIMITER
      }

      try {
        console.log(`🔄 Ejecutando declaración ${i + 1}/${statements.length}`);
        const [results] = await connection.execute(statement);
        
        if (Array.isArray(results) && results.length > 0) {
          console.log(`   ✅ Resultado:`, results[0]);
        } else {
          console.log(`   ✅ Ejecutado correctamente`);
        }
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('Duplicate entry')) {
          console.log(`   ⚠️  Ya existe (saltando): ${error.message}`);
        } else {
          console.error(`   ❌ Error en declaración ${i + 1}:`, error.message);
        }
      }
    }

    // Crear el procedimiento almacenado manualmente
    console.log('🔧 Creando procedimiento GenerateOrderNumber...');
    
    try {
      await connection.execute('DROP PROCEDURE IF EXISTS GenerateOrderNumber');
      
      const procedureSQL = `
        CREATE PROCEDURE GenerateOrderNumber(OUT orderNumber VARCHAR(20))
        BEGIN
            DECLARE orderCount INT DEFAULT 0;
            DECLARE datePrefix VARCHAR(8);
            
            SET datePrefix = DATE_FORMAT(NOW(), '%Y%m%d');
            
            SELECT COUNT(*) INTO orderCount 
            FROM orders 
            WHERE DATE(created_at) = CURDATE();
            
            SET orderCount = orderCount + 1;
            
            SET orderNumber = CONCAT('ORD', datePrefix, LPAD(orderCount, 4, '0'));
        END
      `;
      
      await connection.execute(procedureSQL);
      console.log('✅ Procedimiento GenerateOrderNumber creado');
    } catch (error) {
      console.error('❌ Error creando procedimiento:', error.message);
    }

    // Crear la vista manualmente
    console.log('🔧 Creando vista orders_with_details...');
    
    try {
      await connection.execute('DROP VIEW IF EXISTS orders_with_details');
      
      const viewSQL = `
        CREATE VIEW orders_with_details AS
        SELECT 
            o.id,
            o.order_number,
            o.customer_type,
            o.user_id,
            o.session_id,
            o.customer_name,
            o.customer_phone,
            o.customer_email,
            o.delivery_location_id,
            o.delivery_date,
            o.delivery_time,
            o.delivery_address,
            o.total_amount,
            o.notes,
            o.status,
            o.whatsapp_message,
            o.whatsapp_sent_at,
            o.admin_notes,
            o.created_at,
            o.updated_at,
            dl.name as delivery_location_name,
            dl.address as delivery_location_address,
            dl.description as delivery_location_description,
            u.name as user_name,
            u.email as user_email
        FROM orders o
        LEFT JOIN delivery_locations dl ON o.delivery_location_id = dl.id
        LEFT JOIN users u ON o.user_id = u.id
      `;
      
      await connection.execute(viewSQL);
      console.log('✅ Vista orders_with_details creada');
    } catch (error) {
      console.error('❌ Error creando vista:', error.message);
    }

    // Verificar lugares de entrega
    console.log('🔍 Verificando lugares de entrega...');
    const [locations] = await connection.execute(
      'SELECT COUNT(*) as count FROM delivery_locations WHERE is_active = TRUE'
    );
    
    if (locations[0].count === 0) {
      console.log('📍 Creando lugares de entrega de prueba...');
      await connection.execute(`
        INSERT INTO delivery_locations (name, address, description, is_active) VALUES
        ('Centro de la Ciudad', 'Centro, Ciudad', 'Entrega en el centro de la ciudad', TRUE),
        ('Zona Norte', 'Zona Norte, Ciudad', 'Entrega en la zona norte', TRUE),
        ('Zona Sur', 'Zona Sur, Ciudad', 'Entrega en la zona sur', TRUE)
      `);
      console.log('✅ Lugares de entrega creados');
    } else {
      console.log(`✅ Ya existen ${locations[0].count} lugares de entrega`);
    }

    // Probar el procedimiento
    console.log('🧪 Probando procedimiento GenerateOrderNumber...');
    try {
      await connection.execute('SET @testOrderNumber = ""');
      await connection.execute('CALL GenerateOrderNumber(@testOrderNumber)');
      const [result] = await connection.execute('SELECT @testOrderNumber as orderNumber');
      console.log('✅ Número de orden de prueba:', result[0].orderNumber);
    } catch (error) {
      console.error('❌ Error probando procedimiento:', error.message);
    }

    console.log('🎉 Configuración de base de datos completada exitosamente');

  } catch (error) {
    console.error('💥 Error configurando base de datos:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
setupOrdersDatabase();
