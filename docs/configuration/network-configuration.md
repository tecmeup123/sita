# SiTa Minter Network Configuration Guide

This guide provides detailed instructions for configuring and switching between different blockchain networks (testnet vs. mainnet) in the SiTa Minter application.

## Table of Contents

1. [Introduction](#introduction)
2. [Network Configuration Files](#network-configuration-files)
3. [Supported Networks](#supported-networks)
4. [Switching Between Networks](#switching-between-networks)
5. [Network-Specific Settings](#network-specific-settings)
6. [Fee Configuration](#fee-configuration)
7. [Environment Variables](#environment-variables)
8. [Testing Network Configurations](#testing-network-configurations)
9. [Troubleshooting](#troubleshooting)

## Introduction

SiTa Minter supports multiple blockchain networks, allowing users to issue tokens on both test networks and the main Nervos CKB network. This guide explains how to configure these networks, update network-specific settings, and manage the transitions between them.

## Network Configuration Files

The network configuration is primarily managed in these files:

- `client/src/lib/networks.ts` - Core network definitions
- `client/src/context/NetworkContext.tsx` - Network state management
- `client/src/lib/ckb.ts` - CKB network-specific utilities
- `client/src/hooks/use-network.ts` - Hook for accessing network information

## Supported Networks

SiTa Minter currently supports the following networks:

1. **Mainnet** - The production Nervos CKB blockchain
2. **Testnet** - The Nervos testnet for development and testing

### Network Configuration Structure

Each network is configured with the following properties:

```typescript
interface NetworkConfig {
  id: string;                  // Unique identifier for the network
  name: string;                // Display name
  rpcUrl: string;              // RPC endpoint URL
  explorerUrl: string;         // Block explorer URL
  chainId: number;             // Numeric chain identifier
  isTestnet: boolean;          // Whether this is a test network
  platformFee: number;         // Platform fee in CKB
  networkFee: number;          // Network fee in CKB
  tipFee: number;              // Optional tip fee in CKB
}
```

## Switching Between Networks

### Default Network Selection

The default network is configured in the `NetworkContext.tsx` file:

```typescript
// Default to mainnet if no selection is stored
const defaultNetworkId = localStorage.getItem('selectedNetwork') || 'mainnet';
```

To change the default network, update this value.

### Network Selector Component

Users can manually switch networks using the `NetworkSelector` component. If you need to modify this component:

```typescript
// In NetworkSelector.tsx
const networks = [
  { id: 'mainnet', name: 'Mainnet', badge: null },
  { id: 'testnet', name: 'Testnet', badge: 'Test' }
];
```

### Programmatic Network Switching

To switch networks programmatically:

```typescript
// In any component using the NetworkContext
const { setCurrentNetwork } = useNetwork();

// Switch to testnet
const switchToTestnet = () => {
  setCurrentNetwork('testnet');
  // Handle any side effects of network switching
};
```

## Network-Specific Settings

### RPC Endpoints

To update the RPC endpoint for a network:

```typescript
// In networks.ts
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    // ...other properties
    rpcUrl: 'https://mainnet.ckbapp.dev/rpc', // Update this URL
    // ...
  },
  testnet: {
    // ...other properties
    rpcUrl: 'https://testnet.ckbapp.dev/rpc', // Update this URL
    // ...
  }
};
```

### Block Explorers

To update the block explorer URL:

```typescript
// In networks.ts
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    // ...other properties
    explorerUrl: 'https://explorer.nervos.org', // Update this URL
    // ...
  },
  testnet: {
    // ...other properties
    explorerUrl: 'https://explorer.nervos.org/aggron', // Update this URL
    // ...
  }
};
```

## Fee Configuration

Each network can have different fee structures. To update the fees:

```typescript
// In networks.ts
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    // ...other properties
    platformFee: 300, // Platform fee in CKB
    networkFee: 0.01, // Network fee in CKB
    tipFee: 144, // Optional tip fee in CKB
    // ...
  },
  testnet: {
    // ...other properties
    platformFee: 300, // Platform fee in CKB (can be different for testnet)
    networkFee: 0.01, // Network fee in CKB
    tipFee: 144, // Optional tip fee in CKB
    // ...
  }
};
```

For more information on fee configuration, please refer to the [Platform Fee](../update-guides/platform-fee.md) guide.

## Environment Variables

Network-specific environment variables can be set in the `.env` file:

```
# Mainnet Configuration
VITE_MAINNET_RPC_URL=https://mainnet.ckbapp.dev/rpc
VITE_MAINNET_EXPLORER_URL=https://explorer.nervos.org

# Testnet Configuration
VITE_TESTNET_RPC_URL=https://testnet.ckbapp.dev/rpc
VITE_TESTNET_EXPLORER_URL=https://explorer.nervos.org/aggron
```

To use these variables in the code:

```typescript
// In networks.ts
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    // ...other properties
    rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL,
    explorerUrl: import.meta.env.VITE_MAINNET_EXPLORER_URL,
    // ...
  },
  testnet: {
    // ...other properties
    rpcUrl: import.meta.env.VITE_TESTNET_RPC_URL,
    explorerUrl: import.meta.env.VITE_TESTNET_EXPLORER_URL,
    // ...
  }
};
```

## Testing Network Configurations

After updating network configurations, test the following functionality:

1. **Network Switching**: Ensure the application can switch between networks
2. **Transaction Submission**: Test transaction submission on each network
3. **Block Explorer Links**: Verify that links to the block explorer work correctly
4. **Fee Calculations**: Confirm that fee calculations are correct for each network
5. **Wallet Connections**: Test wallet connections on each network

### Test Checklist

Create a test transaction on each network and verify:

- [ ] Transaction is submitted successfully
- [ ] Correct fees are displayed and charged
- [ ] Transaction can be viewed on the block explorer
- [ ] Network name is clearly displayed in the UI
- [ ] Error handling works correctly for network-specific errors

## Troubleshooting

### Common Issues and Solutions

#### RPC Connection Failures

If the application cannot connect to the network RPC:

1. Verify the RPC URL is correct
2. Check if the RPC service is operational
3. Implement a fallback RPC provider:

```typescript
// Example fallback implementation
const getFallbackRpcUrl = (networkId: string) => {
  const fallbackUrls = {
    mainnet: [
      'https://mainnet.ckbapp.dev/rpc',
      'https://mainnet-backup.ckbapp.dev/rpc'
    ],
    testnet: [
      'https://testnet.ckbapp.dev/rpc',
      'https://testnet-backup.ckbapp.dev/rpc'
    ]
  };
  
  return fallbackUrls[networkId] || [];
};
```

#### Invalid Network Errors

When wallets are connected to the wrong network:

```typescript
// Helper to prompt wallet network switching
const promptNetworkSwitch = async (walletId: string, requiredNetworkId: string) => {
  try {
    // Implementation depends on wallet type
    if (walletId === 'metamask') {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: getChainIdHex(requiredNetworkId) }],
      });
    } else {
      // Show manual instructions for other wallet types
      showNetworkSwitchModal(walletId, requiredNetworkId);
    }
  } catch (error) {
    console.error('Network switch failed:', error);
    // Handle error
  }
};
```

#### Fee Calculation Errors

If fee calculations are incorrect:

1. Verify the fee values in the network configuration
2. Check the calculations in the fee estimation logic
3. Add logging to trace the fee calculation process:

```typescript
// Debug logging for fee calculation
const calculateTotalFee = (networkId: string, includesTip: boolean) => {
  const network = NETWORK_CONFIGS[networkId];
  const platformFee = network.platformFee;
  const networkFee = network.networkFee;
  const tipFee = includesTip ? network.tipFee : 0;
  
  const totalFee = platformFee + networkFee + tipFee;
  
  console.log(`Fee calculation for ${networkId}:`, {
    platformFee,
    networkFee,
    tipFee,
    totalFee
  });
  
  return totalFee;
};
```

## Advanced Network Configuration

### Adding a New Network

To add a new network:

1. Define the network configuration:

```typescript
// In networks.ts
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  // Existing networks...
  
  // Add new network
  devnet: {
    id: 'devnet',
    name: 'Development Network',
    rpcUrl: 'https://devnet.example.com/rpc',
    explorerUrl: 'https://explorer.example.com/devnet',
    chainId: 999,
    isTestnet: true,
    platformFee: 100, // Lower fee for development
    networkFee: 0.005,
    tipFee: 50
  }
};
```

2. Update the network selector to include the new network:

```typescript
// In NetworkSelector.tsx
const networks = [
  { id: 'mainnet', name: 'Mainnet', badge: null },
  { id: 'testnet', name: 'Testnet', badge: 'Test' },
  { id: 'devnet', name: 'Development', badge: 'Dev' }
];
```

3. Test thoroughly to ensure the new network functions correctly.

### Network Feature Flags

For features that should only be enabled on certain networks:

```typescript
// In networks.ts
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    // ...other properties
    features: {
      advancedTokens: true,
      nftSupport: false
    }
  },
  testnet: {
    // ...other properties
    features: {
      advancedTokens: true,
      nftSupport: true  // Experimental feature enabled on testnet
    }
  }
};

// Usage
const { currentNetwork } = useNetwork();
const showNftOption = NETWORK_CONFIGS[currentNetwork.id].features.nftSupport;
```

This allows for feature testing on test networks before enabling on mainnet.

## Conclusion

Proper network configuration is essential for a secure and functional SiTa Minter application. Always test thoroughly after making changes to network settings, especially when working with production networks where real assets are involved.