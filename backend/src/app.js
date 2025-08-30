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

// Configuración de CORS
const corsOrigins = [
  process.env.CORS_ORIGIN || 'https://jeniricosmetics.com',
  'https://www.jeniricosmetics.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Permitir cualquier subdominio de Vercel, dominio personalizado y desarrollo
    if (origin.includes('vercel.app') || 
        origin.includes('jeniricosmetics.com') ||
        origin.includes('localhost') || 
        origin.includes('127.0.0.1')) {
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

// Logging detallado para debugging de rutas
console.log('🔍 REGISTRANDO RUTAS DE LA API...');

// Registrar rutas de la API
console.log('📡 Registrando /api/init...');
app.use('/api/init', require('./routes/init'));

console.log('📡 Registrando /api/auth...');
app.use('/api/auth', authRoutes);

console.log('📡 Registrando /api/public/products...');
app.use('/api/public/products', publicProductRoutes);

console.log('📡 Registrando /api/products...');
app.use('/api/products', productRoutes);

console.log('📡 Registrando /api/unified-cart...');
app.use('/api/unified-cart', unifiedCartRoutes);

console.log('📡 Registrando /api/reservations...');
app.use('/api/reservations', reservationRoutes);

console.log('📡 Registrando /api/surveys...');
app.use('/api/surveys', surveyRoutes);

console.log('📡 Registrando /api/enhanced-surveys...');
app.use('/api/enhanced-surveys', enhancedSurveyRoutes);

console.log('📡 Registrando /api/stats...');
app.use('/api/stats', statsRoutes);

console.log('📡 Registrando /api/admin...');
app.use('/api/admin', adminRoutes);

console.log('📡 Registrando /api/orders...');
app.use('/api/orders', orderRoutes);

console.log('📡 Registrando /api/reports...');
app.use('/api/reports', reportRoutes);

console.log('✅ TODAS LAS RUTAS REGISTRADAS');

// Middleware de debug para capturar todas las solicitudes (después de las rutas específicas)

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

// Endpoint de debug para diagnosticar problemas de rutas
app.get('/api/debug/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Debug de rutas',
    timestamp: new Date().toISOString(),
    registeredRoutes: [
      '/api/init',
      '/api/auth',
      '/api/public/products',
      '/api/products',
      '/api/unified-cart',
      '/api/reservations',
      '/api/surveys',
      '/api/enhanced-surveys',
      '/api/stats',
      '/api/admin',
      '/api/orders',
      '/api/reports',
      '/api/health'
    ],
    requestInfo: {
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      headers: req.headers
    }
  });
});

// Endpoint de debug para probar middleware
app.use('/api/debug/middleware', (req, res, next) => {
  console.log('🔍 DEBUG MIDDLEWARE:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl
  });
  
  res.json({
    success: true,
    message: 'Middleware funcionando',
    requestInfo: {
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl
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

// Middleware de debug para capturar todas las solicitudes (después de las rutas específicas)
app.use('*', (req, res, next) => {
  console.log('🔍 DEBUG - RUTA NO ENCONTRADA:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    timestamp: new Date().toISOString()
  });
  
  // Solo continuar si es una ruta de debug
  if (req.path.startsWith('/api/debug')) {
    return next();
  }
  
  // Para todas las demás rutas, continuar al siguiente middleware
  next();
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