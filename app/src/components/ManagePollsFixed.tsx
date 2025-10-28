import React, { useState } from 'react';

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

  if (pollsState.length === 0) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '40px',
        background: 'white',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>
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
        color: '#333'
      }}>
        Manage Your Polls
      </h2>
      <p style={{
        fontSize: '16px',
        color: '#666',
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
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
                color: '#333',
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
                borderRadius: '20px',
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
              background: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <strong style={{ color: '#666', fontSize: '14px' }}>Options:</strong>
              <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
                {poll.options.map((option, index) => (
                  <div key={index} style={{
                    padding: '10px',
                    background: 'white',
                    borderRadius: '6px',
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
              <div style={{ fontSize: '14px', color: '#666' }}>
                <strong style={{ color: '#333' }}>Status:</strong>{' '}
                {poll.isActive ? 'Accepting votes' : 'Closed'}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <strong style={{ color: '#333' }}>Votes:</strong>{' '}
                {poll.votes}
              </div>
            </div>

            {/* Action Button */}
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              {poll.isActive ? (
                <button
                  onClick={() => handleClosePoll(poll.id)}
                  style={{
                    padding: '12px 28px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Close Poll
                </button>
              ) : (
                <div style={{
                  padding: '12px 28px',
                  fontSize: '16px',
                  color: '#999',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  border: 'none'
                }}>
                  Poll is closed
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
          <div style={{ fontSize: '14px', color: '#666' }}>Total Polls</div>
        </div>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
            {pollsState.filter(p => p.isActive).length}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Active</div>
        </div>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b' }}>
            {pollsState.filter(p => !p.isActive).length}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Closed</div>
        </div>
      </div>
    </div>
  );
};

export default ManagePollsFixed;
