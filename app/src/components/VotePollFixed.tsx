import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import VoterStats from './VoterStats';
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
        textAlign: 'center',
        padding: '60px 20px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-grey)',
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🗳️</div>
        <h3 style={{ 
          fontSize: '24px', 
          color: 'var(--text-main)', 
          margin: '0 0 16px 0',
          fontWeight: '700'
        }}>
          No Active Polls
        </h3>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-muted)',
          margin: '0'
        }}>
          Create a poll to get started with voting!
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '2.5rem',
        fontWeight: '800',
        margin: '0 0 32px 0',
        textAlign: 'center',
        background: 'var(--button-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Active Polls - Cast Your Vote
      </h2>

      {/* Voter Stats - Show when connected */}
      {voterPublicKey && !isDemoMode && (
        <VoterStats voterAddress={voterPublicKey} showDetails={true} />
      )}

      <div style={{ display: 'grid', gap: '32px' }}>
        {polls.map((poll) => {
          const hasVoted = votedPolls[poll.id] !== undefined;
          const selectedOption = selectedOptions[poll.id];
          const votingState = votingStates[poll.id] || 'idle';
          const voteConfirmation = voteConfirmations[poll.id];

          return (
            <div
              key={poll.id}
              className="card"
              style={{
                background: 'linear-gradient(135deg, var(--bg-card) 0%, #1a1a2e 100%)',
                border: '1px solid var(--border-grey)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Poll Header */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  margin: '0 0 12px 0',
                  lineHeight: '1.4'
                }}>
                  {poll.question}
                </h3>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  {poll.expiryDate && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--accent-blue)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <span>⏰</span>
                      <CountdownTimer expiryDate={poll.expiryDate} />
                    </div>
                  )}
                  
                  {poll.isAnonymous && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--accent-pink)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      <span>🔒</span>
                      <span>Anonymous</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Poll Options */}
              <div style={{ marginBottom: '24px' }}>
                {poll.options.map((option, index) => (
                  <div key={index} style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 20px',
                      background: selectedOption === index ? 'var(--accent-blue)' : 'var(--btn-bg)',
                      border: `2px solid ${selectedOption === index ? 'var(--accent-blue)' : 'var(--border-grey)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: hasVoted ? 'default' : 'pointer',
                      transition: 'var(--transition)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <input
                        type="radio"
                        name={`poll-${poll.id}`}
                        checked={selectedOption === index}
                        onChange={() => !hasVoted && handleOptionSelect(poll.id, index)}
                        disabled={hasVoted}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: 'var(--accent-blue)'
                        }}
                      />
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: selectedOption === index ? 'white' : 'var(--text-main)',
                        flex: 1
                      }}>
                        {option}
                      </span>
                      {hasVoted && votedPolls[poll.id] === index && (
                        <span style={{
                          color: 'var(--accent-green)',
                          fontWeight: '700',
                          fontSize: '18px'
                        }}>
                          ✓ Your Vote
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>

              {/* Submit Button or Vote Confirmation */}
              {!hasVoted ? (
                <button
                  onClick={() => handleSubmitVote(poll.id)}
                  disabled={selectedOption === undefined || selectedOption === null || votingState === 'voting'}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    fontSize: '18px',
                    padding: '20px',
                    opacity: votingState === 'voting' ? 0.7 : 1,
                    cursor: votingState === 'voting' || (selectedOption === null || selectedOption === undefined)
                      ? 'not-allowed'
                      : 'pointer'
                  }}
                >
                  {votingState === 'voting' ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <div className="loading-dots">
                        <div className="loading-dot" />
                        <div className="loading-dot" />
                        <div className="loading-dot" />
                      </div>
                      Submitting Vote...
                    </div>
                  ) : selectedOption !== null && selectedOption !== undefined ? (
                    '🗳️ Cast Your Vote'
                  ) : (
                    'Select an option first'
                  )}
                </button>
              ) : (
                <div>
                  <div className="status-success" style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    ✅ You voted for: "{poll.options[votedPolls[poll.id]]}"
                  </div>

                  {/* Vote Confirmation Details */}
                  {voteConfirmation && (
                    <div style={{
                      padding: '20px',
                      background: 'var(--btn-bg)',
                      border: '1px solid var(--border-grey)',
                      borderRadius: 'var(--radius)',
                      fontSize: '14px'
                    }}>
                      <div style={{ 
                        marginBottom: '16px', 
                        fontWeight: '700', 
                        color: 'var(--text-main)',
                        fontSize: '16px'
                      }}>
                        Vote Confirmation Details:
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gap: '8px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                      }}>
                        <div style={{ color: 'var(--text-muted)' }}>
                          <strong>Status:</strong> {voteConfirmation.success ? '✅ Success' : '❌ Failed'}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          <strong>Message:</strong> {voteConfirmation.message}
                        </div>
                        {voteConfirmation.transactionSignature && (
                          <div style={{ color: 'var(--text-muted)' }}>
                            <strong>Transaction:</strong> {voteConfirmation.transactionSignature.slice(0, 8)}...{voteConfirmation.transactionSignature.slice(-8)}
                          </div>
                        )}
                        <div style={{ color: 'var(--text-muted)' }}>
                          <strong>Blockchain:</strong> {voteConfirmation.blockchainConfirmed ? '✅ Confirmed' : '⚠️ Local Only'}
                        </div>
                        {voteConfirmation.feePaidBy && (
                          <div style={{ color: 'var(--text-muted)' }}>
                            <strong>💰 Fee paid by:</strong> {voteConfirmation.feePaidBy}
                          </div>
                        )}
                        {voteConfirmation.rateLimitInfo && (
                          <div style={{ color: 'var(--text-muted)' }}>
                            <strong>⏱️ Remaining votes:</strong> {voteConfirmation.rateLimitInfo.remainingVotes}
                          </div>
                        )}
                        {voteConfirmation.governmentWallet && (
                          <div style={{ color: 'var(--text-muted)' }}>
                            <strong>🏛️ Government wallet:</strong> {voteConfirmation.governmentWallet.slice(0, 8)}...{voteConfirmation.governmentWallet.slice(-8)}
                          </div>
                        )}
                        {voteConfirmation.demoMode && (
                          <div style={{ 
                            color: '#ff9800',
                            fontWeight: '600',
                            background: '#fff3e0',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ffb74d'
                          }}>
                            🎮 Demo Mode: Transaction simulated (government wallet has no SOL)
                          </div>
                        )}
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