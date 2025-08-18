const cron = require('node-cron');
const guestCartController = require('../controllers/guestCartController');

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

    // Programar limpieza cada 15 minutos
    this.cleanupJob = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('⏰ Ejecutando limpieza automática programada...');
        await this.executeCleanup();
      } catch (error) {
        console.error('❌ Error en limpieza automática programada:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/Mexico_City' // Ajustar a tu zona horaria
    });

    // Ejecutar limpieza inicial después de 1 minuto
    setTimeout(async () => {
      console.log('🔄 Ejecutando limpieza inicial...');
      await this.executeCleanup();
    }, 60000);

    this.isRunning = true;
    console.log('✅ Servicio de limpieza automática iniciado correctamente');
    console.log('📅 Programado para ejecutarse cada 15 minutos');
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
      console.log('🧹 Iniciando proceso de limpieza...');
      
      const startTime = Date.now();
      const result = await guestCartController.cleanupExpiredCarts();
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