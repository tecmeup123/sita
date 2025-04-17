
import React, { createContext, useContext } from 'react';

interface NetworkContextType {
  currentNetwork: 'mainnet';
}

const NetworkContext = createContext<NetworkContextType>({ currentNetwork: 'mainnet' });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  return (
    <NetworkContext.Provider value={{ currentNetwork: 'mainnet' }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
