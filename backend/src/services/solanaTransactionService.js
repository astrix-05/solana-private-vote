const { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const solanaConfig = require('../config/solana');
const logger = require('../utils/logger');

class SolanaTransactionService {
  constructor() {
    this.connection = solanaConfig.connection;
    this.governmentWallet = solanaConfig.governmentWallet;
    this.programId = new PublicKey('7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ'); // From lib_simple.rs
    
    // Initialize Anchor provider
    this.provider = new AnchorProvider(
      this.connection,
      new Wallet(this.governmentWallet),
      { commitment: 'confirmed' }
    );
  }

  // Create a vote transaction
  async createVoteTransaction(voterPublicKey, pollId, voteChoice) {
    try {
      const transaction = new Transaction();
      
      // For now, we'll create a simple instruction that logs the vote
      // In a real implementation, this would call your Anchor program
      const voteInstruction = this.createVoteInstruction(
        new PublicKey(voterPublicKey),
        pollId,
        voteChoice
      );
      
      transaction.add(voteInstruction);
      
      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.governmentWallet.publicKey;
      
      return transaction;
      
    } catch (error) {
      logger.error('Error creating vote transaction:', error);
      throw error;
    }
  }

  // Create a simple vote instruction (placeholder for now)
  createVoteInstruction(voterPublicKey, pollId, voteChoice) {
    // This is a placeholder instruction
    // In a real implementation, you would use your Anchor program
    return SystemProgram.transfer({
      fromPubkey: this.governmentWallet.publicKey,
      toPubkey: voterPublicKey, // Send 0.001 SOL as a "vote receipt"
      lamports: 1000 // 0.001 SOL
    });
  }

  // Sign and submit transaction
  async signAndSubmitTransaction(transaction) {
    try {
      // Sign the transaction with government wallet
      transaction.sign(this.governmentWallet);
      
      // Submit to Solana network
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.governmentWallet],
        {
          commitment: 'confirmed',
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        }
      );
      
      logger.info(`Transaction submitted successfully: ${signature}`);
      return {
        success: true,
        signature,
        message: 'Vote transaction submitted to Solana blockchain'
      };
      
    } catch (error) {
      logger.error('Error signing and submitting transaction:', error);
      throw error;
    }
  }

  // Get transaction status
  async getTransactionStatus(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return {
        signature,
        status: status.value?.confirmationStatus || 'unknown',
        err: status.value?.err,
        slot: status.value?.slot
      };
    } catch (error) {
      logger.error('Error getting transaction status:', error);
      throw error;
    }
  }

  // Check if government wallet has enough SOL for fees
  async checkWalletBalance() {
    try {
      const balance = await this.connection.getBalance(this.governmentWallet.publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      if (solBalance < 0.01) { // Less than 0.01 SOL
        logger.warn(`Government wallet balance is low: ${solBalance} SOL`);
        return {
          hasEnoughFunds: false,
          balance: solBalance,
          message: 'Government wallet needs more SOL for transaction fees'
        };
      }
      
      return {
        hasEnoughFunds: true,
        balance: solBalance,
        message: 'Government wallet has sufficient funds'
      };
    } catch (error) {
      logger.error('Error checking wallet balance:', error);
      throw error;
    }
  }

  // Request airdrop for devnet testing
  async requestAirdrop(lamports = 1000000000) { // 1 SOL
    try {
      if (solanaConfig.network !== 'devnet') {
        throw new Error('Airdrop only available on devnet');
      }
      
      const signature = await this.connection.requestAirdrop(
        this.governmentWallet.publicKey,
        lamports
      );
      
      await this.connection.confirmTransaction(signature);
      
      logger.info(`Airdrop successful: ${signature}`);
      return {
        success: true,
        signature,
        message: 'Airdrop completed successfully'
      };
      
    } catch (error) {
      logger.error('Error requesting airdrop:', error);
      throw error;
    }
  }

  // Create a poll creation transaction
  async createPollTransaction(creatorPublicKey, pollData) {
    try {
      const transaction = new Transaction();
      
      // For now, we'll create a simple instruction
      // In a real implementation, this would call your Anchor program
      const pollInstruction = this.createPollInstruction(
        new PublicKey(creatorPublicKey),
        pollData
      );
      
      transaction.add(pollInstruction);
      
      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.governmentWallet.publicKey;
      
      return transaction;
      
    } catch (error) {
      logger.error('Error creating poll transaction:', error);
      throw error;
    }
  }

  // Create a simple poll instruction (placeholder)
  createPollInstruction(creatorPublicKey, pollData) {
    // This is a placeholder instruction
    // In a real implementation, you would use your Anchor program
    return SystemProgram.transfer({
      fromPubkey: this.governmentWallet.publicKey,
      toPubkey: creatorPublicKey, // Send 0.001 SOL as a "poll creation receipt"
      lamports: 1000 // 0.001 SOL
    });
  }

  // Get government wallet info
  async getWalletInfo() {
    try {
      const balance = await this.connection.getBalance(this.governmentWallet.publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      return {
        publicKey: this.governmentWallet.publicKey.toString(),
        balance: solBalance,
        network: solanaConfig.network,
        rpcUrl: solanaConfig.rpcUrl,
        programId: this.programId.toString()
      };
    } catch (error) {
      logger.error('Error getting wallet info:', error);
      throw error;
    }
  }
}

module.exports = new SolanaTransactionService();
