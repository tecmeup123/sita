
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
  return { currentNetwork: 'mainnet' };
}
