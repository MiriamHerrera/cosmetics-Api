const http = require('http');
const app = require('./src/app');
const { initializeSocket } = require('./src/socket');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 8000;

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar WebSocket
const io = initializeSocket(server);

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. Verifique la configuración.');
      process.exit(1);
    }

    // Iniciar servidor
    server.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📱 API disponible en: http://localhost:${PORT}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 WebSocket activo en: ws://localhost:${PORT}`);
      console.log(`🛒 Endpoint: /api/cart`);
      console.log(`📅 Endpoint: /api/reservations`);
      console.log(`📊 Endpoint: /api/surveys`);
      console.log(`📈 Endpoint: /api/stats`);
      console.log(`👑 Endpoint: /api/admin`);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 Señal SIGTERM recibida, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Señal SIGINT recibida, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Iniciar servidor
startServer(); 