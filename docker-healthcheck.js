#!/usr/bin/env node

/**
 * MaxEvo Health Check Script
 * Comprehensive health check for DigitalOcean App Platform deployment
 * Tests all critical MaxEvo components and dependencies
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Health check configuration
const HEALTH_CONFIG = {
  port: process.env.PORT || 8080,
  host: process.env.HOST || '0.0.0.0',
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 2000
};

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  HTTP_SERVER_FAILED: 1,
  MAXEVO_CORE_FAILED: 2,
  DATABASE_FAILED: 3,
  MEMORY_EXHAUSTED: 4,
  DEPENDENCY_FAILED: 5,
  TIMEOUT: 6
};

/**
 * Log with timestamp
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Check if HTTP server is responding
 */
async function checkHttpServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HEALTH_CONFIG.host === '0.0.0.0' ? 'localhost' : HEALTH_CONFIG.host,
      port: HEALTH_CONFIG.port,
      path: '/health',
      method: 'GET',
      timeout: HEALTH_CONFIG.timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('info', 'HTTP server health check passed', { statusCode: res.statusCode });
          resolve(true);
        } else {
          log('error', 'HTTP server health check failed', { statusCode: res.statusCode, response: data });
          reject(new Error(`HTTP health check failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      log('error', 'HTTP server health check error', { error: error.message });
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      log('error', 'HTTP server health check timeout');
      reject(new Error('HTTP health check timeout'));
    });

    req.end();
  });
}

/**
 * Check MaxEvo API endpoints
 */
async function checkMaxEvoEndpoints() {
  const endpoints = [
    '/api/mcp/status',
    '/api/terminal/sessions'
  ];

  for (const endpoint of endpoints) {
    try {
      await new Promise((resolve, reject) => {
        const options = {
          hostname: HEALTH_CONFIG.host === '0.0.0.0' ? 'localhost' : HEALTH_CONFIG.host,
          port: HEALTH_CONFIG.port,
          path: endpoint,
          method: 'GET',
          timeout: HEALTH_CONFIG.timeout,
          headers: {
            'User-Agent': 'MaxEvo-HealthCheck/1.0'
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            // Accept both 200 (success) and 401 (unauthorized) as healthy
            // 401 means the endpoint exists but requires auth
            if (res.statusCode === 200 || res.statusCode === 401) {
              log('info', `MaxEvo endpoint check passed: ${endpoint}`, { statusCode: res.statusCode });
              resolve(true);
            } else {
              log('warn', `MaxEvo endpoint check failed: ${endpoint}`, { statusCode: res.statusCode, response: data });
              reject(new Error(`Endpoint ${endpoint} failed with status ${res.statusCode}`));
            }
          });
        });

        req.on('error', (error) => {
          log('warn', `MaxEvo endpoint check error: ${endpoint}`, { error: error.message });
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          log('warn', `MaxEvo endpoint check timeout: ${endpoint}`);
          reject(new Error(`Endpoint ${endpoint} timeout`));
        });

        req.end();
      });
    } catch (error) {
      log('warn', `MaxEvo endpoint ${endpoint} not accessible, but continuing...`, { error: error.message });
      // Don't fail health check for individual MaxEvo endpoints in case they require auth
    }
  }
}

/**
 * Check critical files exist
 */
async function checkCriticalFiles() {
  const criticalFiles = [
    'api/server/index.js',
    'api/package.json',
    'api/server/services/MaxEvoCore.js',
    'api/server/services/initializeMaxEvo.js',
    'api/db/connect.js'
  ];

  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      log('error', `Critical file missing: ${file}`);
      throw new Error(`Critical file missing: ${file}`);
    }
  }

  log('info', 'All critical files present');
}

/**
 * Check memory usage
 */
async function checkMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
  };

  // Warning if using more than 512MB RSS
  if (memoryMB.rss > 512) {
    log('warn', 'High memory usage detected', memoryMB);
  } else {
    log('info', 'Memory usage within normal limits', memoryMB);
  }

  // Fail if using more than 900MB RSS (leaving 100MB buffer for 1GB limit)
  if (memoryMB.rss > 900) {
    log('error', 'Memory usage exceeded safe limits', memoryMB);
    throw new Error('Memory exhausted');
  }
}

/**
 * Check environment variables
 */
async function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT'
  ];

  const optionalButImportantEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'APP_TITLE'
  ];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      log('error', `Required environment variable missing: ${envVar}`);
      throw new Error(`Required environment variable missing: ${envVar}`);
    }
  }

  // Check optional but important variables
  for (const envVar of optionalButImportantEnvVars) {
    if (!process.env[envVar]) {
      log('warn', `Important environment variable missing: ${envVar}`);
    }
  }

  log('info', 'Environment variables check completed');
}

/**
 * Retry wrapper for unreliable operations
 */
async function withRetry(operation, operationName, maxRetries = HEALTH_CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      log('warn', `${operationName} failed on attempt ${attempt}/${maxRetries}`, { error: error.message });
      
      if (attempt === maxRetries) {
        log('error', `${operationName} failed after ${maxRetries} attempts`);
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, HEALTH_CONFIG.retryDelay));
    }
  }
}

/**
 * Main health check function
 */
async function performHealthCheck() {
  const startTime = Date.now();
  log('info', 'Starting MaxEvo health check');

  try {
    // Check 1: Critical files
    log('info', 'Checking critical files...');
    await checkCriticalFiles();

    // Check 2: Environment variables
    log('info', 'Checking environment variables...');
    await checkEnvironmentVariables();

    // Check 3: Memory usage
    log('info', 'Checking memory usage...');
    await checkMemoryUsage();

    // Check 4: HTTP server (with retries)
    log('info', 'Checking HTTP server...');
    await withRetry(checkHttpServer, 'HTTP server check');

    // Check 5: MaxEvo endpoints (optional, don't fail if auth required)
    log('info', 'Checking MaxEvo endpoints...');
    try {
      await checkMaxEvoEndpoints();
    } catch (error) {
      log('warn', 'Some MaxEvo endpoints not accessible (may require authentication)', { error: error.message });
      // Don't fail the health check for this
    }

    const duration = Date.now() - startTime;
    log('info', 'Health check completed successfully', { duration: `${duration}ms` });
    
    return true;

  } catch (error) {
    const duration = Date.now() - startTime;
    log('error', 'Health check failed', { 
      error: error.message, 
      duration: `${duration}ms`,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Set timeout for entire health check
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CONFIG.timeout);
    });

    await Promise.race([
      performHealthCheck(),
      timeoutPromise
    ]);

    log('info', 'MaxEvo deployment is healthy');
    process.exit(EXIT_CODES.SUCCESS);

  } catch (error) {
    log('error', 'MaxEvo deployment health check failed', { error: error.message });
    
    // Determine appropriate exit code
    let exitCode = EXIT_CODES.SUCCESS;
    
    if (error.message.includes('HTTP')) {
      exitCode = EXIT_CODES.HTTP_SERVER_FAILED;
    } else if (error.message.includes('MaxEvo') || error.message.includes('MCP')) {
      exitCode = EXIT_CODES.MAXEVO_CORE_FAILED;
    } else if (error.message.includes('database') || error.message.includes('MONGO')) {
      exitCode = EXIT_CODES.DATABASE_FAILED;
    } else if (error.message.includes('memory') || error.message.includes('Memory')) {
      exitCode = EXIT_CODES.MEMORY_EXHAUSTED;
    } else if (error.message.includes('timeout')) {
      exitCode = EXIT_CODES.TIMEOUT;
    } else {
      exitCode = EXIT_CODES.DEPENDENCY_FAILED;
    }

    process.exit(exitCode);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception in health check', { error: error.message, stack: error.stack });
  process.exit(EXIT_CODES.DEPENDENCY_FAILED);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection in health check', { reason: String(reason) });
  process.exit(EXIT_CODES.DEPENDENCY_FAILED);
});

// Run health check if called directly
if (require.main === module) {
  main();
}

module.exports = {
  performHealthCheck,
  EXIT_CODES
};