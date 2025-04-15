import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Securely saves transaction state to help recovery from interrupted operations
 * @param key Unique identifier for the transaction state
 * @param state State object to save
 */
export function saveTransactionState(key: string, state: any) {
  try {
    // Add a timestamp for expiration checks
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
      version: '1.0' // For potential format changes
    };
    
    // Encrypt or serialize the state before storing
    const serializedState = JSON.stringify(stateWithTimestamp);
    localStorage.setItem(`txstate_${key}`, serializedState);
    
    // Also set a session-only flag for active transactions
    sessionStorage.setItem(`active_tx_${key}`, 'true');
    
    console.log(`Transaction state saved: ${key}`);
    return true;
  } catch (error) {
    console.error(`Failed to save transaction state: ${error}`);
    return false;
  }
}

/**
 * Loads transaction state for recovery
 * @param key Unique identifier for the transaction state
 * @param maxAgeMs Maximum age of the state in milliseconds (default: 1 hour)
 * @returns The saved state or null if not found/expired
 */
export function loadTransactionState<T>(key: string, maxAgeMs: number = 3600000): T | null {
  try {
    const serializedState = localStorage.getItem(`txstate_${key}`);
    if (!serializedState) return null;
    
    // Parse the state
    const state = JSON.parse(serializedState) as T & { timestamp: number, version: string };
    
    // Check if the state has expired
    const now = Date.now();
    if (now - state.timestamp > maxAgeMs) {
      console.log(`Transaction state expired: ${key}`);
      clearTransactionState(key);
      return null;
    }
    
    console.log(`Transaction state loaded: ${key}`);
    return state;
  } catch (error) {
    console.error(`Failed to load transaction state: ${error}`);
    return null;
  }
}

/**
 * Clears transaction state after completion or expiry
 * @param key Unique identifier for the transaction state
 */
export function clearTransactionState(key: string) {
  try {
    localStorage.removeItem(`txstate_${key}`);
    sessionStorage.removeItem(`active_tx_${key}`);
    console.log(`Transaction state cleared: ${key}`);
    return true;
  } catch (error) {
    console.error(`Failed to clear transaction state: ${error}`);
    return false;
  }
}

/**
 * Sanitizes text input to prevent XSS attacks
 * @param input Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Replace HTML special chars with entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    // Prevent script injection attempts
    .replace(/javascript:/gi, 'forbidden:')
    .replace(/on\w+=/gi, 'data-blocked=');
}

/**
 * Validates wallet address format
 * @param address The wallet address to validate
 * @param networkType The network type ("mainnet" or "testnet")
 * @returns True if valid, false otherwise
 */
export function isValidWalletAddress(address: string, networkType: "mainnet" | "testnet"): boolean {
  if (!address) return false;
  
  // Check for correct prefix based on network
  const mainnetPrefix = 'ckb1';
  const testnetPrefix = 'ckt1';
  const prefix = networkType === 'mainnet' ? mainnetPrefix : testnetPrefix;
  
  if (!address.startsWith(prefix)) {
    return false;
  }
  
  // Check for valid length (CKB addresses should be 46+ chars including prefix)
  if (address.length < 46) {
    return false;
  }
  
  // Validate character set (CKB addresses use bech32 encoding)
  const validChars = /^[0-9a-z]+$/;
  if (!validChars.test(address.substring(4))) {
    return false;
  }
  
  return true;
}

/**
 * Monitors network changes during active transactions
 * @param callback Function to call when network changes during active tx
 * @returns Cleanup function
 */
export function monitorNetworkSafety(callback: (changedTo: "mainnet" | "testnet") => void) {
  const hasActiveTx = Object.keys(sessionStorage)
    .some(key => key.startsWith('active_tx_'));
    
  if (!hasActiveTx) return () => {};
  
  // Function to detect network change
  const handleNetworkChange = (event: CustomEvent) => {
    if (hasActiveTx) {
      callback(event.detail.network);
    }
  };
  
  // Add event listener
  window.addEventListener('network-change', handleNetworkChange as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('network-change', handleNetworkChange as EventListener);
  };
}
