const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import API routes
const chatApi = require('./api/chat-api');
const repositoryApi = require('./api/repository-api');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for API
}));

app.use(cors({
  origin: '*', // Configure based on your frontend domain
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'lambda'
  });
});

// API routes
app.use('/api/chat', chatApi);
app.use('/api/repository', repositoryApi);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Codebase AI Agent Lambda API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      repository: '/api/repository'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Lambda error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Export the serverless handler
module.exports.handler = serverless(app);
