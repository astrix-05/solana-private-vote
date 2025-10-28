import React from 'react';

// Simplified Arcium context for demo mode
export const useArcium = () => {
  return {
    isInitialized: true,
    encryptVote: async (data: string) => {
      const bytes = new TextEncoder().encode(data);
      return Array.from(bytes);
    },
    decryptVote: async (data: number[]) => {
      const bytes = new Uint8Array(data);
      return new TextDecoder().decode(bytes);
    },
    initialize: async () => {},
  };
};

export const ArciumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};