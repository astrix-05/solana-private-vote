import { PublicKey } from '@solana/web3.js';

export interface Poll {
  creator: PublicKey;
  question: string;
  options: string[];
  isActive: boolean;
  totalVotes: number;
  voteCounts: number[];
  createdAt: number;
  closedAt: number | null;
}

export interface Vote {
  poll: PublicKey;
  voter: PublicKey;
  encryptedData: number[];
  createdAt: number;
}

export interface CreatePollData {
  question: string;
  options: string[];
}

export interface VoteData {
  pollAddress: string;
  selectedOption: number;
  encryptedData: number[];
}

export interface PollFormData {
  question: string;
  options: string[];
}

export interface WalletContextType {
  publicKey: PublicKey | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: <T>(transaction: T) => Promise<T>;
  signAllTransactions: <T>(transactions: T[]) => Promise<T[]>;
}

export interface ArciumContextType {
  isInitialized: boolean;
  encryptVote: (voteData: string) => Promise<number[]>;
  decryptVote: (encryptedData: number[]) => Promise<string>;
  initialize: () => Promise<void>;
}

export interface AppState {
  polls: Poll[];
  loading: boolean;
  error: string | null;
  success: string | null;
}

export type ViewMode = 'create' | 'vote' | 'manage' | 'results';

export interface NotificationState {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
