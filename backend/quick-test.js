const http = require('http');

console.log('🔍 Testing backend server connectivity...\n');

// Test 1: Basic connectivity
const testConnectivity = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Server is running!');
        console.log('📊 Status:', res.statusCode);
        console.log('📝 Response:', data);
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('❌ Server connection failed:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('⏰ Request timeout - server might be slow or not responding');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
};

// Test 2: CORS preflight
const testCORS = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path: '/api/admin/users',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      },
      timeout: 5000
    }, (res) => {
      console.log('\n🔒 CORS Preflight Test:');
      console.log('📊 Status:', res.statusCode);
      console.log('🌍 CORS Headers:');
      console.log('   Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
      console.log('   Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
      console.log('   Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
      
      if (res.headers['access-control-allow-origin']) {
        console.log('✅ CORS headers are present!');
      } else {
        console.log('❌ CORS headers are missing!');
      }
      resolve();
    });

    req.on('error', (err) => {
      console.log('❌ CORS test failed:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('⏰ CORS request timeout');
      req.destroy();
      reject(new Error('CORS Timeout'));
    });

    req.end();
  });
};

// Run tests
const runTests = async () => {
  try {
    await testConnectivity();
    await testCORS();
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.log('\n💥 Tests failed:', error.message);
    console.log('\n💡 Make sure your backend server is running with:');
    console.log('   cd backend && npm run dev');
  }
};

runTests(); 