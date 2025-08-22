const fetch = require('node-fetch');

async function testCreateOption() {
  try {
    console.log('🧪 Probando creación de opción...');
    
    const response = await fetch('http://localhost:8000/api/enhanced-surveys/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        survey_id: 9,
        option_text: 'Opción de prueba desde script',
        description: 'Esta es una opción de prueba creada desde el script'
      }),
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta exitosa:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ Error:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Error de conexión:', error.message);
  }
}

testCreateOption(); 