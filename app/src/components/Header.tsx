import React from 'react';
import { ViewMode } from '../types';
import { Shield, Vote, Plus, Settings, BarChart3, Wallet } from './Icons';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isInitialized: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, isInitialized }) => {
  const publicKey: string | null = null;
  const disconnect = () => {};

  const navigationItems = [
    { id: 'create' as ViewMode, label: 'Create Poll', icon: Plus },
    { id: 'vote' as ViewMode, label: 'Vote', icon: Vote },
    { id: 'manage' as ViewMode, label: 'Manage', icon: Settings },
    { id: 'results' as ViewMode, label: 'Results', icon: BarChart3 },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Private Vote</h1>
              <p className="text-sm text-gray-500">Secure voting on Solana</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                    currentView === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Wallet and Status */}
          <div className="flex items-center space-x-4">
            {/* Arcium Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm text-gray-600">
                {isInitialized ? 'Encrypted' : 'Initializing...'}
              </span>
            </div>

            {/* Wallet Info */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <Wallet className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {publicKey ? formatAddress(publicKey) : 'Not connected'}
              </span>
              <button
                onClick={disconnect}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-2 gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    currentView === item.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
