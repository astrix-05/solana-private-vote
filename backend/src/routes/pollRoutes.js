const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const pollController = require('../controllers/pollController');
const SecurityUtils = require('../utils/security');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting
const createPollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 poll creations per windowMs
  message: {
    success: false,
    error: 'Too many poll creation requests, please try again later.'
  }
});

const voteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 votes per windowMs
  message: {
    success: false,
    error: 'Too many voting requests, please try again later.'
  }
});

// API key middleware
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  if (!SecurityUtils.validateApiKey(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Create poll route
router.post('/polls', 
  createPollLimiter,
  apiKeyMiddleware,
  [
    body('question')
      .isLength({ min: 5, max: 500 })
      .withMessage('Question must be between 5 and 500 characters'),
    body('options')
      .isArray({ min: 2, max: 10 })
      .withMessage('Poll must have between 2 and 10 options'),
    body('options.*')
      .isLength({ min: 1, max: 100 })
      .withMessage('Each option must be between 1 and 100 characters'),
    body('creator')
      .isLength({ min: 32, max: 44 })
      .withMessage('Invalid creator address format'),
    body('isAnonymous')
      .optional()
      .isBoolean()
      .withMessage('isAnonymous must be a boolean'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiry date format')
  ],
  handleValidationErrors,
  pollController.createPoll
);

// Submit vote route
router.post('/polls/:pollId/vote',
  voteLimiter,
  apiKeyMiddleware,
  [
    param('pollId')
      .isLength({ min: 16, max: 32 })
      .withMessage('Invalid poll ID format'),
    body('optionIndex')
      .isInt({ min: 0 })
      .withMessage('Option index must be a non-negative integer'),
    body('voterAddress')
      .isLength({ min: 32, max: 44 })
      .withMessage('Invalid voter address format')
  ],
  handleValidationErrors,
  pollController.submitVote
);

// Dedicated vote endpoint
router.post('/vote',
  voteLimiter,
  apiKeyMiddleware,
  [
    body('voterPublicKey')
      .isLength({ min: 32, max: 44 })
      .withMessage('Invalid voter public key format'),
    body('pollId')
      .isLength({ min: 16, max: 32 })
      .withMessage('Invalid poll ID format'),
    body('voteChoice')
      .isInt({ min: 0 })
      .withMessage('Vote choice must be a non-negative integer')
  ],
  handleValidationErrors,
  pollController.submitVoteDirect
);

// Get poll details route
router.get('/polls/:pollId',
  apiKeyMiddleware,
  [
    param('pollId')
      .isLength({ min: 16, max: 32 })
      .withMessage('Invalid poll ID format')
  ],
  handleValidationErrors,
  pollController.getPoll
);

// Get all polls route
router.get('/polls',
  apiKeyMiddleware,
  pollController.getAllPolls
);

// Get polls by creator route
router.get('/polls/creator/:creatorAddress',
  apiKeyMiddleware,
  [
    param('creatorAddress')
      .isLength({ min: 32, max: 44 })
      .withMessage('Invalid creator address format')
  ],
  handleValidationErrors,
  pollController.getPollsByCreator
);

// Close poll route
router.post('/polls/:pollId/close',
  apiKeyMiddleware,
  [
    param('pollId')
      .isLength({ min: 16, max: 32 })
      .withMessage('Invalid poll ID format'),
    body('creatorAddress')
      .isLength({ min: 32, max: 44 })
      .withMessage('Invalid creator address format')
  ],
  handleValidationErrors,
  pollController.closePoll
);

// Get poll results route
router.get('/polls/:pollId/results',
  apiKeyMiddleware,
  [
    param('pollId')
      .isLength({ min: 16, max: 32 })
      .withMessage('Invalid poll ID format')
  ],
  handleValidationErrors,
  pollController.getPollResults
);

// Get government wallet info route
router.get('/wallet',
  apiKeyMiddleware,
  pollController.getGovernmentWalletInfo
);

// Get Solana wallet balance
router.get('/wallet/balance',
  apiKeyMiddleware,
  pollController.getWalletBalance
);

// Request airdrop (devnet only)
router.post('/wallet/airdrop',
  apiKeyMiddleware,
  [
    body('lamports')
      .optional()
      .isInt({ min: 1000000, max: 2000000000 })
      .withMessage('Lamports must be between 1M and 2B')
  ],
  handleValidationErrors,
  pollController.requestAirdrop
);

// Get transaction status
router.get('/transaction/:signature',
  apiKeyMiddleware,
  [
    param('signature')
      .isLength({ min: 80, max: 100 })
      .withMessage('Invalid transaction signature format')
  ],
  handleValidationErrors,
  pollController.getTransactionStatus
);

// Get Solana wallet info
router.get('/solana/wallet',
  apiKeyMiddleware,
  pollController.getSolanaWalletInfo
);

// Health check route (no API key required)
router.get('/health',
  pollController.healthCheck
);

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Route error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;
