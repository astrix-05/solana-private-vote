import React, { createContext, useContext, ReactNode } from 'react';
import { Connection } from '@solana/web3.js';

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connection: Connection | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    return {
      connected: false,
      publicKey: null,
      connect: async () => {},
      disconnect: async () => {},
      connection: null
    };
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [publicKey, setPublicKey] = React.useState<string | null>(null);
  const [connected, setConnected] = React.useState(false);
  const connection = React.useMemo(
    () => new Connection(
      process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    ),
    []
  );

  const connect = async () => {
    console.log('Attempting to connect wallet...');
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        const wallet = (window as any).solana;
        console.log('Wallet detected, attempting connection...');
        const response = await wallet.connect();
        setPublicKey(response.publicKey.toString());
        setConnected(true);
        console.log('Wallet connected successfully:', response.publicKey.toString());
        alert(`Wallet connected successfully! Address: ${response.publicKey.toString().slice(0, 8)}...`);
      } catch (err) {
        console.error('Failed to connect wallet:', err);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      console.log('No wallet detected');
      // For testing purposes, simulate a wallet connection
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: simulating wallet connection');
        setPublicKey('test_wallet_1234567890abcdef');
        setConnected(true);
        alert('Development mode: Simulated wallet connection for testing');
      } else {
        // Check for other wallet providers
        if (typeof window !== 'undefined' && (window as any).solflare) {
          alert('Phantom wallet not detected. Please install Phantom wallet from https://phantom.app/ or use Solflare wallet.');
        } else {
          alert('No Solana wallet detected. Please install Phantom wallet from https://phantom.app/');
        }
      }
    }
  };

  const disconnect = async () => {
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        await (window as any).solana.disconnect();
        setPublicKey(null);
        setConnected(false);
        console.log('Wallet disconnected successfully');
      } catch (err) {
        console.error('Failed to disconnect wallet:', err);
        // Force disconnect even if wallet disconnect fails
        setPublicKey(null);
        setConnected(false);
      }
    } else {
      // Force disconnect if wallet is not available
      setPublicKey(null);
      setConnected(false);
    }
  };

  return (
    <WalletContext.Provider value={{ connected, publicKey, connect, disconnect, connection }}>
      {children}
    </WalletContext.Provider>
  );
};

// Wallet Button Component
export const WalletButton: React.FC = () => {
  const { connected, publicKey, connect, disconnect } = useWallet();
  
  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {connected ? (
        <>
          <span style={{
            fontSize: '12px',
            color: '#999'
          }}>
            {formatAddress(publicKey)}
          </span>
          <button
            onClick={disconnect}
            style={{
              padding: '8px 16px',
        background: 'var(--bg-button)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-medium)',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '400',
              minHeight: '36px'
            }}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connect}
          style={{
            padding: '8px 16px',
        background: 'var(--bg-button)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-medium)',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            minHeight: '36px'
          }}
        >
          Connect
        </button>
      )}
    </div>
  );
};