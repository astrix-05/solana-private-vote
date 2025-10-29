import React, { useState, useMemo, useCallback } from 'react';
import CreatePollFixed from './components/CreatePollFixed';
import VotePollFixed from './components/VotePollFixed';
import ManagePollsFixed from './components/ManagePollsFixed';
import ResultsFixed from './components/ResultsFixed';
import SharePoll from './components/SharePoll';
import SimplifiedNavigation from './components/SimplifiedNavigation';
import WalletFundingStatus from './components/WalletFundingStatus';
import { useWallet, WalletButton } from './contexts/WalletProvider';
import { useIsMobile } from './hooks/useIsMobile';

type ViewMode = 'create' | 'vote' | 'manage' | 'results';

interface Poll {
  id: number;
  question: string;
  options: string[];
  isActive: boolean;
  votes: number;
  creator?: string;
  voters?: string[];
  expiryDate?: number; // Unix timestamp in milliseconds
  isAnonymous?: boolean; // Whether votes are anonymous
}

function PrivateVoteApp() {
  const { connected, publicKey, connect } = useWallet();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState('Welcome to Private Vote!');
  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [pollIdCounter, setPollIdCounter] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePollId, setSharePollId] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Memoized check function with current timestamp
  const isPollExpired = useCallback((poll: Poll, currentTime: number = Date.now()): boolean => {
    if (!poll.expiryDate) return false;
    return currentTime > poll.expiryDate;
  }, []);

  const handleCreatePoll = async (pollData: { question: string; options: string[]; expiryDate?: number; isAnonymous?: boolean }) => {
    if (!connected || !publicKey) {
      setMessage('Please connect your wallet to create a poll.');
      return;
    }

    setLoading(true);
    try {
      // Simulate transaction signing (in real app, this would be a blockchain transaction)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    const newPoll: Poll = {
        question: pollData.question,
        options: pollData.options,
      id: pollIdCounter,
      isActive: true,
        votes: 0,
        creator: publicKey,
        voters: [],
        expiryDate: pollData.expiryDate,
        isAnonymous: pollData.isAnonymous || false
      };
      
    setCreatedPolls([...createdPolls, newPoll]);
    setPollIdCounter(pollIdCounter + 1);
      setMessage(`✅ Poll created by wallet: ${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`);
      
      // Show share modal for the newly created poll
      setSharePollId(pollIdCounter);
      setShowShareModal(true);
    setViewMode('manage');
    } catch (error) {
      setMessage('Failed to create poll. Please try again.');
      console.error('Error creating poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: number, optionIndex: number) => {
    if (!connected || !publicKey) {
      if (!isDemoMode) {
        setMessage('Please connect your wallet to vote.');
        return;
      }
      // In demo mode, use a mock public key
    }

    const poll = createdPolls.find(p => p.id === pollId);
    if (!poll) {
      setMessage('Poll not found.');
      return;
    }

    if (!poll.isActive) {
      setMessage('This poll is no longer accepting votes.');
      return;
    }

    // Check if poll has expired
    if (isPollExpired(poll)) {
      setMessage('This poll has expired and is no longer accepting votes.');
      // Auto-close expired poll
      setCreatedPolls(prev =>
        prev.map(p =>
          p.id === pollId ? { ...p, isActive: false } : p
        )
      );
      return;
    }

    // Check if user already voted (using hashed address for anonymous polls)
    const currentPublicKey = isDemoMode ? 'demo_user_12345' : (publicKey || '');
    const voterId = poll.isAnonymous ? 
      `hash_${currentPublicKey.slice(0, 8)}${currentPublicKey.slice(-8)}` : 
      currentPublicKey;
    
    if (poll.voters && poll.voters.includes(voterId)) {
      setMessage('You have already voted on this poll.');
      return;
    }

    setLoading(true);
    try {
      // Simulate transaction signing (in real app, this would be a blockchain transaction)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCreatedPolls(prev => 
        prev.map(p => 
          p.id === pollId 
            ? { 
                ...p, 
                votes: p.votes + 1,
                voters: [...(p.voters || []), voterId]
              } 
            : p
        )
      );
      
      const anonymityText = poll.isAnonymous ? ' (anonymously)' : '';
      const demoText = isDemoMode ? ' (demo)' : '';
      setMessage(`✅ Vote cast${anonymityText}${demoText}! You selected: "${poll.options[optionIndex]}"`);
    } catch (error) {
      setMessage('Failed to cast vote. Please try again.');
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePoll = async (pollId: number) => {
    if (!connected || !publicKey) {
      setMessage('Please connect your wallet to close a poll.');
      return;
    }

    const poll = createdPolls.find(p => p.id === pollId);
    if (!poll) {
      setMessage('Poll not found.');
      return;
    }

    // Only poll creator can close the poll
    if (poll.creator && poll.creator !== publicKey) {
      setMessage('Only the poll creator can close this poll.');
      return;
    }

    setLoading(true);
    try {
      // Simulate transaction signing (in real app, this would be a blockchain transaction)
      await new Promise(resolve => setTimeout(resolve, 500));
      
    setCreatedPolls(prev => 
      prev.map(p => 
        p.id === pollId ? { ...p, isActive: false } : p
      )
    );
      
      setMessage('✅ Poll closed successfully!');
    } catch (error) {
      setMessage('Failed to close poll. Please try again.');
      console.error('Error closing poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDemoPoll = () => {
    const demoPoll: Poll = {
      id: pollIdCounter,
      question: "What's your favorite programming language?",
      options: ["JavaScript", "TypeScript", "Rust", "Python", "Go"],
      isActive: true,
      votes: 0,
      creator: "demo_wallet_123456789",
      voters: [],
      expiryDate: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
      isAnonymous: false
    };

    // Simulate some auto-votes
    const mockVoters = [
      "demo_voter_1",
      "demo_voter_2", 
      "demo_voter_3",
      "demo_voter_4",
      "demo_voter_5"
    ];

    const voteCounts = [2, 1, 1, 1, 0]; // Vote distribution
    const allVoters: string[] = [];
    
    voteCounts.forEach((count, optionIndex) => {
      for (let i = 0; i < count; i++) {
        allVoters.push(`${mockVoters[allVoters.length]}_option_${optionIndex}`);
      }
    });

    const demoPollWithVotes = {
      ...demoPoll,
      votes: allVoters.length,
      voters: allVoters
    };

    setCreatedPolls([demoPollWithVotes]);
    setPollIdCounter(pollIdCounter + 1);
    setIsDemoMode(true);
    setMessage('🎮 Demo poll created! This is a demonstration with mock data.');
    setViewMode('vote');
  };

  // Memoized filtered polls for performance
  const activePollsForVoting = useMemo(() => {
    return createdPolls.filter(p => p.isActive && !isPollExpired(p));
  }, [createdPolls, isPollExpired]);

  return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        paddingLeft: isMobile ? '0' : '60px',
        paddingBottom: isMobile ? '80px' : '0',
        color: 'var(--text-main)',
        lineHeight: '1.6'
      }}>
      {/* Simplified Navigation */}
      <SimplifiedNavigation 
        currentView={viewMode} 
        onViewChange={(view) => {
          setViewMode(view);
          setMessage(`Switched to ${view} view`);
        }}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div className="container">
        {/* Header */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h1>Private Vote</h1>
          <p>Secure voting on Solana</p>
          
          {/* Wallet Status */}
          {connected && publicKey && (
            <div style={{
              marginTop: '16px',
              display: 'inline-block',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              padding: '8px 16px',
              background: 'var(--bg-main)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-grey)'
            }}>
              Connected: {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
            </div>
          )}
        </div>

        {/* Wallet Funding Status */}
        <div className="card">
          <WalletFundingStatus showDetails={true} />
        </div>
          
        {/* Loading Indicator */}
        {loading && (
          <div className="card" style={{ textAlign: 'center' }}>
            <p>Processing...</p>
          </div>
        )}
      </div>

        {/* Wallet Button - Desktop only */}
        {!isMobile && (
          <div style={{ 
            position: 'absolute',
            top: '20px',
            right: '20px'
          }}>
            <WalletButton />
          </div>
        )}

        {/* Mobile Wallet Button */}
        {isMobile && (
          <div style={{ 
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 1001
          }}>
            <WalletButton />
          </div>
        )}

      {/* Success Message */}
      {message && message !== 'Welcome to Private Vote!' && !message.startsWith('Create a new poll') && (
        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <p>{message}</p>
          </div>
        </div>
      )}

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="container">
          <div className="card" style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px',
            background: '#e3f2fd'
          }}>
            <span style={{ fontSize: '20px' }}>🎮</span>
            <div>
              <strong style={{ color: 'var(--button-primary)', fontSize: '1rem' }}>Demo Mode</strong>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                You're viewing a demonstration with mock data. Connect your wallet to create real polls.
              </p>
            </div>
            <button
              onClick={() => {
                setIsDemoMode(false);
                setCreatedPolls([]);
                setMessage('Demo mode disabled. Connect your wallet to create real polls.');
              }}
              className="btn-secondary"
              style={{ marginLeft: 'auto' }}
            >
              Exit Demo
            </button>
        </div>
        )}

        {/* Wallet Connection Prompt - Show when not connected and not in demo mode */}
        {!connected && !isDemoMode && (
          <div className="container">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>🔗 Connect Your Wallet</h3>
              <p>
                Connect your Solana wallet to create polls, vote, and manage your voting sessions.
              </p>
              <button
                onClick={connect}
                className="btn-primary"
              >
                Connect Wallet
              </button>
      </div>
        )}

        {/* Try Demo Button - Show when no polls and not in demo mode */}
      {!isDemoMode && createdPolls.length === 0 && !connected && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--bg-card)',
          marginBottom: '32px',
          border: '1px solid var(--border-light)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-subtle)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Try Private Vote
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '0 0 20px 0',
            lineHeight: '1.4'
          }}>
            Experience the interface with a demo poll. No wallet connection required.
          </p>
          <button
            onClick={createDemoPoll}
            style={{
              padding: '12px 24px',
              background: 'var(--bg-button)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = 'var(--accent-primary)'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = 'var(--bg-button)'}
          >
            🎮 Try Demo
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="container">
        {viewMode === 'create' ? (
          <div className="card">
            <CreatePollFixed 
              onSubmit={handleCreatePoll} 
              loading={loading}
              creatorPublicKey={publicKey?.toString()}
              isDemoMode={isDemoMode}
            />
          </div>
        ) : viewMode === 'vote' ? (
          <div className="card">
            <VotePollFixed 
              polls={activePollsForVoting} 
              onVote={handleVote} 
              isDemoMode={isDemoMode}
              voterPublicKey={publicKey?.toString()}
            />
          </div>
        ) : viewMode === 'manage' && createdPolls.length > 0 ? (
          <div className="card">
            <ManagePollsFixed 
              polls={createdPolls.filter(poll => poll.creator === publicKey)} 
              onClosePoll={handleClosePoll} 
            />
          </div>
        ) : viewMode === 'results' && createdPolls.length > 0 ? (
          <div className="card">
            <ResultsFixed polls={createdPolls} isPollExpired={isPollExpired} />
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <p>No polls created yet. Click "Create" to get started.</p>
          </div>
        )}
      </div>

      {/* Share Poll Modal */}
      {showShareModal && sharePollId && (
        <SharePoll
          pollId={sharePollId || 0}
          pollQuestion={createdPolls.find(p => p.id === sharePollId)?.question || ''}
          onClose={() => {
            setShowShareModal(false);
            setSharePollId(null);
          }}
        />
      )}
    </div>
  );
}

export default PrivateVoteApp;
