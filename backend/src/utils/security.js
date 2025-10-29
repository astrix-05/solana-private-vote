const crypto = require('crypto');
const logger = require('./logger');

class SecurityUtils {
  constructor() {
    this.apiKey = process.env.API_KEY;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  // Generate a secure API key
  static generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate a secure JWT secret
  static generateJwtSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Validate API key
  validateApiKey(apiKey) {
    if (!this.apiKey) {
      logger.warn('API_KEY not set in environment variables');
      return false;
    }
    return apiKey === this.apiKey;
  }

  // Generate a secure random string
  static generateSecureString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data
  static hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Validate wallet address format
  static validateWalletAddress(address) {
    try {
      // Basic Solana address validation (base58, 32-44 characters)
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      return base58Regex.test(address);
    } catch (error) {
      logger.error('Error validating wallet address:', error);
      return false;
    }
  }

  // Sanitize input data
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }

  // Rate limiting helper
  static createRateLimitKey(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    return this.hashData(ip + userAgent);
  }

  // Validate poll data
  static validatePollData(pollData) {
    const errors = [];
    
    if (!pollData.question || pollData.question.length < 5) {
      errors.push('Question must be at least 5 characters long');
    }
    
    if (!pollData.options || pollData.options.length < 2) {
      errors.push('Poll must have at least 2 options');
    }
    
    if (pollData.options && pollData.options.length > 10) {
      errors.push('Poll cannot have more than 10 options');
    }
    
    if (pollData.expiryDate && new Date(pollData.expiryDate) <= new Date()) {
      errors.push('Expiry date must be in the future');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate vote data
  static validateVoteData(voteData) {
    const errors = [];
    
    if (!voteData.pollId || typeof voteData.pollId !== 'string') {
      errors.push('Valid poll ID is required');
    }
    
    if (voteData.optionIndex === undefined || voteData.optionIndex === null || typeof voteData.optionIndex !== 'number') {
      errors.push('Valid option index is required');
    }
    
    if (!voteData.voterAddress || !this.validateWalletAddress(voteData.voterAddress)) {
      errors.push('Valid voter address is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const instance = new SecurityUtils();

// Export both instance and static methods
module.exports = {
  ...instance,
  // Static methods
  generateApiKey: SecurityUtils.generateApiKey,
  generateJwtSecret: SecurityUtils.generateJwtSecret,
  generateSecureString: SecurityUtils.generateSecureString,
  hashData: SecurityUtils.hashData,
  validateWalletAddress: SecurityUtils.validateWalletAddress,
  sanitizeInput: SecurityUtils.sanitizeInput,
  createRateLimitKey: SecurityUtils.createRateLimitKey,
  validatePollData: SecurityUtils.validatePollData,
  validateVoteData: SecurityUtils.validateVoteData,
  // Instance methods
  validateApiKey: instance.validateApiKey.bind(instance)
};
