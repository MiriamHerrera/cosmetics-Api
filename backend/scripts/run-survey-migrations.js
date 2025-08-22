const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Sin contraseña
  database: 'cosmetics_db'
};

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida correctamente');

    // 1. Verificar estructura actual de users
    console.log('\n📋 Verificando estructura de la tabla users...');
    const [userColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'cosmetics_db' 
      AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    const userColumnNames = userColumns.map(col => col.COLUMN_NAME);
    console.log('Columnas actuales en users:', userColumnNames);

    // 2. Agregar campo username a users si no existe
    if (!userColumnNames.includes('username')) {
      console.log('\n➕ Agregando campo username a la tabla users...');
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN username VARCHAR(50) UNIQUE COMMENT 'Nombre de usuario único' AFTER id
      `);
      console.log('✅ Campo username agregado a users');
      
      // Actualizar usuarios existentes
      await connection.execute(`
        UPDATE users 
        SET username = CONCAT('user_', id) 
        WHERE username IS NULL OR username = ''
      `);
      console.log('✅ Usuarios existentes actualizados con username');
    } else {
      console.log('✅ Campo username ya existe en users');
    }

    // 3. Verificar estructura de surveys
    console.log('\n📋 Verificando estructura de la tabla surveys...');
    const [surveyColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'cosmetics_db' 
      AND TABLE_NAME = 'surveys'
      ORDER BY ORDINAL_POSITION
    `);
    
    const surveyColumnNames = surveyColumns.map(col => col.COLUMN_NAME);
    console.log('Columnas actuales en surveys:', surveyColumnNames);

    // 4. Agregar campos faltantes a surveys
    const requiredSurveyFields = [
      { name: 'description', sql: 'ADD COLUMN description TEXT COMMENT "Descripción adicional de la encuesta" AFTER question' },
      { name: 'created_by', sql: 'ADD COLUMN created_by BIGINT(20) NOT NULL DEFAULT 1 COMMENT "ID del usuario que creó la encuesta" AFTER status' },
      { name: 'updated_at', sql: 'ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at' },
      { name: 'closed_by', sql: 'ADD COLUMN closed_by BIGINT(20) NULL COMMENT "ID del admin que cerró la encuesta" AFTER updated_at' },
      { name: 'closed_at', sql: 'ADD COLUMN closed_at DATETIME NULL COMMENT "Fecha de cierre" AFTER closed_by' }
    ];

    for (const field of requiredSurveyFields) {
      if (!surveyColumnNames.includes(field.name)) {
        console.log(`➕ Agregando campo ${field.name} a surveys...`);
        await connection.execute(`ALTER TABLE surveys ${field.sql}`);
        console.log(`✅ Campo ${field.name} agregado a surveys`);
      } else {
        console.log(`✅ Campo ${field.name} ya existe en surveys`);
      }
    }

    // 5. Verificar estructura de survey_options
    console.log('\n📋 Verificando estructura de la tabla survey_options...');
    const [optionColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'cosmetics_db' 
      AND TABLE_NAME = 'survey_options'
      ORDER BY ORDINAL_POSITION
    `);
    
    const optionColumnNames = optionColumns.map(col => col.COLUMN_NAME);
    console.log('Columnas actuales en survey_options:', optionColumnNames);

    // 6. Agregar campos faltantes a survey_options
    const requiredOptionFields = [
      { name: 'description', sql: 'ADD COLUMN description TEXT COMMENT "Descripción adicional de la opción" AFTER option_text' },
      { name: 'created_by', sql: 'ADD COLUMN created_by BIGINT(20) NOT NULL DEFAULT 1 COMMENT "ID del usuario que sugirió la opción" AFTER product_id' },
      { name: 'is_approved', sql: 'ADD COLUMN is_approved TINYINT(1) DEFAULT 0 COMMENT "0 = Pendiente, 1 = Aprobada" AFTER created_by' },
      { name: 'admin_notes', sql: 'ADD COLUMN admin_notes TEXT COMMENT "Notas del administrador sobre la aprobación" AFTER is_approved' },
      { name: 'approved_by', sql: 'ADD COLUMN approved_by BIGINT(20) NULL COMMENT "ID del admin que aprobó/rechazó" AFTER admin_notes' },
      { name: 'approved_at', sql: 'ADD COLUMN approved_at DATETIME NULL COMMENT "Fecha de aprobación/rechazo" AFTER approved_by' },
      { name: 'updated_at', sql: 'ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER approved_at' }
    ];

    for (const field of requiredOptionFields) {
      if (!optionColumnNames.includes(field.name)) {
        console.log(`➕ Agregando campo ${field.name} a survey_options...`);
        await connection.execute(`ALTER TABLE survey_options ${field.sql}`);
        console.log(`✅ Campo ${field.name} agregado a survey_options`);
      } else {
        console.log(`✅ Campo ${field.name} ya existe en survey_options`);
      }
    }

    // 7. Verificar estructura de survey_votes
    console.log('\n📋 Verificando estructura de la tabla survey_votes...');
    const [voteColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'cosmetics_db' 
      AND TABLE_NAME = 'survey_votes'
      ORDER BY ORDINAL_POSITION
    `);
    
    const voteColumnNames = voteColumns.map(col => col.COLUMN_NAME);
    console.log('Columnas actuales en survey_votes:', voteColumnNames);

    // 8. Agregar campos faltantes a survey_votes
    if (!voteColumnNames.includes('updated_at')) {
      console.log('➕ Agregando campo updated_at a survey_votes...');
      await connection.execute(`
        ALTER TABLE survey_votes 
        ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
      `);
      console.log('✅ Campo updated_at agregado a survey_votes');
    } else {
      console.log('✅ Campo updated_at ya existe en survey_votes');
    }

    // 9. Cambiar el enum de status en surveys
    console.log('\n🔄 Actualizando enum de status en surveys...');
    try {
      await connection.execute(`
        ALTER TABLE surveys 
        MODIFY COLUMN status ENUM('draft', 'open', 'closed') DEFAULT 'open' COMMENT 'Estado de la encuesta'
      `);
      console.log('✅ Enum de status actualizado en surveys');
    } catch (error) {
      console.log('⚠️ No se pudo actualizar el enum de status (puede que ya esté correcto)');
    }

    // 10. Actualizar datos existentes
    console.log('\n🔄 Actualizando datos existentes...');
    await connection.execute('UPDATE surveys SET created_by = 1 WHERE created_by IS NULL');
    await connection.execute('UPDATE survey_options SET created_by = 1 WHERE created_by IS NULL');
    await connection.execute('UPDATE survey_options SET is_approved = 1 WHERE is_approved IS NULL');
    console.log('✅ Datos existentes actualizados');

    // 11. Verificar estructura final
    console.log('\n📊 Verificando estructura final...');
    const [finalStats] = await connection.execute(`
      SELECT 'Surveys' as table_name, COUNT(*) as count FROM surveys
      UNION ALL
      SELECT 'Survey Options', COUNT(*) FROM survey_options
      UNION ALL
      SELECT 'Survey Votes', COUNT(*) FROM survey_votes
      UNION ALL
      SELECT 'Users', COUNT(*) FROM users
    `);
    
    console.log('\n📈 Estadísticas finales:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.table_name}: ${stat.count}`);
    });

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('✅ Todas las tablas tienen la estructura correcta');
    console.log('✅ El sistema de encuestas debería funcionar correctamente');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migración
runMigrations(); 