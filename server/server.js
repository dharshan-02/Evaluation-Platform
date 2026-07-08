const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');
const connectDB = require('./config/db');
const http = require('http');
const socket = require('./socket');
const { initCronService } = require('./services/cronService');

// Initialize Express app
const app = express();

// --------------- Middleware ---------------

// CORS - allow frontend dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files - uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------- API Routes ---------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Evaluation Hub API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Route mounting (all phases complete)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/execute', require('./routes/executionRoutes'));
app.use('/api/plagiarism', require('./routes/plagiarismRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// --------------- Error Handling ---------------

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);

  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'development'
    ? err.message
    : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// --------------- Start Server ---------------

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Ensure uploads directory exists
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Initialize HTTP server and Socket.IO
  const server = http.createServer(app);
  socket.init(server);

  // Initialize background jobs
  initCronService();

  // Start listening
  server.listen(config.port, () => {
    console.log(`\n🚀 Evaluation Hub API Server`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Port:        ${config.port}`);
    console.log(`   URL:         http://localhost:${config.port}`);
    console.log(`   Health:      http://localhost:${config.port}/api/health\n`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
// touch
// restart
