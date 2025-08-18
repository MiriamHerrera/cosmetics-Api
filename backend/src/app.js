const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuración de BD
const { testConnection } = require('./config/database');

// Importar controlador de carrito invitado para limpieza automática
const guestCartController = require('./controllers/guestCartController');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const guestCartRoutes = require('./routes/guest-cart');
const reservationRoutes = require('./routes/reservations');
const surveyRoutes = require('./routes/surveys');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 8000;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de seguridad y optimización
app.use(helmet());
app.use(compression());
app.use(limiter);

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/guest-cart', guestCartRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cosmetics API Backend',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      reservations: '/api/reservations',
      surveys: '/api/surveys',
      stats: '/api/stats',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

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
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📱 API disponible en: http://localhost:${PORT}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🛒 Endpoint: /api/cart`);
      console.log(`📅 Endpoint: /api/reservations`);
      console.log(`📊 Endpoint: /api/surveys`);
      console.log(`📈 Endpoint: /api/stats`);
      console.log(`👑 Endpoint: /api/admin`);
    });

    // Configurar limpieza automática de carritos expirados cada hora
    console.log('⏰ Configurando limpieza automática de carritos expirados...');
    setInterval(async () => {
      try {
        await guestCartController.cleanupExpiredCarts();
      } catch (error) {
        console.error('❌ Error en limpieza automática programada:', error);
      }
    }, 60 * 60 * 1000); // Cada hora (60 minutos * 60 segundos * 1000 ms)

    // Ejecutar limpieza inicial al iniciar el servidor
    console.log('🧹 Ejecutando limpieza inicial de carritos expirados...');
    await guestCartController.cleanupExpiredCarts();

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Exportar la app para que server.js la use
module.exports = app; 