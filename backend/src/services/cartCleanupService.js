const cron = require('node-cron');
const { query } = require('../config/database');

class CartCleanupService {
  constructor() {
    this.isRunning = false;
    this.cleanupJob = null;
  }

  // Iniciar el servicio de limpieza automática
  start() {
    if (this.isRunning) {
      console.log('⚠️ Servicio de limpieza ya está ejecutándose');
      return;
    }

    console.log('🚀 Iniciando servicio de limpieza automática de carritos...');

    // Programar limpieza cada 1 minuto (para testing rápido)
    this.cleanupJob = cron.schedule('* * * * *', async () => {
      try {
        console.log('⏰ Ejecutando limpieza automática programada (cada minuto)...');
        await this.executeCleanup();
      } catch (error) {
        console.error('❌ Error en limpieza automática programada:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/Mexico_City' // Ajustar a tu zona horaria
    });

    // Ejecutar limpieza inicial después de 10 segundos
    setTimeout(async () => {
      console.log('🔄 Ejecutando limpieza inicial...');
      await this.executeCleanup();
    }, 10000);

    this.isRunning = true;
    console.log('✅ Servicio de limpieza automática iniciado correctamente');
    console.log('📅 Programado para ejecutarse cada 1 minuto (testing rápido)');
  }

  // Detener el servicio de limpieza
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Servicio de limpieza no está ejecutándose');
      return;
    }

    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob = null;
    }

    this.isRunning = false;
    console.log('🛑 Servicio de limpieza automática detenido');
  }

  // Ejecutar limpieza manual
  async executeCleanup() {
    try {
      console.log('🧹 Iniciando proceso de limpieza de carritos unificados...');
      
      const startTime = Date.now();
      
      // Limpiar carritos expirados del sistema unificado
      const result = await this.cleanupExpiredUnifiedCarts();
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (result.success) {
        console.log(`✅ Limpieza completada en ${duration}ms`);
        console.log(`📊 Resultados: ${result.cleaned} items limpiados, ${result.stockRestored} stock restaurado`);
        
        if (result.deletedItems > 0 || result.deletedCarts > 0) {
          console.log(`🗑️ Eliminados: ${result.deletedItems} items, ${result.deletedCarts} carritos`);
        }
      } else {
        console.error('❌ Error en limpieza:', result.message);
      }

      return result;
    } catch (error) {
      console.error('❌ Error ejecutando limpieza:', error);
      return {
        success: false,
        message: 'Error ejecutando limpieza',
        error: error.message
      };
    }
  }

  // Limpiar carritos expirados del sistema unificado
  async cleanupExpiredUnifiedCarts() {
    try {
      console.log('🔍 Buscando carritos expirados...');
      
      // Buscar carritos expirados
      const expiredCarts = await query(`
        SELECT id, cart_type FROM carts_unified 
        WHERE expires_at < NOW() AND status = 'active'
      `);
      
      if (expiredCarts.length === 0) {
        console.log('✅ No hay carritos expirados para limpiar');
        return {
          success: true,
          cleaned: 0,
          stockRestored: 0,
          deletedItems: 0,
          deletedCarts: 0
        };
      }

      console.log(`📦 Encontrados ${expiredCarts.length} carritos expirados`);
      
      let totalItemsDeleted = 0;
      let totalStockRestored = 0;
      let totalCartsDeleted = 0;

      for (const cart of expiredCarts) {
        // Obtener items del carrito
        const cartItems = await query(`
          SELECT ci.product_id, ci.quantity 
          FROM cart_items_unified ci 
          WHERE ci.cart_id = ?
        `, [cart.id]);

        // Restaurar stock
        for (const item of cartItems) {
          await query(`
            UPDATE products 
            SET stock_total = stock_total + ? 
            WHERE id = ?
          `, [item.quantity, item.product_id]);
          totalStockRestored += item.quantity;
          console.log(`🔄 [CleanupService] Stock restaurado: +${item.quantity} para producto ${item.product_id}`);
        }

        // Eliminar items del carrito
        await query(`
          DELETE FROM cart_items_unified 
          WHERE cart_id = ?
        `, [cart.id]);
        totalItemsDeleted += cartItems.length;

        // Marcar carrito como expirado
        await query(`
          UPDATE carts_unified 
          SET status = 'expired' 
          WHERE id = ?
        `, [cart.id]);
        totalCartsDeleted++;
      }

      console.log(`✅ Limpieza completada: ${totalItemsDeleted} items, ${totalStockRestored} stock, ${totalCartsDeleted} carritos`);

      return {
        success: true,
        cleaned: totalItemsDeleted,
        stockRestored: totalStockRestored,
        deletedItems: totalItemsDeleted,
        deletedCarts: totalCartsDeleted
      };

    } catch (error) {
      console.error('❌ Error limpiando carritos unificados:', error);
      return {
        success: false,
        message: 'Error limpiando carritos unificados',
        error: error.message
      };
    }
  }

  // Obtener estado del servicio
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cleanupJob ? this.cleanupJob.nextDate().toISOString() : null,
      lastRun: this.lastRunTime || null
    };
  }

  // Ejecutar limpieza inmediata (para testing)
  async forceCleanup() {
    console.log('🔧 Ejecutando limpieza forzada...');
    this.lastRunTime = new Date();
    return await this.executeCleanup();
  }
}

// Crear instancia singleton
const cartCleanupService = new CartCleanupService();

module.exports = cartCleanupService; 