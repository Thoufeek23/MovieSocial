require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middleware
app.use(helmet());
app.use(express.json());

// Rate limiter - reasonable defaults for public APIs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // limit each IP to 120 requests per windowMs
});
app.use('/api/', apiLimiter);

// CORS config - allow from configured origin in production
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

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
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));