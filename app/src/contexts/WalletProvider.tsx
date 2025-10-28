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
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        const wallet = (window as any).solana;
        const response = await wallet.connect();
        setPublicKey(response.publicKey.toString());
        setConnected(true);
      } catch (err) {
        console.error('Failed to connect wallet:', err);
      }
    } else {
      alert('Please install Phantom wallet from https://phantom.app/');
    }
  };

  const disconnect = async () => {
    if (typeof window !== 'undefined' && (window as any).solana) {
      try {
        await (window as any).solana.disconnect();
        setPublicKey(null);
        setConnected(false);
      } catch (err) {
        console.error('Failed to disconnect wallet:', err);
      }
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {connected ? (
        <>
          <div style={{
            padding: '8px 16px',
            background: 'white',
            borderRadius: '8px',
            color: '#667eea',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {formatAddress(publicKey)}
          </div>
          <button
            onClick={disconnect}
            style={{
              padding: '8px 16px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connect}
          style={{
            padding: '10px 20px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};