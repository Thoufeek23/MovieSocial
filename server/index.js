require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');
const logger = require('./utils/logger');
const badges = require('./utils/badges');
const http = require('http');
const { Server } = require('socket.io'); 

// Add global error handlers to aid debugging in hosted environments
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception - shutting down', err && err.stack ? err.stack : err);
  // Graceful shutdown could be implemented here. For now, exit so the host can restart the process.
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
  // Exit for a clean restart by the process manager
  process.exit(1);
});

const app = express();

const server = http.createServer(app); // Wrap express app
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // Configure CORS for sockets
    methods: ["GET", "POST"]
  }
});

// Store io instance globally or pass it to routes
app.set('io', io);

// Socket Logic
io.on('connection', (socket) => {

  // Join a room specific to the user ID so we can send them private messages
  socket.on('join_room', (userId) => {
    socket.join(userId);
  });
});

// Configure `trust proxy` carefully. Passing `true` trusts all proxies which
// allows a client to spoof the IP via X-Forwarded-For and will make IP-based
// rate limiting permissive. Instead prefer a specific value (for example
// `1` when behind a single reverse proxy such as many PaaS providers).
// Set the `TRUST_PROXY` env var to control this in production (e.g. "1").
// Default behavior: in production default to 1 (common), otherwise false.
const trustProxyEnv = process.env.TRUST_PROXY;
if (typeof trustProxyEnv !== 'undefined') {
  // allow numeric or string values (e.g. '1' -> 1)
  const tp = /^\d+$/.test(trustProxyEnv) ? Number(trustProxyEnv) : trustProxyEnv;
  app.set('trust proxy', tp);
} else {
  app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
}

// Log the effective trust proxy setting for debugging/ops
try {
  const effectiveTrust = app.get('trust proxy');
  logger.info('[startup] express trust proxy =', effectiveTrust);
  // If trust proxy is true (trust all), warn operator because it weakens IP rate-limiting
  if (effectiveTrust === true) {
    logger.warn('[startup] trust proxy is set to `true` which trusts all proxies. This can allow clients to spoof IPs via X-Forwarded-For and may bypass IP-based rate limiting. Prefer setting TRUST_PROXY=1 (or a specific proxy count) in production.');
  }
} catch (e) {
  // ignore logging failure
}

// Rate limiting is intentionally disabled in this build. If you need rate
// limiting, enable it via your platform (CDN/WAF) or re-add express-rate-limit
// and configure RATE_LIMIT_* environment variables. Removed to avoid
// conflicts with platform-level proxies and proxy headers (e.g. Render).

// Middleware
app.use(helmet());
// Increase payload size limit to 50MB for image uploads (profile photos, etc.)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// CORS config - allow from configured origin in production
// Place CORS before rate limiting so preflight requests get handled and
// returned with proper headers instead of being counted toward the rate limit.
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));

// Explicit preflight handler for our API routes so browsers receive the
// Access-Control-Allow-* headers immediately. Avoid express route wildcards
// that can trip path-to-regexp on some platforms; instead use a lightweight
// middleware mounted at '/api' which checks for OPTIONS and replies.
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Let CORS middleware set the Access-Control-Allow-* headers, then return 204.
    // Note: cors() will write headers and call next(); we call it then end the response.
    cors({ origin: allowedOrigin })(req, res, () => {
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      // Mirror requested headers or ensure authorization and content-type are allowed
      res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      res.sendStatus(204);
    });
    return;
  }
  next();
});

// Rate limiting removed: upstream platform (CDN/WAF) or host-level rate limits
// are expected to handle request throttling. The express-rate-limit code
// was removed to avoid conflicts with platform-specific proxy headers.

// Database Connection with retry/backoff
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('FATAL: MONGO_URI is not set in environment. Set MONGO_URI to your Atlas/DB connection string.');
  process.exit(1);
}

const connectWithRetry = async (maxAttempts = 5, initialDelay = 2000) => {
  const opts = {
    // reduce how long the driver waits for server selection on each attempt
    serverSelectionTimeoutMS: 10000,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(mongoUri, opts);
      logger.info('MongoDB Connected');
      // attach runtime error logging
      mongoose.connection.on('error', err => logger.error('Mongoose runtime error:', err));
      return;
    } catch (err) {
  logger.warn(`MongoDB connection attempt ${attempt} failed:`, err && err.message ? err.message : err);

      // Common recovery hint for Atlas/Render users
      if (err && /whitelist|access|IP|not authorized/i.test(String(err))) {
        console.error('It looks like a network/whitelist or auth issue. Verify your Atlas IP Access List includes your host (or 0.0.0.0/0 temporarily for testing) and that the user/password in MONGO_URI are correct.');
      }

      if (attempt === maxAttempts) {
        logger.error('Exceeded maximum MongoDB connection attempts. Exiting process so host can restart the service.');
        logger.error('Full error:', err);
        process.exit(1);
      }

      const wait = initialDelay * Math.pow(2, attempt - 1);
      logger.info(`Retrying MongoDB connection in ${wait}ms... (attempt ${attempt + 1}/${maxAttempts})`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
};

connectWithRetry();

// Schedule quarterly badge computation when the DB is connected and the feature is enabled.
// Enable by setting ENABLE_MONTHLY_BADGES=true in environment (recommended for production only).
mongoose.connection.on('connected', () => {
  try {
    if (process.env.ENABLE_MONTHLY_BADGES === 'true') {
      logger.info('Quarterly badge computation is enabled. Scheduling quarterly job.');

      // Compute time (ms) until next run: first day of next quarter at 00:05 UTC
      // Node.js setTimeout max value is 2147483647 ms (~24.8 days), so we need to handle longer waits
      const MAX_TIMEOUT = 2147483647; // Max 32-bit signed integer
      const scheduleNextRun = () => {
        const now = new Date();
        // Calculate next quarter start (Jan 1, Apr 1, Jul 1, Oct 1)
        const currentMonth = now.getUTCMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3; // 0, 3, 6, or 9
        const nextQuarterStartMonth = (quarterStartMonth + 3) % 12;
        const nextYear = nextQuarterStartMonth === 0 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
        const nextQuarter = new Date(Date.UTC(nextYear, nextQuarterStartMonth, 1, 0, 5, 0));
        let wait = Math.max(0, nextQuarter.getTime() - Date.now());
        
        // If wait exceeds max timeout, schedule a check-in earlier
        if (wait > MAX_TIMEOUT) {
          logger.info(`Quarterly badge compute scheduled in ${Math.ceil(wait / (1000 * 60 * 60 * 24))} days, breaking into smaller intervals`);
          wait = MAX_TIMEOUT - (60 * 60 * 1000); // Schedule 1 hour before max, then recheck
          setTimeout(() => scheduleNextRun(), wait); // Reschedule when we get closer
          return;
        }
        
        logger.info('Scheduling quarterly badge compute in ms:', wait);

        setTimeout(async () => {
          try {
            // Compute for previous quarter (last 3 months)
            const runDate = new Date();
            runDate.setUTCDate(1);
            runDate.setUTCHours(0,0,0,0);
            // Calculate the start of the previous quarter
            const currentMonth = runDate.getUTCMonth();
            const currentQuarterStart = Math.floor(currentMonth / 3) * 3;
            const prevQuarterStart = currentQuarterStart - 3;
            const prevQuarterYear = prevQuarterStart < 0 ? runDate.getUTCFullYear() - 1 : runDate.getUTCFullYear();
            const prevQuarterMonth = prevQuarterStart < 0 ? prevQuarterStart + 12 : prevQuarterStart;
            const startMonth = prevQuarterMonth + 1; // 1-12 format
            logger.info('Running quarterly badge compute for quarter starting', prevQuarterYear, startMonth);
            await badges.computeQuarterlyBadges(prevQuarterYear, startMonth);
            logger.info('Quarterly badge compute finished for quarter starting', prevQuarterYear, startMonth);
          } catch (err) {
            logger.error('Quarterly badge compute failed', err);
          } finally {
            // schedule next run
            scheduleNextRun();
          }
        }, wait);
      };

      // kick off schedule
      scheduleNextRun();
    } else {
      logger.info('Quarterly badge computation is disabled. Set ENABLE_MONTHLY_BADGES=true to enable.');
    }
  } catch (e) {
    logger.error('Failed to schedule quarterly badge compute', e);
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/discussions', require('./routes/discussions'));
app.use('/api/ranks', require('./routes/ranks'));
app.use('/api/puzzles', require('./routes/puzzles'));
app.use('/api/ai', require('./routes/ai'));
// Stats and leaderboards
app.use('/api/messages', require('./routes/messages'));
app.use('/api/stats', require('./routes/stats'));
// Debug endpoints for runtime checks (safe to remove after debugging)
// debug routes removed

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health endpoint - include DB connection state for better diagnostics in hosted logs
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting', 'unauthorized'];
  const connectionState = mongoose && mongoose.connection && typeof mongoose.connection.readyState === 'number'
    ? states[mongoose.connection.readyState] || mongoose.connection.readyState
    : 'unknown';
  res.json({ status: 'ok', db: { state: connectionState, readyState: mongoose.connection.readyState } });
});

// Serve client static assets if present (for single-host deployments)
const fs = require('fs');
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (process.env.NODE_ENV === 'production' && fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // Use '/*' to avoid path-to-regexp parsing issues with bare '*'
  app.get('/*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // In many hosting setups (like Render when deploying server only) the client/build
  // folder won't exist. Avoid crashing the app; log a helpful message and skip static serving.
  logger.warn('Client build not found or NODE_ENV not production; skipping static file serving from', clientBuildPath);
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));