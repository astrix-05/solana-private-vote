import React, { useState } from 'react';
import CreatePollFixed from './components/CreatePollFixed';
import VotePollFixed from './components/VotePollFixed';
import ManagePollsFixed from './components/ManagePollsFixed';
import ResultsFixed from './components/ResultsFixed';
import { useWallet, WalletButton } from './contexts/WalletProvider';

type ViewMode = 'create' | 'view' | 'vote' | 'manage' | 'results';

interface Poll {
  id: number;
  question: string;
  options: string[];
  isActive: boolean;
  votes: number;
  creator?: string;
  voters?: string[];
}

function PrivateVoteApp() {
  const { connected, publicKey } = useWallet();
  const [message, setMessage] = useState('Welcome to Private Vote!');
  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [pollIdCounter, setPollIdCounter] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleCreatePoll = async (pollData: { question: string; options: string[] }) => {
    if (!connected || !publicKey) {
      setMessage('Please connect your wallet to create a poll.');
      return;
    }

    setLoading(true);
    try {
      // Simulate transaction signing (in real app, this would be a blockchain transaction)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPoll: Poll = {
        ...pollData,
        id: pollIdCounter,
        isActive: true,
        votes: 0,
        creator: publicKey,
        voters: []
      };
      
      setCreatedPolls([...createdPolls, newPoll]);
      setPollIdCounter(pollIdCounter + 1);
      setMessage(`✅ Poll created by wallet: ${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`);
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
      setMessage('Please connect your wallet to vote.');
      return;
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

    // Check if user already voted
    if (poll.voters && poll.voters.includes(publicKey)) {
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
                voters: [...(p.voters || []), publicKey!]
              } 
            : p
        )
      );
      
      setMessage(`✅ Vote cast! You selected: "${poll.options[optionIndex]}"`);
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
        {/* Wallet Button - Top Right */}
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <WalletButton />
        </div>
        
        <h1 style={{ 
          fontSize: '42px', 
          color: 'white',
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          🗳️ Private Vote
        </h1>
        <p style={{ color: 'white', fontSize: '18px', opacity: 0.9 }}>
          Secure voting system on Solana
        </p>
        
        {/* Wallet Status */}
        {connected && (
          <div style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            display: 'inline-block',
            fontSize: '14px',
            color: 'white'
          }}>
            ✓ Wallet Connected
          </div>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div style={{
            marginTop: '10px',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.3)',
            borderRadius: '20px',
            display: 'inline-block',
            fontSize: '14px',
            color: 'white',
            animation: 'pulse 2s infinite'
          }}>
            ⏳ Processing transaction...
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => {
            setViewMode('create');
            setMessage('Create a new poll');
          }}
          style={{
            padding: '12px 24px',
            background: viewMode === 'create' ? 'white' : 'rgba(255,255,255,0.2)',
            color: viewMode === 'create' ? '#667eea' : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'all 0.3s'
          }}
        >
          Create Poll
        </button>
        <button
          onClick={() => {
            setViewMode('vote');
            setMessage(`${createdPolls.length} poll(s) available`);
          }}
          style={{
            padding: '12px 24px',
            background: viewMode === 'vote' ? 'white' : 'rgba(255,255,255,0.2)',
            color: viewMode === 'vote' ? '#667eea' : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'all 0.3s'
          }}
        >
          Vote ({createdPolls.length})
        </button>
        <button
          onClick={() => {
            setViewMode('manage');
            setMessage(`Manage your ${createdPolls.length} poll(s)`);
          }}
          style={{
            padding: '12px 24px',
            background: viewMode === 'manage' && createdPolls.length > 0 ? 'white' : 'rgba(255,255,255,0.2)',
            color: viewMode === 'manage' && createdPolls.length > 0 ? '#667eea' : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'all 0.3s'
          }}
        >
          Manage ({createdPolls.length})
        </button>
        <button
          onClick={() => {
            setViewMode('results');
            setMessage('View detailed voting results');
          }}
          style={{
            padding: '12px 24px',
            background: viewMode === 'results' && createdPolls.length > 0 ? 'white' : 'rgba(255,255,255,0.2)',
            color: viewMode === 'results' && createdPolls.length > 0 ? '#667eea' : 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            transition: 'all 0.3s'
          }}
        >
          Results
        </button>
      </div>

      {/* Success Message */}
      {message && message !== 'Welcome to Private Vote!' && (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 20px',
          padding: '15px',
          background: 'rgba(76, 175, 80, 0.9)',
          color: 'white',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '16px'
        }}>
          ✅ {message}
        </div>
      )}

      {/* Content Area */}
      {viewMode === 'create' ? (
        <CreatePollFixed onSubmit={handleCreatePoll} loading={loading} />
      ) : viewMode === 'vote' ? (
        <VotePollFixed polls={createdPolls.filter(p => p.isActive)} onVote={handleVote} />
      ) : viewMode === 'manage' && createdPolls.length > 0 ? (
        <ManagePollsFixed polls={createdPolls} onClosePoll={handleClosePoll} />
      ) : viewMode === 'results' && createdPolls.length > 0 ? (
        <ResultsFixed polls={createdPolls} />
      ) : viewMode === 'view' && createdPolls.length > 0 ? (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'grid',
          gap: '20px'
        }}>
          {createdPolls.map((poll, index) => (
            <div key={index} style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{ 
                fontSize: '24px', 
                marginBottom: '15px',
                color: '#333'
              }}>
                {poll.question}
              </h3>
              <div style={{ marginTop: '15px' }}>
                <strong style={{ color: '#666' }}>Options:</strong>
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  {poll.options.map((option, optIndex) => (
                    <li key={optIndex} style={{ 
                      marginBottom: '8px',
                      color: '#555',
                      fontSize: '16px'
                    }}>
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: '#f0f4ff',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#666'
              }}>
                <strong>Status:</strong> Active • <strong>Votes:</strong> 0
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          padding: '40px',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '18px', color: '#666' }}>
            No polls created yet. Click "Create Poll" to get started!
          </p>
        </div>
      )}
    </div>
  );
}

export default PrivateVoteApp;
