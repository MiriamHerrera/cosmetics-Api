const { query, getConnection } = require('../config/database');
const whatsappConfig = require('../config/whatsapp');

class ReservationService {
  
  // Configuración de tiempos de reserva
  static RESERVATION_TIMES = {
    GUEST: 1 * 60 * 60 * 1000,        // 1 hora en milisegundos
    REGISTERED: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
    ADMIN_EXTENSION: 24 * 60 * 60 * 1000  // 24 horas adicionales (admin)
  };

  // Crear o actualizar reserva
  static async createOrUpdateReservation(userId, sessionId, productId, quantity, userType = 'guest') {
    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();

      // Calcular tiempo de expiración
      const expirationTime = new Date(Date.now() + this.RESERVATION_TIMES[userType.toUpperCase()]);
      
      // Verificar stock disponible
      const [product] = await connection.execute(
        'SELECT id, name, stock_total, price FROM products WHERE id = ? AND status = "active"',
        [productId]
      );

      if (!product) {
        throw new Error('Producto no encontrado');
      }

      if (product.stock_total < quantity) {
        throw new Error(`Stock insuficiente. Solo hay ${product.stock_total} unidades disponibles`);
      }

      // Buscar reserva existente
      let [existingReservation] = await connection.execute(
        `SELECT id, quantity, reserved_until FROM reservations 
         WHERE user_id = ? AND session_id = ? AND product_id = ? AND status = 'active'`,
        [userId, sessionId, productId]
      );

      if (existingReservation) {
        // Actualizar reserva existente
        const newQuantity = existingReservation.quantity + quantity;
        await connection.execute(
          'UPDATE reservations SET quantity = ?, reserved_until = ? WHERE id = ?',
          [newQuantity, expirationTime, existingReservation.id]
        );
      } else {
        // Crear nueva reserva
        await connection.execute(
          `INSERT INTO reservations (user_id, session_id, product_id, quantity, 
           reserved_until, user_type, status, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
          [userId, sessionId, productId, quantity, expirationTime, userType]
        );
      }

      // Reducir stock del producto
      await connection.execute(
        'UPDATE products SET stock_total = stock_total - ? WHERE id = ?',
        [quantity, productId]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Reserva creada/actualizada exitosamente',
        expirationTime: expirationTime,
        userType: userType
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Extender plazo de reserva (admin)
  static async extendReservation(reservationId, adminId, extensionHours = 24) {
    const connection = await getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar que la reserva existe y está activa
      const [reservation] = await connection.execute(
        'SELECT * FROM reservations WHERE id = ? AND status = "active"',
        [reservationId]
      );

      if (!reservation) {
        throw new Error('Reserva no encontrada o inactiva');
      }

      // Calcular nueva fecha de expiración
      const currentExpiration = new Date(reservation.reserved_until);
      const newExpiration = new Date(currentExpiration.getTime() + (extensionHours * 60 * 60 * 1000));

      // Actualizar fecha de expiración
      await connection.execute(
        'UPDATE reservations SET reserved_until = ?, updated_at = NOW() WHERE id = ?',
        [newExpiration, reservationId]
      );

      // Registrar extensión en historial
      await connection.execute(
        `INSERT INTO reservation_extensions (reservation_id, admin_id, 
         previous_expiration, new_expiration, extension_hours, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [reservationId, adminId, currentExpiration, newExpiration, extensionHours]
      );

      await connection.commit();

      return {
        success: true,
        message: `Reserva extendida por ${extensionHours} horas`,
        newExpiration: newExpiration,
        previousExpiration: currentExpiration
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Limpiar reservas expiradas
  static async cleanupExpiredReservations() {
    try {
      console.log('🧹 Iniciando limpieza de reservas expiradas...');

      // Buscar reservas expiradas
      const expiredReservations = await query(`
        SELECT 
          r.id,
          r.product_id,
          r.quantity,
          r.user_type,
          r.user_id,
          r.session_id,
          p.name as product_name,
          TIMESTAMPDIFF(MINUTE, r.reserved_until, NOW()) as minutes_expired
        FROM reservations r
        INNER JOIN products p ON r.product_id = p.id
        WHERE r.reserved_until < NOW() AND r.status = 'active'
      `);

      if (expiredReservations.length === 0) {
        console.log('✅ No hay reservas expiradas para limpiar');
        return { success: true, cleaned: 0, stockRestored: 0 };
      }

      console.log(`🔍 Encontradas ${expiredReservations.length} reservas expiradas`);

      let totalStockRestored = 0;
      let cleanedReservations = 0;

      // Procesar cada reserva expirada
      for (const reservation of expiredReservations) {
        try {
          // Restaurar stock
          await query(
            'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
            [reservation.quantity, reservation.product_id]
          );

          // Marcar reserva como expirada
          await query(
            'UPDATE reservations SET status = "expired", updated_at = NOW() WHERE id = ?',
            [reservation.id]
          );

          totalStockRestored += reservation.quantity;
          cleanedReservations++;

          console.log(`✅ Reserva expirada limpiada: ${reservation.quantity} unidades de "${reservation.product_name}" - Expiró hace ${reservation.minutes_expired} minutos`);

        } catch (error) {
          console.error(`❌ Error procesando reserva expirada ${reservation.id}:`, error);
        }
      }

      console.log(`🧹 Limpieza completada: ${cleanedReservations} reservas procesadas, ${totalStockRestored} stock restaurado`);

      return {
        success: true,
        message: 'Limpieza completada exitosamente',
        cleaned: cleanedReservations,
        stockRestored: totalStockRestored
      };

    } catch (error) {
      console.error('❌ Error en limpieza de reservas:', error);
      throw error;
    }
  }

  // Enviar recordatorio de WhatsApp
  static async sendWhatsAppReminder(reservationId) {
    try {
      // Obtener información de la reserva
      const [reservation] = await query(`
        SELECT r.*, p.name as product_name, p.price
        FROM reservations r
        INNER JOIN products p ON r.product_id = p.id
        WHERE r.id = ? AND r.status = 'active'
      `, [reservationId]);

      if (!reservation) {
        throw new Error('Reserva no encontrada');
      }

      // Calcular tiempo restante
      const now = new Date();
      const expiration = new Date(reservation.reserved_until);
      const timeRemaining = Math.ceil((expiration - now) / (1000 * 60 * 60)); // Horas restantes

      // Generar mensaje de recordatorio
      const reminderMessage = this.generateReminderMessage(reservation, timeRemaining);

      // Aquí se enviaría el mensaje por WhatsApp
      // Por ahora, solo retornamos el mensaje generado
      console.log('📱 Mensaje de recordatorio generado:', reminderMessage);

      return {
        success: true,
        message: 'Recordatorio enviado exitosamente',
        whatsappMessage: reminderMessage,
        timeRemaining: timeRemaining
      };

    } catch (error) {
      console.error('❌ Error enviando recordatorio:', error);
      throw error;
    }
  }

  // Generar mensaje de recordatorio
  static generateReminderMessage(reservation, timeRemaining) {
    const productName = reservation.product_name;
    const quantity = reservation.quantity;
    const price = reservation.price;
    const total = quantity * price;

    let timeText = '';
    if (timeRemaining > 24) {
      timeText = `${Math.ceil(timeRemaining / 24)} días`;
    } else if (timeRemaining > 0) {
      timeText = `${timeRemaining} horas`;
    } else {
      timeText = 'menos de 1 hora';
    }

    return `🛒 *RECORDATORIO DE RESERVA*

📦 *Producto:* ${productName}
🔢 *Cantidad:* ${quantity}
💰 *Precio unitario:* $${price}
💵 *Total:* $${total}

⏰ *Tu reserva expira en:* ${timeText}

🚨 *¡No pierdas tu reserva!*
Completa tu compra antes de que expire.

📱 *Contacto:* ${whatsappConfig.number}
🌐 *Sitio web:* ${whatsappConfig.websiteUrl}

_Recordatorio automático del sistema de reservas_`;
  }

  // Obtener estadísticas de reservas
  static async getReservationStats() {
    try {
      const [stats] = await query(`
        SELECT 
          COUNT(*) as total_reservations,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_reservations,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_reservations,
          SUM(CASE WHEN user_type = 'guest' THEN 1 ELSE 0 END) as guest_reservations,
          SUM(CASE WHEN user_type = 'registered' THEN 1 ELSE 0 END) as registered_reservations,
          SUM(CASE WHEN reserved_until < NOW() THEN 1 ELSE 0 END) as overdue_reservations
        FROM reservations
      `);

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

module.exports = ReservationService; 