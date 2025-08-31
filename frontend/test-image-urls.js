// Script para probar la función getImageUrl
const { getImageUrl } = require('./src/lib/config.ts');

// Simular diferentes escenarios de URLs
const testCases = [
  // Caso 1: Ruta relativa /uploads (caso principal)
  {
    input: '/uploads/products/images-1756665882572-505102398.jpeg',
    expected: 'https://api.jeniricosmetics.com/uploads/products/images-1756665882572-505102398.jpeg',
    description: 'Ruta relativa /uploads para Railway'
  },
  
  // Caso 2: URL absoluta existente
  {
    input: 'https://api.jeniricosmetics.com/api/uploads/products/images-1756665882572-505102398.jpeg',
    expected: 'https://api.jeniricosmetics.com/api/uploads/products/images-1756665882572-505102398.jpeg',
    description: 'URL absoluta existente'
  },
  
  // Caso 3: Sin imagen
  {
    input: null,
    expected: '/NoImage.jpg',
    description: 'Sin imagen (null)'
  },
  
  // Caso 4: String vacío
  {
    input: '',
    expected: '/NoImage.jpg',
    description: 'String vacío'
  },
  
  // Caso 5: Ruta relativa genérica
  {
    input: '/some/other/path.jpg',
    expected: '/some/other/path.jpg',
    description: 'Ruta relativa genérica'
  }
];

console.log('🧪 TESTING getImageUrl FUNCTION\n');

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test Case ${index + 1}: ${testCase.description}`);
  console.log(`   Input: ${testCase.input}`);
  console.log(`   Expected: ${testCase.expected}`);
  
  try {
    const result = getImageUrl(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`   Result: ${result}`);
    console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!passed) {
      console.log(`   ❌ Expected: ${testCase.expected}`);
      console.log(`   ❌ Got: ${result}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
});

console.log('\n🎯 TESTING COMPLETED');
