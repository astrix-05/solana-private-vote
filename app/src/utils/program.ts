import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { WalletContextType } from '../types';

// Program ID from the smart contract
const PROGRAM_ID = new PublicKey('7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ');

export interface ProgramService {
  createPoll: (question: string, options: string[]) => Promise<string>;
  vote: (pollAddress: string, encryptedData: number[]) => Promise<string>;
  closePoll: (pollAddress: string) => Promise<string>;
  revealResults: (pollAddress: string) => Promise<string>;
  getPoll: (pollAddress: string) => Promise<any>;
  getVote: (pollAddress: string, voterAddress: string) => Promise<any>;
}

export class SolanaProgramService implements ProgramService {
  private program: Program<any>;
  private connection: Connection;
  private wallet: WalletContextType;

  constructor(connection: Connection, wallet: WalletContextType) {
    this.connection = connection;
    this.wallet = wallet;
    
    // Initialize the program
    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { preflightCommitment: 'confirmed' }
    );
    
    // In a real implementation, you would load the IDL here
    this.program = new Program({} as any, provider);
  }

  async createPoll(question: string, options: string[]): Promise<string> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Find the poll PDA
      const [pollPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('poll'), this.wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );

      // Create the transaction
      const transaction = new web3.Transaction().add(
        new web3.TransactionInstruction({
          keys: [
            { pubkey: pollPDA, isSigner: false, isWritable: true },
            { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: PROGRAM_ID,
          data: Buffer.from([]), // In real implementation, this would be serialized instruction data
        })
      );

      // Sign and send transaction
      const signedTransaction = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Failed to create poll:', error);
      throw error;
    }
  }

  async vote(pollAddress: string, encryptedData: number[]): Promise<string> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const pollPubkey = new PublicKey(pollAddress);
      
      // Find the vote PDA
      const [votePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), pollPubkey.toBuffer(), this.wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );

      // Create the transaction
      const transaction = new web3.Transaction().add(
        new web3.TransactionInstruction({
          keys: [
            { pubkey: pollPubkey, isSigner: false, isWritable: true },
            { pubkey: votePDA, isSigner: false, isWritable: true },
            { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: PROGRAM_ID,
          data: Buffer.from([]), // In real implementation, this would be serialized instruction data
        })
      );

      // Sign and send transaction
      const signedTransaction = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Failed to vote:', error);
      throw error;
    }
  }

  async closePoll(pollAddress: string): Promise<string> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const pollPubkey = new PublicKey(pollAddress);

      // Create the transaction
      const transaction = new web3.Transaction().add(
        new web3.TransactionInstruction({
          keys: [
            { pubkey: pollPubkey, isSigner: false, isWritable: true },
            { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
          ],
          programId: PROGRAM_ID,
          data: Buffer.from([]), // In real implementation, this would be serialized instruction data
        })
      );

      // Sign and send transaction
      const signedTransaction = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Failed to close poll:', error);
      throw error;
    }
  }

  async revealResults(pollAddress: string): Promise<string> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const pollPubkey = new PublicKey(pollAddress);

      // Create the transaction
      const transaction = new web3.Transaction().add(
        new web3.TransactionInstruction({
          keys: [
            { pubkey: pollPubkey, isSigner: false, isWritable: true },
          ],
          programId: PROGRAM_ID,
          data: Buffer.from([]), // In real implementation, this would be serialized instruction data
        })
      );

      // Sign and send transaction
      const signedTransaction = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Failed to reveal results:', error);
      throw error;
    }
  }

  async getPoll(pollAddress: string): Promise<any> {
    try {
      const pollPubkey = new PublicKey(pollAddress);
      const accountInfo = await this.connection.getAccountInfo(pollPubkey);
      
      if (!accountInfo) {
        throw new Error('Poll not found');
      }

      // In a real implementation, you would deserialize the account data here
      // For now, return mock data
      return {
        creator: this.wallet.publicKey?.toString(),
        question: 'Sample Poll Question',
        options: ['Option 1', 'Option 2', 'Option 3'],
        isActive: true,
        totalVotes: 0,
        voteCounts: [0, 0, 0],
        createdAt: Date.now() / 1000,
        closedAt: null,
      };
    } catch (error) {
      console.error('Failed to get poll:', error);
      throw error;
    }
  }

  async getVote(pollAddress: string, voterAddress: string): Promise<any> {
    try {
      const pollPubkey = new PublicKey(pollAddress);
      const voterPubkey = new PublicKey(voterAddress);
      
      // Find the vote PDA
      const [votePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), pollPubkey.toBuffer(), voterPubkey.toBuffer()],
        PROGRAM_ID
      );

      const accountInfo = await this.connection.getAccountInfo(votePDA);
      
      if (!accountInfo) {
        return null; // Vote doesn't exist
      }

      // In a real implementation, you would deserialize the account data here
      return {
        poll: pollAddress,
        voter: voterAddress,
        encryptedData: [],
        createdAt: Date.now() / 1000,
      };
    } catch (error) {
      console.error('Failed to get vote:', error);
      throw error;
    }
  }
}
