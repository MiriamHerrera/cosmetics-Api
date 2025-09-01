const { query } = require('../config/database');

class CartExpirationService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  /**
   * Iniciar el servicio de expiración automática
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ [CartExpiration] Servicio ya está ejecutándose');
      return;
    }

    console.log('🚀 [CartExpiration] Iniciando servicio de expiración automática...');
    
    // Ejecutar limpieza cada hora
    this.interval = setInterval(async () => {
      await this.cleanupExpiredCarts();
    }, 60 * 60 * 1000); // 1 hora en milisegundos

    // Ejecutar limpieza inmediatamente al iniciar
    this.cleanupExpiredCarts();
    
    this.isRunning = true;
    console.log('✅ [CartExpiration] Servicio iniciado - limpieza cada hora');
  }

  /**
   * Detener el servicio
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 [CartExpiration] Servicio detenido');
  }

  /**
   * Limpiar carritos expirados
   */
  async cleanupExpiredCarts() {
    try {
      console.log('🧹 [CartExpiration] Iniciando limpieza de carritos expirados...');
      
      // Obtener carritos expirados
      const expiredCarts = await query(`
        SELECT c.id, c.cart_type, c.user_id, c.session_id
        FROM carts_unified c 
        WHERE c.expires_at < NOW() AND c.status = 'active'
        ORDER BY c.expires_at ASC
      `);

      if (expiredCarts.length === 0) {
        console.log('ℹ️ [CartExpiration] No hay carritos expirados para limpiar');
        return;
      }

      console.log(`📦 [CartExpiration] Encontrados ${expiredCarts.length} carritos expirados`);

      let totalStockRestored = 0;
      let totalCartsCleaned = 0;

      for (const cart of expiredCarts) {
        try {
          // Obtener items del carrito antes de eliminarlos
          const cartItems = await query(
            'SELECT product_id, quantity FROM cart_items_unified WHERE cart_id = ?',
            [cart.id]
          );

          // Restaurar stock de cada producto
          for (const item of cartItems) {
            await query(
              'UPDATE products SET stock_total = stock_total + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );
            totalStockRestored += item.quantity;
            
            console.log(`🔄 [CartExpiration] Stock restaurado: +${item.quantity} para producto ${item.product_id}`);
          }

          // Eliminar items del carrito
          if (cartItems.length > 0) {
            await query('DELETE FROM cart_items_unified WHERE cart_id = ?', [cart.id]);
            console.log(`🗑️ [CartExpiration] ${cartItems.length} items eliminados del carrito ${cart.id}`);
          }

          // Marcar carrito como expirado
          await query(
            'UPDATE carts_unified SET status = "expired" WHERE id = ?',
            [cart.id]
          );

          totalCartsCleaned++;
          console.log(`✅ [CartExpiration] Carrito ${cart.id} marcado como expirado (tipo: ${cart.cart_type})`);

        } catch (cartError) {
          console.error(`❌ [CartExpiration] Error procesando carrito ${cart.id}:`, cartError);
        }
      }

      console.log(`🎯 [CartExpiration] Limpieza completada:`);
      console.log(`   - Carritos limpiados: ${totalCartsCleaned}`);
      console.log(`   - Stock restaurado: ${totalStockRestored} unidades`);
      console.log(`   - Hora del servidor: ${new Date().toISOString()}`);

    } catch (error) {
      console.error('❌ [CartExpiration] Error en limpieza automática:', error);
    }
  }

  /**
   * Obtener estadísticas de expiración
   */
  async getExpirationStats() {
    try {
      const stats = await query(`
        SELECT 
          cart_type,
          COUNT(*) as total_carts,
          SUM(CASE WHEN expires_at < NOW() THEN 1 ELSE 0 END) as expired_carts,
          SUM(CASE WHEN expires_at > NOW() AND expires_at < DATE_ADD(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 0 END) as expiring_soon
        FROM carts_unified 
        WHERE status = 'active'
        GROUP BY cart_type
      `);

      return stats;
    } catch (error) {
      console.error('❌ [CartExpiration] Error obteniendo estadísticas:', error);
      return [];
    }
  }

  /**
   * Verificar estado del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCleanup: this.lastCleanup,
      nextCleanup: this.isRunning ? new Date(Date.now() + 60 * 60 * 1000) : null
    };
  }
}

// Crear instancia singleton
const cartExpirationService = new CartExpirationService();

module.exports = cartExpirationService;
