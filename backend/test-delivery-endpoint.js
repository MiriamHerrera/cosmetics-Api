// Script para probar el endpoint de horarios de delivery
const express = require('express');
const request = require('http');

// Función para hacer request HTTP
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = request.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testDeliveryEndpoints() {
  console.log('🧪 Testing Delivery Endpoints...\n');
  
  const baseUrl = 'http://localhost:8000'; // Ajusta el puerto si es necesario
  
  try {
    // Test 1: Obtener ubicaciones de entrega
    console.log('📍 Test 1: Getting delivery locations...');
    const locationsOptions = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/orders/delivery-locations',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const locationsResponse = await makeRequest(locationsOptions);
    console.log(`Status: ${locationsResponse.statusCode}`);
    console.log('Response:', JSON.stringify(locationsResponse.data, null, 2));
    
    if (locationsResponse.statusCode === 200 && locationsResponse.data.success) {
      const locations = locationsResponse.data.data;
      console.log(`✅ Found ${locations.length} locations`);
      
      // Test 2: Probar horarios para cada ubicación
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 1); // Mañana
      const dateStr = testDate.toISOString().split('T')[0];
      const dayOfWeek = testDate.getDay();
      
      console.log(`\n⏰ Test 2: Getting delivery times for date ${dateStr} (day ${dayOfWeek})`);
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Solo días laborables
        for (const location of locations) {
          console.log(`\n🔍 Testing location ${location.id}: ${location.name}`);
          
          const timesOptions = {
            hostname: 'localhost',
            port: 8000,
            path: `/api/orders/delivery-times?locationId=${location.id}&date=${dateStr}`,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          };
          
          const timesResponse = await makeRequest(timesOptions);
          console.log(`Status: ${timesResponse.statusCode}`);
          
          if (timesResponse.statusCode === 200) {
            const times = timesResponse.data.data;
            console.log(`✅ Found ${times.length} time slots:`);
            times.forEach(time => {
              console.log(`  - ${time.display_time} (${time.time_slot})`);
            });
          } else {
            console.log('❌ Error:', timesResponse.data);
          }
        }
      } else {
        console.log('⚠️ Tomorrow is weekend, testing with Monday instead...');
        const monday = new Date();
        monday.setDate(monday.getDate() + (1 + 7 - monday.getDay()) % 7); // Next Monday
        const mondayStr = monday.toISOString().split('T')[0];
        
        console.log(`Testing with Monday: ${mondayStr}`);
        
        const location = locations[0];
        const timesOptions = {
          hostname: 'localhost',
          port: 8000,
          path: `/api/orders/delivery-times?locationId=${location.id}&date=${mondayStr}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        };
        
        const timesResponse = await makeRequest(timesOptions);
        console.log(`Status: ${timesResponse.statusCode}`);
        
        if (timesResponse.statusCode === 200) {
          const times = timesResponse.data.data;
          console.log(`✅ Found ${times.length} time slots for Monday:`);
          times.forEach(time => {
            console.log(`  - ${time.display_time} (${time.time_slot})`);
          });
        } else {
          console.log('❌ Error:', timesResponse.data);
        }
      }
      
    } else {
      console.log('❌ Failed to get locations:', locationsResponse.data);
    }
    
    // Test 3: Probar con parámetros inválidos
    console.log('\n🚫 Test 3: Testing with invalid parameters...');
    
    const invalidOptions = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/orders/delivery-times?locationId=999&date=invalid-date',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const invalidResponse = await makeRequest(invalidOptions);
    console.log(`Status: ${invalidResponse.statusCode}`);
    console.log('Response:', JSON.stringify(invalidResponse.data, null, 2));
    
    if (invalidResponse.statusCode === 400) {
      console.log('✅ Correctly handled invalid parameters');
    } else {
      console.log('⚠️ Unexpected response for invalid parameters');
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error);
  }
}

// Ejecutar las pruebas
console.log('🚀 Starting delivery endpoint tests...');
console.log('Make sure your server is running on http://localhost:8000\n');

testDeliveryEndpoints().then(() => {
  console.log('\n✅ Tests completed');
  
  console.log('\n📋 Summary of expected behavior:');
  console.log('1. GET /api/orders/delivery-locations should return 4 locations');
  console.log('2. GET /api/orders/delivery-times should return specific time slots');
  console.log('3. Time slots should be formatted as both HH:MM and 12-hour format');
  console.log('4. Should only return times for weekdays (Monday-Friday)');
  console.log('5. Each location should have different time slots as specified');
  
  console.log('\n🎯 Expected time slots per location:');
  console.log('Location 1: 9:30 AM (all days), 10:20 AM (Tue-Thu)');
  console.log('Location 2: 10:15 AM (all days), 11:00 AM (Tue-Thu)');
  console.log('Location 3: 8:00 AM, 9:00 AM (all days)');
  console.log('Location 4: 6:30 PM, 7:00 PM (all days)');
  
}).catch(error => {
  console.error('❌ Tests failed:', error);
});
