const { Connection, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const solanaConfig = require('../config/solana');
const logger = require('../utils/logger');
const SecurityUtils = require('../utils/security');

class PollService {
  constructor() {
    this.connection = solanaConfig.connection;
    this.governmentWallet = solanaConfig.governmentWallet;
    this.polls = new Map(); // In-memory storage for demo
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
      
      return {
        success: true,
        pollId: poll.id,
        poll: this.sanitizePollForResponse(poll)
      };

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

      // Record vote
      poll.votes.set(voteData.voterAddress, voteData.optionIndex);
      poll.voteCounts[voteData.optionIndex]++;

      logger.info(`Vote submitted: Poll ${voteData.pollId}, Option ${voteData.optionIndex}, Voter ${voteData.voterAddress}`);

      return {
        success: true,
        message: 'Vote submitted successfully'
      };

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
}

module.exports = new PollService();
