const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Sin contraseña
  database: 'cosmetics_db'
};

async function testPendingOptionsQuery() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida correctamente');

    // 1. Probar la consulta exacta que usa el controlador
    console.log('\n📋 Probando consulta de opciones pendientes...');
    try {
      const [results] = await connection.execute(`
        SELECT 
          so.id,
          so.option_text,
          so.description,
          so.created_at,
          so.admin_notes,
          s.question as survey_question,
          s.id as survey_id,
          u.username as suggested_by
        FROM survey_options so
        INNER JOIN surveys s ON so.survey_id = s.id
        INNER JOIN users u ON so.created_by = u.id
        WHERE so.is_approved = 0
        ORDER BY so.created_at ASC
      `);
      
      console.log('✅ Consulta ejecutada exitosamente');
      console.log(`📊 Resultados encontrados: ${results.length}`);
      
      if (results.length > 0) {
        console.log('\n📝 Primer resultado:');
        console.log(JSON.stringify(results[0], null, 2));
      }
      
    } catch (error) {
      console.error('❌ Error en la consulta:', error.message);
      console.error('Código de error:', error.code);
      console.error('SQL State:', error.sqlState);
      console.error('SQL Message:', error.sqlMessage);
    }

    // 2. Verificar datos en las tablas
    console.log('\n📊 Verificando datos en las tablas...');
    
    const [surveyOptionsCount] = await connection.execute('SELECT COUNT(*) as count FROM survey_options');
    const [surveysCount] = await connection.execute('SELECT COUNT(*) as count FROM surveys');
    const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    console.log(`📋 Survey Options: ${surveyOptionsCount[0].count}`);
    console.log(`📋 Surveys: ${surveysCount[0].count}`);
    console.log(`👥 Users: ${usersCount[0].count}`);

    // 3. Verificar opciones pendientes
    const [pendingOptionsCount] = await connection.execute('SELECT COUNT(*) as count FROM survey_options WHERE is_approved = 0');
    console.log(`⏳ Opciones pendientes: ${pendingOptionsCount[0].count}`);

    // 4. Verificar relaciones
    console.log('\n🔗 Verificando relaciones entre tablas...');
    
    const [orphanedOptions] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM survey_options so
      LEFT JOIN surveys s ON so.survey_id = s.id
      WHERE s.id IS NULL
    `);
    
    const [orphanedUsers] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM survey_options so
      LEFT JOIN users u ON so.created_by = u.id
      WHERE u.id IS NULL
    `);
    
    console.log(`❌ Opciones sin survey válido: ${orphanedOptions[0].count}`);
    console.log(`❌ Opciones sin user válido: ${orphanedUsers[0].count}`);

    // 5. Mostrar algunos ejemplos
    console.log('\n📝 Ejemplos de datos:');
    
    const [sampleOptions] = await connection.execute('SELECT id, survey_id, created_by, is_approved FROM survey_options LIMIT 3');
    console.log('Survey Options:', sampleOptions);
    
    const [sampleSurveys] = await connection.execute('SELECT id, question, status FROM surveys LIMIT 3');
    console.log('Surveys:', sampleSurveys);
    
    const [sampleUsers] = await connection.execute('SELECT id, username, email FROM users LIMIT 3');
    console.log('Users:', sampleUsers);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar prueba
testPendingOptionsQuery(); 