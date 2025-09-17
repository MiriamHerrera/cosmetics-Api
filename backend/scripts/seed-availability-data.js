const { query, getConnection } = require('../src/config/database');

const seedAvailabilityData = async () => {
  let connection;
  
  try {
    console.log('🌱 Iniciando inserción de datos de disponibilidad...');
    
    connection = await getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    
    // 1. Insertar lugares de entrega de ejemplo
    console.log('📍 Insertando lugares de entrega...');
    
    const deliveryLocations = [
      {
        name: 'Centro Comercial Plaza',
        address: 'Av. Principal 123, Centro, Ciudad',
        description: 'Plaza comercial principal con estacionamiento',
        is_active: true
      },
      {
        name: 'Mercado Central',
        address: 'Calle Comercio 456, Mercado Central',
        description: 'Mercado tradicional en el centro histórico',
        is_active: true
      },
      {
        name: 'Zona Norte - Supermercado',
        address: 'Blvd. Norte 789, Zona Norte',
        description: 'Supermercado en zona residencial norte',
        is_active: true
      },
      {
        name: 'Universidad',
        address: 'Campus Universitario, Zona Estudiantil',
        description: 'Punto de entrega en el campus universitario',
        is_active: false
      }
    ];
    
    for (const location of deliveryLocations) {
      try {
        await query(`
          INSERT INTO delivery_locations (name, address, description, is_active)
          VALUES (?, ?, ?, ?)
        `, [location.name, location.address, location.description, location.is_active ? 1 : 0]);
        console.log(`✅ Lugar insertado: ${location.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Lugar ya existe: ${location.name}`);
        } else {
          console.error(`❌ Error insertando ${location.name}:`, error.message);
        }
      }
    }
    
    // 2. Obtener IDs de los lugares insertados
    const locations = await query(`
      SELECT id, name FROM delivery_locations ORDER BY id
    `);
    
    console.log(`📍 ${locations.length} lugares de entrega disponibles`);
    
    // 3. Insertar horarios de ejemplo para cada lugar
    console.log('🕐 Insertando horarios de disponibilidad...');
    
    const timeSlots = [
      // Lunes a Viernes: 9:00 - 18:00 cada hora
      { day: 1, times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
      { day: 2, times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
      { day: 3, times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
      { day: 4, times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
      { day: 5, times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
      // Sábado: 9:00 - 15:00 cada hora
      { day: 6, times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] },
      // Domingo: 10:00 - 14:00 cada hora
      { day: 0, times: ['10:00', '11:00', '12:00', '13:00', '14:00'] }
    ];
    
    let totalTimeSlots = 0;
    
    for (const location of locations) {
      console.log(`🕐 Creando horarios para: ${location.name}`);
      
      for (const daySchedule of timeSlots) {
        for (const time of daySchedule.times) {
          try {
            await query(`
              INSERT INTO delivery_time_slots (location_id, day_of_week, time_slot, is_active)
              VALUES (?, ?, ?, ?)
            `, [location.id, daySchedule.day, time, 1]);
            totalTimeSlots++;
          } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
              // Ya existe este horario, continuar
            } else {
              console.error(`❌ Error insertando horario ${time} para ${location.name}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`✅ ${totalTimeSlots} horarios de disponibilidad insertados`);
    
    // 4. Verificar datos insertados
    console.log('🔍 Verificando datos insertados...');
    
    const locationCount = await query('SELECT COUNT(*) as count FROM delivery_locations');
    const timeSlotCount = await query('SELECT COUNT(*) as count FROM delivery_time_slots');
    
    console.log(`📊 Resumen de datos insertados:`);
    console.log(`   - Lugares de entrega: ${locationCount[0].count}`);
    console.log(`   - Horarios de disponibilidad: ${timeSlotCount[0].count}`);
    
    // 5. Mostrar algunos ejemplos
    console.log('📋 Ejemplos de lugares de entrega:');
    const sampleLocations = await query(`
      SELECT id, name, address, is_active 
      FROM delivery_locations 
      ORDER BY id 
      LIMIT 3
    `);
    
    sampleLocations.forEach(location => {
      console.log(`   ${location.id}. ${location.name} - ${location.is_active ? 'Activo' : 'Inactivo'}`);
    });
    
    console.log('📋 Ejemplos de horarios:');
    const sampleTimeSlots = await query(`
      SELECT ts.id, dl.name as location_name, ts.day_of_week, ts.time_slot, ts.is_active
      FROM delivery_time_slots ts
      LEFT JOIN delivery_locations dl ON ts.location_id = dl.id
      ORDER BY ts.id
      LIMIT 5
    `);
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    sampleTimeSlots.forEach(slot => {
      console.log(`   ${slot.id}. ${slot.location_name} - ${dayNames[slot.day_of_week]} ${slot.time_slot} - ${slot.is_active ? 'Activo' : 'Inactivo'}`);
    });
    
    console.log('✅ Datos de disponibilidad insertados exitosamente');
    
  } catch (error) {
    console.error('❌ Error insertando datos de disponibilidad:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('🔓 Conexión liberada');
    }
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedAvailabilityData()
    .then(() => {
      console.log('🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { seedAvailabilityData };
