import React, { useState, useMemo, useCallback } from 'react';
import CreatePollFixed from './components/CreatePollFixed';
import VotePollFixed from './components/VotePollFixed';
import ManagePollsFixed from './components/ManagePollsFixed';
import ResultsFixed from './components/ResultsFixed';
import SharePoll from './components/SharePoll';
import SimplifiedNavigation from './components/SimplifiedNavigation';
import WalletFundingStatus from './components/WalletFundingStatus';
import { useWallet, WalletButton } from './contexts/WalletProvider';
import { useIsMobile } from './hooks/useIsMobile';

type ViewMode = 'create' | 'vote' | 'manage' | 'results';

interface Poll {
  id: number;
  question: string;
  options: string[];
  isActive: boolean;
  votes: number;
  creator?: string;
  voters?: string[];
  expiryDate?: number; // Unix timestamp in milliseconds
  isAnonymous?: boolean; // Whether votes are anonymous
  backendId?: string; // Relayer-generated poll id
}

function PrivateVoteApp() {
  const { connected, publicKey, connect } = useWallet();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState('Welcome to Private Vote!');
  const [createdPolls, setCreatedPolls] = useState<Poll[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('create');
  const [pollIdCounter, setPollIdCounter] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePollId, setSharePollId] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Memoized check function with current timestamp
  const isPollExpired = useCallback((poll: Poll, currentTime: number = Date.now()): boolean => {
    if (!poll.expiryDate) return false;
    return currentTime > poll.expiryDate;
  }, []);

  const handleCreatePoll = async (pollData: { question: string; options: string[]; expiryDate?: number; isAnonymous?: boolean; backendPollId?: string }) => {
    if (!connected || !publicKey) {
      setMessage('Please connect your wallet to create a poll.');
      return;
    }

    setLoading(true);
    try {
      const newPoll: Poll = {
        id: pollIdCounter,
        question: pollData.question,
        options: pollData.options,
        isActive: true,
        votes: 0,
        creator: publicKey,
        voters: [],
        expiryDate: pollData.expiryDate,
        isAnonymous: pollData.isAnonymous || false,
        backendId: pollData.backendPollId
      };

      setCreatedPolls(prev => [newPoll, ...prev]);
      setPollIdCounter(prev => prev + 1);
      setMessage(`Poll "${pollData.question}" created successfully!`);
      setSharePollId(newPoll.id);
      setShowShareModal(true);
    } catch (error) {
      setMessage('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (pollId: number, optionIndex: number) => {
    setCreatedPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const newVoters = [...(poll.voters || [])];
        if (!newVoters.includes(publicKey || '')) {
          newVoters.push(publicKey || '');
        }
        return {
          ...poll,
          votes: poll.votes + 1,
          voters: newVoters
        };
      }
      return poll;
    }));
    setMessage('Vote recorded successfully!');
  };

  const handleClosePoll = (pollId: number) => {
    setCreatedPolls(prev => prev.map(poll => 
      poll.id === pollId ? { ...poll, isActive: false } : poll
    ));
    setMessage('Poll closed successfully!');
  };

  const createDemoPoll = () => {
    const demoPoll: Poll = {
      id: pollIdCounter,
      question: "Demo Poll - What's your favorite feature?",
      options: ["Real-time voting", "Anonymous polls", "Mobile-friendly", "Blockchain security"],
      isActive: true,
      votes: 0,
      creator: 'demo',
      voters: [],
      isAnonymous: false
    };

    setCreatedPolls(prev => [demoPoll, ...prev]);
    setPollIdCounter(prev => prev + 1);
    setIsDemoMode(true);
    setMessage('Demo poll created! Try voting to see how it works.');
  };

  // Memoized active polls for voting
  const activePollsForVoting = useMemo(() => {
    return createdPolls.filter(poll => poll.isActive && !isPollExpired(poll));
  }, [createdPolls, isPollExpired]);

  return (
    <div className="container" style={{minHeight:'100vh',background:'#fff',padding:'40px 0'}}>
      {/* Minimal Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:520,margin:'0 auto 36px auto',paddingTop:24}}>
        <div style={{fontWeight:900,fontSize:'1.72rem',letterSpacing:0,color:'#222',fontFamily:'Inter,system-ui,sans-serif'}}>Private Vote</div>
        <div>
          <WalletButton />
        </div>
      </div>
      {/* Minimal nav tabs */}
      <div className="tabs">
        <button className={`tab${viewMode==='create'?' active':''}`} onClick={()=>setViewMode('create')}>Create</button>
        <button className={`tab${viewMode==='vote'?' active':''}`} onClick={()=>setViewMode('vote')}>Vote</button>
        <button className={`tab${viewMode==='manage'?' active':''}`} onClick={()=>setViewMode('manage')}>Manage</button>
        <button className={`tab${viewMode==='results'?' active':''}`} onClick={()=>setViewMode('results')}>Results</button>
      </div>
      {/* Feedback/messages */}
      {message && message !== 'Welcome to Private Vote!' && !message.startsWith('Create a new poll') && (
        <div className={`status-${message.includes('success')?'success':message.includes('error')?'error':'warning'}`}>{message}</div>
      )}
      {/* Content area */}
      {viewMode === 'create' ? (
        <div className="flat-block">
          <CreatePollFixed onSubmit={handleCreatePoll} loading={loading} creatorPublicKey={publicKey?.toString()} isDemoMode={isDemoMode} />
        </div>
      ) : viewMode === 'vote' ? (
        <div className="flat-block">
          <VotePollFixed polls={activePollsForVoting} onVote={handleVote} isDemoMode={isDemoMode} voterPublicKey={publicKey?.toString()} />
        </div>
      ) : viewMode === 'manage' && createdPolls.length > 0 ? (
        <div className="flat-block">
          <ManagePollsFixed polls={createdPolls.filter(poll => poll.creator === publicKey)} onClosePoll={handleClosePoll} />
        </div>
      ) : viewMode === 'results' && createdPolls.length > 0 ? (
        <div className="flat-block">
          <ResultsFixed polls={createdPolls} isPollExpired={isPollExpired} />
        </div>
      ) : (
        <div className="flat-block" style={{textAlign:'center'}}>
          <h2 style={{color:'#aaa'}}>No polls available</h2>
          <p style={{color:'#aaa'}}>Click "Create" to get started with your first poll.</p>
        </div>
      )}
    </div>
  );
}

export default PrivateVoteApp;