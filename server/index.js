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
  console.info('[startup] express trust proxy =', effectiveTrust);
  // If trust proxy is true (trust all), warn operator because it weakens IP rate-limiting
  if (effectiveTrust === true) {
    console.warn('[startup] WARNING: trust proxy is set to `true` which trusts all proxies. This can allow clients to spoof IPs via X-Forwarded-For and may bypass IP-based rate limiting. Prefer setting TRUST_PROXY=1 (or a specific proxy count) in production. See https://expressjs.com/en/guide/behind-proxies.html');
  }
} catch (e) {
  // ignore logging failure
}

// Log configured rate-limit parameters for visibility
try {
  console.info('[startup] rate-limit window (ms) =', defaultWindowMs);
  console.info('[startup] rate-limit anon max =', anonDefaultMax, 'auth max =', authDefaultMax);
  console.info('[startup] reviews route max =', reviewsRouteMax, 'movies route max =', moviesRouteMax);
} catch (e) {
  // ignore
}

try {
  console.info('[startup] RATE_LIMIT_UNLIMITED =', isUnlimited);
} catch (e) {}

// Log any configured whitelist for rate limiting exemptions
try {
  const rawWL = process.env.RATE_LIMIT_WHITELIST || '';
  const parsedWL = rawWL.split(',').map(s => s.trim()).filter(Boolean);
  console.info('[startup] rate-limit whitelist =', parsedWL.length ? parsedWL : '(none)');
} catch (e) {}

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

// Allow separate limits for authenticated vs anonymous users and per-route overrides
// If RATE_LIMIT_UNLIMITED=true is set, use a very large number to effectively disable rate limiting
const isUnlimited = String(process.env.RATE_LIMIT_UNLIMITED || '').toLowerCase() === 'true';
const VERY_LARGE_LIMIT = Number.MAX_SAFE_INTEGER || 9007199254740991;
const anonDefaultMax = isUnlimited ? VERY_LARGE_LIMIT : (process.env.RATE_LIMIT_ANON_MAX ? Number(process.env.RATE_LIMIT_ANON_MAX) : (isDev ? 1000 : 120));
const authDefaultMax = isUnlimited ? VERY_LARGE_LIMIT : (process.env.RATE_LIMIT_AUTH_MAX ? Number(process.env.RATE_LIMIT_AUTH_MAX) : (isDev ? 2000 : 600));

// Per-route overrides (for busy endpoints like reviews/movies)
const reviewsRouteMax = isUnlimited ? VERY_LARGE_LIMIT : (process.env.REVIEWS_RATE_LIMIT_MAX ? Number(process.env.REVIEWS_RATE_LIMIT_MAX) : (isDev ? 1000 : 60));
const moviesRouteMax = isUnlimited ? VERY_LARGE_LIMIT : (process.env.MOVIES_RATE_LIMIT_MAX ? Number(process.env.MOVIES_RATE_LIMIT_MAX) : (isDev ? 1000 : 60));

const apiLimiter = rateLimit({
  windowMs: defaultWindowMs,
  // max accepts a number or a function(req, res) -> number; return higher limits for authenticated users
  max: (req, res) => {
    try {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        const payload = jwt.decode(token);
        if (payload && payload.user && payload.user.id) return authDefaultMax;
      }
    } catch (e) {
      // ignore and fall back to anon
    }
    return anonDefaultMax;
  },
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
    // Skip for whitelisted users or IPs (comma-separated list in env). Example: RATE_LIMIT_WHITELIST=68d7...,127.0.0.1
    try {
      const raw = process.env.RATE_LIMIT_WHITELIST || '';
      if (raw) {
        const tokens = raw.split(',').map(s => s.trim()).filter(Boolean);
        if (tokens.length > 0) {
          // Check user id from Bearer token
          try {
            const auth = req.headers.authorization;
            if (auth && auth.startsWith('Bearer ')) {
              const token = auth.split(' ')[1];
              const payload = jwt.decode(token);
              if (payload && payload.user && payload.user.id && tokens.includes(String(payload.user.id))) return true;
            }
          } catch (e) {
            // ignore token parse errors
          }

          // Check client IP
          try {
            const xff = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
            const clientIp = (xff && typeof xff === 'string' ? xff.split(',')[0].trim() : (req.ip || ''));
            if (clientIp && tokens.includes(clientIp)) return true;
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore
    }
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
  // prefer explicit per-route env override, otherwise use auth/anon defaults
  max: (req, res) => {
    // if a specific override present, use it
    if (process.env.REVIEWS_RATE_LIMIT_MAX) return reviewsRouteMax;
    try {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        const payload = jwt.decode(token);
        if (payload && payload.user && payload.user.id) return Math.max(60, authDefaultMax / 10);
      }
    } catch (e) {}
    return Math.max(60, anonDefaultMax / 10);
  },
  keyGenerator: apiLimiter.keyGenerator,
  skip: apiLimiter.skip,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests to reviews endpoint' }),
});

const moviesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: (req, res) => {
    if (process.env.MOVIES_RATE_LIMIT_MAX) return moviesRouteMax;
    try {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const token = auth.split(' ')[1];
        const payload = jwt.decode(token);
        if (payload && payload.user && payload.user.id) return Math.max(60, authDefaultMax / 10);
      }
    } catch (e) {}
    return Math.max(60, anonDefaultMax / 10);
  },
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