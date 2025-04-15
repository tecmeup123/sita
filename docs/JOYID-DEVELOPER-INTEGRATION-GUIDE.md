# JoyID Integration Guide for dApp Developers

This comprehensive guide explains how to integrate JoyID wallet into your decentralized application (dApp) on the Nervos CKB blockchain. It provides step-by-step instructions, code examples, and best practices based on our successful implementation in the SITA MINTER application.

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Basic Integration](#basic-integration)
5. [Advanced Integration](#advanced-integration)
6. [Error Handling](#error-handling)
7. [Security Best Practices](#security-best-practices)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

## Introduction

JoyID is a next-generation blockchain wallet that leverages WebAuthn for secure and user-friendly authentication. Instead of seed phrases, it uses the device's biometric security (fingerprint/face recognition) to create a seamless user experience.

This guide focuses on integrating JoyID into web applications to interact with the Nervos CKB blockchain.

### Key Benefits for Developers

- **Simple Integration**: JoyID can be integrated with just a few lines of code
- **Enhanced User Experience**: No seed phrases, just biometric authentication
- **Cross-Platform**: Works across mobile and desktop devices
- **Security**: Leverages hardware-level security via WebAuthn

## Prerequisites

Before integrating JoyID into your dApp, ensure you have:

- A basic understanding of JavaScript/TypeScript and React
- Familiarity with Nervos CKB blockchain concepts
- Node.js (v14+) installed on your development machine
- npm or yarn package manager

## Installation

### Step 1: Install Required Dependencies

```bash
# Using npm
npm install @ckb-ccc/ccc

# Using yarn
yarn add @ckb-ccc/ccc
```

### Step 2: Add Polyfills for Browser Compatibility

JoyID requires certain Node.js modules that are not available in browsers. Add these polyfills to your application:

```javascript
// In browserPolyfills.js
// Buffer polyfill
window.Buffer = window.Buffer || require('buffer/').Buffer;

// Stream polyfill for some CKB operations
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.browser = true;
}
```

Include this file in your application's entry point:

```javascript
// In your main.js or index.js
import './browserPolyfills';
```

Or configure your bundler (Webpack, Vite, etc.) to include these polyfills automatically.

## Basic Integration

### Step 1: Create a JoyID Signer

The first step is to create a JoyID signer that connects to the Nervos CKB blockchain:

```typescript
import * as ccc from '@ckb-ccc/ccc';

/**
 * Creates a CKB signer with enhanced error handling for different networks
 * @param network The network to connect to ("mainnet" or "testnet")
 * @returns A configured CKB signer connected to the specified network
 */
export async function createSigner(network: string = "testnet") {
  // Define RPC endpoints for each network
  const rpcEndpoints = {
    mainnet: [
      "https://mainnet.ckb.dev/rpc",
      "https://rpc.ankr.com/nervos"
    ],
    testnet: [
      "https://testnet.ckb.dev/rpc",
      "https://testnet.ckbapp.dev/rpc"
    ]
  };
  
  // Select the appropriate endpoints based on network
  const endpoints = network === "mainnet" ? rpcEndpoints.mainnet : rpcEndpoints.testnet;
  
  // Try each endpoint until one works
  for (const url of endpoints) {
    try {
      console.log(`Creating CKB client for ${network} using endpoint: ${url}...`);
      
      // Create the appropriate client type based on network
      const client = network === "mainnet" 
        ? new ccc.ClientPublicMainnet({ url }) 
        : new ccc.ClientPublicTestnet({ url });
      
      // Create CkbSigner with your application details
      const signer = new ccc.JoyId.CkbSigner(
        client, 
        "Your dApp Name",  // Replace with your application name
        "https://yourdapp.com/logo.png"  // Replace with your application logo URL
      );
      
      // Connect to the wallet
      await signer.connect();
      
      return signer;
    } catch (error) {
      console.warn(`Connection attempt to ${url} failed:`, error);
      // Continue to the next endpoint
    }
  }
  
  // If all endpoints fail, throw an error
  throw new Error(`Failed to connect to any ${network} CKB node.`);
}
```

### Step 2: Implement Wallet Connection in Your UI

Create a component to handle wallet connection:

```tsx
import React, { useState } from 'react';
import { createSigner } from './utils/ckb';

function WalletConnector({ onConnect }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState('testnet');
  
  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const signer = await createSigner(network);
      
      // Get user's address/lock script
      const { script } = await signer.getRecommendedAddressObj();
      
      // Convert script to address string
      const addressObj = await signer.client.Address.fromScript(script);
      const address = addressObj.toString();
      
      // Notify parent component
      onConnect({ signer, address, script });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setError(error.message || "Failed to connect to wallet");
    } finally {
      setConnecting(false);
    }
  };
  
  return (
    <div>
      <select value={network} onChange={(e) => setNetwork(e.target.value)}>
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>
      
      <button 
        onClick={handleConnect}
        disabled={connecting}
      >
        {connecting ? "Connecting..." : "Connect JoyID Wallet"}
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default WalletConnector;
```

### Step 3: Use the Connected Wallet

Once connected, you can use the signer to perform transactions:

```tsx
import React, { useState } from 'react';
import WalletConnector from './WalletConnector';

function App() {
  const [walletState, setWalletState] = useState(null);
  
  const handleWalletConnect = (state) => {
    setWalletState(state);
  };
  
  const sendTransaction = async () => {
    if (!walletState) return;
    
    try {
      const { signer } = walletState;
      
      // Create a simple transaction
      const tx = ccc.Transaction.from({
        outputs: [
          {
            capacity: 61 * 10**8, // 61 CKB
            lock: script // recipient's lock script
          }
        ]
      });
      
      // Add inputs and calculate fee
      await tx.completeInputsByCapacity(signer);
      await tx.completeFeeBy(signer, 1000);
      
      // Send the transaction
      const txHash = await signer.sendTransaction(tx);
      console.log("Transaction sent:", txHash);
      
      // Optional: Wait for confirmation
      await signer.client.waitTransaction(txHash);
      console.log("Transaction confirmed!");
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };
  
  return (
    <div>
      {!walletState ? (
        <WalletConnector onConnect={handleWalletConnect} />
      ) : (
        <div>
          <p>Connected to: {walletState.address}</p>
          <button onClick={sendTransaction}>Send Transaction</button>
        </div>
      )}
    </div>
  );
}
```

## Advanced Integration

### State Persistence

To provide a better user experience, implement wallet connection persistence:

```typescript
// In a utility file (e.g., walletUtils.ts)
export function saveWalletState(state) {
  localStorage.setItem('wallet_state', JSON.stringify({
    timestamp: Date.now(),
    network: state.network,
    address: state.address
  }));
}

export function loadWalletState() {
  try {
    const state = localStorage.getItem('wallet_state');
    if (!state) return null;
    
    const parsedState = JSON.parse(state);
    
    // Check if state is recent (within last hour)
    if (Date.now() - parsedState.timestamp > 3600000) {
      localStorage.removeItem('wallet_state');
      return null;
    }
    
    return parsedState;
  } catch (e) {
    console.warn("Failed to load wallet state:", e);
    return null;
  }
}

export function clearWalletState() {
  localStorage.removeItem('wallet_state');
}
```

Implement this in your React component:

```tsx
import { useState, useEffect } from 'react';
import { createSigner } from './utils/ckb';
import { saveWalletState, loadWalletState, clearWalletState } from './utils/walletUtils';

function WalletManager() {
  const [walletState, setWalletState] = useState(null);
  
  // Check for existing connection on component mount
  useEffect(() => {
    const savedState = loadWalletState();
    if (savedState) {
      // Attempt to reconnect
      reconnectWallet(savedState.network);
    }
  }, []);
  
  const reconnectWallet = async (network) => {
    try {
      const signer = await createSigner(network);
      // Get additional information and update state
      // ...
      setWalletState({ signer, network, /* other state */ });
    } catch (e) {
      console.warn("Failed to reconnect wallet:", e);
      clearWalletState();
    }
  };
  
  const connectWallet = async (network) => {
    try {
      const signer = await createSigner(network);
      
      // Get wallet information
      const { script } = await signer.getRecommendedAddressObj();
      const addressObj = await signer.client.Address.fromScript(script);
      const address = addressObj.toString();
      
      // Update state
      const state = { signer, network, address, script };
      setWalletState(state);
      
      // Save state for persistence
      saveWalletState(state);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };
  
  const disconnectWallet = () => {
    setWalletState(null);
    clearWalletState();
  };
  
  // Rest of component...
}
```

### Transaction Handling

Implement robust transaction handling with proper error management:

```typescript
/**
 * Sends a transaction with enhanced error handling and recovery
 * @param signer The JoyID signer instance
 * @param tx The transaction to send
 * @returns The transaction hash
 */
export async function sendTransactionSafely(signer, tx) {
  // Generate a unique key for this transaction
  const txKey = `tx_${Date.now()}`;
  
  try {
    // Save initial state
    saveTxState(txKey, { status: 'pending' });
    
    // Add inputs and calculate fee
    await tx.completeInputsByCapacity(signer);
    await tx.completeFeeBy(signer, 1000);
    
    // Update state before sending
    saveTxState(txKey, { 
      status: 'signing',
      rawTx: tx.serializeJson()
    });
    
    // Send transaction
    const txHash = await signer.sendTransaction(tx);
    
    // Update state after sending
    saveTxState(txKey, { 
      status: 'sent',
      txHash,
      timestamp: Date.now()
    });
    
    // Optional: Wait for confirmation
    try {
      await signer.client.waitTransaction(txHash);
      saveTxState(txKey, { status: 'confirmed', txHash });
    } catch (confirmError) {
      console.warn("Could not confirm transaction:", confirmError);
      // Don't throw, transaction might still be processing
    }
    
    // Transaction completed
    return txHash;
  } catch (error) {
    // Update state with error
    saveTxState(txKey, { 
      status: 'failed',
      error: error.message,
      timestamp: Date.now()
    });
    
    // Throw appropriate error
    if (error.message.includes('rejected')) {
      throw new Error('Transaction was rejected by the user');
    } else if (error.message.includes('capacity')) {
      throw new Error('Insufficient balance for this transaction');
    } else {
      throw error;
    }
  }
}

// Helper function to save transaction state
function saveTxState(key, state) {
  try {
    const currentState = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({
      ...currentState,
      ...state,
      lastUpdated: Date.now()
    }));
  } catch (e) {
    console.warn("Failed to save transaction state:", e);
  }
}
```

## Error Handling

Implement comprehensive error handling for a better user experience:

```typescript
/**
 * Handles JoyID and CKB specific errors with user-friendly messages
 * @param error The error object
 * @returns User-friendly error message
 */
export function handleWalletError(error) {
  const message = error.message || String(error);
  
  // Connection errors
  if (message.includes('Failed to connect') || message.includes('Network Error')) {
    return {
      title: 'Connection Failed',
      description: 'Could not connect to the blockchain network. Please check your internet connection and try again.'
    };
  }
  
  // Wallet errors
  if (message.includes('wallet') || message.includes('JoyID')) {
    return {
      title: 'Wallet Error',
      description: 'There was a problem with your JoyID wallet. Please ensure JoyID is properly set up on your device.'
    };
  }
  
  // Signature errors
  if (message.includes('sign') || message.includes('signature') || message.includes('rejected')) {
    return {
      title: 'Transaction Rejected',
      description: 'You rejected the transaction or the signing process was interrupted.'
    };
  }
  
  // Balance errors
  if (message.includes('capacity') || message.includes('insufficient')) {
    return {
      title: 'Insufficient Balance',
      description: 'You do not have enough CKB to complete this transaction.'
    };
  }
  
  // Default error
  return {
    title: 'Operation Failed',
    description: message
  };
}
```

## Security Best Practices

When integrating JoyID into your dApp, follow these security best practices:

### 1. Multiple RPC Endpoints

Always provide multiple RPC endpoints to improve reliability:

```typescript
const rpcEndpoints = {
  mainnet: [
    "https://mainnet.ckb.dev/rpc",
    "https://rpc.ankr.com/nervos",
    "https://mainnet.ckbapp.dev/rpc"
  ],
  testnet: [
    "https://testnet.ckb.dev/rpc",
    "https://testnet.ckbapp.dev/rpc"
  ]
};
```

### 2. Input Validation

Always validate user inputs before creating transactions:

```typescript
function validateTokenAmount(amount) {
  // Check if amount is a valid number
  const parsedAmount = BigInt(amount);
  if (parsedAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }
  
  // Check if amount exceeds maximum supply
  const maxSupply = BigInt(2) ** BigInt(128) - BigInt(1);
  if (parsedAmount > maxSupply) {
    throw new Error("Amount exceeds maximum token supply");
  }
  
  return parsedAmount.toString();
}
```

### 3. Transaction Recovery

Implement transaction recovery mechanisms:

```typescript
async function checkPendingTransactions() {
  // Find all saved transaction states
  const pendingTxs = Object.keys(localStorage)
    .filter(key => key.startsWith('tx_'))
    .map(key => ({
      key,
      data: JSON.parse(localStorage.getItem(key) || '{}')
    }))
    .filter(item => item.data.status === 'sent' || item.data.status === 'signing');
  
  // Check status of each pending transaction
  for (const tx of pendingTxs) {
    if (tx.data.txHash && signer) {
      try {
        // Check if transaction exists on chain
        const status = await signer.client.getTransaction(tx.data.txHash);
        
        if (status) {
          // Transaction exists, update state to confirmed
          localStorage.setItem(tx.key, JSON.stringify({
            ...tx.data,
            status: 'confirmed',
            lastUpdated: Date.now()
          }));
        }
      } catch (e) {
        // Transaction not found or error checking
        console.warn(`Could not check transaction ${tx.data.txHash}:`, e);
      }
    }
  }
}
```

### 4. Network Switch Protection

Warn users when switching networks during active transactions:

```typescript
// Detect network switch
useEffect(() => {
  // Check if there are pending transactions
  const pendingTxs = Object.keys(localStorage)
    .filter(key => key.startsWith('tx_'))
    .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
    .some(tx => tx.status === 'sent' || tx.status === 'signing');
  
  if (pendingTxs && previousNetwork && previousNetwork !== network) {
    alert("WARNING: Switching networks while you have pending transactions may cause issues. Please wait for all transactions to complete.");
  }
  
  setPreviousNetwork(network);
}, [network, previousNetwork]);
```

## Testing

Testing your JoyID integration is crucial for a reliable user experience:

### 1. Testing on Testnet

Always test your integration on testnet first:

```typescript
// Create a testnet signer for testing
const testnetSigner = await createSigner('testnet');

// Get testnet CKB from the faucet
// https://faucet.nervos.org/
```

### 2. Mock Testing

For unit tests, create a mock JoyID signer:

```typescript
// mockJoyIdSigner.js
export function createMockSigner() {
  return {
    connect: jest.fn().mockResolvedValue(true),
    getRecommendedAddressObj: jest.fn().mockResolvedValue({
      script: {
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0x8211f1b938a107cd53b6302cc752a6fc3965638d"
      }
    }),
    client: {
      Address: {
        fromScript: jest.fn().mockResolvedValue({
          toString: () => "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwgx292hnvmn68xf779vmzrshpmm6epn4c0cgwga"
        })
      },
      waitTransaction: jest.fn().mockResolvedValue(true),
      getTransaction: jest.fn().mockResolvedValue({ txStatus: { status: 'committed' } })
    },
    sendTransaction: jest.fn().mockResolvedValue("0x7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a")
  };
}
```

## Production Deployment

When deploying your dApp to production:

### 1. Register Your dApp with JoyID

For enhanced security and user experience, consider registering your dApp with JoyID:

1. Visit the [JoyID Developer Portal](https://joy.id/developers)
2. Register your application with:
   - Your dApp name
   - Website URL
   - Logo (recommended size: 200x200px)
   - Contact information

### 2. Configure Production Endpoints

Use reliable RPC endpoints for production:

```typescript
// Production endpoints should include fallbacks
const productionEndpoints = [
  "https://mainnet.ckb.dev/rpc",
  "https://rpc.ankr.com/nervos",
  "https://mainnet.ckbapp.dev/rpc"
];
```

### 3. Enable Analytics

Consider adding analytics to track wallet connection success rates:

```typescript
function trackWalletEvent(event, data) {
  // Example with a generic analytics service
  analytics.track('wallet_event', {
    event,
    timestamp: Date.now(),
    ...data
  });
}

// Usage
try {
  const signer = await createSigner(network);
  trackWalletEvent('connection_success', { network });
} catch (error) {
  trackWalletEvent('connection_error', { 
    network,
    error: error.message
  });
}
```

## Troubleshooting

Common issues and solutions when integrating JoyID:

### 1. Connection Issues

**Problem**: Users cannot connect to JoyID wallet

**Solutions**:
- Ensure the user has JoyID installed on their device
- Check that your RPC endpoints are accessible
- Verify the user's internet connection is stable
- Try using different RPC endpoints

### 2. Transaction Failures

**Problem**: Transactions fail to send or confirm

**Solutions**:
- Check if the user has sufficient CKB balance
- Verify transaction parameters are valid
- Ensure the user approves the transaction in JoyID
- Add proper error handling for rejected transactions

### 3. Network-Specific Issues

**Problem**: Integration works on testnet but fails on mainnet

**Solutions**:
- Ensure you're using the correct client type for each network
- Verify mainnet RPC endpoints are accessible
- Check if the user has mainnet CKB in their wallet
- Review transaction parameters for network compatibility

### 4. Cross-Device Compatibility

**Problem**: JoyID connection works on some devices but not others

**Solutions**:
- Ensure WebAuthn is supported on the user's device/browser
- Test on multiple browsers and devices
- Provide clear instructions for users on unsupported platforms
- Consider offering an alternative connection method as fallback

## Conclusion

Integrating JoyID into your dApp provides a secure and user-friendly way for users to interact with the Nervos CKB blockchain. By following this guide, you can implement a robust wallet integration that handles common edge cases and provides a smooth user experience.

For additional support, refer to:
- [JoyID Documentation](https://docs.joy.id/)
- [Nervos CKB Documentation](https://docs.nervos.org/)
- [JoyID Developer Telegram Group](https://t.me/joinchat/joYL7QB7XX9kZTRk)

---

*This guide is based on real-world implementation experience with the SITA MINTER application. The code examples and best practices have been tested in production environments.*