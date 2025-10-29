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
  expiryDate?: number;
  isAnonymous?: boolean;
}

interface ResultsFixedProps {
  polls: Poll[];
  isPollExpired: (poll: Poll) => boolean;
}

const ResultsFixed: React.FC<ResultsFixedProps> = ({ polls, isPollExpired }) => {
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
        background: 'var(--bg-card)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
          No polls available yet. Create a poll and get some votes!
        </p>
      </div>
    );
  }

  // Group polls by status
  const activePolls = polls.filter(p => p.isActive && !isPollExpired(p));
  const closedOrExpiredPolls = polls.filter(p => !p.isActive || isPollExpired(p));
  const pollsWithResults = polls.filter(p => p.votes > 0 || !p.isActive || isPollExpired(p));

  if (pollsWithResults.length === 0) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '40px',
        background: 'var(--bg-card)',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
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
        color: 'var(--text-primary)'
      }}>
        Poll Results
      </h2>
      <p style={{
        fontSize: '16px',
        color: 'var(--text-muted)',
        marginBottom: '30px'
      }}>
        View detailed voting results with visual charts
      </p>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            marginTop: '24px'
          }}>
            Active Polls
          </h3>
          <div style={{ display: 'grid', gap: '30px', marginBottom: '48px' }}>
            {activePolls.map((poll) => {
              const distribution = getVoteDistribution(poll);
              const maxVotes = getMaxVotes(distribution);
              const sortedOptions = Object.entries(distribution)
                .sort(([,a], [,b]) => b - a)
                .map(([index]) => parseInt(index));

              return (
                <div key={poll.id} style={{
                  background: 'var(--bg-card)',
                  padding: '24px',
                  marginBottom: '16px'
                }}>
                  {/* Poll Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '25px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{
                          fontSize: '24px',
                          color: 'var(--text-primary)',
                          fontWeight: '600',
                          margin: 0
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
                            🔒 Anonymous
                          </span>
                        )}
                      </div>
                      {poll.isAnonymous && (
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          margin: 0,
                          fontStyle: 'italic'
                        }}>
                          Voter addresses are hidden for privacy
                        </p>
                      )}
                    </div>
                    <div style={{
                      padding: '6px 14px',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '15px'
                    }}>
                      Active
                    </div>
                  </div>

                  {/* Total Votes */}
                  <div style={{
                    padding: '15px',
                    background: '#f0f4ff',
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
                      color: 'var(--text-muted)',
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
                                color: 'var(--text-primary)',
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
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: `${width}%`,
                              height: '100%',
                              background: isWinner
                                ? 'linear-gradient(90deg, #ffd700, #ffed4e)'
                                : 'linear-gradient(90deg, #667eea, #764ba2)',
                              transition: 'all 0.5s ease',
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
        </>
      )}

      {/* Closed/Expired Polls */}
      {closedOrExpiredPolls.length > 0 && (
        <>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#999',
            marginBottom: '16px',
            marginTop: '24px'
          }}>
            Closed / Expired Polls
          </h3>
          <div style={{ display: 'grid', gap: '30px' }}>
            {closedOrExpiredPolls.map((poll) => {
              const distribution = getVoteDistribution(poll);
              const maxVotes = getMaxVotes(distribution);
              const sortedOptions = Object.entries(distribution)
                .sort(([,a], [,b]) => b - a)
                .map(([index]) => parseInt(index));
              const isExpired = isPollExpired(poll);

              return (
                <div key={poll.id} style={{
                  background: 'var(--bg-card)',
                  padding: '24px',
                  marginBottom: '16px',
                  opacity: isExpired ? 0.7 : 1
                }}>
                  {/* Poll Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: '25px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{
                          fontSize: '24px',
                          color: 'var(--text-primary)',
                          fontWeight: '600',
                          margin: 0
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
                            🔒 Anonymous
                          </span>
                        )}
                      </div>
                      {poll.isAnonymous && (
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          margin: 0,
                          fontStyle: 'italic'
                        }}>
                          Voter addresses are hidden for privacy
                        </p>
                      )}
                    </div>
                    <div style={{
                      padding: '6px 14px',
                      background: isExpired ? '#efefef' : '#fff3e0',
                      color: isExpired ? '#999' : '#f57c00',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '15px'
                    }}>
                      {isExpired ? 'Expired' : 'Closed'}
                    </div>
                  </div>

                  {/* Total Votes */}
                  <div style={{
                    padding: '15px',
                    background: '#f0f4ff',
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
                      color: 'var(--text-muted)',
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
                                color: 'var(--text-primary)',
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
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: `${width}%`,
                              height: '100%',
                              background: isWinner
                                ? 'linear-gradient(90deg, #ffd700, #ffed4e)'
                                : 'linear-gradient(90deg, #667eea, #764ba2)',
                              transition: 'all 0.5s ease',
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
        </>
      )}
    </div>
  );
};

export default ResultsFixed;
