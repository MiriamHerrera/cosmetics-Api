const mysql = require('mysql2/promise');

// Configuración de conexión (usar variables de entorno en producción)
const dbConfig = {
  host: process.env.DB_HOST || 'centerbeam.proxy.rlwy.net',
  port: process.env.DB_PORT || 18260,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cosmetics_db'
};

async function testMinimalSetup() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa');
    
    // Verificar estructura básica
    console.log('\n📊 Verificando estructura de base de datos...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Encontradas ${tables.length} tablas`);
    
    // Verificar datos mínimos
    console.log('\n📝 Verificando datos mínimos...');
    
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    const [surveys] = await connection.query('SELECT COUNT(*) as count FROM surveys');
    
    console.log(`👥 Usuarios: ${users[0].count}`);
    console.log(`🏷️ Categorías: ${categories[0].count}`);
    console.log(`📦 Productos: ${products[0].count}`);
    console.log(`📊 Encuestas: ${surveys[0].count}`);
    
    // Verificar producto específico
    console.log('\n🔍 Verificando producto de prueba...');
    const [productDetails] = await connection.query('SELECT id, name, price, stock_total FROM products WHERE id = 1');
    
    if (productDetails.length > 0) {
      const product = productDetails[0];
      console.log(`✅ Producto encontrado: ${product.name} - $${product.price} - Stock: ${product.stock_total}`);
    } else {
      console.log('❌ Producto de prueba no encontrado');
    }
    
    // Verificar encuesta
    console.log('\n📊 Verificando encuesta de prueba...');
    const [surveyDetails] = await connection.query('SELECT id, question FROM surveys WHERE id = 1');
    
    if (surveyDetails.length > 0) {
      const survey = surveyDetails[0];
      console.log(`✅ Encuesta encontrada: ${survey.question}`);
    } else {
      console.log('❌ Encuesta de prueba no encontrada');
    }
    
    console.log('\n🎉 Verificación completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testMinimalSetup();
}

module.exports = testMinimalSetup;
