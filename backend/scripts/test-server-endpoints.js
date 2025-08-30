const axios = require('axios');

// Configuración
const BASE_URL = 'https://api.jeniricosmetics.com';
const ENDPOINTS = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/products',
  '/api/public/products',
  '/api/unified-cart',
  '/api/reservations',
  '/api/surveys',
  '/api/stats',
  '/api/admin'
];

async function testEndpoints() {
  console.log('🔍 PROBANDO ENDPOINTS DEL SERVIDOR...');
  console.log('=====================================');
  console.log(`🌐 URL Base: ${BASE_URL}`);
  console.log('');
  
  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`📡 Probando: ${endpoint}`);
      
      let response;
      if (endpoint === '/api/auth/login') {
        // Probar POST para login
        response = await axios.post(`${BASE_URL}${endpoint}`, {
          phone: '8124307494',
          password: 'test123'
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else if (endpoint === '/api/auth/register') {
        // Probar POST para register
        response = await axios.post(`${BASE_URL}${endpoint}`, {
          name: 'Test User',
          phone: '1234567890',
          password: 'test123'
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Probar GET para otros endpoints
        response = await axios.get(`${BASE_URL}${endpoint}`, {
          timeout: 10000
        });
      }
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      if (response.data && response.data.success !== undefined) {
        console.log(`   Success: ${response.data.success}`);
        if (response.data.message) {
          console.log(`   Message: ${response.data.message}`);
        }
      }
      
    } catch (error) {
      if (error.response) {
        // El servidor respondió con un código de estado de error
        console.log(`❌ ${endpoint} - Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data.message || error.response.statusText}`);
        
        if (error.response.status === 404) {
          console.log(`   🔍 Este endpoint no está disponible en el servidor`);
        } else if (error.response.status === 500) {
          console.log(`   🔧 Error interno del servidor`);
        }
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        console.log(`❌ ${endpoint} - Sin respuesta del servidor`);
        console.log(`   Error: ${error.message}`);
      } else {
        // Algo más causó el error
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
    
    console.log(''); // Línea en blanco para separar resultados
  }
  
  console.log('=====================================');
  console.log('✅ PRUEBA DE ENDPOINTS COMPLETADA');
}

// Función para probar específicamente el endpoint de login
async function testLoginEndpoint() {
  console.log('🔐 PROBANDO ESPECÍFICAMENTE EL ENDPOINT DE LOGIN...');
  console.log('==================================================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      phone: '8124307494',
      password: 'test123'
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      }
    });
    
    console.log('✅ Login endpoint responde correctamente');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Message: ${response.data.message}`);
    
  } catch (error) {
    console.log('❌ Login endpoint no responde correctamente');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
      
      if (error.response.status === 404) {
        console.log('   🔍 PROBLEMA: Endpoint no encontrado');
        console.log('   💡 Posibles causas:');
        console.log('      - El servidor no está ejecutando la versión correcta del código');
        console.log('      - Las rutas no están configuradas correctamente');
        console.log('      - El servidor necesita reiniciarse');
      } else if (error.response.status === 500) {
        console.log('   🔧 PROBLEMA: Error interno del servidor');
        console.log('   💡 Posibles causas:');
        console.log('      - Error en el controlador de autenticación');
        console.log('      - Problema con la base de datos');
        console.log('      - Error en el middleware de validación');
      }
    } else if (error.request) {
      console.log('   ❌ PROBLEMA: Sin respuesta del servidor');
      console.log('   💡 Posibles causas:');
      console.log('      - El servidor no está ejecutándose');
      console.log('      - Problema de conectividad');
      console.log('      - Firewall bloqueando la conexión');
    } else {
      console.log('   ❌ PROBLEMA: Error en la petición');
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('==================================================');
}

// Ejecutar las pruebas
async function runTests() {
  try {
    await testEndpoints();
    console.log('');
    await testLoginEndpoint();
  } catch (error) {
    console.error('❌ Error ejecutando las pruebas:', error.message);
  }
}

runTests();
