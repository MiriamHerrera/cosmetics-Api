const ReservationService = require('../services/reservationService');
const { query } = require('../config/database');

class ReservationController {

  // Obtener todas las reservas (admin)
  getAllReservations = async (req, res) => {
    try {
      console.log('🔍 Obteniendo todas las reservas...');
      
      const { status, user_type, page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;

      // Construir consulta base
      let baseQuery = `
        SELECT 
          r.*,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.image_url as product_image,
          u.name as user_name,
          u.phone as user_phone,
          u.email as user_email,
          (p.price * r.quantity) as total_amount,
          TIMESTAMPDIFF(MINUTE, NOW(), r.reserved_until) as minutes_remaining,
          TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until) as hours_remaining,
          CASE 
            WHEN r.reserved_until < NOW() THEN 'expired'
            WHEN TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until) < 1 THEN 'critical'
            WHEN TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until) < 24 THEN 'warning'
            ELSE 'safe'
          END as expiration_status
        FROM reservations r
        INNER JOIN products p ON r.product_id = p.id
        INNER JOIN users u ON r.user_id = u.id
        WHERE 1=1
      `;

      const queryParams = [];

      // Aplicar filtros
      if (status) {
        baseQuery += ' AND r.status = ?';
        queryParams.push(status);
      }

      if (user_type) {
        baseQuery += ' AND r.user_type = ?';
        queryParams.push(user_type);
      }

      if (search) {
        baseQuery += ' AND (p.name LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)';
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Contar total de registros
      const countQuery = baseQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
      const [countResult] = await query(countQuery, queryParams);
      const total = countResult.total;

      // Aplicar paginación y ordenamiento
      baseQuery += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), offset);

      // Ejecutar consulta principal
      const reservations = await query(baseQuery, queryParams);

      console.log(`✅ ${reservations.length} reservas obtenidas de ${total} totales`);

      res.json({
        success: true,
        data: {
          reservations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo reservas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener reservas de un usuario específico
  getUserReservations = async (req, res) => {
    try {
      const { userId, sessionId } = req.params;
      const { status = 'active' } = req.query;

      console.log(`🔍 Obteniendo reservas para usuario: ${userId || sessionId}`);

      let queryParams = [];
      let whereClause = '';

      if (userId) {
        whereClause = 'r.user_id = ?';
        queryParams.push(userId);
      } else if (sessionId) {
        whereClause = 'r.session_id = ?';
        queryParams.push(sessionId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId o sessionId'
        });
      }

      if (status) {
        whereClause += ' AND r.status = ?';
        queryParams.push(status);
      }

      const reservations = await query(`
        SELECT 
          r.*,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.image_url as product_image,
          (p.price * r.quantity) as total_amount,
          TIMESTAMPDIFF(MINUTE, NOW(), r.reserved_until) as minutes_remaining,
          TIMESTAMPDIFF(HOUR, NOW(), r.reserved_until) as hours_remaining
        FROM reservations r
        INNER JOIN products p ON r.product_id = p.id
        WHERE ${whereClause}
        ORDER BY r.created_at DESC
      `, queryParams);

      console.log(`✅ ${reservations.length} reservas obtenidas para el usuario`);

      res.json({
        success: true,
        data: reservations
      });

    } catch (error) {
      console.error('❌ Error obteniendo reservas del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Crear nueva reserva
  createReservation = async (req, res) => {
    try {
      const { userId, sessionId, productId, quantity, userType = 'guest' } = req.body;

      console.log('➕ Creando nueva reserva:', { userId, sessionId, productId, quantity, userType });

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Producto ID y cantidad son requeridos'
        });
      }

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId o sessionId'
        });
      }

      // Usar userId como sessionId si es usuario registrado
      const finalSessionId = userId || sessionId;
      const finalUserId = userType === 'registered' ? userId : null;

      const result = await ReservationService.createOrUpdateReservation(
        finalUserId,
        finalSessionId,
        productId,
        quantity,
        userType
      );

      console.log('✅ Reserva creada exitosamente:', result);

      res.status(201).json({
        success: true,
        message: 'Reserva creada exitosamente',
        data: result
      });

    } catch (error) {
      console.error('❌ Error creando reserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Extender plazo de reserva (admin)
  extendReservation = async (req, res) => {
    try {
      const { reservationId } = req.params;
      const { extensionHours = 24, reason } = req.body;
      const adminId = req.user.id; // Del middleware de autenticación

      console.log(`⏰ Extendiendo reserva ${reservationId} por ${extensionHours} horas`);

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado'
        });
      }

      const result = await ReservationService.extendReservation(
        reservationId,
        adminId,
        extensionHours
      );

      console.log('✅ Reserva extendida exitosamente:', result);

      res.json({
        success: true,
        message: 'Reserva extendida exitosamente',
        data: result
      });

    } catch (error) {
      console.error('❌ Error extendiendo reserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Cancelar reserva
  cancelReservation = async (req, res) => {
    try {
      const { reservationId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id; // Puede ser admin o usuario

      console.log(`❌ Cancelando reserva ${reservationId}`);

      // Verificar que la reserva existe y pertenece al usuario
      const [reservation] = await query(`
        SELECT r.*, p.name as product_name
        FROM reservations r
        INNER JOIN products p ON r.product_id = p.id
        WHERE r.id = ? AND r.status = 'active'
      `, [reservationId]);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada o inactiva'
        });
      }

      // Verificar permisos (admin puede cancelar cualquier reserva, usuario solo las suyas)
      if (userId !== reservation.user_id && !req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cancelar esta reserva'
        });
      }

      // Restaurar stock del producto
      await query(
        'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
        [reservation.quantity, reservation.product_id]
      );

      // Marcar reserva como cancelada
      await query(
        'UPDATE reservations SET status = "cancelled", notes = ?, updated_at = NOW() WHERE id = ?',
        [reason || 'Cancelada por el usuario', reservationId]
      );

      console.log(`✅ Reserva ${reservationId} cancelada exitosamente`);

      res.json({
        success: true,
        message: 'Reserva cancelada exitosamente',
        data: {
          reservationId,
          stockRestored: reservation.quantity,
          productName: reservation.product_name
        }
      });

    } catch (error) {
      console.error('❌ Error cancelando reserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Completar reserva (convertir en pedido)
  completeReservation = async (req, res) => {
    try {
      const { reservationId } = req.params;
      const { orderId } = req.body;

      console.log(`✅ Completando reserva ${reservationId} con pedido ${orderId}`);

      // Verificar que la reserva existe y está activa
      const [reservation] = await query(`
        SELECT r.*, p.name as product_name
        FROM reservations r
        INNER JOIN products p ON r.product_id = p.id
        WHERE r.id = ? AND r.status = 'active'
      `, [reservationId]);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada o inactiva'
        });
      }

      // Marcar reserva como completada
      await query(
        'UPDATE reservations SET status = "completed", notes = ?, updated_at = NOW() WHERE id = ?',
        [`Completada - Pedido #${orderId}`, reservationId]
      );

      console.log(`✅ Reserva ${reservationId} marcada como completada`);

      res.json({
        success: true,
        message: 'Reserva completada exitosamente',
        data: {
          reservationId,
          orderId,
          productName: reservation.product_name
        }
      });

    } catch (error) {
      console.error('❌ Error completando reserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Enviar recordatorio de WhatsApp
  sendWhatsAppReminder = async (req, res) => {
    try {
      const { reservationId } = req.params;

      console.log(`📱 Enviando recordatorio WhatsApp para reserva ${reservationId}`);

      const result = await ReservationService.sendWhatsAppReminder(reservationId);

      console.log('✅ Recordatorio enviado exitosamente:', result);

      res.json({
        success: true,
        message: 'Recordatorio enviado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('❌ Error enviando recordatorio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener estadísticas de reservas
  getReservationStats = async (req, res) => {
    try {
      console.log('📊 Obteniendo estadísticas de reservas...');

      const stats = await ReservationService.getReservationStats();

      console.log('✅ Estadísticas obtenidas exitosamente');

      res.json({
        success: true,
        data: stats.data
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Limpiar reservas expiradas (admin)
  cleanupExpiredReservations = async (req, res) => {
    try {
      console.log('🧹 Iniciando limpieza manual de reservas expiradas...');

      const result = await ReservationService.cleanupExpiredReservations();

      console.log('✅ Limpieza completada:', result);

      res.json({
        success: true,
        message: 'Limpieza completada exitosamente',
        data: result
      });

    } catch (error) {
      console.error('❌ Error en limpieza manual:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // Obtener historial de extensiones de una reserva
  getReservationExtensions = async (req, res) => {
    try {
      const { reservationId } = req.params;

      console.log(`📋 Obteniendo historial de extensiones para reserva ${reservationId}`);

      const extensions = await query(`
        SELECT 
          re.*,
          u.name as admin_name,
          u.email as admin_email
        FROM reservation_extensions re
        INNER JOIN users u ON re.admin_id = u.id
        WHERE re.reservation_id = ?
        ORDER BY re.created_at DESC
      `, [reservationId]);

      console.log(`✅ ${extensions.length} extensiones obtenidas`);

      res.json({
        success: true,
        data: extensions
      });

    } catch (error) {
      console.error('❌ Error obteniendo extensiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };
}

module.exports = new ReservationController(); 