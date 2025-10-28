/**
 * Arcium Integration Entry Point
 * 
 * This module provides the main interface for integrating Arcium encryption
 * with the private voting system.
 */

import { arciumEncryption, VoteData, EncryptedVote } from './encryption';

export { arciumEncryption, VoteData, EncryptedVote };

/**
 * Main Arcium service class
 */
export class ArciumService {
  private encryption = arciumEncryption;

  /**
   * Encrypt a vote for submission to the blockchain
   */
  async encryptVote(voteData: VoteData): Promise<EncryptedVote> {
    return await this.encryption.encryptVote(voteData);
  }

  /**
   * Decrypt a vote from the blockchain
   */
  async decryptVote(encryptedVote: EncryptedVote): Promise<VoteData> {
    return await this.encryption.decryptVote(encryptedVote);
  }

  /**
   * Verify the integrity of an encrypted vote
   */
  async verifyVote(encryptedVote: EncryptedVote): Promise<boolean> {
    return await this.encryption.verifyVote(encryptedVote);
  }

  /**
   * Get the current status of the encryption service
   */
  getStatus() {
    return this.encryption.getStatus();
  }

  /**
   * Create a vote data object
   */
  createVoteData(option: number, pollId: string, voterId: string): VoteData {
    return {
      option,
      timestamp: Date.now(),
      pollId,
      voterId
    };
  }

  /**
   * Convert encrypted vote to bytes for blockchain storage
   */
  async encryptVoteForBlockchain(voteData: VoteData): Promise<number[]> {
    const encryptedVote = await this.encryptVote(voteData);
    return Array.from(encryptedVote.encryptedData);
  }

  /**
   * Convert bytes from blockchain to encrypted vote
   */
  async decryptVoteFromBlockchain(encryptedData: number[], pollId: string, voterId: string): Promise<VoteData> {
    const encryptedVote: EncryptedVote = {
      encryptedData: new Uint8Array(encryptedData),
      publicKey: new (global as any).PublicKey('11111111111111111111111111111112'), // Mock public key
      signature: new Uint8Array(64) // Mock signature
    };
    
    return await this.decryptVote(encryptedVote);
  }
}

// Export singleton instance
export const arciumService = new ArciumService();

// Example usage
if (require.main === module) {
  (async () => {
    console.log('Arcium Integration Demo');
    console.log('======================');
    
    // Initialize service
    const service = new ArciumService();
    console.log('Service status:', service.getStatus());
    
    // Create sample vote data
    const voteData = service.createVoteData(1, 'poll-123', 'voter-456');
    console.log('Original vote data:', voteData);
    
    // Encrypt vote
    const encryptedVote = await service.encryptVote(voteData);
    console.log('Encrypted vote data length:', encryptedVote.encryptedData.length);
    
    // Decrypt vote
    const decryptedVote = await service.decryptVote(encryptedVote);
    console.log('Decrypted vote data:', decryptedVote);
    
    // Verify vote
    const isValid = await service.verifyVote(encryptedVote);
    console.log('Vote is valid:', isValid);
    
    // Test blockchain integration
    const blockchainData = await service.encryptVoteForBlockchain(voteData);
    console.log('Blockchain data length:', blockchainData.length);
    
    const fromBlockchain = await service.decryptVoteFromBlockchain(blockchainData, 'poll-123', 'voter-456');
    console.log('Data from blockchain:', fromBlockchain);
  })();
}
