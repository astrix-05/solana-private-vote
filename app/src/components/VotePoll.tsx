import React, { useState, useEffect } from 'react';
import { Poll } from '../types';
import { Vote, Shield, Clock, Users, AlertCircle } from './Icons';

interface VotePollProps {
  onVote: (pollAddress: string, selectedOption: number) => void;
}

const VotePoll: React.FC<VotePollProps> = ({ onVote }) => {
  const publicKey = new (window as any).PublicKey('11111111111111111111111111111112');
  const isInitialized = true;
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockPolls: Poll[] = [
      {
        creator: publicKey || new (window as any).PublicKey('11111111111111111111111111111112'),
        question: 'What is your favorite programming language?',
        options: ['Rust', 'TypeScript', 'Python', 'Go'],
        isActive: true,
        totalVotes: 15,
        voteCounts: [0, 0, 0, 0],
        createdAt: Date.now() / 1000 - 3600,
        closedAt: null,
      },
      {
        creator: publicKey || new (window as any).PublicKey('11111111111111111111111111111113'),
        question: 'Which blockchain platform do you prefer?',
        options: ['Solana', 'Ethereum', 'Polygon', 'Avalanche'],
        isActive: true,
        totalVotes: 8,
        voteCounts: [0, 0, 0, 0],
        createdAt: Date.now() / 1000 - 7200,
        closedAt: null,
      },
    ];
    setPolls(mockPolls);
  }, [publicKey]);

  const handleVote = async () => {
    if (!selectedPoll || selectedOption === null) return;

    setLoading(true);
    try {
      await onVote(selectedPoll.creator.toString(), selectedOption);
      setSelectedPoll(null);
      setSelectedOption(null);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (!isInitialized) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing encryption service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Polls</h2>
        <p className="text-gray-600">
          Select a poll to cast your encrypted vote. Your vote will be completely private.
        </p>
      </div>

      {selectedPoll ? (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{selectedPoll.question}</h3>
              <button
                onClick={() => {
                  setSelectedPoll(null);
                  setSelectedOption(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to polls
              </button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{selectedPoll.totalVotes} votes</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Created {formatTime(selectedPoll.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span>Encrypted</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {selectedPoll.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedOption === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="option"
                  value={index}
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Your Vote is Private</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your vote will be encrypted using Arcium technology. No one can see your choice until results are revealed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setSelectedPoll(null);
                setSelectedOption(null);
              }}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleVote}
              disabled={selectedOption === null || loading}
              className="btn-primary"
            >
              {loading ? 'Casting Vote...' : 'Cast Vote'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {polls.map((poll, index) => (
            <div key={index} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPoll(poll)}>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {poll.question}
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  poll.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {poll.isActive ? 'Active' : 'Closed'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {poll.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="text-sm text-gray-600">
                    {optionIndex + 1}. {option}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{poll.totalVotes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>Encrypted</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Vote className="w-4 h-4" />
                  <span>Vote</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {polls.length === 0 && (
        <div className="card text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Polls</h3>
          <p className="text-gray-600">There are currently no active polls to vote on.</p>
        </div>
      )}
    </div>
  );
};

export default VotePoll;
