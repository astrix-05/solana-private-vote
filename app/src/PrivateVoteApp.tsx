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
      const newPoll: Poll = {
        id: pollIdCounter,
        question: pollData.question,
        options: pollData.options,
        isActive: true,
        votes: 0,
        creator: publicKey,
        voters: [],
        expiryDate: pollData.expiryDate,
        isAnonymous: pollData.isAnonymous || false
      };

      setCreatedPolls(prev => [newPoll, ...prev]);
      setPollIdCounter(prev => prev + 1);
      setMessage(`Poll "${pollData.question}" created successfully!`);
      setSharePollId(newPoll.id);
      setShowShareModal(true);
    } catch (error) {
      setMessage('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (pollId: number, optionIndex: number) => {
    setCreatedPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const newVoters = [...(poll.voters || [])];
        if (!newVoters.includes(publicKey || '')) {
          newVoters.push(publicKey || '');
        }
        return {
          ...poll,
          votes: poll.votes + 1,
          voters: newVoters
        };
      }
      return poll;
    }));
    setMessage('Vote recorded successfully!');
  };

  const handleClosePoll = (pollId: number) => {
    setCreatedPolls(prev => prev.map(poll => 
      poll.id === pollId ? { ...poll, isActive: false } : poll
    ));
    setMessage('Poll closed successfully!');
  };

  const createDemoPoll = () => {
    const demoPoll: Poll = {
      id: pollIdCounter,
      question: "Demo Poll - What's your favorite feature?",
      options: ["Real-time voting", "Anonymous polls", "Mobile-friendly", "Blockchain security"],
      isActive: true,
      votes: 0,
      creator: 'demo',
      voters: [],
      isAnonymous: false
    };

    setCreatedPolls(prev => [demoPoll, ...prev]);
    setPollIdCounter(prev => prev + 1);
    setIsDemoMode(true);
    setMessage('Demo poll created! Try voting to see how it works.');
  };

  // Memoized active polls for voting
  const activePollsForVoting = useMemo(() => {
    return createdPolls.filter(poll => poll.isActive && !isPollExpired(poll));
  }, [createdPolls, isPollExpired]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-main)',
      paddingTop: isMobile ? '80px' : '100px',
      paddingBottom: isMobile ? '100px' : '0'
    }}>
      {/* Modern Header */}
      <header className="navbar">
        <div className="nav-content">
          <div className="nav-title">Private Vote</div>
          
          <div className="nav-icons">
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-muted)',
              marginRight: '16px'
            }}>
              {connected ? `Connected: ${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}` : 'Not Connected'}
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container">
        {/* Hero Section */}
        <div className="card" style={{ 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, var(--bg-card) 0%, #1a1a2e 100%)',
          border: '1px solid var(--accent-blue)',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            margin: '0 0 16px 0',
            background: 'var(--button-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Private Vote
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            margin: '0 0 32px 0'
          }}>
            Secure, transparent, and anonymous voting on Solana
          </p>
          
          {/* Wallet Status Badge */}
          {connected && publicKey && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'var(--btn-bg)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--accent-blue)',
              color: 'var(--accent-blue)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: 'var(--accent-green)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              Connected: {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
            </div>
          )}
        </div>

        {/* Wallet Funding Status */}
        <div className="card">
          <WalletFundingStatus showDetails={true} />
        </div>

        {/* Status Messages */}
        {message && message !== 'Welcome to Private Vote!' && !message.startsWith('Create a new poll') && (
          <div className={`status-${message.includes('success') ? 'success' : message.includes('error') ? 'error' : 'warning'}`}>
            {message}
          </div>
        )}

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="status-warning">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>🎮</span>
              <div>
                <strong>Demo Mode Active</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                  You're viewing a demonstration. Connect your wallet to create real polls.
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
          </div>
        )}

        {/* Wallet Connection Prompt */}
        {!connected && !isDemoMode && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ 
              fontSize: '2rem', 
              margin: '0 0 16px 0',
              color: 'var(--text-main)'
            }}>
              🔗 Connect Your Wallet
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'var(--text-muted)',
              margin: '0 0 32px 0'
            }}>
              Connect your Solana wallet to create polls, vote, and manage your voting sessions.
            </p>
            <button
              onClick={connect}
              className="btn-primary"
              style={{ fontSize: '18px', padding: '20px 40px' }}
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Try Demo Button */}
        {!isDemoMode && createdPolls.length === 0 && !connected && (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ 
              fontSize: '2rem', 
              margin: '0 0 16px 0',
              color: 'var(--text-main)'
            }}>
              🎮 Try Private Vote
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'var(--text-muted)',
              margin: '0 0 32px 0'
            }}>
              Experience the interface with a demo poll. No wallet connection required.
            </p>
            <button
              onClick={createDemoPoll}
              className="btn-primary"
              style={{ fontSize: '18px', padding: '20px 40px' }}
            >
              🎮 Try Demo
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="loading-spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              Processing your request...
            </p>
          </div>
        )}

        {/* Content Area */}
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
            <h2 style={{ color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              No polls available
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Click "Create" to get started with your first poll.
            </p>
          </div>
        )}
      </div>

      {/* Modern Navigation */}
      <SimplifiedNavigation 
        currentView={viewMode} 
        onViewChange={(view) => {
          setViewMode(view);
          setMessage(`Switched to ${view} view`);
        }}
        isMobile={isMobile}
      />

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