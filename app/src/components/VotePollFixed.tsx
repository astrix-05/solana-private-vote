import React, { useState } from 'react';

interface VotePollFixedProps {
  polls: Array<{
    question: string;
    options: string[];
    id: number;
  }>;
  onVote: (pollId: number, optionIndex: number) => void;
}

const VotePollFixed: React.FC<VotePollFixedProps> = ({ polls, onVote }) => {
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: number]: number | null }>({});
  const [votedPolls, setVotedPolls] = useState<{ [pollId: number]: number }>({});

  const handleOptionSelect = (pollId: number, optionIndex: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [pollId]: optionIndex
    }));
  };

  const handleSubmitVote = (pollId: number) => {
    const selectedOption = selectedOptions[pollId];
    if (selectedOption !== undefined && selectedOption !== null) {
      onVote(pollId, selectedOption);
      setVotedPolls(prev => ({
        ...prev,
        [pollId]: selectedOption
      }));
      // Clear selection after voting
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
        background: 'white',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>
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
        color: '#333'
      }}>
        Active Polls - Cast Your Vote
      </h2>

      <div style={{ display: 'grid', gap: '25px' }}>
        {polls.map((poll) => {
          const hasVoted = votedPolls[poll.id] !== undefined;
          const selectedOption = selectedOptions[poll.id];

          return (
            <div
              key={poll.id}
              style={{
                background: 'white',
                padding: '25px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {/* Poll Question */}
              <h3 style={{
                fontSize: '22px',
                marginBottom: '20px',
                color: '#333',
                fontWeight: '600'
              }}>
                {poll.question}
              </h3>

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
                      borderRadius: '8px',
                      cursor: hasVoted ? 'default' : 'pointer',
                      background: hasVoted && votedPolls[poll.id] === index
                        ? '#f1f8e9'
                        : selectedOption === index
                        ? '#f0f4ff'
                        : '#fafafa',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
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
                  disabled={selectedOption === undefined || selectedOption === null}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: selectedOption !== null && selectedOption !== undefined
                      ? '#667eea'
                      : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedOption !== null && selectedOption !== undefined
                      ? 'pointer'
                      : 'not-allowed',
                    transition: 'all 0.3s'
                  }}
                >
                  {selectedOption !== null && selectedOption !== undefined
                    ? 'Cast Your Vote'
                    : 'Select an option first'}
                </button>
              ) : (
                <div style={{
                  padding: '12px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  ✓ You voted for: "{poll.options[votedPolls[poll.id]]}"
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
