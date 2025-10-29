// API service for communicating with the backend relayer
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const API_KEY = process.env.REACT_APP_API_KEY || 'your_api_key_change_in_production_67890';

export interface VoteRequest {
  voterPublicKey: string;
  pollId: string;
  voteChoice: number;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  transactionSignature?: string;
  blockchainConfirmed?: boolean;
  error?: string;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  creator: string;
  isAnonymous?: boolean;
  expiryDate?: string;
}

export interface CreatePollResponse {
  success: boolean;
  pollId: string;
  poll: any;
  transactionSignature?: string;
  blockchainConfirmed?: boolean;
  error?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  creator: string;
  isActive: boolean;
  isAnonymous: boolean;
  expiryDate?: string;
  createdAt: string;
  voteCounts: number[];
}

export interface PollResults {
  pollId: string;
  question: string;
  options: Array<{
    text: string;
    votes: number;
    percentage: string;
  }>;
  totalVotes: number;
  isActive: boolean;
  isAnonymous: boolean;
  createdAt: string;
}

class ApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.apiKey = API_KEY;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Vote on a poll using the relayer
  async vote(voteData: VoteRequest): Promise<VoteResponse> {
    return this.makeRequest<VoteResponse>('/vote', {
      method: 'POST',
      body: JSON.stringify(voteData),
    });
  }

  // Create a new poll
  async createPoll(pollData: CreatePollRequest): Promise<CreatePollResponse> {
    return this.makeRequest<CreatePollResponse>('/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  }

  // Get all polls
  async getAllPolls(): Promise<{ success: boolean; polls: Poll[] }> {
    return this.makeRequest<{ success: boolean; polls: Poll[] }>('/polls');
  }

  // Get poll details
  async getPoll(pollId: string): Promise<{ success: boolean; poll: Poll }> {
    return this.makeRequest<{ success: boolean; poll: Poll }>(`/polls/${pollId}`);
  }

  // Get poll results
  async getPollResults(pollId: string): Promise<{ success: boolean; results: PollResults }> {
    return this.makeRequest<{ success: boolean; results: PollResults }>(`/polls/${pollId}/results`);
  }

  // Get polls by creator
  async getPollsByCreator(creatorAddress: string): Promise<{ success: boolean; polls: Poll[] }> {
    return this.makeRequest<{ success: boolean; polls: Poll[] }>(`/polls/creator/${creatorAddress}`);
  }

  // Close a poll
  async closePoll(pollId: string, creatorAddress: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest<{ success: boolean; message: string }>(`/polls/${pollId}/close`, {
      method: 'POST',
      body: JSON.stringify({ creatorAddress }),
    });
  }

  // Get government wallet info
  async getWalletInfo(): Promise<{ success: boolean; wallet: any }> {
    return this.makeRequest<{ success: boolean; wallet: any }>('/wallet');
  }

  // Get Solana wallet info
  async getSolanaWalletInfo(): Promise<{ success: boolean; wallet: any }> {
    return this.makeRequest<{ success: boolean; wallet: any }>('/solana/wallet');
  }

  // Get wallet balance
  async getWalletBalance(): Promise<{ success: boolean; hasEnoughFunds: boolean; balance: number; message: string }> {
    return this.makeRequest<{ success: boolean; hasEnoughFunds: boolean; balance: number; message: string }>('/wallet/balance');
  }

  // Request airdrop (devnet only)
  async requestAirdrop(lamports: number = 1000000000): Promise<{ success: boolean; signature?: string; message: string }> {
    return this.makeRequest<{ success: boolean; signature?: string; message: string }>('/wallet/airdrop', {
      method: 'POST',
      body: JSON.stringify({ lamports }),
    });
  }

  // Get transaction status
  async getTransactionStatus(signature: string): Promise<{ success: boolean; signature: string; status: string; err?: any; slot?: number }> {
    return this.makeRequest<{ success: boolean; signature: string; status: string; err?: any; slot?: number }>(`/transaction/${signature}`);
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; status: string; timestamp: string; uptime: number; governmentWallet: any; version: string }> {
    return this.makeRequest<{ success: boolean; status: string; timestamp: string; uptime: number; governmentWallet: any; version: string }>('/health');
  }
}

export default new ApiService();
