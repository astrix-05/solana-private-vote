const pollService = require('../services/pollService');
const SecurityUtils = require('../utils/security');
const logger = require('../utils/logger');
const solanaTransactionService = require('../services/solanaTransactionService');
const walletFundingService = require('../services/walletFundingService');

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

  // Submit vote via direct endpoint
  async submitVoteDirect(req, res) {
    try {
      const { voterPublicKey, pollId, voteChoice } = req.body;

      // Validate required fields
      if (!voterPublicKey || !pollId || voteChoice === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: voterPublicKey, pollId, voteChoice'
        });
      }

      // Validate voter public key
      if (!SecurityUtils.validateWalletAddress(voterPublicKey)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid voter public key format'
        });
      }

      const result = await pollService.submitVote({
        pollId,
        optionIndex: parseInt(voteChoice),
        voterAddress: voterPublicKey
      });

      res.json(result);

    } catch (error) {
      logger.error('Submit vote direct error:', error);
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

  // Get Solana wallet balance
  async getWalletBalance(req, res) {
    try {
      const balanceInfo = await solanaTransactionService.checkWalletBalance();
      res.json({
        success: true,
        ...balanceInfo
      });
    } catch (error) {
      logger.error('Get wallet balance error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Request airdrop (devnet only)
  async requestAirdrop(req, res) {
    try {
      const { lamports } = req.body;
      const result = await solanaTransactionService.requestAirdrop(lamports);
      res.json(result);
    } catch (error) {
      logger.error('Request airdrop error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get transaction status
  async getTransactionStatus(req, res) {
    try {
      const { signature } = req.params;
      
      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Transaction signature is required'
        });
      }

      const status = await solanaTransactionService.getTransactionStatus(signature);
      res.json({
        success: true,
        ...status
      });
    } catch (error) {
      logger.error('Get transaction status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get Solana wallet info
  async getSolanaWalletInfo(req, res) {
    try {
      const walletInfo = await solanaTransactionService.getWalletInfo();
      res.json({
        success: true,
        wallet: walletInfo
      });
    } catch (error) {
      logger.error('Get Solana wallet info error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get wallet funding status
  async getWalletFundingStatus(req, res) {
    try {
      const status = await walletFundingService.getFundingStatus();
      res.json({
        success: true,
        funding: status
      });
    } catch (error) {
      logger.error('Get wallet funding status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Force fund wallet
  async forceFundWallet(req, res) {
    try {
      const success = await walletFundingService.forceFundWallet();
      if (success) {
        res.json({
          success: true,
          message: 'Wallet funded successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fund wallet'
        });
      }
    } catch (error) {
      logger.error('Force fund wallet error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update funding parameters
  async updateFundingParameters(req, res) {
    try {
      const { minimumBalance, targetBalance, airdropAmount, checkInterval } = req.body;
      
      walletFundingService.updateParameters({
        minimumBalance,
        targetBalance,
        airdropAmount,
        checkInterval
      });

      res.json({
        success: true,
        message: 'Funding parameters updated successfully'
      });
    } catch (error) {
      logger.error('Update funding parameters error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Start/stop funding monitoring
  async toggleFundingMonitoring(req, res) {
    try {
      const { action } = req.body; // 'start' or 'stop'
      
      if (action === 'start') {
        walletFundingService.startMonitoring();
        res.json({
          success: true,
          message: 'Funding monitoring started'
        });
      } else if (action === 'stop') {
        walletFundingService.stopMonitoring();
        res.json({
          success: true,
          message: 'Funding monitoring stopped'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid action. Use "start" or "stop"'
        });
      }
    } catch (error) {
      logger.error('Toggle funding monitoring error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get voter statistics and rate limit status
  async getVoterStats(req, res) {
    try {
      const { voterAddress } = req.params;

      if (!voterAddress) {
        return res.status(400).json({
          success: false,
          error: 'Voter address is required'
        });
      }

      // Validate voter address
      if (!SecurityUtils.validateWalletAddress(voterAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid voter wallet address'
        });
      }

      const result = pollService.getVoterStats(voterAddress);
      res.json(result);

    } catch (error) {
      logger.error('Get voter stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new PollController();
