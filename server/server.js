const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security Headers (configured to allow Google Fonts & local assets)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Lightweight Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`📡 [${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Apply Rate Limiter to API routes
app.use('/api', apiLimiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.status(200).json({
    status: 'online',
    message: '✦ Ek Raaz Ki Baat Batau? Backend is shining! ✦',
    database: states[dbState] || 'Unknown',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static files
const publicPath = path.join(__dirname, '..');
app.use(express.static(publicPath));

// Fallback to index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} was not found in the cosmos.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Port Configuration & Server Startup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🔮 Ek Raaz Ki Baat Batau? — Tarot Server`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🌌 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================\n`);
});

// Graceful Shutdown
const handleShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Closing HTTP server and MongoDB connection...`);
  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log('✨ MongoDB connection closed. Exiting process safely.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
