# SiTa Minter Wallet Implementation Documentation

## Overview

The SiTa Minter application uses the Cryptape Consensus Cell (CCC) wallet connector to interact with various wallets in the Nervos ecosystem. This document provides a detailed description of the current wallet implementation, focusing on balance retrieval and relevant code sections for troubleshooting.

## Core Components

### 1. Wallet Context (`client/src/context/WalletContext.tsx`)

The application uses a React context pattern to manage wallet state and functions:

```typescript
export interface WalletContextType {
  signer: ccc.Signer | null;
  walletConnected: boolean;
  connecting: boolean;
  network: "mainnet" | "testnet";
  walletAddress: string | null;
  walletBalance: string | null;
  userScript: any | null;
  error: string | null;
  
  // Connect methods
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setNetwork: (network: "mainnet" | "testnet") => void;
}
```

### 2. CCC Configuration

The CCC wallet connector is configured with:

1. **Network Selection**: Supports both mainnet and testnet
2. **Wallet Filtering**: Configured to only show specific wallet options (JoyID, MetaMask, UTXO Global)
3. **Chain Filtering**: JoyID wallet is specifically filtered to show only CKB, BTC, and EVM chains

## Balance Retrieval Implementation

### Initial Balance Loading

The balance is retrieved during the wallet connection process:

```typescript
const connectWallet = async () => {
  try {
    setConnecting(true);
    
    // Get the client for the current network
    const client = getClientForNetwork(network);
    
    // Set the wallet preference order based on network
    const networks = getPreferredNetworks(network);
    
    // Use the CCC provider to connect the wallet
    const tempSigner = await ccc.connect({
      client,
      networks,
      signerFilter: (signer) => {
        // Wallet filtering logic
        // ...
      }
    });
    
    // Get wallet address
    const addressObj = await tempSigner.getRecommendedAddressObj();
    const { address, script } = addressObj;
    
    // Get wallet balance - THIS IS WHERE BALANCE IS FETCHED
    const capacity = await tempSigner.client.getCapacityByLockScript(script);
    const balanceValue = capacity.div(10**8).toString();
    
    // Update state
    setSigner(tempSigner);
    setWalletConnected(true);
    setWalletAddress(address);
    setWalletBalance(balanceValue);
    setUserScript(script);
    
    // Store connection info
    localStorage.setItem('sitaminter_wallet_connected', 'true');
    localStorage.setItem('sitaminter_wallet_address', address);
    localStorage.setItem('sitaminter_user_script', JSON.stringify(script));
    
    return tempSigner;
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
    return null;
  } finally {
    setConnecting(false);
  }
};
```

### Balance Computation Method

The CKB balance is calculated using:

1. Raw capacity is retrieved from the CKB client using `getCapacityByLockScript(script)`
2. The raw value is divided by 10^8 to convert from shannons to CKB
3. The result is converted to a string for display

```typescript
const capacity = await tempSigner.client.getCapacityByLockScript(script);
const balanceValue = capacity.div(10**8).toString();
```

### Display Formatting

The WalletConnector component formats the balance for display:

```typescript
// Helper to format CKB balance for display
const formatBalance = (balance: string | null): string => {
  if (!balance) return "0";
  
  // Convert to number for formatting
  const numBalance = parseFloat(balance);
  
  // Format with commas for thousands and limit to 4 decimal places
  return numBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  });
};
```

## Refresh and Update Mechanism

### Current Limitation

The current implementation does not automatically refresh the wallet balance. The balance is only fetched:

1. When initially connecting the wallet
2. When manually reconnecting the wallet
3. When switching networks

### Balance Update Points

Current balance update occurs at these points:

1. **Initial Connection**: During `connectWallet()`
2. **Network Change**: When changing between mainnet and testnet
3. **Auto-reconnection**: When the page reloads and auto-reconnects a previously connected wallet

## Wallet Reconnection Logic

When the application loads, it attempts to reconnect a previously connected wallet:

```typescript
// Auto reconnect wallet on page load if the user previously connected
useEffect(() => {
  // Check if we should attempt to reconnect
  const wasConnected = localStorage.getItem('sitaminter_wallet_connected') === 'true';
  const savedAddress = localStorage.getItem('sitaminter_wallet_address');
  
  if (wasConnected && savedAddress && !signer) {
    console.log("Attempting to reconnect previously connected wallet");
    
    // Attempt to reconnect wallet
    connectWallet()
      .then(returnedSigner => {
        if (returnedSigner) {
          // Reconnection successful
        } else {
          // Reconnection failed
          disconnectWallet();
        }
      })
      .catch(err => {
        console.error("Error reconnecting wallet:", err);
        // Clean up stale connection
        disconnectWallet();
        localStorage.removeItem('sitaminter_wallet_connected');
        localStorage.removeItem('sitaminter_wallet_address');
        localStorage.removeItem('sitaminter_user_script');
      });
  }
}, [signer, connectWallet, disconnectWallet, network]);
```

## Troubleshooting Balance Issues

### Common Issues

1. **Zero Balance After Connection**:
   - Check if `getCapacityByLockScript` is returning unexpected results
   - Verify if the script parameter is correctly formatted

2. **Balance Not Updating**:
   - Current implementation doesn't have automatic balance refreshing
   - Balance only updates on connection/reconnection

3. **Incorrect Balance Display**:
   - Check the formatting function `formatBalance()`
   - Verify the division by 10^8 is correctly implemented

### Debugging Steps

1. Add logging to the balance retrieval process:
   ```typescript
   console.log("Script used for balance:", script);
   const capacity = await tempSigner.client.getCapacityByLockScript(script);
   console.log("Raw capacity returned:", capacity.toString());
   const balanceValue = capacity.div(10**8).toString();
   console.log("Formatted balance value:", balanceValue);
   ```

2. Verify network configuration:
   ```typescript
   console.log("Current network:", network);
   console.log("Client configuration:", client);
   ```

3. Check if the wallet's selected address matches the expected script:
   ```typescript
   const addressObj = await tempSigner.getRecommendedAddressObj();
   console.log("Address object:", addressObj);
   ```

## Potential Improvements

1. **Implement Balance Auto-refresh**:
   - Add a periodic balance check (e.g., every 30 seconds)
   - Refresh balance after each transaction

2. **Add Manual Refresh Button**:
   - Implement a refresh button in the UI to manually update balance

3. **Transaction History Integration**:
   - Show recent transactions that affected the balance

4. **Multiple Address Support**:
   - Allow users to select between multiple addresses in their wallet

5. **Enhanced Error Handling**:
   - Add specific error handling for balance retrieval failures
   - Provide user-friendly messages for balance issues

## CCC Wallet Implementation Details

### Wallet Filtering

The application filters available wallets to show only specific options:

```typescript
// Filter wallets to only show JoyID, MetaMask, and UTXO Global
signerFilter: (signer) => {
  const name = signer.name.toLowerCase();
  console.log(`JoyID chain filter: signer name=${name}, allowed=${
    name === 'ckb' || 
    name === 'btc' || 
    name.startsWith('btc (') || 
    name === 'evm'
  }`);
  
  // For JoyID wallet, only show CKB, BTC, and EVM chains
  if (signer.provider.name === 'JoyID') {
    return name === 'ckb' || 
           name === 'btc' || 
           name.startsWith('btc (') || 
           name === 'evm';
  }
  
  // For other wallet types, filter by wallet name
  const isAllowed = 
    name === 'metamask' || 
    name === 'utxo-global' || 
    name === 'utxo global wallet';
  
  console.log(`Filtering wallet: ${name}, matched to: ${
    name === 'metamask' ? 'metamask' : 
    (name === 'utxo-global' || name === 'utxo global wallet') ? 'utxo-global' : 
    'none'
  }, allowed: ${isAllowed}`);
  
  return isAllowed;
}
```

### Network Configuration

The application configures different CKB nodes based on the selected network:

```typescript
function getClientForNetwork(network: "mainnet" | "testnet") {
  if (network === "mainnet") {
    return new ccc.RpcClient("https://mainnet.ckb.dev/rpc");
  } else {
    return new ccc.RpcClient("https://testnet.ckb.dev/rpc");
  }
}

function getPreferredNetworks(network: "mainnet" | "testnet"): NetworkPreference[] {
  if (network === "mainnet") {
    return [
      { chain: 'ckb', network: 'mainnet' }, 
      { chain: 'btc', network: 'mainnet' },
      { chain: 'evm', network: 'eip155:1' }
    ];
  } else {
    return [
      { chain: 'ckb', network: 'testnet' }, 
      { chain: 'btc', network: 'testnet' },
      { chain: 'evm', network: 'eip155:5' }
    ];
  }
}
```

## Conclusion

The current wallet implementation provides a foundation for connecting to different wallets in the Nervos ecosystem, with specific filtering for wallets and chains. The balance retrieval occurs during connection and doesn't automatically refresh. 

When troubleshooting balance issues, focus on the `getCapacityByLockScript` call and verify that the script parameter is correctly formatted. Adding logging around these areas will help identify the source of any balance discrepancies.