const controller = require('./src/controllers/unifiedCartController');

// Simular request y response
const mockRequest = {
  body: {
    sessionId: 'guest_test_' + Date.now(),
    productId: 1,
    quantity: 1
  },
  headers: {
    'content-type': 'application/json'
  }
};

const mockResponse = {
  status: function(code) {
    console.log(`📊 [Mock] Status code: ${code}`);
    return this;
  },
  json: function(data) {
    console.log(`📊 [Mock] Response data:`, data);
    return this;
  }
};

async function testController() {
  console.log('🧪 [Test] Probando controlador del carrito unificado...');
  
  try {
    // 1. Probar método test
    console.log('\n📋 [Test] ===== PRUEBA 1: Método test =====');
    await controller.test(mockRequest, mockResponse);
    
    // 2. Probar método getCart
    console.log('\n📋 [Test] ===== PRUEBA 2: Método getCart =====');
    const getCartRequest = {
      body: {
        sessionId: 'guest_test_' + Date.now()
      }
    };
    await controller.getCart(getCartRequest, mockResponse);
    
    // 3. Probar método addItem
    console.log('\n📋 [Test] ===== PRUEBA 3: Método addItem =====');
    const addItemRequest = {
      body: {
        sessionId: 'guest_test_' + Date.now(),
        productId: 1,
        quantity: 1
      }
    };
    await controller.addItem(addItemRequest, mockResponse);
    
    console.log('\n✅ [Test] Todas las pruebas del controlador completadas');
    
  } catch (error) {
    console.error('\n❌ [Test] Error durante las pruebas:', error);
    console.error('❌ [Test] Stack trace:', error.stack);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testController()
    .then(() => {
      console.log('\n✅ [Test] Script de prueba completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 [Test] Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testController };
