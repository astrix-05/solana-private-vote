const solanaConfig = require('../config/solana');
const logger = require('../utils/logger');

class WalletFundingService {
  constructor() {
    this.connection = solanaConfig.connection;
    this.governmentWallet = solanaConfig.governmentWallet;
    this.minimumBalance = 0.1; // Minimum SOL balance (0.1 SOL)
    this.targetBalance = 1.0; // Target SOL balance (1.0 SOL)
    this.airdropAmount = 2.0; // Amount to airdrop when low (2.0 SOL)
    this.checkInterval = 30000; // Check every 30 seconds
    this.isMonitoring = false;
    this.lastNotificationTime = 0;
    this.notificationCooldown = 300000; // 5 minutes between notifications
    this.fundingAttempts = new Map(); // Track funding attempts per session
    this.maxFundingAttempts = 3; // Max attempts per hour
    this.fundingAttemptWindow = 3600000; // 1 hour window
  }

  // Start monitoring wallet balance
  startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('Wallet funding monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting wallet funding monitoring...');
    
    // Check immediately
    this.checkAndFundWallet();
    
    // Set up interval
    this.monitoringInterval = setInterval(() => {
      this.checkAndFundWallet();
    }, this.checkInterval);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Wallet funding monitoring stopped');
  }

  // Check wallet balance and fund if necessary
  async checkAndFundWallet() {
    try {
      const balance = await this.getWalletBalance();
      const solBalance = balance / 1000000000; // Convert lamports to SOL

      logger.debug(`Government wallet balance: ${solBalance.toFixed(4)} SOL`);

      if (solBalance < this.minimumBalance) {
        await this.handleLowBalance(solBalance);
      } else if (solBalance < this.targetBalance) {
        await this.handleLowBalance(solBalance, false); // Warning only
      }
    } catch (error) {
      logger.error('Error checking wallet balance:', error);
    }
  }

  // Handle low balance situation
  async handleLowBalance(currentBalance, isCritical = true) {
    const now = Date.now();
    const walletAddress = this.governmentWallet.publicKey.toBase58();
    
    // Check if we've exceeded funding attempts
    const attempts = this.fundingAttempts.get(walletAddress) || [];
    const recentAttempts = attempts.filter(time => now - time < this.fundingAttemptWindow);
    
    if (recentAttempts.length >= this.maxFundingAttempts) {
      if (isCritical && now - this.lastNotificationTime > this.notificationCooldown) {
        this.sendCriticalNotification(currentBalance, 'Maximum funding attempts exceeded');
        this.lastNotificationTime = now;
      }
      return;
    }

    // Record this funding attempt
    this.fundingAttempts.set(walletAddress, [...recentAttempts, now]);

    if (isCritical) {
      logger.warn(`CRITICAL: Government wallet balance is critically low: ${currentBalance.toFixed(4)} SOL`);
      
      // Try to fund the wallet
      const funded = await this.fundWallet();
      
      if (funded) {
        logger.info('Wallet successfully funded');
        this.sendSuccessNotification();
      } else {
        logger.error('Failed to fund wallet');
        this.sendCriticalNotification(currentBalance, 'Failed to fund wallet automatically');
      }
    } else {
      logger.warn(`WARNING: Government wallet balance is low: ${currentBalance.toFixed(4)} SOL`);
      this.sendWarningNotification(currentBalance);
    }
  }

  // Attempt to fund the wallet
  async fundWallet() {
    try {
      if (solanaConfig.network !== 'devnet' && solanaConfig.network !== 'testnet') {
        logger.error('Cannot airdrop on mainnet. Manual funding required.');
        return false;
      }

      logger.info(`Requesting airdrop of ${this.airdropAmount} SOL...`);
      const signature = await this.connection.requestAirdrop(
        this.governmentWallet.publicKey,
        this.airdropAmount * 1000000000 // Convert SOL to lamports
      );

      // Wait for confirmation
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      const newBalance = await this.getWalletBalance();
      const newSolBalance = newBalance / 1000000000;
      
      logger.info(`Airdrop successful! New balance: ${newSolBalance.toFixed(4)} SOL`);
      return true;
    } catch (error) {
      logger.error('Airdrop failed:', error);
      return false;
    }
  }

  // Get current wallet balance
  async getWalletBalance() {
    try {
      return await this.connection.getBalance(this.governmentWallet.publicKey);
    } catch (error) {
      logger.error('Failed to get wallet balance:', error);
      throw error;
    }
  }

  // Send critical notification
  sendCriticalNotification(balance, reason) {
    const message = `🚨 CRITICAL: Government wallet balance is critically low!
    
Balance: ${balance.toFixed(4)} SOL
Minimum Required: ${this.minimumBalance} SOL
Reason: ${reason}
Network: ${solanaConfig.network}
Wallet: ${this.governmentWallet.publicKey.toBase58()}

This may cause vote failures. Please fund the wallet immediately!`;

    logger.error(message);
    console.error('\n' + '='.repeat(80));
    console.error(message);
    console.error('='.repeat(80) + '\n');
  }

  // Send warning notification
  sendWarningNotification(balance) {
    const message = `⚠️ WARNING: Government wallet balance is low!
    
Balance: ${balance.toFixed(4)} SOL
Target Balance: ${this.targetBalance} SOL
Network: ${solanaConfig.network}
Wallet: ${this.governmentWallet.publicKey.toBase58()}

Consider funding the wallet to prevent future issues.`;

    logger.warn(message);
    console.warn('\n' + '-'.repeat(60));
    console.warn(message);
    console.warn('-'.repeat(60) + '\n');
  }

  // Send success notification
  sendSuccessNotification() {
    const message = `✅ SUCCESS: Government wallet has been funded!
    
New balance: ${this.getWalletBalance().then(b => (b / 1000000000).toFixed(4))} SOL
Network: ${solanaConfig.network}
Wallet: ${this.governmentWallet.publicKey.toBase58()}`;

    logger.info(message);
    console.log('\n' + '✅'.repeat(20));
    console.log(message);
    console.log('✅'.repeat(20) + '\n');
  }

  // Get funding status
  async getFundingStatus() {
    try {
      const balance = await this.getWalletBalance();
      const solBalance = balance / 1000000000;
      
      return {
        isMonitoring: this.isMonitoring,
        currentBalance: solBalance,
        minimumBalance: this.minimumBalance,
        targetBalance: this.targetBalance,
        isLow: solBalance < this.minimumBalance,
        isWarning: solBalance < this.targetBalance && solBalance >= this.minimumBalance,
        network: solanaConfig.network,
        walletAddress: this.governmentWallet.publicKey.toBase58(),
        lastCheck: new Date().toISOString(),
        fundingAttempts: this.fundingAttempts.get(this.governmentWallet.publicKey.toBase58())?.length || 0
      };
    } catch (error) {
      logger.error('Error getting funding status:', error);
      throw error;
    }
  }

  // Force fund wallet (for manual triggers)
  async forceFundWallet() {
    logger.info('Manual wallet funding requested');
    return await this.fundWallet();
  }

  // Update funding parameters
  updateParameters(params) {
    if (params.minimumBalance !== undefined) {
      this.minimumBalance = params.minimumBalance;
      logger.info(`Updated minimum balance to ${this.minimumBalance} SOL`);
    }
    if (params.targetBalance !== undefined) {
      this.targetBalance = params.targetBalance;
      logger.info(`Updated target balance to ${this.targetBalance} SOL`);
    }
    if (params.airdropAmount !== undefined) {
      this.airdropAmount = params.airdropAmount;
      logger.info(`Updated airdrop amount to ${this.airdropAmount} SOL`);
    }
    if (params.checkInterval !== undefined) {
      this.checkInterval = params.checkInterval;
      logger.info(`Updated check interval to ${this.checkInterval}ms`);
    }
  }
}

module.exports = new WalletFundingService();

