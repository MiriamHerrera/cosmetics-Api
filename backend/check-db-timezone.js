const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseTimezone() {
    console.log('🕐 === VERIFICACIÓN DE TIMEZONE DE BASE DE DATOS ===\n');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        
        console.log('🗄️ Información de timezone de MySQL:');
        
        // 1. Verificar timezone actual
        const [timezoneResult] = await connection.execute(`
            SELECT 
                @@global.time_zone as global_timezone,
                @@session.time_zone as session_timezone,
                NOW() as current_time,
                UTC_TIMESTAMP() as utc_time
        `);
        
        console.log('   - Global timezone:', timezoneResult[0].global_timezone);
        console.log('   - Session timezone:', timezoneResult[0].session_timezone);
        console.log('   - Hora actual (NOW):', timezoneResult[0].current_time);
        console.log('   - Hora UTC:', timezoneResult[0].utc_time);
        
        // 2. Verificar datos de carrito recientes
        console.log('\n📋 Verificando timestamps de carritos recientes:');
        const [cartResult] = await connection.execute(`
            SELECT 
                id,
                created_at,
                updated_at,
                TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), created_at) as hours_diff
            FROM cart_items_unified 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        if (cartResult.length > 0) {
            cartResult.forEach(cart => {
                console.log(`   - Cart ID ${cart.id}:`);
                console.log(`     * Created: ${cart.created_at}`);
                console.log(`     * Updated: ${cart.updated_at}`);
                console.log(`     * Diferencia con UTC: ${cart.hours_diff} horas`);
            });
        } else {
            console.log('   - No hay carritos recientes para verificar');
        }
        
        // 3. Verificar si podemos cambiar el timezone
        console.log('\n🔧 Intentando configurar timezone a México:');
        try {
            await connection.execute("SET time_zone = '-06:00'");
            const [newTimeResult] = await connection.execute("SELECT NOW() as new_time");
            console.log('   - Timezone cambiado a -06:00 (México)');
            console.log('   - Nueva hora:', newTimeResult[0].new_time);
        } catch (error) {
            console.log('   - Error cambiando timezone:', error.message);
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
    }
    
    console.log('\n🔍 === SOLUCIONES POSIBLES ===');
    console.log('1. Configurar timezone en Railway MySQL:');
    console.log('   - Ir a Railway → MySQL service → Variables');
    console.log('   - Agregar: TZ=America/Mexico_City');
    console.log('   - O agregar: default-time-zone=-06:00');
    console.log('');
    console.log('2. Configurar timezone en la aplicación:');
    console.log('   - Agregar en database.js: timezone: "-06:00"');
    console.log('');
    console.log('3. Usar CONVERT_TZ en las consultas:');
    console.log('   - SELECT CONVERT_TZ(created_at, "+00:00", "-06:00")');
}

checkDatabaseTimezone().catch(console.error);
