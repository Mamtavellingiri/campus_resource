const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const config = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const ecoRoutes = require('./routes/ecoRoutes');

const { processNoShowAutoRelease } = require('./services/noShowService');
const { expireOldEntries } = require('./services/waitlistService');

const app = express();
const PORT = config.PORT;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production' ? process.env.CORS_ORIGIN || false : '*',
  credentials: true
}));
app.use(express.json());

// Rate limiting — skip entirely in development so the SPA never gets a 429
if (config.NODE_ENV !== 'development') {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many auth attempts, please try again later.' }
  });

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests, please try again later.' }
  });

  app.use('/api/', generalLimiter);
  // Strict limiter ONLY on mutation auth routes, not on /auth/me
  app.post('/api/auth/login', authLimiter);
  app.post('/api/auth/register', authLimiter);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/checkin', checkInRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/eco', ecoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Campus Resource Booking & Management System API',
    timestamp: new Date().toISOString()
  });
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API route '${req.originalUrl}' not found.` });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
    error: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Background Jobs (every minute)
cron.schedule('* * * * *', async () => {
  await processNoShowAutoRelease();
  await expireOldEntries();
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 CAMPUS RESOURCE SYSTEM SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`⚡ Rate limiting: ${config.NODE_ENV === 'development' ? 'DISABLED (dev mode)' : 'ENABLED'}`);
  console.log(`⏱️  Background Jobs Active (No-Show + Waitlist Expire, every 1 min)`);
  console.log(`==================================================`);
});
