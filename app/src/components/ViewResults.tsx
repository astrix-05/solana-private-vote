import React, { useState, useEffect } from 'react';
import { Poll } from '../types';
import { BarChart3, Users, Clock, Shield, Award } from './Icons';

const ViewResults: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockPolls: Poll[] = [
      {
        creator: new (window as any).PublicKey('11111111111111111111111111111112'),
        question: 'What is your favorite programming language?',
        options: ['Rust', 'TypeScript', 'Python', 'Go'],
        isActive: false,
        totalVotes: 15,
        voteCounts: [5, 4, 3, 3],
        createdAt: Date.now() / 1000 - 3600,
        closedAt: Date.now() / 1000 - 1800,
      },
      {
        creator: new (window as any).PublicKey('11111111111111111111111111111113'),
        question: 'Which blockchain platform do you prefer?',
        options: ['Solana', 'Ethereum', 'Polygon', 'Avalanche'],
        isActive: false,
        totalVotes: 8,
        voteCounts: [3, 2, 2, 1],
        createdAt: Date.now() / 1000 - 7200,
        closedAt: Date.now() / 1000 - 3600,
      },
    ];
    setPolls(mockPolls);
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getWinner = (poll: Poll) => {
    const maxVotes = Math.max(...poll.voteCounts);
    const winnerIndex = poll.voteCounts.indexOf(maxVotes);
    return { option: poll.options[winnerIndex], votes: maxVotes, index: winnerIndex };
  };

  const getPercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const getTotalVotes = () => {
    return polls.reduce((sum: number, poll: Poll) => sum + poll.totalVotes, 0);
  };

  const getTotalPolls = () => {
    return polls.length;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Poll Results</h2>
        <p className="text-gray-600">
          View the results of closed polls. All votes were encrypted and counted securely.
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Polls</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalPolls()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalVotes()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Encrypted</p>
              <p className="text-2xl font-bold text-gray-900">100%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Poll Results */}
      <div className="space-y-6">
        {polls.map((poll, index) => {
          const winner = getWinner(poll);
          return (
            <div key={index} className="card">
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {poll.question}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      Closed
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{poll.totalVotes} votes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Closed {formatTime(poll.closedAt!)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                {poll.options.map((option, optionIndex) => {
                  const votes = poll.voteCounts[optionIndex];
                  const percentage = getPercentage(votes, poll.totalVotes);
                  const isWinner = optionIndex === winner.index;

                  return (
                    <div key={optionIndex} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700">
                            {option}
                          </span>
                          {isWinner && (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <Award className="w-4 h-4" />
                              <span className="text-xs font-medium">Winner</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {votes} votes ({percentage}%)
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isWinner 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                              : 'bg-gradient-to-r from-primary-400 to-primary-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Winner Announcement */}
              {poll.totalVotes > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="w-6 h-6 text-yellow-600" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Winner</h4>
                      <p className="text-sm text-yellow-700">
                        <span className="font-semibold">{winner.option}</span> won with {winner.votes} votes
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {polls.length === 0 && (
        <div className="card text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
          <p className="text-gray-600">There are no closed polls with results to display.</p>
        </div>
      )}
    </div>
  );
};

export default ViewResults;
