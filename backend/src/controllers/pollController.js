const pollService = require('../services/pollService');
const SecurityUtils = require('../utils/security');
const logger = require('../utils/logger');

class PollController {
  // Create a new poll
  async createPoll(req, res) {
    try {
      const { question, options, creator, isAnonymous, expiryDate } = req.body;

      // Validate required fields
      if (!question || !options || !creator) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: question, options, creator'
        });
      }

      // Validate creator address
      if (!SecurityUtils.validateWalletAddress(creator)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid creator wallet address'
        });
      }

      const result = await pollService.createPoll({
        question,
        options,
        creator,
        isAnonymous: isAnonymous || false,
        expiryDate
      });

      res.status(201).json(result);

    } catch (error) {
      logger.error('Create poll error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Submit a vote
  async submitVote(req, res) {
    try {
      const { pollId } = req.params;
      const { optionIndex, voterAddress } = req.body;

      // Validate required fields
      if (!pollId || optionIndex === undefined || !voterAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: pollId, optionIndex, voterAddress'
        });
      }

      // Validate voter address
      if (!SecurityUtils.validateWalletAddress(voterAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid voter wallet address'
        });
      }

      const result = await pollService.submitVote({
        pollId,
        optionIndex: parseInt(optionIndex),
        voterAddress
      });

      res.json(result);

    } catch (error) {
      logger.error('Submit vote error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get poll details
  async getPoll(req, res) {
    try {
      const { pollId } = req.params;

      if (!pollId) {
        return res.status(400).json({
          success: false,
          error: 'Poll ID is required'
        });
      }

      const result = await pollService.getPoll(pollId);
      res.json(result);

    } catch (error) {
      logger.error('Get poll error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all polls
  async getAllPolls(req, res) {
    try {
      const result = await pollService.getAllPolls();
      res.json(result);

    } catch (error) {
      logger.error('Get all polls error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get polls by creator
  async getPollsByCreator(req, res) {
    try {
      const { creatorAddress } = req.params;

      if (!creatorAddress) {
        return res.status(400).json({
          success: false,
          error: 'Creator address is required'
        });
      }

      // Validate creator address
      if (!SecurityUtils.validateWalletAddress(creatorAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid creator wallet address'
        });
      }

      const result = await pollService.getPollsByCreator(creatorAddress);
      res.json(result);

    } catch (error) {
      logger.error('Get polls by creator error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Close a poll
  async closePoll(req, res) {
    try {
      const { pollId } = req.params;
      const { creatorAddress } = req.body;

      if (!pollId || !creatorAddress) {
        return res.status(400).json({
          success: false,
          error: 'Poll ID and creator address are required'
        });
      }

      // Validate creator address
      if (!SecurityUtils.validateWalletAddress(creatorAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid creator wallet address'
        });
      }

      const result = await pollService.closePoll(pollId, creatorAddress);
      res.json(result);

    } catch (error) {
      logger.error('Close poll error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get poll results
  async getPollResults(req, res) {
    try {
      const { pollId } = req.params;

      if (!pollId) {
        return res.status(400).json({
          success: false,
          error: 'Poll ID is required'
        });
      }

      const result = await pollService.getPollResults(pollId);
      res.json(result);

    } catch (error) {
      logger.error('Get poll results error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get government wallet info
  async getGovernmentWalletInfo(req, res) {
    try {
      const result = await pollService.getGovernmentWalletInfo();
      res.json(result);

    } catch (error) {
      logger.error('Get government wallet info error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Health check
  async healthCheck(req, res) {
    try {
      const walletInfo = await pollService.getGovernmentWalletInfo();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        governmentWallet: walletInfo.wallet,
        uptime: process.uptime()
      });

    } catch (error) {
      logger.error('Health check error:', error);
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = new PollController();
