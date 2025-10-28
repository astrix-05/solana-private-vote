import React, { useState } from 'react';
import type { ViewMode, NotificationState } from './types';
import Header from './components/Header';
import CreatePoll from './components/CreatePoll';
import VotePoll from './components/VotePoll';
import ManagePolls from './components/ManagePolls';
import ViewResults from './components/ViewResults';
import Notification from './components/Notification';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('create');
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = (type: NotificationState['type'], message: string, duration = 5000) => {
    setNotification({ type, message, duration });
    setTimeout(() => setNotification(null), duration);
  };

  const handleCreatePoll = async (pollData: { question: string; options: string[] }) => {
    console.log('Creating poll:', pollData);
    showNotification('success', 'Poll created successfully! (Demo mode)');
    setTimeout(() => setCurrentView('manage'), 2000);
  };

  const handleVote = async (pollAddress: string, selectedOption: number) => {
    console.log('Voting:', pollAddress, selectedOption);
    showNotification('success', 'Vote cast successfully! (Demo mode)');
  };

  const handleClosePoll = async (pollAddress: string) => {
    console.log('Closing poll:', pollAddress);
    showNotification('success', 'Poll closed successfully! (Demo mode)');
  };

  const handleRevealResults = async (pollAddress: string) => {
    console.log('Revealing results:', pollAddress);
    showNotification('success', 'Results revealed! (Demo mode)');
    setTimeout(() => setCurrentView('results'), 2000);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreatePoll onSubmit={handleCreatePoll} />;
      case 'vote':
        return <VotePoll onVote={handleVote} />;
      case 'manage':
        return <ManagePolls onClosePoll={handleClosePoll} onRevealResults={handleRevealResults} />;
      case 'results':
        return <ViewResults />;
      default:
        return <CreatePoll onSubmit={handleCreatePoll} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isInitialized={true}
      />
      
      <main className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </main>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default App;