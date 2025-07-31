#!/usr/bin/env node

/**
 * MaxEvo Production Startup Script for DigitalOcean App Platform
 * Avoids nginx proxy issues and ensures proper port configuration
 */

const path = require('path');
const fs = require('fs');

// Ensure we're in the correct directory
process.chdir(path.join(__dirname, 'api'));

// Set production environment
process.env.NODE_ENV = 'production';

// Force port configuration for DigitalOcean App Platform
process.env.PORT = process.env.PORT || '8080';
process.env.HOST = '0.0.0.0';

// Enhanced logging for deployment debugging
console.log('🚀 MaxEvo Production Startup');
console.log('📍 Working Directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🔌 Port:', process.env.PORT);
console.log('🏠 Host:', process.env.HOST);
console.log('📦 Node Version:', process.version);

// Verify critical files exist
const criticalFiles = [
  'server/index.js',
  'package.json'
];

for (const file of criticalFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Critical file missing: ${file}`);
    process.exit(1);
  }
}

console.log('✅ All critical files present');

// Import and start the server
try {
  console.log('🔥 Starting MaxEvo AI Operating System...');
  require('./server/index.js');
} catch (error) {
  console.error('💥 Fatal startup error:', error);
  process.exit(1);
}