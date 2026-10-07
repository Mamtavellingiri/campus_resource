const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware - Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Middleware - Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Import Routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// ✅ Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/checkin', checkInRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);

// ✅ Root Route - This fixes the "/" not found error
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Campus Resource API is running!',
    version: '1.0.0',
    endpoints: {
      api: '/api',
      health: '/api/health',
      auth: '/api/auth',
      resources: '/api/resources',
      bookings: '/api/bookings',
      checkin: '/api/checkin',
      admin: '/api/admin',
      analytics: '/api/analytics',
      feedback: '/api/feedback',
      maintenance: '/api/maintenance',
      notifications: '/api/notifications'
    },
    documentation: 'https://github.com/Mamtavellingiri/campus_resource'
  });
});

// ✅ Root API Route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '✅ Campus Resource API is running!',
    endpoints: {
      auth: '/api/auth',
      resources: '/api/resources',
      bookings: '/api/bookings',
      checkin: '/api/checkin',
      admin: '/api/admin',
      analytics: '/api/analytics',
      feedback: '/api/feedback',
      maintenance: '/api/maintenance',
      notifications: '/api/notifications'
    }
  });
});

// ✅ Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '✅ Backend is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ✅ 404 Handler - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `❌ Route '${req.originalUrl}' not found`
  });
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: '❌ Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check at http://localhost:${PORT}/api/health`);
  console.log(`✅ Root route at http://localhost:${PORT}/`);
});

// ✅ Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// ✅ Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down...');
  process.exit(0);
});