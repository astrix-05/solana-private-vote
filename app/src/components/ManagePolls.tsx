import React, { useState, useEffect } from 'react';
import { Poll } from '../types';
import { Settings, Lock, BarChart3, Clock, Users, AlertCircle } from './Icons';

interface ManagePollsProps {
  onClosePoll: (pollAddress: string) => void;
  onRevealResults: (pollAddress: string) => void;
}

const formatAddress = (addr: any) => {
  const addrStr = typeof addr === 'string' ? addr : addr?.toString() || 'Unknown';
  return addrStr.length > 8 ? `${addrStr.slice(0, 4)}...${addrStr.slice(-4)}` : addrStr;
};

const ManagePolls: React.FC<ManagePollsProps> = ({ onClosePoll, onRevealResults }) => {
  const publicKey = new (window as any).PublicKey('11111111111111111111111111111112');
  const [polls, setPolls] = useState<Poll[]>([]);
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
        creator: publicKey || new (window as any).PublicKey('11111111111111111111111111111112'),
        question: 'Which blockchain platform do you prefer?',
        options: ['Solana', 'Ethereum', 'Polygon', 'Avalanche'],
        isActive: false,
        totalVotes: 8,
        voteCounts: [3, 2, 2, 1],
        createdAt: Date.now() / 1000 - 7200,
        closedAt: Date.now() / 1000 - 1800,
      },
    ];
    setPolls(mockPolls);
  }, [publicKey]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const handleClosePoll = async (pollAddress: string) => {
    setLoading(true);
    try {
      await onClosePoll(pollAddress);
      // Update local state
      setPolls(prev => prev.map(poll => 
        poll.creator.toString() === pollAddress 
          ? { ...poll, isActive: false, closedAt: Date.now() / 1000 }
          : poll
      ));
    } catch (error) {
      console.error('Failed to close poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealResults = async (pollAddress: string) => {
    setLoading(true);
    try {
      await onRevealResults(pollAddress);
    } catch (error) {
      console.error('Failed to reveal results:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPollCreator = (poll: Poll) => {
    return publicKey && poll.creator.toString() === publicKey.toString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Polls</h2>
        <p className="text-gray-600">
          View and manage your polls. Close active polls or reveal results for closed polls.
        </p>
      </div>

      {loading && (
        <div className="card text-center mb-6">
          <div className="animate-spin w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Processing...</p>
        </div>
      )}

      <div className="grid gap-6">
        {polls.map((poll, index) => (
          <div key={index} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {poll.question}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{poll.totalVotes} votes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Created {formatTime(poll.createdAt)}</span>
                  </div>
                  {poll.closedAt && (
                    <div className="flex items-center space-x-1">
                      <Lock className="w-4 h-4" />
                      <span>Closed {formatTime(poll.closedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                poll.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {poll.isActive ? 'Active' : 'Closed'}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Options:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {poll.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{option}</span>
                    {!poll.isActive && poll.voteCounts[optionIndex] > 0 && (
                      <span className="text-sm font-medium text-primary-600">
                        {poll.voteCounts[optionIndex]} votes
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isPollCreator(poll) && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Creator:</span> {formatAddress(poll.creator)}
                </div>
                <div className="flex items-center space-x-3">
                  {poll.isActive ? (
                    <button
                      onClick={() => handleClosePoll(poll.creator.toString())}
                      disabled={loading}
                      className="btn-danger"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Close Poll
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRevealResults(poll.creator.toString())}
                      disabled={loading}
                      className="btn-primary"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Reveal Results
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isPollCreator(poll) && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>You can only manage polls you created</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {polls.length === 0 && (
        <div className="card text-center">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Polls Found</h3>
          <p className="text-gray-600">You haven't created any polls yet.</p>
        </div>
      )}
    </div>
  );
};

export default ManagePolls;
