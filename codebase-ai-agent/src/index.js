const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import API routes
const chatApi = require('./api/chat-api');
const repositoryApi = require('./api/repository-api');

// Import services for initialization
const OpenSearchService = require('./services/opensearch-service');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/chat', chatApi);
app.use('/api/repository', repositoryApi);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Codebase AI Agent API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      repository: '/api/repository'
    },
    documentation: 'https://github.com/your-org/codebase-ai-agent'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
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

// Initialize services and start server
async function startServer() {
  try {
    console.log('Initializing services...');
    
    // Initialize OpenSearch index
    const openSearchService = new OpenSearchService();
    await openSearchService.initializeIndex();
    console.log('OpenSearch index initialized');

    // Start server
    app.listen(port, () => {
      console.log(`🚀 Codebase AI Agent API running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`💬 Chat API: http://localhost:${port}/api/chat`);
      console.log(`📁 Repository API: http://localhost:${port}/api/repository`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
