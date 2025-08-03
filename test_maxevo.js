#!/usr/bin/env node

// Test script for MaxEvo API
const http = require('http');

const testData = JSON.stringify({
  chatId: "test123",
  message: "Hello MaxEvo. What can you do?"
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testData)
  }
};

console.log('🧪 Testing MaxEvo API...');
console.log('Sending:', testData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n📋 Response:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.response && response.agent) {
        console.log('\n✅ SUCCESS: Real AI response detected!');
        console.log(`Agent: ${response.agent}`);
        console.log(`Response: ${response.response.substring(0, 100)}...`);
      } else {
        console.log('\n❌ FAILED: Not a real AI response');
      }
    } catch (error) {
      console.log('❌ Failed to parse JSON response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(testData);
req.end();