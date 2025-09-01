const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://api.jeniricosmetics.com/api';
const TEST_ENDPOINTS = [
  '/unified-cart/test',
  '/unified-cart/get',
  '/unified-cart/add-item'
];

// Datos de prueba
const testData = {
  guest: {
    sessionId: 'guest_test_' + Date.now(),
    productId: 1,
    quantity: 1
  },
  user: {
    userId: 3, // Usuario de prueba
    productId: 1,
    quantity: 1
  }
};

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    console.log(`\n🧪 [Test] Probando ${method} ${endpoint}`);
    
    const config = {
      method: method.toLowerCase(),
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    console.log('📝 [Test] Configuración:', {
      url: config.url,
      method: config.method,
      data: config.data
    });
    
    const response = await axios(config);
    
    console.log('✅ [Test] Respuesta exitosa:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    return { success: true, response };
    
  } catch (error) {
    console.log('❌ [Test] Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.response) {
      console.log('📊 [Test] Detalles del error:', {
        headers: error.response.headers,
        config: error.response.config
      });
    }
    
    return { success: false, error };
  }
}

async function runTests() {
  console.log('🚀 [Test] Iniciando pruebas del API del carrito unificado...');
  console.log('🌐 [Test] URL base:', API_BASE_URL);
  
  try {
    // 1. Probar endpoint de test
    console.log('\n📋 [Test] ===== PRUEBA 1: Endpoint de test =====');
    await testEndpoint('/unified-cart/test');
    
    // 2. Probar get cart como invitado
    console.log('\n📋 [Test] ===== PRUEBA 2: Get cart como invitado =====');
    await testEndpoint('/unified-cart/get', 'POST', {
      sessionId: testData.guest.sessionId
    });
    
    // 3. Probar get cart como usuario
    console.log('\n📋 [Test] ===== PRUEBA 3: Get cart como usuario =====');
    await testEndpoint('/unified-cart/get', 'POST', {
      userId: testData.user.userId
    });
    
    // 4. Probar add item como invitado
    console.log('\n📋 [Test] ===== PRUEBA 4: Add item como invitado =====');
    await testEndpoint('/unified-cart/add-item', 'POST', {
      sessionId: testData.guest.sessionId,
      productId: testData.guest.productId,
      quantity: testData.guest.quantity
    });
    
    // 5. Probar add item como usuario
    console.log('\n📋 [Test] ===== PRUEBA 5: Add item como usuario =====');
    await testEndpoint('/unified-cart/add-item', 'POST', {
      userId: testData.user.userId,
      productId: testData.user.productId,
      quantity: testData.user.quantity
    });
    
    console.log('\n🎉 [Test] Todas las pruebas completadas');
    
  } catch (error) {
    console.error('\n💥 [Test] Error fatal durante las pruebas:', error);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ [Test] Script de prueba completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 [Test] Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testEndpoint };
