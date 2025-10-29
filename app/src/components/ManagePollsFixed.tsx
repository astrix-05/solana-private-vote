import React, { useState } from 'react';
import SharePoll from './SharePoll';

interface Poll {
  id: number;
  question: string;
  options: string[];
  isActive: boolean;
  votes: number;
}

interface ManagePollsFixedProps {
  polls: Poll[];
  onClosePoll: (pollId: number) => void;
  onReopenPoll?: (pollId: number) => void;
}

const ManagePollsFixed: React.FC<ManagePollsFixedProps> = ({ polls, onClosePoll, onReopenPoll }) => {
  const [pollsState, setPollsState] = useState<Poll[]>(polls);
  const [message, setMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePollId, setSharePollId] = useState<number | null>(null);

  const handleClosePoll = (pollId: number) => {
    setPollsState(prev => 
      prev.map(poll => 
        poll.id === pollId ? { ...poll, isActive: false } : poll
      )
    );
    onClosePoll(pollId);
    const poll = pollsState.find(p => p.id === pollId);
    if (poll) {
      setMessage(`Poll "${poll.question}" has been closed`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSharePoll = (pollId: number) => {
    setSharePollId(pollId);
    setShowShareModal(true);
  };

  if (pollsState.length === 0) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '40px',
        background: 'var(--bg-card)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
          You haven't created any polls yet. Create a poll to manage it here!
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
        marginBottom: '10px',
        color: 'var(--text-primary)'
      }}>
        Manage Your Polls
      </h2>
      <p style={{
        fontSize: '16px',
        color: 'var(--text-muted)',
        marginBottom: '30px'
      }}>
        View and manage all polls you've created. Close polls to stop accepting votes.
      </p>

      {/* Success Message */}
      {message && (
        <div style={{
          padding: '15px',
          background: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '8px',
          marginBottom: '25px',
          fontSize: '16px'
        }}>
          ✅ {message}
        </div>
      )}

      {/* Polls List */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {pollsState.map((poll) => (
          <div
            key={poll.id}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              marginBottom: '16px',
              border: poll.isActive ? '2px solid #667eea' : '2px solid #e0e0e0'
            }}
          >
            {/* Poll Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '22px',
                color: 'var(--text-primary)',
                fontWeight: '600',
                flex: 1,
                margin: 0
              }}>
                {poll.question}
              </h3>
              <div style={{
                padding: '6px 14px',
                background: poll.isActive ? '#e8f5e9' : '#fff3e0',
                color: poll.isActive ? '#2e7d32' : '#f57c00',
                fontSize: '14px',
                fontWeight: '600',
                marginLeft: '15px'
              }}>
                {poll.isActive ? '✓ Active' : '✗ Closed'}
              </div>
            </div>

            {/* Options */}
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              background: '#f9f9f9'
            }}>
              <strong style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Options:</strong>
              <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                {poll.options.map((option, index) => (
                  <div key={index} style={{
                    padding: '10px',
                    background: 'white',
                    fontSize: '15px',
                    color: '#555'
                  }}>
                    {index + 1}. {option}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '20px',
              padding: '12px',
              background: '#f0f4ff',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                <strong style={{ color: '#333' }}>Status:</strong>{' '}
                {poll.isActive ? 'Accepting votes' : 'Closed'}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                <strong style={{ color: '#333' }}>Votes:</strong>{' '}
                {poll.votes}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}>
              <button
                onClick={() => handleSharePoll(poll.id)}
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f0f0f0',
                  color: 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
                title="Share Poll"
              >
                📤
              </button>
              {poll.isActive ? (
                <button
                  onClick={() => handleClosePoll(poll.id)}
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                  title="Close Poll"
                >
                  ✕
                </button>
              ) : (
                <div style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  background: '#f5f5f5',
                  fontSize: '18px'
                }}
                title="Poll is closed"
                >
                  ✓
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: '#f0f4ff',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-around',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
            {pollsState.length}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Polls</div>
        </div>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
            {pollsState.filter(p => p.isActive).length}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Active</div>
        </div>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b' }}>
            {pollsState.filter(p => !p.isActive).length}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Closed</div>
        </div>
      </div>

      {/* Share Poll Modal */}
      {showShareModal && sharePollId && (
        <SharePoll
          pollId={sharePollId}
          pollQuestion={pollsState.find(p => p.id === sharePollId)?.question || ''}
          onClose={() => {
            setShowShareModal(false);
            setSharePollId(null);
          }}
        />
      )}
    </div>
  );
};

export default ManagePollsFixed;
