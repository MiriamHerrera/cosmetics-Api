const fetch = require('node-fetch');

// Script para probar el endpoint de órdenes de invitados
async function testGuestOrder() {
  const testData = {
    sessionId: 'guest_test_123456789',
    customerName: 'Cliente Prueba',
    customerPhone: '8123456789',
    customerEmail: 'test@example.com',
    deliveryLocationId: 1,
    deliveryDate: '2025-01-21', // Fecha futura
    deliveryTime: '14:00:00',
    deliveryAddress: 'Dirección de prueba',
    totalAmount: 100.00,
    cartItems: [
      {
        productId: 1,
        quantity: 2,
        price: 50.00
      }
    ],
    notes: 'Orden de prueba'
  };

  try {
    console.log('🧪 Probando endpoint de órdenes de invitados...');
    console.log('📤 Datos enviados:', JSON.stringify(testData, null, 2));

    const response = await fetch('https://api.jeniricosmetics.com/api/orders/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);

    const result = await response.json();
    console.log('📋 Respuesta:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Prueba exitosa');
    } else {
      console.log('❌ Prueba falló');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testGuestOrder();
