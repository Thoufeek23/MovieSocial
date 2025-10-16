require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// When running behind a proxy (Render, Heroku, etc.) enable trust proxy so
// express-rate-limit and other middleware can correctly read X-Forwarded-* headers.
// Use `1` to trust the first proxy in front of the app (recommended for single-proxy hosts).
app.set('trust proxy', 1);

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

// Rate limiter - reasonable defaults for public APIs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // limit each IP to 120 requests per windowMs
  // skip preflight OPTIONS requests so they don't count toward the limit
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', apiLimiter);

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

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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