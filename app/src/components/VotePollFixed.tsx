import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import apiService, { VoteRequest, VoteResponse } from '../services/apiService';

interface VotePollFixedProps {
  polls: Array<{
    question: string;
    options: string[];
    id: number;
    expiryDate?: number;
    isAnonymous?: boolean;
  }>;
  onVote: (pollId: number, optionIndex: number) => void;
  isDemoMode?: boolean;
  voterPublicKey?: string;
}

const VotePollFixed: React.FC<VotePollFixedProps> = ({ polls, onVote, isDemoMode = false, voterPublicKey }) => {
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: number]: number | null }>({});
  const [votedPolls, setVotedPolls] = useState<{ [pollId: number]: number }>({});
  const [votingStates, setVotingStates] = useState<{ [pollId: number]: 'idle' | 'voting' | 'success' | 'error' }>({});
  const [voteConfirmations, setVoteConfirmations] = useState<{ [pollId: number]: VoteResponse }>({});

  const handleOptionSelect = (pollId: number, optionIndex: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [pollId]: optionIndex
    }));
  };

  const handleSubmitVote = async (pollId: number) => {
    const selectedOption = selectedOptions[pollId];
    if (selectedOption === undefined || selectedOption === null) return;

    // Set voting state
    setVotingStates(prev => ({
      ...prev,
      [pollId]: 'voting'
    }));

    try {
      if (isDemoMode || !voterPublicKey) {
        // Demo mode - just call the local onVote
        onVote(pollId, selectedOption);
        setVotedPolls(prev => ({
          ...prev,
          [pollId]: selectedOption
        }));
        setVotingStates(prev => ({
          ...prev,
          [pollId]: 'success'
        }));
        setVoteConfirmations(prev => ({
          ...prev,
          [pollId]: {
            success: true,
            message: 'Demo vote recorded locally',
            blockchainConfirmed: false
          }
        }));
      } else {
        // Real voting - use relayer
        const voteRequest: VoteRequest = {
          voterPublicKey,
          pollId: pollId.toString(),
          voteChoice: selectedOption
        };

        const response = await apiService.vote(voteRequest);
        
        if (response.success) {
          // Update local state
          onVote(pollId, selectedOption);
          setVotedPolls(prev => ({
            ...prev,
            [pollId]: selectedOption
          }));
          setVotingStates(prev => ({
            ...prev,
            [pollId]: 'success'
          }));
          setVoteConfirmations(prev => ({
            ...prev,
            [pollId]: response
          }));
        } else {
          throw new Error(response.message || 'Vote failed');
        }
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      setVotingStates(prev => ({
        ...prev,
        [pollId]: 'error'
      }));
      setVoteConfirmations(prev => ({
        ...prev,
        [pollId]: {
          success: false,
          message: error instanceof Error ? error.message : 'Vote failed',
          blockchainConfirmed: false
        }
      }));
    } finally {
      // Clear selection after voting attempt
      setSelectedOptions(prev => ({
        ...prev,
        [pollId]: null
      }));
    }
  };

  if (polls.length === 0) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '40px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-subtle)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
          No active polls available. Create a poll first!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h2 style={{
        fontSize: '28px',
        marginBottom: '30px',
        color: 'var(--text-primary)'
      }}>
        Active Polls - Cast Your Vote
      </h2>

      <div style={{ display: 'grid', gap: '25px' }}>
        {polls.map((poll) => {
          const hasVoted = votedPolls[poll.id] !== undefined;
          const selectedOption = selectedOptions[poll.id];
          const votingState = votingStates[poll.id] || 'idle';
          const voteConfirmation = voteConfirmations[poll.id];

          return (
            <div
              key={poll.id}
              style={{
                background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-subtle)',
                padding: '24px',
                marginBottom: '16px'
              }}
            >
              {/* Poll Question */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{
                  fontSize: '22px',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  margin: 0,
                  flex: 1
                }}>
                  {poll.question}
                </h3>
                {poll.isAnonymous && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#e3f2fd',
                    color: '#1976d2',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    Anonymous
                  </span>
                )}
                {isDemoMode && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#fff3cd',
                    color: '#856404',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    Demo
                  </span>
                )}
              </div>

              {/* Countdown Timer */}
              {poll.expiryDate && (
                <div style={{ marginBottom: '20px' }}>
                  <CountdownTimer expiryDate={poll.expiryDate} />
                </div>
              )}

              {/* Options */}
              <div style={{ marginBottom: '20px' }}>
                {poll.options.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => !hasVoted && handleOptionSelect(poll.id, index)}
                    style={{
                      padding: '14px',
                      marginBottom: '10px',
                      border: hasVoted && votedPolls[poll.id] === index
                        ? '2px solid #4caf50'
                        : selectedOption === index
                        ? '2px solid #667eea'
                        : '2px solid #e0e0e0',
                      cursor: hasVoted ? 'default' : 'pointer',
                      background: hasVoted && votedPolls[poll.id] === index
                        ? '#f1f8e9'
                        : selectedOption === index
                        ? '#f0f4ff'
                        : '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: hasVoted && votedPolls[poll.id] === index
                          ? '4px solid #4caf50'
                          : selectedOption === index
                          ? '4px solid #667eea'
                          : '2px solid #ccc',
                        background: hasVoted && votedPolls[poll.id] === index
                          ? '#4caf50'
                          : selectedOption === index
                          ? '#667eea'
                          : 'transparent',
                        marginRight: '12px',
                        transition: 'all 0.2s'
                      }} />
                      <span style={{
                        fontSize: '16px',
                        color: '#555'
                      }}>
                        {option}
                      </span>
                      {hasVoted && votedPolls[poll.id] === index && (
                        <span style={{
                          marginLeft: 'auto',
                          color: '#4caf50',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          ✓ Your Vote
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              {!hasVoted ? (
                <button
                  onClick={() => handleSubmitVote(poll.id)}
                  disabled={selectedOption === undefined || selectedOption === null || votingState === 'voting'}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: votingState === 'voting'
                      ? '#ccc'
                      : selectedOption !== null && selectedOption !== undefined
                      ? '#667eea'
                      : '#ccc',
                    color: 'white',
                    border: 'none',
                    cursor: votingState === 'voting' || (selectedOption === null || selectedOption === undefined)
                      ? 'not-allowed'
                      : 'pointer',
                    minHeight: '48px',
                    opacity: votingState === 'voting' ? 0.7 : 1
                  }}
                >
                  {votingState === 'voting'
                    ? 'Submitting Vote...'
                    : selectedOption !== null && selectedOption !== undefined
                    ? 'Cast Your Vote'
                    : 'Select an option first'}
                </button>
              ) : (
                <div>
                  <div style={{
                    padding: '12px',
                    background: voteConfirmation?.success ? '#e8f5e9' : '#ffebee',
                    color: voteConfirmation?.success ? '#2e7d32' : '#c62828',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    ✓ You voted for: "{poll.options[votedPolls[poll.id]]}"
                  </div>
                  
                  {/* Vote Confirmation Details */}
                  {voteConfirmation && (
                    <div style={{
                      padding: '12px',
                      background: 'var(--bg-section)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}>
                      <div style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Vote Confirmation:
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Status: {voteConfirmation.success ? '✅ Success' : '❌ Failed'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Message: {voteConfirmation.message}
                      </div>
                      {voteConfirmation.transactionSignature && (
                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Transaction: {voteConfirmation.transactionSignature.slice(0, 8)}...{voteConfirmation.transactionSignature.slice(-8)}
                        </div>
                      )}
                      <div style={{ color: 'var(--text-muted)' }}>
                        Blockchain: {voteConfirmation.blockchainConfirmed ? '✅ Confirmed' : '⚠️ Local Only'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VotePollFixed;
