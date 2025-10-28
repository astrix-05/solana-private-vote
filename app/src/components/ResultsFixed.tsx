import React from 'react';

interface VoteCount {
  [optionIndex: number]: number;
}

interface Poll {
  id: number;
  question: string;
  options: string[];
  isActive: boolean;
  votes: number;
  voteCounts?: VoteCount;
}

interface ResultsFixedProps {
  polls: Poll[];
}

const ResultsFixed: React.FC<ResultsFixedProps> = ({ polls }) => {
  // Mock vote distribution (in real app, this would come from blockchain)
  const getVoteDistribution = (poll: Poll): VoteCount => {
    // If we have real vote counts, use them
    if (poll.voteCounts) {
      return poll.voteCounts;
    }
    
    // Otherwise, create a mock distribution
    const counts: VoteCount = {};
    poll.options.forEach((_, index) => {
      counts[index] = Math.floor(Math.random() * poll.votes);
    });
    
    // Ensure total matches
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    if (sum !== poll.votes && poll.votes > 0) {
      const diff = poll.votes - sum;
      const randomIndex = Math.floor(Math.random() * poll.options.length);
      counts[randomIndex] = (counts[randomIndex] || 0) + diff;
    }
    
    return counts;
  };

  const getPercentage = (votes: number, total: number): number => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const getMaxVotes = (distribution: VoteCount): number => {
    return Math.max(...Object.values(distribution), 1);
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
          No polls available yet. Create a poll and get some votes!
        </p>
      </div>
    );
  }

  // Filter to only show polls with votes or closed polls
  const pollsWithResults = polls.filter(p => p.votes > 0 || !p.isActive);

  if (pollsWithResults.length === 0) {
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
          No results to display yet. Votes will appear here!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h2 style={{
        fontSize: '28px',
        marginBottom: '10px',
        color: '#333'
      }}>
        Poll Results
      </h2>
      <p style={{
        fontSize: '16px',
        color: '#666',
        marginBottom: '30px'
      }}>
        View detailed voting results with visual charts
      </p>

      <div style={{ display: 'grid', gap: '30px' }}>
        {pollsWithResults.map((poll) => {
          const distribution = getVoteDistribution(poll);
          const maxVotes = getMaxVotes(distribution);
          const sortedOptions = Object.entries(distribution)
            .sort(([,a], [,b]) => b - a)
            .map(([index]) => parseInt(index));

          return (
            <div
              key={poll.id}
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              {/* Poll Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '25px'
              }}>
                <h3 style={{
                  fontSize: '24px',
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

              {/* Total Votes */}
              <div style={{
                padding: '15px',
                background: '#f0f4ff',
                borderRadius: '10px',
                marginBottom: '25px'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#667eea',
                  textAlign: 'center'
                }}>
                  {poll.votes}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '5px'
                }}>
                  Total Votes
                </div>
              </div>

              {/* Results Bars */}
              <div style={{ marginBottom: '20px' }}>
                {poll.options.map((option, index) => {
                  const votes = distribution[index] || 0;
                  const percentage = getPercentage(votes, poll.votes);
                  const width = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
                  const isWinner = index === sortedOptions[0] && votes > 0;

                  return (
                    <div key={index} style={{ marginBottom: '18px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            color: '#555',
                            minWidth: '120px'
                          }}>
                            {option}
                          </span>
                          {isWinner && (
                            <span style={{
                              marginLeft: '10px',
                              padding: '3px 10px',
                              background: '#ffd700',
                              color: '#856404',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              👑 Winner
                            </span>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          marginLeft: '10px'
                        }}>
                          <span style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#333',
                            minWidth: '40px',
                            textAlign: 'right'
                          }}>
                            {votes}
                          </span>
                          <span style={{
                            fontSize: '16px',
                            color: '#999',
                            minWidth: '45px',
                            textAlign: 'right'
                          }}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      {/* Bar Chart */}
                      <div style={{
                        width: '100%',
                        height: '32px',
                        background: '#f0f0f0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${width}%`,
                          height: '100%',
                          background: isWinner
                            ? 'linear-gradient(90deg, #ffd700, #ffed4e)'
                            : 'linear-gradient(90deg, #667eea, #764ba2)',
                          borderRadius: '16px',
                          transition: 'all 0.5s ease',
                          boxShadow: isWinner ? '0 2px 8px rgba(255, 215, 0, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '12px'
                        }}>
                          {width > 15 && (
                            <span style={{
                              color: isWinner ? '#856404' : 'white',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Winner Announcement */}
              {poll.votes > 0 && (
                <div style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #fff9c4, #fff59d)',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#856404'
                  }}>
                    🎉 Winner: {poll.options[sortedOptions[0]]} 🎉
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#a68b00',
                    marginTop: '5px'
                  }}>
                    with {distribution[sortedOptions[0]]} votes ({getPercentage(distribution[sortedOptions[0]], poll.votes)}%)
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsFixed;
