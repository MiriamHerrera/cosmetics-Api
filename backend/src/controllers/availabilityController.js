const { query } = require('../config/database');

class AvailabilityController {
  
  // ===== LUGARES DE ENTREGA =====
  
  // Obtener todos los lugares de entrega
  getDeliveryLocations = async (req, res) => {
    try {
      console.log('🔍 Obteniendo lugares de entrega...');
      
      const locations = await query(`
        SELECT 
          id,
          name,
          address,
          description,
          is_active,
          created_at,
          updated_at
        FROM delivery_locations 
        ORDER BY name
      `);

      console.log(`✅ ${locations.length} lugares de entrega obtenidos`);

      res.json({
        success: true,
        data: locations
      });

    } catch (error) {
      console.error('❌ Error obteniendo lugares de entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Crear nuevo lugar de entrega
  createDeliveryLocation = async (req, res) => {
    try {
      const { name, address, description, is_active = true } = req.body;

      console.log('🔧 Creando lugar de entrega:', { name, address, description, is_active });

      // Validar datos requeridos
      if (!name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y dirección son requeridos'
        });
      }

      const result = await query(`
        INSERT INTO delivery_locations (name, address, description, is_active)
        VALUES (?, ?, ?, ?)
      `, [name, address, description || null, is_active ? 1 : 0]);

      console.log('✅ Lugar de entrega creado con ID:', result.insertId);

      res.status(201).json({
        success: true,
        message: 'Lugar de entrega creado exitosamente',
        data: {
          id: result.insertId,
          name,
          address,
          description,
          is_active: !!is_active
        }
      });

    } catch (error) {
      console.error('❌ Error creando lugar de entrega:', error);
      
      // Manejar error de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un lugar con ese nombre'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Actualizar lugar de entrega
  updateDeliveryLocation = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, description, is_active } = req.body;

      console.log('🔧 Actualizando lugar de entrega:', { id, name, address, description, is_active });

      // Validar datos requeridos
      if (!name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y dirección son requeridos'
        });
      }

      const result = await query(`
        UPDATE delivery_locations 
        SET name = ?, address = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, address, description || null, is_active ? 1 : 0, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lugar de entrega no encontrado'
        });
      }

      console.log('✅ Lugar de entrega actualizado');

      res.json({
        success: true,
        message: 'Lugar de entrega actualizado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error actualizando lugar de entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Eliminar lugar de entrega
  deleteDeliveryLocation = async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🗑️ Eliminando lugar de entrega:', id);

      // Verificar si hay horarios asociados
      const timeSlots = await query(`
        SELECT COUNT(*) as count FROM delivery_time_slots WHERE location_id = ?
      `, [id]);

      if (timeSlots[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el lugar porque tiene horarios asociados. Elimine primero los horarios.'
        });
      }

      const result = await query(`
        DELETE FROM delivery_locations WHERE id = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lugar de entrega no encontrado'
        });
      }

      console.log('✅ Lugar de entrega eliminado');

      res.json({
        success: true,
        message: 'Lugar de entrega eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando lugar de entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Cambiar estado de lugar de entrega
  toggleDeliveryLocationStatus = async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🔄 Cambiando estado de lugar de entrega:', id);

      const result = await query(`
        UPDATE delivery_locations 
        SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lugar de entrega no encontrado'
        });
      }

      // Obtener el nuevo estado
      const location = await query(`
        SELECT is_active FROM delivery_locations WHERE id = ?
      `, [id]);

      console.log('✅ Estado de lugar de entrega cambiado a:', location[0].is_active ? 'activo' : 'inactivo');

      res.json({
        success: true,
        message: `Lugar de entrega ${location[0].is_active ? 'activado' : 'desactivado'} exitosamente`,
        is_active: !!location[0].is_active
      });

    } catch (error) {
      console.error('❌ Error cambiando estado de lugar de entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // ===== HORARIOS DE DISPONIBILIDAD =====

  // Obtener todos los horarios
  getTimeSlots = async (req, res) => {
    try {
      console.log('🔍 Obteniendo horarios de disponibilidad...');
      
      const timeSlots = await query(`
        SELECT 
          ts.id,
          ts.location_id,
          ts.day_of_week,
          ts.time_slot,
          ts.is_active,
          ts.created_at,
          ts.updated_at,
          dl.name as location_name
        FROM delivery_time_slots ts
        LEFT JOIN delivery_locations dl ON ts.location_id = dl.id
        ORDER BY dl.name, ts.day_of_week, ts.time_slot
      `);

      console.log(`✅ ${timeSlots.length} horarios obtenidos`);

      res.json({
        success: true,
        data: timeSlots
      });

    } catch (error) {
      console.error('❌ Error obteniendo horarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Crear nuevo horario
  createTimeSlot = async (req, res) => {
    try {
      const { location_id, day_of_week, time_slot, is_active = true } = req.body;

      console.log('🔧 Creando horario:', { location_id, day_of_week, time_slot, is_active });

      // Validar datos requeridos
      if (!location_id || day_of_week === undefined || !time_slot) {
        return res.status(400).json({
          success: false,
          message: 'Lugar, día de la semana y horario son requeridos'
        });
      }

      // Validar que el lugar existe
      const location = await query(`
        SELECT id, name FROM delivery_locations WHERE id = ?
      `, [location_id]);

      if (location.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lugar de entrega no encontrado'
        });
      }

      // Validar día de la semana
      if (day_of_week < 0 || day_of_week > 6) {
        return res.status(400).json({
          success: false,
          message: 'Día de la semana debe estar entre 0 (Domingo) y 6 (Sábado)'
        });
      }

      const result = await query(`
        INSERT INTO delivery_time_slots (location_id, day_of_week, time_slot, is_active)
        VALUES (?, ?, ?, ?)
      `, [location_id, day_of_week, time_slot, is_active ? 1 : 0]);

      console.log('✅ Horario creado con ID:', result.insertId);

      res.status(201).json({
        success: true,
        message: 'Horario creado exitosamente',
        data: {
          id: result.insertId,
          location_id,
          day_of_week,
          time_slot,
          is_active: !!is_active,
          location_name: location[0].name
        }
      });

    } catch (error) {
      console.error('❌ Error creando horario:', error);
      
      // Manejar error de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un horario para ese lugar, día y hora'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Actualizar horario
  updateTimeSlot = async (req, res) => {
    try {
      const { id } = req.params;
      const { location_id, day_of_week, time_slot, is_active } = req.body;

      console.log('🔧 Actualizando horario:', { id, location_id, day_of_week, time_slot, is_active });

      // Validar datos requeridos
      if (!location_id || day_of_week === undefined || !time_slot) {
        return res.status(400).json({
          success: false,
          message: 'Lugar, día de la semana y horario son requeridos'
        });
      }

      // Validar que el lugar existe
      const location = await query(`
        SELECT id FROM delivery_locations WHERE id = ?
      `, [location_id]);

      if (location.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lugar de entrega no encontrado'
        });
      }

      // Validar día de la semana
      if (day_of_week < 0 || day_of_week > 6) {
        return res.status(400).json({
          success: false,
          message: 'Día de la semana debe estar entre 0 (Domingo) y 6 (Sábado)'
        });
      }

      const result = await query(`
        UPDATE delivery_time_slots 
        SET location_id = ?, day_of_week = ?, time_slot = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [location_id, day_of_week, time_slot, is_active ? 1 : 0, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado'
        });
      }

      console.log('✅ Horario actualizado');

      res.json({
        success: true,
        message: 'Horario actualizado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error actualizando horario:', error);
      
      // Manejar error de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un horario para ese lugar, día y hora'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Eliminar horario
  deleteTimeSlot = async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🗑️ Eliminando horario:', id);

      const result = await query(`
        DELETE FROM delivery_time_slots WHERE id = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado'
        });
      }

      console.log('✅ Horario eliminado');

      res.json({
        success: true,
        message: 'Horario eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error eliminando horario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Cambiar estado de horario
  toggleTimeSlotStatus = async (req, res) => {
    try {
      const { id } = req.params;

      console.log('🔄 Cambiando estado de horario:', id);

      const result = await query(`
        UPDATE delivery_time_slots 
        SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Horario no encontrado'
        });
      }

      // Obtener el nuevo estado
      const timeSlot = await query(`
        SELECT is_active FROM delivery_time_slots WHERE id = ?
      `, [id]);

      console.log('✅ Estado de horario cambiado a:', timeSlot[0].is_active ? 'activo' : 'inactivo');

      res.json({
        success: true,
        message: `Horario ${timeSlot[0].is_active ? 'activado' : 'desactivado'} exitosamente`,
        is_active: !!timeSlot[0].is_active
      });

    } catch (error) {
      console.error('❌ Error cambiando estado de horario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener horarios disponibles para un lugar específico
  getAvailableTimeSlots = async (req, res) => {
    try {
      const { locationId } = req.params;
      const { dayOfWeek } = req.query;

      console.log('🔍 Obteniendo horarios disponibles:', { locationId, dayOfWeek });

      let whereClause = 'WHERE ts.location_id = ? AND ts.is_active = 1';
      let queryParams = [locationId];

      if (dayOfWeek !== undefined) {
        whereClause += ' AND ts.day_of_week = ?';
        queryParams.push(parseInt(dayOfWeek));
      }

      const timeSlots = await query(`
        SELECT 
          ts.id,
          ts.day_of_week,
          ts.time_slot,
          dl.name as location_name
        FROM delivery_time_slots ts
        LEFT JOIN delivery_locations dl ON ts.location_id = dl.id
        ${whereClause}
        ORDER BY ts.day_of_week, ts.time_slot
      `, queryParams);

      console.log(`✅ ${timeSlots.length} horarios disponibles encontrados`);

      res.json({
        success: true,
        data: timeSlots
      });

    } catch (error) {
      console.error('❌ Error obteniendo horarios disponibles:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };
}

module.exports = new AvailabilityController();
