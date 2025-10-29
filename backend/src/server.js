const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import custom modules
const pollRoutes = require('./routes/pollRoutes');
const { corsOptions, requestLogger, securityHeaders, sanitizeInput } = require('./middleware/security');
const logger = require('./utils/logger');
const solanaConfig = require('./config/solana');
const walletFundingService = require('./services/walletFundingService');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors(corsOptions));

// Security headers
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (disabled for now)
// app.use(sanitizeInput);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Health check endpoint (no rate limiting)
app.get('/health', async (req, res) => {
  try {
    const walletInfo = await solanaConfig.getWalletInfo();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      governmentWallet: {
        publicKey: walletInfo.publicKey,
        balance: walletInfo.balance,
        network: walletInfo.network
      },
      version: '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API routes
app.use('/api', pollRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Private Vote Relayer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  walletFundingService.stopMonitoring();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  walletFundingService.stopMonitoring();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Check government wallet
    const walletInfo = await solanaConfig.getWalletInfo();
    logger.info('Government wallet initialized:', walletInfo.publicKey);
    
    // Check wallet balance
    await solanaConfig.fundWalletIfNeeded();
    
    // Start wallet funding monitoring
    walletFundingService.startMonitoring();
    logger.info('💰 Wallet funding monitoring started');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Private Vote Relayer Server running on port ${PORT}`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 API endpoints: http://localhost:${PORT}/api`);
      logger.info(`🔑 Government wallet: ${walletInfo.publicKey}`);
      logger.info(`💰 Wallet balance: ${walletInfo.balance} SOL`);
      logger.info(`🌍 Network: ${walletInfo.network}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
