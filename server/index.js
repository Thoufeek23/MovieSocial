require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const path = require('path');
// Add global error handlers to aid debugging in hosted environments
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception - shutting down', err && err.stack ? err.stack : err);
  // Graceful shutdown could be implemented here. For now, exit so the host can restart the process.
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
  // Exit for a clean restart by the process manager
  process.exit(1);
});

const app = express();

// When running behind proxies (Cloudflare, Render, etc.) enable trust proxy so
// express-rate-limit and other middleware can correctly read X-Forwarded-* headers.
// Trust the full proxy chain so req.ip is populated from the client-facing header.
// Set to `true` to trust all proxies (acceptable for many hosted setups behind a CDN).
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(express.json());

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

// Rate limiter - improved behavior:
// - Use per-user key when authenticated (prevents one IP from blocking other users behind same NAT)
// - Skip limiting for local dev (::1 / 127.0.0.1) to avoid dev friction
// - Keep a global fallback by IP for unauthenticated requests
const isDev = process.env.NODE_ENV !== 'production';

// Rate limit window and max can be tuned from environment vars in production
const defaultWindowMs = (process.env.RATE_LIMIT_WINDOW_MINUTES ? Number(process.env.RATE_LIMIT_WINDOW_MINUTES) : 15) * 60 * 1000; // minutes -> ms
const defaultMax = process.env.RATE_LIMIT_MAX_REQUESTS ? Number(process.env.RATE_LIMIT_MAX_REQUESTS) : (isDev ? 1000 : 120);

const apiLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: defaultMax,
  keyGenerator: (req) => {
    // If Authorization Bearer token present, use decoded user id as key
    try {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        const payload = jwt.decode(token);
        if (payload && payload.user && payload.user.id) return String(payload.user.id);
      }
    } catch (e) {
      // ignore and continue to other fallbacks
    }

    // If behind proxies, prefer the left-most value in X-Forwarded-For (original client IP)
    try {
      const xff = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
      if (xff && typeof xff === 'string') {
        const first = xff.split(',')[0].trim();
        if (first) return first;
      }
    } catch (e) {
      // ignore and fallback to req.ip
    }

    // final fallback to Express-determined IP
    return req.ip;
  },
  skip: (req) => {
    // skip preflight
    if (req.method === 'OPTIONS') return true;
    // skip for local dev addresses to avoid blocking local dev flows
    if (isDev) {
      const ip = req.ip || (req.connection && req.connection.remoteAddress) || '';
      if (ip === '::1' || ip === '127.0.0.1') return true;
    }
    return false;
  },
  skipFailedRequests: true, // don't count failed responses (optional)
  handler: (req, res /*, next */) => {
    // Log more informative details for debugging: include JWT user id if present and client IP
    let clientIp = req.ip;
    try {
      const xff = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
      if (xff && typeof xff === 'string') clientIp = xff.split(',')[0].trim() || clientIp;
    } catch (e) {
      // ignore
    }

    let userId = null;
    try {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        const payload = jwt.decode(token);
        if (payload && payload.user && payload.user.id) userId = payload.user.id;
      }
    } catch (e) {
      // ignore
    }

    try {
      console.warn('[rate-limit] blocked', { clientIp, userId, method: req.method, url: req.originalUrl });
    } catch (e) {
      console.warn('[rate-limit] blocked request (failed to stringify details)');
    }

    // Inform clients when they can retry (use the configured window)
    const retryAfter = Math.ceil(apiLimiter.windowMs / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({ message: 'Too many requests', retryAfter });
  },
});

// Apply global limiter
app.use('/api/', apiLimiter);

// Add higher-rate per-route limiters for known high-traffic endpoints
const reviewsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 1000 : 60,
  keyGenerator: apiLimiter.keyGenerator,
  skip: apiLimiter.skip,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests to reviews endpoint' }),
});

const moviesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 1000 : 60,
  keyGenerator: apiLimiter.keyGenerator,
  skip: apiLimiter.skip,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests to movies endpoint' }),
});

// Mount per-route limiters
app.use('/api/reviews', reviewsLimiter);
app.use('/api/movies', moviesLimiter);

// Database Connection with retry/backoff
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('FATAL: MONGO_URI is not set in environment. Set MONGO_URI to your Atlas/DB connection string.');
  process.exit(1);
}

const connectWithRetry = async (maxAttempts = 5, initialDelay = 2000) => {
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // reduce how long the driver waits for server selection on each attempt
    serverSelectionTimeoutMS: 10000,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await mongoose.connect(mongoUri, opts);
      console.log('MongoDB Connected');
      // attach runtime error logging
      mongoose.connection.on('error', err => console.error('Mongoose runtime error:', err));
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, err && err.message ? err.message : err);

      // Common recovery hint for Atlas/Render users
      if (err && /whitelist|access|IP|not authorized/i.test(String(err))) {
        console.error('It looks like a network/whitelist or auth issue. Verify your Atlas IP Access List includes your host (or 0.0.0.0/0 temporarily for testing) and that the user/password in MONGO_URI are correct.');
      }

      if (attempt === maxAttempts) {
        console.error('Exceeded maximum MongoDB connection attempts. Exiting process so host can restart the service.');
        console.error('Full error:', err);
        process.exit(1);
      }

      const wait = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying MongoDB connection in ${wait}ms... (attempt ${attempt + 1}/${maxAttempts})`);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
};

connectWithRetry();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/discussions', require('./routes/discussions'));
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
  console.warn('Client build not found or NODE_ENV not production; skipping static file serving from', clientBuildPath);
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));