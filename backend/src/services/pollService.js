const { Connection, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const solanaConfig = require('../config/solana');
const logger = require('../utils/logger');
const SecurityUtils = require('../utils/security');
const solanaTransactionService = require('./solanaTransactionService');

class PollService {
  constructor() {
    this.connection = solanaConfig.connection;
    this.governmentWallet = solanaConfig.governmentWallet;
    this.polls = new Map(); // In-memory storage for demo
    this.voterRateLimit = new Map(); // Track voter activity for rate limiting
    this.voterIdentities = new Map(); // Track voter identity verification
  }

  // Rate limiting: Check if voter has exceeded voting frequency
  checkVoterRateLimit(voterAddress) {
    const now = Date.now();
    const voterKey = voterAddress.toLowerCase();
    
    if (!this.voterRateLimit.has(voterKey)) {
      this.voterRateLimit.set(voterKey, []);
    }
    
    const voterHistory = this.voterRateLimit.get(voterKey);
    
    // Remove votes older than 1 hour
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentVotes = voterHistory.filter(timestamp => timestamp > oneHourAgo);
    this.voterRateLimit.set(voterKey, recentVotes);
    
    // Allow maximum 10 votes per hour per address
    const maxVotesPerHour = 10;
    if (recentVotes.length >= maxVotesPerHour) {
      return {
        allowed: false,
        message: `Rate limit exceeded. Maximum ${maxVotesPerHour} votes per hour allowed.`,
        retryAfter: Math.ceil((recentVotes[0] + (60 * 60 * 1000) - now) / 1000)
      };
    }
    
    return { allowed: true };
  }

  // Verify voter identity (basic verification)
  verifyVoterIdentity(voterAddress) {
    const voterKey = voterAddress.toLowerCase();
    
    // Check if address is a valid Solana public key
    try {
      new PublicKey(voterAddress);
    } catch (error) {
      return {
        verified: false,
        message: 'Invalid voter address format'
      };
    }
    
    // Basic identity verification - in production, this could be enhanced
    // with additional checks like signature verification, KYC, etc.
    if (!this.voterIdentities.has(voterKey)) {
      this.voterIdentities.set(voterKey, {
        address: voterAddress,
        firstSeen: new Date(),
        verifiedAt: new Date(),
        verificationMethod: 'basic_address_validation'
      });
    }
    
    return {
      verified: true,
      message: 'Voter identity verified',
      identity: this.voterIdentities.get(voterKey)
    };
  }

  // Create a new poll
  async createPoll(pollData) {
    try {
      // Validate poll data
      const validation = SecurityUtils.validatePollData(pollData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate unique poll ID
      const pollId = SecurityUtils.generateSecureString(16);
      
      // Create poll object
      const poll = {
        id: pollId,
        question: SecurityUtils.sanitizeInput(pollData.question),
        options: pollData.options.map(option => SecurityUtils.sanitizeInput(option)),
        creator: pollData.creator,
        isActive: true,
        isAnonymous: pollData.isAnonymous || false,
        expiryDate: pollData.expiryDate ? new Date(pollData.expiryDate) : null,
        createdAt: new Date(),
        votes: new Map(), // voterAddress -> optionIndex
        voteCounts: new Array(pollData.options.length).fill(0)
      };

      // Store poll
      this.polls.set(pollId, poll);
      
      logger.info(`Poll created: ${pollId} by ${pollData.creator}`);
      
      // Submit poll creation to Solana blockchain
      try {
        const transaction = await solanaTransactionService.createPollTransaction(
          pollData.creator,
          pollData
        );
        
        const txResult = await solanaTransactionService.signAndSubmitTransaction(transaction);
        
        logger.info(`Poll creation transaction submitted to Solana: ${txResult.signature}`);
        
        return {
          success: true,
          pollId: poll.id,
          poll: this.sanitizePollForResponse(poll),
          transactionSignature: txResult.signature,
          blockchainConfirmed: true
        };
        
      } catch (txError) {
        logger.error('Error submitting poll creation to Solana:', txError);
        
        // Still return success for the poll creation, but note the blockchain error
        return {
          success: true,
          pollId: poll.id,
          poll: this.sanitizePollForResponse(poll),
          error: txError.message,
          blockchainConfirmed: false
        };
      }

    } catch (error) {
      logger.error('Error creating poll:', error);
      throw error;
    }
  }

  // Submit a vote
  async submitVote(voteData) {
    try {
      // Validate vote data
      const validation = SecurityUtils.validateVoteData(voteData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Verify voter identity
      const identityCheck = this.verifyVoterIdentity(voteData.voterAddress);
      if (!identityCheck.verified) {
        throw new Error(`Identity verification failed: ${identityCheck.message}`);
      }

      // Check rate limiting
      const rateLimitCheck = this.checkVoterRateLimit(voteData.voterAddress);
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded: ${rateLimitCheck.message}. Retry after ${rateLimitCheck.retryAfter} seconds.`);
      }

      const poll = this.polls.get(voteData.pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      // Check if poll is active and not expired
      if (!poll.isActive) {
        throw new Error('Poll is not active');
      }

      if (poll.expiryDate && new Date() > poll.expiryDate) {
        throw new Error('Poll has expired');
      }

      // Check if voter has already voted
      if (poll.votes.has(voteData.voterAddress)) {
        throw new Error('Voter has already voted on this poll');
      }

      // Validate option index
      if (typeof voteData.optionIndex !== 'number' || voteData.optionIndex < 0 || voteData.optionIndex >= poll.options.length) {
        throw new Error('Invalid option index');
      }

      // Record vote with timestamp for rate limiting
      const now = Date.now();
      poll.votes.set(voteData.voterAddress, voteData.optionIndex);
      poll.voteCounts[voteData.optionIndex]++;
      
      // Update rate limiting tracking
      const voterKey = voteData.voterAddress.toLowerCase();
      if (!this.voterRateLimit.has(voterKey)) {
        this.voterRateLimit.set(voterKey, []);
      }
      this.voterRateLimit.get(voterKey).push(now);

      logger.info(`Vote submitted: Poll ${voteData.pollId}, Option ${voteData.optionIndex}, Voter ${voteData.voterAddress}, Identity: ${identityCheck.identity.verificationMethod}`);

      // Submit vote to Solana blockchain
      try {
        const transaction = await solanaTransactionService.createVoteTransaction(
          voteData.voterAddress,
          voteData.pollId,
          voteData.optionIndex
        );
        
        const txResult = await solanaTransactionService.signAndSubmitTransaction(transaction);
        
        logger.info(`Vote transaction submitted to Solana: ${txResult.signature}`);
        
        return {
          success: true,
          message: 'Vote submitted successfully',
          transactionSignature: txResult.signature,
          blockchainConfirmed: !txResult.demoMode,
          feePaidBy: 'government',
          voterIdentity: identityCheck.identity,
          rateLimitInfo: {
            remainingVotes: 10 - this.voterRateLimit.get(voterKey).length,
            resetTime: new Date(now + (60 * 60 * 1000)).toISOString()
          },
          demoMode: txResult.demoMode || false,
          governmentWallet: this.governmentWallet.publicKey.toBase58()
        };
        
      } catch (txError) {
        logger.error('Error submitting vote to Solana:', txError);
        
        // Still return success for the vote, but note the blockchain error
        return {
          success: true,
          message: 'Vote recorded locally, but blockchain submission failed',
          error: txError.message,
          blockchainConfirmed: false,
          feePaidBy: 'government',
          voterIdentity: identityCheck.identity,
          rateLimitInfo: {
            remainingVotes: 10 - this.voterRateLimit.get(voterKey).length,
            resetTime: new Date(now + (60 * 60 * 1000)).toISOString()
          },
          demoMode: true,
          governmentWallet: this.governmentWallet.publicKey.toBase58()
        };
      }

    } catch (error) {
      logger.error('Error submitting vote:', error);
      throw error;
    }
  }

  // Get poll details
  async getPoll(pollId) {
    try {
      const poll = this.polls.get(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      return {
        success: true,
        poll: this.sanitizePollForResponse(poll)
      };

    } catch (error) {
      logger.error('Error getting poll:', error);
      throw error;
    }
  }

  // Get all polls
  async getAllPolls() {
    try {
      const polls = Array.from(this.polls.values())
        .map(poll => this.sanitizePollForResponse(poll))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        polls
      };

    } catch (error) {
      logger.error('Error getting all polls:', error);
      throw error;
    }
  }

  // Get polls by creator
  async getPollsByCreator(creatorAddress) {
    try {
      const polls = Array.from(this.polls.values())
        .filter(poll => poll.creator === creatorAddress)
        .map(poll => this.sanitizePollForResponse(poll))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        polls
      };

    } catch (error) {
      logger.error('Error getting polls by creator:', error);
      throw error;
    }
  }

  // Close a poll
  async closePoll(pollId, creatorAddress) {
    try {
      const poll = this.polls.get(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      // Check if requester is the creator
      if (poll.creator !== creatorAddress) {
        throw new Error('Only the poll creator can close the poll');
      }

      poll.isActive = false;
      poll.closedAt = new Date();

      logger.info(`Poll closed: ${pollId} by ${creatorAddress}`);

      return {
        success: true,
        message: 'Poll closed successfully'
      };

    } catch (error) {
      logger.error('Error closing poll:', error);
      throw error;
    }
  }

  // Get poll results
  async getPollResults(pollId) {
    try {
      const poll = this.polls.get(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      const results = {
        pollId: poll.id,
        question: poll.question,
        options: poll.options.map((option, index) => ({
          text: option,
          votes: poll.voteCounts[index],
          percentage: poll.votes.size > 0 ? 
            ((poll.voteCounts[index] / poll.votes.size) * 100).toFixed(1) : 0
        })),
        totalVotes: poll.votes.size,
        isActive: poll.isActive,
        isAnonymous: poll.isAnonymous,
        createdAt: poll.createdAt,
        closedAt: poll.closedAt
      };

      return {
        success: true,
        results
      };

    } catch (error) {
      logger.error('Error getting poll results:', error);
      throw error;
    }
  }

  // Sanitize poll data for response (remove sensitive information)
  sanitizePollForResponse(poll) {
    const sanitized = { ...poll };
    
    // Remove votes map for privacy
    delete sanitized.votes;
    
    // If poll is anonymous, don't show individual voter info
    if (poll.isAnonymous) {
      // Keep only vote counts, not individual votes
    }
    
    return sanitized;
  }

  // Get government wallet info
  async getGovernmentWalletInfo() {
    try {
      const walletInfo = await solanaConfig.getWalletInfo();
      return {
        success: true,
        wallet: walletInfo
      };
    } catch (error) {
      logger.error('Error getting government wallet info:', error);
      throw error;
    }
  }

  // Get voter statistics and rate limit status
  getVoterStats(voterAddress) {
    const voterKey = voterAddress.toLowerCase();
    const now = Date.now();
    
    // Get rate limit info
    const voterHistory = this.voterRateLimit.get(voterKey) || [];
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentVotes = voterHistory.filter(timestamp => timestamp > oneHourAgo);
    
    // Get identity info
    const identity = this.voterIdentities.get(voterKey);
    
    return {
      success: true,
      voterAddress: voterAddress,
      identity: identity || null,
      rateLimit: {
        votesInLastHour: recentVotes.length,
        maxVotesPerHour: 10,
        remainingVotes: Math.max(0, 10 - recentVotes.length),
        resetTime: recentVotes.length > 0 ? new Date(recentVotes[0] + (60 * 60 * 1000)).toISOString() : null
      },
      feeInfo: {
        paidBy: 'government',
        description: 'All transaction fees are covered by the government relayer wallet'
      }
    };
  }
}

module.exports = new PollService();
