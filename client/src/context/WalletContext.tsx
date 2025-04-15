"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState, useRef } from "react";
import { ccc, Provider, useCcc } from "@ckb-ccc/connector-react";
import { scriptToHash } from "@nervosnetwork/ckb-sdk-utils";
import { useToast } from "@/hooks/use-toast";
import logger, { SecurityEvent } from "../lib/securityLogger";
import { Script, ExtendedSigner, Cell, ScriptLike } from "../lib/types/ckb";

// Type definition for the wallet context
export interface WalletContextType {
  signer: ExtendedSigner | null;
  walletConnected: boolean;
  connecting: boolean;
  network: "mainnet" | "testnet";
  walletAddress: string | null;
  walletBalance: string | null;
  userScript: Script | null;
  error: string | null;
  refreshing: boolean;
  processingTransaction: boolean;
  
  // Connect methods
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setNetwork: (network: "mainnet" | "testnet") => void;
  refreshBalance: () => Promise<string | null>;
  // Transaction lock methods
  acquireTransactionLock: () => boolean;
  releaseTransactionLock: () => void;
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Inner component to use the CCC hooks
const WalletProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { wallet, signerInfo, open, disconnect, client } = useCcc();
  
  const [signer, setSigner] = useState<ExtendedSigner | null>(null);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [network, setNetworkState] = useState<"mainnet" | "testnet">(() => {
    // Load from localStorage if available
    const savedNetwork = typeof window !== 'undefined' ? localStorage.getItem('sitaminter_network') : null;
    return (savedNetwork === 'mainnet' ? 'mainnet' : 'testnet') as "mainnet" | "testnet";
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [userScript, setUserScript] = useState<Script | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [processingTransaction, setProcessingTransaction] = useState<boolean>(false);
  const [attemptedAutoReconnect, setAttemptedAutoReconnect] = useState(false);
  
  // Transaction lock mechanism to prevent reentrancy
  const transactionLockRef = useRef<boolean>(false);

  // Prepare for manual reconnection when needed, but don't auto-connect
  useEffect(() => {
    if (typeof window === 'undefined' || attemptedAutoReconnect) return;
    
    // Just mark as attempted to avoid multiple checks
    setAttemptedAutoReconnect(true);
    
    // Clear any stale connection flags that might cause issues
    if (!walletConnected && !wallet && !signerInfo) {
      console.log("Cleaning up stale wallet connection state");
      localStorage.removeItem('sitaminter_wallet_connected');
    }
    
    // Note: Auto-reconnect has been disabled to prevent UI glitches
    // Users will need to manually connect their wallet
    
    // Add event listener to disconnect wallet on page refresh or close
    const handleBeforeUnload = () => {
      console.log("Page being refreshed/closed - disconnecting wallet");
      
      // Clear localStorage
      localStorage.removeItem('sitaminter_wallet_connected');
      localStorage.removeItem('sitaminter_wallet_address');
      localStorage.removeItem('sitaminter_user_script');
      
      // Force disconnect wallet directly
      if (disconnect) {
        disconnect();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [attemptedAutoReconnect, disconnect]);

  // Update localStorage when network changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sitaminter_network', network);
      
      // Emit network change event
      const event = new CustomEvent('network-change', { 
        detail: { network } 
      });
      window.dispatchEvent(event);
    }
  }, [network]);

  // Update state when wallet or signerInfo changes
  useEffect(() => {
    const updateWalletInfo = async () => {
      // When the user has explicitly requested to connect (connecting = true)
      // or when the wallet is already connected, process the wallet connection
      if (wallet && signerInfo && signerInfo.signer && (connecting || walletConnected)) {
        try {
          setSigner(signerInfo.signer);
          setWalletConnected(true);
          
          // Get user's script/address
          const { script } = await signerInfo.signer.getRecommendedAddressObj();
          setUserScript(script);
          
          // Save script to localStorage for persistence
          localStorage.setItem('sitaminter_user_script', JSON.stringify(script));
          
          // Get wallet address
          await getWalletAddress(signerInfo.signer);
          
          // Get wallet balance
          await fetchWalletBalance(signerInfo.signer, script);
          
          // Store wallet connection state in localStorage
          localStorage.setItem('sitaminter_wallet_connected', 'true');
          
          if (connecting) {
            toast({
              title: "Wallet Connected",
              description: `Successfully connected to ${wallet.name} on ${network}.`,
            });
          }
        } catch (e: any) {
          console.error("Failed to update wallet info:", e);
          setError(`Failed to update wallet info: ${e.message}`);
        } finally {
          setConnecting(false);
        }
      } else if (!wallet || !signerInfo) {
        // If wallet or signerInfo is null/undefined, consider disconnected
        if (walletConnected) {
          setSigner(null);
          setWalletConnected(false);
          setWalletAddress(null);
          setWalletBalance(null);
          setUserScript(null);
          localStorage.removeItem('sitaminter_wallet_connected');
          localStorage.removeItem('sitaminter_wallet_address');
          localStorage.removeItem('sitaminter_user_script');
        }
        setConnecting(false);
      } else if (wallet && signerInfo && signerInfo.signer && !connecting && !walletConnected) {
        // This is an auto-connection attempt on page load that we want to avoid
        // Only if neither connecting nor walletConnected flags are set
        
        // If the user has previously started the connection process (connecting is true),
        // we should let the connection proceed and not block it
        
        // This condition specifically prevents auto-connection on page load
        // but doesn't interfere with manually initiated connections
        const isPageLoad = document.readyState !== 'complete' || 
                           performance.now() < 3000; // Within first 3 seconds of page load
        
        if (isPageLoad) {
          console.log("Preventing automatic wallet connection on page load");
          // Force disconnect to prevent dialog showing
          disconnect();
        } else {
          // This might be a legitimate connection during normal app use
          // Let it proceed but log for debugging
          console.log("Non-automatic wallet connection detected, allowing");
          setSigner(signerInfo.signer);
          setWalletConnected(true);
        }
      }
    };
    
    updateWalletInfo();
  }, [wallet, signerInfo, network, connecting, walletConnected, disconnect]);

  // Get wallet address from signer
  const getWalletAddress = async (signer: ExtendedSigner) => {
    try {
      const { script } = await signer.getRecommendedAddressObj();
      // Create address from script using CKB utils
      const address = ccc.Address.fromScript(script, signer.client).toString();
      setWalletAddress(address);
      
      // Save address to localStorage for persistence
      localStorage.setItem('sitaminter_wallet_address', address);
      
      return address;
    } catch (e: any) {
      console.error("Failed to get wallet address:", e);
      setError(`Failed to get wallet address: ${e.message}`);
      return null;
    }
  };

  // Get wallet balance from signer with improved handling based on CCC documentation
  // @ts-ignore - External library type mismatches in ckb.ts
  const fetchWalletBalance = async (signer: ExtendedSigner, script: Script) => {
    try {
      console.log("Fetching wallet balance for script:", JSON.stringify(script));
      
      let readableBalance = "0";
      
      // Try the direct RPC method first as it's most reliable
      try {
        // Import is inside to avoid circular dependencies
        const { getBalanceForScript } = await import('@/lib/ckbService');
        
        // Format script for RPC call
        const formattedScript = {
          codeHash: script.codeHash,
          hashType: script.hashType,
          args: script.args
        };
        
        const directBalance = await getBalanceForScript(formattedScript, network);
        console.log("Direct RPC balance result:", directBalance);
        
        if (directBalance && parseFloat(directBalance) > 0) {
          readableBalance = directBalance;
          console.log("Using direct RPC balance:", readableBalance);
        }
      } catch (rpcError) {
        console.error("Direct RPC balance check failed:", rpcError);
        // Continue to fallback methods
      }
      
      // If RPC method didn't work or returned 0, try the CCC wallet methods
      if (readableBalance === "0") {
        let balance;
        
        try {
          // Method 1: First try the direct capacity method from the client
          if (typeof signer.client.getCapacity === 'function') {
            console.log("Using client.getCapacity method");
            
            // Get the lock hash from the script
            // @ts-ignore - The CCC types are not fully compatible with our Script type
            const lockHash = scriptToHash(script);
            
            // Use getCapacity with the lock hash
            balance = await signer.client.getCapacity(lockHash);
            console.log("Raw capacity (shannons):", balance.toString());
            
            // Convert from shannons to CKB (1 CKB = 10^8 shannons)
            if (balance) {
              const numBalance = typeof balance === 'bigint' ? balance : BigInt(balance.toString());
              readableBalance = (Number(numBalance) / 10**8).toFixed(4);
              console.log("Formatted balance from getCapacity (CKB):", readableBalance);
            }
          }
          // Method 2: Try using signer's getCells method and sum capacities
          else if (typeof signer.getCells === 'function') {
            console.log("Using signer.getCells method");
            
            // Get all cells owned by this lock script
            const cells = await signer.getCells({ lock: script });
            
            // Sum the capacities of all cells
            let totalCapacity = BigInt(0);
            cells.forEach(cell => {
              // Handle different cell structure formats
              if (cell.cellOutput && cell.cellOutput.capacity) {
                totalCapacity += BigInt(cell.cellOutput.capacity);
              } else if (cell.capacity) {
                totalCapacity += BigInt(cell.capacity);
              }
            });
            
            readableBalance = (Number(totalCapacity) / 10**8).toFixed(4);
            console.log("Formatted balance from getCells (CKB):", readableBalance);
          }
          // Method 3: Try using advanced collector API if available
          else if (signer.collector && typeof signer.collector.getCellsByLockScript === 'function') {
            console.log("Using collector.getCellsByLockScript method");
            
            const cells = await signer.collector.getCellsByLockScript(script);
            
            // Sum the capacities
            let totalCapacity = BigInt(0);
            cells.forEach(cell => {
              // Handle different cell structure formats
              if (cell.cellOutput && cell.cellOutput.capacity) {
                totalCapacity += BigInt(cell.cellOutput.capacity);
              } else if (cell.capacity) {
                totalCapacity += BigInt(cell.capacity);
              }
            });
            
            readableBalance = (Number(totalCapacity) / 10**8).toFixed(4);
            console.log("Formatted balance from collector (CKB):", readableBalance);
          }
          // Method 4: Try using getCapacityByLockScript if available
          else if (typeof signer.client.getCapacityByLockScript === 'function') {
            console.log("Using getCapacityByLockScript method");
            balance = await signer.client.getCapacityByLockScript(script);
            console.log("Raw capacity (shannons):", balance.toString());
            
            // Convert from shannons to CKB (1 CKB = 10^8 shannons)
            readableBalance = (Number(balance) / 10**8).toFixed(4);
            console.log("Formatted balance (CKB):", readableBalance);
          }
          // Method 5: Last resort - try using the address for balance lookup
          else {
            console.log("Using fallback address-based balance method");
            // Get the address from the script - use @ts-ignore to bypass type checking
            // @ts-ignore - The CCC types are not fully compatible with our Script type
            const address = ccc.Address.fromScript(script, signer.client).toString();
            console.log("Calculated address for balance:", address);
            
            // Some clients may have an address-based balance check
            if (typeof signer.client.getBalance === 'function') {
              // @ts-ignore - CCC API expects different format than what TypeScript detects
              balance = await signer.client.getBalance(address);
              readableBalance = balance ? (Number(balance) / 10**8).toFixed(4) : "0";
              console.log("Balance via address:", readableBalance);
            }
          }
        } catch (balanceError) {
          console.error("Error in primary balance methods, trying fallback:", balanceError);
          
          // If all direct methods fail, try using the recommended address object
          try {
            // @ts-ignore - Different wallet implementations use different fields
            const addressObj = await signer.getRecommendedAddressObj();
            
            // Handle various address object structures
            // @ts-ignore - Different wallet implementations use different fields
            const addr = addressObj.address || addressObj.addressString || '';
            // @ts-ignore - Different wallet implementations use different fields
            const lockScript = addressObj.script || addressObj.lockScript;
            console.log("Using recommended address for balance:", addr);
            
            if (lockScript && typeof signer.client.getCapacity === 'function') {
              // Try getting capacity using the script hash
              // @ts-ignore - The CCC types are not fully compatible with our Script type
              const lockHash = scriptToHash(lockScript);
              balance = await signer.client.getCapacity(lockHash);
              
              if (balance) {
                readableBalance = (Number(balance) / 10**8).toFixed(4);
                console.log("Balance from recommended address script:", readableBalance);
              }
            }
          } catch (addressError) {
            console.error("Fallback address balance lookup failed:", addressError);
          }
        }
      }
      
      // Ensure we have a clean number string
      const cleanBalance = readableBalance.replace(/[^\d.-]/g, '');
      const numericBalance = Number(cleanBalance);
      
      // Format the balance with commas for thousands and limit decimal places
      const formattedBalance = isNaN(numericBalance) ? "0" : 
        numericBalance.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4
        });
      
      console.log("Final formatted balance:", formattedBalance);
      setWalletBalance(formattedBalance);
      return formattedBalance;
    } catch (e: any) {
      console.error("Failed to get wallet balance:", e);
      setError(`Failed to get wallet balance: ${e.message}`);
      setWalletBalance("0");
      return "0";
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      // Open the CCC wallet selection dialog
      await open();
      
      // The connection state will be updated in the useEffect
    } catch (e: any) {
      console.error("Failed to connect wallet:", e);
      setError(`Failed to connect wallet: ${e.message}`);
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: e.message || "Could not connect to wallet. Please try again.",
      });
      setConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    // Prepare data before disconnecting
    const wasConnected = walletConnected;
    
    // Clear local state first
    setSigner(null);
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletBalance(null);
    setUserScript(null);
    
    // Clear localStorage
    localStorage.removeItem('sitaminter_wallet_connected');
    localStorage.removeItem('sitaminter_wallet_address');
    localStorage.removeItem('sitaminter_user_script');
    
    // Only call disconnect after all our state has been cleared
    // To avoid any state synchronization issues with event listeners
    setTimeout(() => {
      if (wasConnected) {
        // Disconnect the CCC wallet in a separate tick of the event loop
        // This helps avoid the dialog appearing since we've already cleared our state
        disconnect();
      }
      
      // Show toast notification
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    }, 0);
  };
  
  // Set network, update localStorage, and trigger wallet reconnection if needed
  const setNetwork = (newNetwork: "mainnet" | "testnet") => {
    // Only proceed if network is actually changing
    if (newNetwork !== network) {
      setNetworkState(newNetwork);
      
      // If wallet is connected, disconnect first and reconnect after network change
      if (walletConnected && wallet && signer) {
        toast({
          title: "Network Changed",
          description: `Switching to ${newNetwork}. Reconnecting wallet...`,
        });
        
        // First disconnect using our custom method (this will clear localStorage)
        disconnectWallet();
        
        // Then reconnect after a small delay to allow the Provider to update
        setTimeout(() => {
          // Save connection preference (will be restored on next page load)
          localStorage.setItem('sitaminter_wallet_connected', 'true');
          connectWallet().catch(e => {
            console.error("Failed to reconnect after network change:", e);
          });
        }, 500);
      } else {
        toast({
          title: "Network Changed",
          description: `Switched to ${newNetwork}.`,
        });
      }
    }
  };

  // Function to manually refresh the wallet balance
  const refreshBalance = async (): Promise<string | null> => {
    if (!signer || !userScript) {
      toast({
        variant: "destructive",
        title: "Balance Refresh Failed",
        description: "Wallet not connected. Please connect your wallet first.",
      });
      return null;
    }
    
    try {
      setRefreshing(true);
      
      toast({
        title: "Refreshing Balance",
        description: "Fetching your latest wallet balance...",
      });
      
      // Try the direct RPC method first
      try {
        // Import is inside to avoid circular dependencies
        const { getBalanceForScript } = await import('@/lib/ckbService');
        
        // Format script for RPC call
        const formattedScript = {
          codeHash: userScript.codeHash,
          hashType: userScript.hashType,
          args: userScript.args
        };
        
        const directBalance = await getBalanceForScript(formattedScript, network);
        console.log("Direct RPC balance result:", directBalance);
        
        if (directBalance && parseFloat(directBalance) > 0) {
          // Format with commas and appropriate decimal places
          const numericBalance = parseFloat(directBalance);
          const formattedBalance = numericBalance.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4
          });
          
          setWalletBalance(formattedBalance);
          
          toast({
            title: "Balance Updated",
            description: `Your current balance is ${formattedBalance} CKB.`,
          });
          
          return formattedBalance;
        }
      } catch (rpcError) {
        console.error("Direct RPC balance check failed:", rpcError);
        // Continue to fallback method
      }
      
      // Fallback to original method
      const balance = await fetchWalletBalance(signer, userScript);
      
      toast({
        title: "Balance Updated",
        description: `Your current balance is ${balance} CKB.`,
      });
      
      return balance;
    } catch (e: any) {
      console.error("Failed to refresh balance:", e);
      setError(`Failed to refresh balance: ${e.message}`);
      
      toast({
        variant: "destructive",
        title: "Balance Refresh Failed",
        description: e.message || "Could not refresh wallet balance. Please try again.",
      });
      
      return null;
    } finally {
      setRefreshing(false);
    }
  };
  
  // Transaction lock methods to prevent reentrancy attacks
  const acquireTransactionLock = (): boolean => {
    // If the lock is already held, return false
    if (transactionLockRef.current === true) {
      logger.security(
        SecurityEvent.LOCK_ACQUISITION_FAILED,
        "Transaction lock already acquired. Cannot process multiple transactions simultaneously.",
        { walletAddress },
        walletAddress || undefined,
        network
      );
      
      toast({
        variant: "destructive",
        title: "Transaction in Progress",
        description: "Please wait for the current transaction to complete before initiating another one.",
      });
      return false;
    }
    
    // Otherwise, acquire the lock and update state
    transactionLockRef.current = true;
    setProcessingTransaction(true);
    
    logger.security(
      SecurityEvent.LOCK_ACQUIRED,
      "Transaction lock acquired successfully",
      { walletAddress },
      walletAddress || undefined,
      network
    );
    return true;
  };
  
  const releaseTransactionLock = (): void => {
    // Release the lock and update state
    transactionLockRef.current = false;
    setProcessingTransaction(false);
    
    logger.security(
      SecurityEvent.LOCK_RELEASED,
      "Transaction lock released",
      { walletAddress },
      walletAddress || undefined,
      network
    );
  };

  const value: WalletContextType = {
    signer,
    walletConnected,
    connecting,
    network,
    walletAddress,
    walletBalance,
    userScript,
    error,
    refreshing,
    processingTransaction,
    connectWallet,
    disconnectWallet,
    setNetwork,
    refreshBalance,
    acquireTransactionLock,
    releaseTransactionLock,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Function to avoid recalculating these on every render
function getClientForNetwork(network: "mainnet" | "testnet") {
  return network === "mainnet" 
    ? new ccc.ClientPublicMainnet({
        url: "https://mainnet.ckb.dev/rpc"
      })
    : new ccc.ClientPublicTestnet({
        url: "https://testnet.ckb.dev/rpc"
      });
}

// Import necessary types from CCC
import { NetworkPreference, SignerType } from '@ckb-ccc/connector-react';

// Function to get preferred networks for a network
function getPreferredNetworks(network: "mainnet" | "testnet"): NetworkPreference[] {
  return [{ 
    network: network === "mainnet" ? "ckb" : "ckb_testnet",
    addressPrefix: network === "mainnet" ? "ckb" : "ckt",
    signerType: "ckb" as SignerType // Cast to SignerType
  }];
}

// Outer provider that sets up the CCC Provider
export const WalletProvider: React.FC<{ 
  children: ReactNode;
  availableWallets?: string[]; // Optional prop to filter available wallets
}> = ({ 
  children,
  availableWallets = ['joyid', 'metamask', 'utxo-global'] // Default to only these supported wallets
}) => {
  const [network, setNetwork] = useState<"mainnet" | "testnet">(() => {
    const savedNetwork = typeof window !== 'undefined' ? localStorage.getItem('sitaminter_network') : null;
    return (savedNetwork === 'mainnet' ? 'mainnet' : 'testnet') as "mainnet" | "testnet";
  });
  
  // Listen for network change events
  useEffect(() => {
    const handleNetworkChange = (event: CustomEvent) => {
      if (event.detail && event.detail.network) {
        setNetwork(event.detail.network);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('network-change', handleNetworkChange as EventListener);
      
      return () => {
        window.removeEventListener('network-change', handleNetworkChange as EventListener);
      };
    }
  }, []);
  
  // Get client and preferred networks based on current network state
  const defaultClient = getClientForNetwork(network);
  const preferredNetworks = getPreferredNetworks(network); 
  
  // Create a signerFilter function that will only allow the specified wallets and chains
  const walletFilter = async (signerInfo: ccc.SignerInfo, wallet: ccc.Wallet): Promise<boolean> => {
    // Convert wallet names to lowercase for case-insensitive comparison
    const walletName = wallet.name.toLowerCase();
    
    // Define mapping of displayed wallet names to our internal wallet IDs
    const walletNameMapping: Record<string, string> = {
      'joyid passkey': 'joyid',
      'metamask': 'metamask',
      'utxo global wallet': 'utxo-global'
    };
    
    // Check if this wallet name maps to one of our allowed wallets
    const matchedWallet = walletNameMapping[walletName];
    const isAllowed = availableWallets.includes(matchedWallet);
    
    // For both JoyID and UTXO Global, we need to filter by chain (only allow CKB)
    if ((matchedWallet === 'joyid' || matchedWallet === 'utxo-global') && signerInfo) {
      // The name property in SignerInfo contains the chain type
      const signerName = signerInfo.name.toLowerCase();
      
      // Define patterns to match for allowed chains - ONLY CKB for both wallets
      const allowedChainPatterns = [
        // CKB chains only
        'ckb'
      ];
      
      // Check if the signer name matches any of our allowed chain patterns
      const isAllowedChain = allowedChainPatterns.some(pattern => 
        signerName.includes(pattern)
      );
      
      // For debugging, log the wallet type, signer name and if it's allowed
      console.log(`${matchedWallet} chain filter: signer name=${signerName}, allowed=${isAllowedChain}`);
      
      // Only allow the wallet if the chain matches our patterns
      return isAllowed && isAllowedChain;
    }
    
    // Log the filtering for debugging
    console.log(`Filtering wallet: ${walletName}, matched to: ${matchedWallet || 'none'}, allowed: ${isAllowed}`);
    
    // Return true if the wallet is in our allowed list
    return isAllowed;
  };
  
  return (
    <Provider 
      defaultClient={defaultClient}
      preferredNetworks={preferredNetworks}
      name="SiTa Minter"
      icon={typeof window !== 'undefined' ? `${window.location.origin}/assets/N.png` : '/assets/N.png'}
      key={network} // Force recreate the provider when network changes
      signerFilter={walletFilter} // Use the signerFilter prop to filter available wallets
      // Note: We don't use autoConnect here as it's not supported by the Provider
      // Instead, we control auto-connection behavior in our custom hooks
    >
      <WalletProviderInner>
        {children}
      </WalletProviderInner>
    </Provider>
  );
};

// Named function for React Fast Refresh compatibility
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
