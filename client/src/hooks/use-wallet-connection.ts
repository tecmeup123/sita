"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook to manage wallet connection UI state and actions
 * Provides a unified API for wallet connection functionality across components
 */
export function useWalletConnection() {
  const { 
    connectWallet: contextConnectWallet, 
    disconnectWallet: contextDisconnectWallet,
    refreshBalance: contextRefreshBalance,
    walletConnected,
    connecting,
    signer,
    walletAddress,
    walletBalance,
    userScript,
    network,
    refreshing
  } = useWallet();
  
  const { toast } = useToast();
  
  // UI state
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Handle wallet connection with error handling
   * Opens connect dialog and attempts to connect
   * This is a void function that initiates the connection process
   */
  const handleConnect = (): void => {
    setConnectionError(null);
    setShowConnectDialog(true);
    
    try {
      const connectPromise = contextConnectWallet();
      if (connectPromise && typeof connectPromise.then === 'function') {
        connectPromise
          .then(() => {
            // Close the dialog once connection is successful
            setShowConnectDialog(false);
          })
          .catch(err => {
            console.error("Connection error:", err);
            setConnectionError("Connection failed. Please check your network and try again.");
          });
      }
    } catch (err) {
      console.error("Connection error:", err);
      setConnectionError("Connection failed. Please check your network and try again.");
    }
  };

  /**
   * Handle wallet disconnection
   * Closes connect dialog first, then disconnects wallet
   */
  const handleDisconnect = () => {
    // Close any open dialogs first to prevent them from reopening on disconnection
    setShowConnectDialog(false);
    // Then proceed with disconnection
    contextDisconnectWallet();
  };

  /**
   * Refresh wallet balance
   */
  const handleRefreshBalance = async () => {
    try {
      await contextRefreshBalance();
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    }
  };

  /**
   * Copy wallet address to clipboard
   */
  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
        duration: 2000,
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return {
    // State
    walletConnected,
    connecting,
    signer,
    walletAddress,
    walletBalance,
    userScript,
    network,
    refreshing,
    showConnectDialog,
    setShowConnectDialog,
    connectionError,
    setConnectionError,
    copied,
    setCopied,
    
    // Actions
    connectWallet: handleConnect,
    disconnectWallet: handleDisconnect,
    refreshBalance: handleRefreshBalance,
    copyAddressToClipboard
  };
}

/**
 * Format address for display (e.g., 0x1234...5678)
 */
export const formatAddress = (address: string | null): string => {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

/**
 * Format CKB balance for display with commas and proper decimal places
 */
export const formatBalance = (balance: string | null): string => {
  if (!balance) return "0";
  
  // Convert to number for formatting
  const numBalance = parseFloat(balance);
  
  // Format with commas for thousands and limit to 4 decimal places
  return numBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  });
};