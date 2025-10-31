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
  const [errorMessages, setErrorMessages] = useState<{ [pollId: number]: string }>({});

  const handleOptionSelect = (pollId: number, optionIndex: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [pollId]: optionIndex
    }));
  };

  const handleSubmitVote = async (pollId: number, apiPollId?: string) => {
    const selectedOption = selectedOptions[pollId];
    console.log('Selected option for poll', pollId, ':', selectedOption); // Debug
    if (selectedOption === undefined || selectedOption === null) {
      setErrorMessages((prev) => ({ ...prev, [pollId]: 'Please select an option before voting.' }));
      return;
    }

    // Validate voter public key before calling backend
    if (!voterPublicKey || voterPublicKey.length < 32 || voterPublicKey.length > 44) {
      setErrorMessages((prev) => ({ ...prev, [pollId]: 'Please connect your wallet to vote.' }));
      return;
    }
    setErrorMessages((prev) => ({ ...prev, [pollId]: '' }));
    setVotingStates(prev => ({ ...prev, [pollId]: 'voting' }));

    try {
      // Call backend relayer API via apiService (ensures /api base, headers, and API key)
      const backendPollId = apiPollId && apiPollId.length >= 16 ? apiPollId : String(pollId);
      const data = await apiService.vote({
        voterPublicKey: voterPublicKey,
        pollId: backendPollId,
        voteChoice: selectedOption
      });
      if (data.success) {
        onVote(pollId, selectedOption);
        setVotedPolls(prev => ({ ...prev, [pollId]: selectedOption }));
        setVotingStates(prev => ({ ...prev, [pollId]: 'success' }));
        setVoteConfirmations(prev => ({ ...prev, [pollId]: {
          success: true,
          message: 'Vote submitted to relayer backend',
          transactionSignature: data.transactionSignature,
          blockchainConfirmed: true
        }}));
      } else {
        throw new Error((data as any).error || 'Vote failed');
      }
    } catch (error) {
      setVotingStates(prev => ({ ...prev, [pollId]: 'error' }));
      setErrorMessages((prev) => ({ ...prev, [pollId]: error instanceof Error ? error.message : 'Failed to submit vote.' }));
      setVoteConfirmations(prev => ({ ...prev, [pollId]: {
        success: false,
        message: error instanceof Error ? error.message : 'Vote failed',
        blockchainConfirmed: false
      }}));
    } finally {
      setSelectedOptions(prev => ({ ...prev, [pollId]: null }));
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
    <div style={{ maxWidth: '520px', margin: '32px auto', padding: '0' }}>
      <h2 style={{ fontSize: '1.38rem', fontWeight: 900, margin: '0 0 22px 0', color: '#222', borderBottom: '1.5px solid #e5e5e5', paddingBottom:'10px', fontFamily:'Inter,system-ui,sans-serif' }}>
        Active Polls - Cast Your Vote
      </h2>
      {voterPublicKey && !isDemoMode && <VoterStats voterAddress={voterPublicKey} showDetails={true} />}
      <div style={{ display: 'flex', flexDirection:'column', gap: '32px' }}>
        {polls.map((poll) => {
          const hasVoted = votedPolls[poll.id] !== undefined;
          const selectedOption = selectedOptions[poll.id];
          const votingState = votingStates[poll.id] || 'idle';
          const voteConfirmation = voteConfirmations[poll.id];
          const error = errorMessages[poll.id];
          return (
            <div key={poll.id} className="vote-card" style={{ background: '#fff', border: '1px solid #ededed', borderRadius: 10, boxShadow: '0 2px 8px #ececec', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Info banner */}
              <div style={{
                background: "#e8f5e9",
                color: "#388e3c",
                border: "1px solid #c8e6c9",
                borderRadius: "7px",
                padding: "8px 16px",
                marginBottom: "18px",
                textAlign: "center"
              }}>
                Voter fees sponsored by government—cast your vote for free!
              </div>
              {/* Question */}
              <label htmlFor={`question-${poll.id}`} style={{ fontWeight: 'bold', fontSize: '1.16rem', color: '#222', marginBottom: 12, marginTop: 0, display: 'block' }}>{poll.question}</label>
              {/* Options Group */}
              <fieldset aria-label="Poll Options" style={{ border: 'none', padding: 0, margin: 0, marginBottom: 8 }}>
                {poll.options.map((option, index) => (
                  <div key={index} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="radio"
                      id={`option-${poll.id}-${index}`}
                      name={`poll-${poll.id}`}
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => handleOptionSelect(poll.id, index)}
                      disabled={hasVoted}
                      style={{ accentColor:'#1976d2', width:24, height:24, borderRadius:'50%'}}
                      aria-checked={selectedOption === index}
                    />
                    <label htmlFor={`option-${poll.id}-${index}`} style={{ fontSize: '1.12rem', color: hasVoted && votedPolls[poll.id] === index ? '#1976d2' : '#222', fontWeight: hasVoted && votedPolls[poll.id] === index ? 700 : 500, cursor: hasVoted ? 'not-allowed' : 'pointer', marginTop: 2 }}>{option}</label>
                    {hasVoted && votedPolls[poll.id] === index && (
                      <span style={{marginLeft:'auto', color:'#1976d2', fontWeight:700, fontSize:'1.08rem'}}>✓ Your Vote</span>
                    )}
                  </div>
                ))}
              </fieldset>
              {/* Error / Success Message */}
              {!!error && (
                <div style={{
                  color: "#d32f2f",
                  background: "#ffd5da",
                  border: "1px solid #d32f2f",
                  borderRadius: "7px",
                  padding: "8px 16px",
                  marginBottom: "12px",
                  textAlign: "center"
                }}>{error}</div>
              )}
              {voteConfirmation && votingState !== 'error' && !error && (
                <div style={{ color: '#1976d2', background: '#e3f0fc', border: '1px solid #1976d2', borderRadius: 7, padding: '8px 16px', marginBottom: 14, textAlign: 'center', fontWeight: 600 }}>
                  {voteConfirmation.success ? 'Vote Successful!' : 'Vote Failed!'} {voteConfirmation.message}
                </div>
              )}
              {/* Vote Button at the Bottom */}
              {!hasVoted ? (
                <button
                  onClick={() => {
                    const apiId = (poll as any).backendId || (typeof (poll as any).id === 'string' ? ((poll as any).id as string) : (poll as any).pollId || (poll as any).serverId);
                    handleSubmitVote(poll.id, apiId);
                  }}
                  disabled={selectedOption === undefined || selectedOption === null || votingState === 'voting'}
                  style={{ width: '100%', borderRadius:6, background:'#1976d2', color:'#fff', border:'none', fontWeight:700, fontSize:'1.11rem', padding:'18px 0', boxShadow:'none', cursor:'pointer', transition:'background .17s', fontFamily:'Inter,system-ui,sans-serif', marginTop:16 }}
                >
                  {votingState === 'voting' ? 'Submitting Vote...' : selectedOption !== null && selectedOption !== undefined ? 'Cast Your Vote' : 'Select an option first'}
                </button>
              ) : (
                <div style={{marginTop:12}}>
                  <div style={{ padding:'10px 0', background:'#f5f5f5', color:'#1976d2', textAlign:'center', fontWeight:700, fontSize:'14px', borderRadius:'5px', marginBottom:'8px' }}>
                    ✓ You voted for: "{poll.options[votedPolls[poll.id]]}"
                  </div>
                  {voteConfirmation && (
                    <div style={{fontSize:'13px', marginTop:'10px', color:'#333'}}>
                      <div>Status: {voteConfirmation.success ? 'Success' : 'Failed'}</div>
                      <div>Message: {voteConfirmation.message}</div>
                      {voteConfirmation.transactionSignature && <div>Transaction: {voteConfirmation.transactionSignature.slice(0, 8)}...{voteConfirmation.transactionSignature.slice(-8)}</div>}
                      <div>Blockchain: {voteConfirmation.blockchainConfirmed ? 'Confirmed' : 'Local Only'}</div>
                      {voteConfirmation.feePaidBy && (<div>Fee paid by: {voteConfirmation.feePaidBy}</div>)}
                      {voteConfirmation.governmentWallet && (<div>Relayer: {voteConfirmation.governmentWallet.slice(0,8)}...{voteConfirmation.governmentWallet.slice(-8)}</div>)}
                      {voteConfirmation.demoMode && (<div>Mode: simulated</div>)}
                      {voteConfirmation.rateLimitInfo && (<div>Votes left: {voteConfirmation.rateLimitInfo.remainingVotes} (resets {new Date(voteConfirmation.rateLimitInfo.resetTime).toLocaleTimeString()})</div>)}
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