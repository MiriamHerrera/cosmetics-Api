const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar configuración de BD
const { testConnection } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const publicProductRoutes = require('./routes/publicProducts');
const productRoutes = require('./routes/products');
const reservationRoutes = require('./routes/reservations');
const surveyRoutes = require('./routes/surveys');
const enhancedSurveyRoutes = require('./routes/enhancedSurveys');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const unifiedCartRoutes = require('./routes/unifiedCart');

const app = express();
const PORT = process.env.PORT || 8000;

// Configuración de CORS - DEBE ir ANTES de cualquier otro middleware
const corsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // Agregar aquí tu dominio de frontend en producción
  process.env.CORS_ORIGIN || 'https://cosmetics-api-frontend-bwlv7q2z2-miriams-projects-0da082f5.vercel.app',
'https://cosmetics-api-frontend-bgnag6k78-miriams-projects-0da082f5.vercel.app',
'https://cosmetics-api-frontend-mcz1og9ph-miriams-projects-0da082f5.vercel.app',
'https://cosmetics-api-frontend-5n6jolzaa-miriams-projects-0da082f5.vercel.app'
].filter(Boolean); // Filtrar valores undefined/null</parameter>

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS bloqueado para origen:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Middleware adicional para CORS headers
app.use((req, res, next) => {
  // Log CORS requests for debugging
  if (req.method === 'OPTIONS') {
    console.log('CORS Preflight request received:', req.headers.origin);
  }
  
  // Ensure CORS headers are set
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Sending CORS preflight response');
    res.status(200).end();
    return;
  }
  
  next();
});

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000), // 1 minuto en desarrollo, 15 en producción
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // 1000 requests por minuto en desarrollo, 100 por 15 min en producción
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intente más tarde',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000)) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health check endpoint
  skip: (req) => req.path === '/api/health',
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded for ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Demasiadas solicitudes, intente más tarde',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000)) / 1000),
      limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000)
    });
  }
});

// Middleware de seguridad y optimización
app.use(helmet());
app.use(compression());
app.use(limiter);



// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Registrar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/public/products', publicProductRoutes);
app.use('/api/products', productRoutes);
app.use('/api/unified-cart', unifiedCartRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/enhanced-surveys', enhancedSurveyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

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
        cart: '/api/unified-cart',
        reservations: '/api/reservations',
        surveys: '/api/surveys',
        stats: '/api/stats',
        admin: '/api/admin',
        orders: '/api/orders',
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
      console.log(`🛒 Endpoint: /api/unified-cart`);
      console.log(`📅 Endpoint: /api/reservations`);
      console.log(`📊 Endpoint: /api/surveys`);
      console.log(`📈 Endpoint: /api/stats`);
      console.log(`👑 Endpoint: /api/admin`);
      
      // Log rate limiting configuration
      const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000);
      const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100);
      console.log(`🚦 Rate Limiting: ${rateLimitMax} requests per ${Math.ceil(rateLimitWindow / 1000)} seconds`);
    });

    // Configurar limpieza automática de carritos expirados cada hora
    console.log('⏰ Configurando limpieza automática de carritos expirados...');
    setInterval(async () => {
      try {
        // Usar el servicio de limpieza unificado
        const CartCleanupService = require('./services/cartCleanupService');
        await CartCleanupService.executeCleanup();
      } catch (error) {
        console.error('❌ Error en limpieza automática programada:', error);
      }
    }, 60 * 60 * 1000); // Cada hora (60 minutos * 60 segundos * 1000 ms)

    // Ejecutar limpieza inicial al iniciar el servidor
    console.log('🧹 Ejecutando limpieza inicial de carritos expirados...');
    try {
      const CartCleanupService = require('./services/cartCleanupService');
      await CartCleanupService.executeCleanup();
    } catch (error) {
      console.error('❌ Error en limpieza inicial:', error);
    }

    // Configurar limpieza automática de reservas expiradas cada 15 minutos
    console.log('⏰ Configurando limpieza automática de reservas expiradas...');
    const ReservationService = require('./services/reservationService');
    setInterval(async () => {
      try {
        await ReservationService.cleanupExpiredReservations();
      } catch (error) {
        console.error('❌ Error en limpieza automática de reservas:', error);
      }
    }, 15 * 60 * 1000); // Cada 15 minutos

    // Ejecutar limpieza inicial de reservas al iniciar el servidor
    console.log('🧹 Ejecutando limpieza inicial de reservas expiradas...');
    await ReservationService.cleanupExpiredReservations();

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Exportar la app para que server.js la use
module.exports = app; 