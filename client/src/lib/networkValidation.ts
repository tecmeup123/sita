/**
 * Network Validation Utilities
 * Provides validation and security checks for network switching
 */
import { logger, SecurityEvent } from './securityLogger';
import { createError, ErrorType } from './errorHandling';

// Type for the supported networks
export type NetworkType = 'mainnet' | 'testnet';

// Event interface for network change events
export interface NetworkChangeEventDetail {
  network: NetworkType;
  previousNetwork?: NetworkType;
  timestamp?: number;
  reason?: string;
}

/**
 * Validate a network switch request
 * @param currentNetwork The current network
 * @param newNetwork The requested new network
 * @param walletConnected Whether a wallet is currently connected
 * @returns Object with validation result and error if any
 */
export function validateNetworkSwitch(
  currentNetwork: NetworkType,
  newNetwork: NetworkType,
  walletConnected: boolean
): { valid: boolean; error?: Error; reason?: string } {
  // Don't allow network switch if the same (prevents unnecessary state changes)
  if (currentNetwork === newNetwork) {
    return {
      valid: false,
      error: new Error('Already connected to this network'),
      reason: 'SAME_NETWORK'
    };
  }

  // Don't allow network switch with connected wallet
  if (walletConnected) {
    // Log this as a security event - could be an attempt to manipulate state
    logger.security(
      SecurityEvent.NETWORK_SWITCHED,
      'Network switch blocked - wallet connected',
      {
        currentNetwork,
        targetNetwork: newNetwork,
        walletConnected
      }
    );

    return {
      valid: false,
      error: new Error('Cannot switch networks with connected wallet'),
      reason: 'WALLET_CONNECTED'
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Create and dispatch a network change event
 * @param network The new network
 * @param previousNetwork The previous network (optional)
 * @param reason Reason for the network change (optional)
 */
export function dispatchNetworkChangeEvent(
  network: NetworkType,
  previousNetwork?: NetworkType,
  reason?: string
): void {
  // Create event details
  const eventDetail: NetworkChangeEventDetail = {
    network,
    previousNetwork,
    timestamp: Date.now(),
    reason
  };

  // Log the network change
  logger.security(
    SecurityEvent.NETWORK_SWITCHED,
    `Network switched to ${network}`,
    {
      from: previousNetwork || 'unknown',
      to: network,
      reason: reason || 'user_initiated'
    }
  );

  // Create and dispatch the custom event
  const event = new CustomEvent<NetworkChangeEventDetail>(
    'network-change',
    { detail: eventDetail }
  );
  
  window.dispatchEvent(event);
}

/**
 * Safely switch network with validation
 * @param currentNetwork Current network
 * @param walletConnected Wallet connection status
 * @returns Object with success flag and potentially new network
 */
export function safeNetworkSwitch(
  currentNetwork: NetworkType, 
  walletConnected: boolean
): { 
  success: boolean; 
  newNetwork?: NetworkType; 
  error?: Error;
} {
  const newNetwork = currentNetwork === 'mainnet' ? 'testnet' : 'mainnet';
  
  // Validate the network switch
  const validation = validateNetworkSwitch(
    currentNetwork,
    newNetwork,
    walletConnected
  );
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error
    };
  }
  
  // Dispatch the network change event
  dispatchNetworkChangeEvent(newNetwork, currentNetwork);
  
  // Persist the network choice
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('sitaminter_network', newNetwork);
  }
  
  return {
    success: true,
    newNetwork
  };
}

export default {
  validateNetworkSwitch,
  dispatchNetworkChangeEvent,
  safeNetworkSwitch
};