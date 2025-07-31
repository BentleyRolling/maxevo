require('dotenv').config();
const fs = require('fs');
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '..') });

// Initialize safe console fallback for production deployments
const safeConsole = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => console.debug(...args)
};

// Initialize logger with fallback
let logger;
try {
  const { logger: librechatLogger } = require('@librechat/data-schemas');
  logger = librechatLogger || safeConsole;
} catch (error) {
  console.warn('⚠️ LibreChat logger initialization failed, using console fallback:', error.message);
  logger = safeConsole;
}

const cors = require('cors');
const axios = require('axios');
const express = require('express');
const passport = require('passport');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { isEnabled } = require('@librechat/api');
const mongoSanitize = require('express-mongo-sanitize');
const { connectDb, indexSync } = require('~/db');

const validateImageRequest = require('./middleware/validateImageRequest');
const { jwtLogin, ldapLogin, passportLogin } = require('~/strategies');
const errorController = require('./controllers/ErrorController');
const initializeMCP = require('./services/initializeMCP');
const { initializeMaxEvo } = require('./services/initializeMaxEvo');
const configureSocialLogins = require('./socialLogins');
const AppService = require('./services/AppService');
const staticCache = require('./utils/staticCache');
const noIndex = require('./middleware/noIndex');
const routes = require('./routes');

const { PORT, HOST, ALLOW_SOCIAL_LOGIN, DISABLE_COMPRESSION, TRUST_PROXY } = process.env ?? {};

// Allow PORT=0 to be used for automatic free port assignment
// Default to 8080 for DigitalOcean App Platform compatibility
const port = isNaN(Number(PORT)) ? 8080 : Number(PORT);
const host = HOST || 'localhost';
const trusted_proxy = Number(TRUST_PROXY) || 1; /* trust first proxy by default */

const app = express();

const startServer = async () => {
  if (typeof Bun !== 'undefined') {
    axios.defaults.headers.common['Accept-Encoding'] = 'gzip';
  }
  
  try {
    await connectDb();
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    logger.warn('MaxEvo will start in standalone mode without MongoDB');
    // Continue without MongoDB for now
  }
  indexSync().catch((err) => {
    logger.error('[indexSync] Background sync failed:', err);
  });

  app.disable('x-powered-by');
  app.set('trust proxy', trusted_proxy);

  await AppService(app);

  const indexPath = path.join(app.locals.paths.dist, 'index.html');
  const indexHTML = fs.readFileSync(indexPath, 'utf8');

  app.get('/health', (_req, res) => res.status(200).send('OK'));

  /* Middleware */
  app.use(noIndex);
  app.use(errorController);
  app.use(express.json({ limit: '3mb' }));
  app.use(express.urlencoded({ extended: true, limit: '3mb' }));
  app.use(mongoSanitize());
  app.use(cors());
  app.use(cookieParser());

  if (!isEnabled(DISABLE_COMPRESSION)) {
    app.use(compression());
  } else {
    console.warn('Response compression has been disabled via DISABLE_COMPRESSION.');
  }

  // Serve static assets with aggressive caching
  app.use(staticCache(app.locals.paths.dist));
  app.use(staticCache(app.locals.paths.fonts));
  app.use(staticCache(app.locals.paths.assets));

  if (!ALLOW_SOCIAL_LOGIN) {
    console.warn('Social logins are disabled. Set ALLOW_SOCIAL_LOGIN=true to enable them.');
  }

  /* OAUTH */
  app.use(passport.initialize());
  passport.use(jwtLogin());
  passport.use(passportLogin());

  /* LDAP Auth */
  if (process.env.LDAP_URL && process.env.LDAP_USER_SEARCH_BASE) {
    passport.use(ldapLogin);
  }

  if (isEnabled(ALLOW_SOCIAL_LOGIN)) {
    await configureSocialLogins(app);
  }

  app.use('/oauth', routes.oauth);
  /* API Endpoints */
  app.use('/api/auth', routes.auth);
  app.use('/api/actions', routes.actions);
  app.use('/api/keys', routes.keys);
  app.use('/api/user', routes.user);
  app.use('/api/search', routes.search);
  app.use('/api/edit', routes.edit);
  app.use('/api/messages', routes.messages);
  app.use('/api/convos', routes.convos);
  app.use('/api/presets', routes.presets);
  app.use('/api/prompts', routes.prompts);
  app.use('/api/categories', routes.categories);
  app.use('/api/tokenizer', routes.tokenizer);
  app.use('/api/endpoints', routes.endpoints);
  app.use('/api/balance', routes.balance);
  app.use('/api/models', routes.models);
  app.use('/api/plugins', routes.plugins);
  app.use('/api/config', routes.config);
  app.use('/api/assistants', routes.assistants);
  app.use('/api/files', await routes.files.initialize());
  app.use('/images/', validateImageRequest, routes.staticRoute);
  app.use('/api/share', routes.share);
  app.use('/api/roles', routes.roles);
  app.use('/api/agents', routes.agents);
  app.use('/api/banner', routes.banner);
  app.use('/api/memories', routes.memories);
  app.use('/api/tags', routes.tags);
  app.use('/api/mcp', routes.mcp);
  app.use('/api/terminal', routes.terminal);

  app.use((req, res) => {
    res.set({
      'Cache-Control': process.env.INDEX_CACHE_CONTROL || 'no-cache, no-store, must-revalidate',
      Pragma: process.env.INDEX_PRAGMA || 'no-cache',
      Expires: process.env.INDEX_EXPIRES || '0',
    });

    const lang = req.cookies.lang || req.headers['accept-language']?.split(',')[0] || 'en-US';
    const saneLang = lang.replace(/"/g, '&quot;');
    const updatedIndexHtml = indexHTML.replace(/lang="en-US"/g, `lang="${saneLang}"`);
    res.type('html');
    res.send(updatedIndexHtml);
  });

  const server = app.listen(port, host, async () => {
    if (host === '0.0.0.0') {
      logger.info(
        `Server listening on all interfaces at port ${port}. Use http://localhost:${port} to access it`,
      );
    } else {
      logger.info(`Server listening at http://${host == '0.0.0.0' ? 'localhost' : host}:${port}`);
    }

    // Initialize existing MCP system
    try {
      initializeMCP(app);
      logger.info('✅ MCP system initialized');
    } catch (error) {
      logger.warn('⚠️ MCP initialization failed, continuing without MCP:', error.message);
    }
    
    // Initialize MaxEvo AI Operating System
    try {
      await initializeMaxEvo(app, server);
      logger.info('🌟 MaxEvo AI Operating System is now online!');
    } catch (error) {
      logger.error('❌ MaxEvo initialization failed:', error);
      logger.warn('Server will continue running in basic mode');
    }
  });
};

startServer();

let messageCount = 0;

// Enhanced uncaught exception handler for production deployment
process.on('uncaughtException', (err) => {
  // Use safe console logging to prevent logger initialization issues
  console.error('🚨 UNCAUGHT EXCEPTION:', err.message);
  console.error('📍 Stack:', err.stack);
  
  // Try to use logger if available, but don't fail if it's not
  if (logger && typeof logger.error === 'function') {
    try {
      logger.error('There was an uncaught error:', err);
    } catch (loggerError) {
      console.error('Logger failed during error handling:', loggerError.message);
    }
  }
  
  // Handle specific non-fatal errors that shouldn't crash the server
  if (err.message.includes('abort')) {
    console.warn('⚠️ AbortController error (non-fatal):', err.message);
    return;
  }

  if (err.message.includes('GoogleGenerativeAI')) {
    console.warn('⚠️ GoogleGenerativeAI error (non-fatal):', err.message);
    return;
  }

  if (err.message.includes('fetch failed')) {
    if (messageCount === 0) {
      console.warn('⚠️ Meilisearch error, search will be disabled');
      messageCount++;
    }
    return;
  }

  if (err.message.includes('OpenAIError') || err.message.includes('ChatCompletionMessage')) {
    console.error('⚠️ OpenAI error (non-fatal):', err.message);
    return;
  }

  // For production deployment, try to continue instead of crashing
  if (process.env.NODE_ENV === 'production') {
    console.error('🔥 PRODUCTION: Attempting to continue despite uncaught exception');
    console.error('📊 Memory usage:', process.memoryUsage());
    return; // Don't exit in production
  }

  // Only exit in development
  console.error('💥 DEVELOPMENT: Exiting due to uncaught exception');
  process.exit(1);
});

/** Export app for easier testing purposes */
module.exports = app;
