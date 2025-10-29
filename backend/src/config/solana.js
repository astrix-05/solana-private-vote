const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const bs58 = require('bs58');
require('dotenv').config();

class SolanaConfig {
  constructor() {
    this.network = process.env.SOLANA_NETWORK || 'devnet';
    this.rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.wsUrl = process.env.SOLANA_WS_URL || 'wss://api.devnet.solana.com';
    
    // Initialize connection
    this.connection = new Connection(this.rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: this.wsUrl
    });
    
    // Initialize government wallet
    this.governmentWallet = this.initializeGovernmentWallet();
  }

  initializeGovernmentWallet() {
    try {
      const privateKey = process.env.GOVERNMENT_WALLET_PRIVATE_KEY;
      
      if (!privateKey) {
        console.warn('⚠️  GOVERNMENT_WALLET_PRIVATE_KEY not found. Generating new wallet...');
        const newWallet = Keypair.generate();
        console.log('🔑 New Government Wallet Generated:');
        console.log('Public Key:', newWallet.publicKey.toString());
        console.log('Private Key (Base58):', bs58.encode(newWallet.secretKey));
        console.log('⚠️  IMPORTANT: Save this private key securely and fund the wallet!');
        return newWallet;
      }

      // Parse private key from base58
      const secretKey = bs58.decode(privateKey);
      const keypair = Keypair.fromSecretKey(secretKey);
      
      console.log('✅ Government wallet loaded:', keypair.publicKey.toString());
      return keypair;
      
    } catch (error) {
      console.error('❌ Error initializing government wallet:', error.message);
      throw new Error('Failed to initialize government wallet');
    }
  }

  async getWalletBalance() {
    try {
      const balance = await this.connection.getBalance(this.governmentWallet.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  async getWalletInfo() {
    const balance = await this.getWalletBalance();
    return {
      publicKey: this.governmentWallet.publicKey.toString(),
      balance: balance,
      network: this.network,
      rpcUrl: this.rpcUrl
    };
  }

  async fundWalletIfNeeded() {
    const balance = await this.getWalletBalance();
    
    if (balance < 0.1) { // Less than 0.1 SOL
      console.log(`💰 Wallet balance is low (${balance} SOL). Consider funding the wallet.`);
      
      if (this.network === 'devnet') {
        console.log('🔗 Airdrop SOL from devnet faucet:');
        console.log(`https://faucet.solana.com/?address=${this.governmentWallet.publicKey.toString()}`);
      }
    }
    
    return balance;
  }
}

module.exports = new SolanaConfig();
