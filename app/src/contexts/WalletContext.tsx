import React, { createContext } from 'react';

// Simplified wallet context for demo mode
export const useWallet = () => {
  return {
    publicKey: null,
    connected: false,
    connect: async () => {},
    disconnect: async () => {},
  };
};