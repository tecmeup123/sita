# SiTa Minter Wallet Configuration Guide

This guide provides detailed instructions for configuring the wallet options in the SiTa Minter application, using the CCC (Cross-Chain Connector) wallet connector.

## Table of Contents

1. [Introduction](#introduction)
2. [Configuration Files](#configuration-files)
3. [Supported Wallet Options](#supported-wallet-options)
4. [Adding or Removing Wallet Options](#adding-or-removing-wallet-options)
5. [Updating Wallet Icons](#updating-wallet-icons)
6. [Network Restrictions](#network-restrictions)
7. [Default Wallet Settings](#default-wallet-settings)
8. [Wallet-Specific Configurations](#wallet-specific-configurations)
9. [Troubleshooting](#troubleshooting)

## Introduction

SiTa Minter uses the CCC (Cross-Chain Connector) wallet connector to provide a unified interface for connecting multiple wallets from the Nervos ecosystem. This guide explains how to configure these wallet options, including adding or removing wallet types, updating icons, and setting network restrictions.

## Configuration Files

The wallet configuration is primarily managed in these files:

- `client/src/hooks/use-wallet-connection.ts` - Core wallet connection logic
- `client/src/components/WalletConnector.tsx` - UI component for wallet selection
- `client/src/context/WalletContext.tsx` - Wallet connection state management

## Supported Wallet Options

SiTa Minter currently supports the following wallet types:

1. **JoyID** - Biometric wallet that uses device security
2. **MetaMask** - Browser extension wallet with Nervos support
3. **UTXO Global** - Mobile wallet for Nervos network

### Wallet Configuration Structure

Each wallet is configured with the following properties:

```typescript
{
  id: string;            // Unique identifier for the wallet
  name: string;          // Display name
  icon: string;          // Path to wallet icon
  description: string;   // Short description
  networks: string[];    // Supported networks (e.g., 'CKB')
  isPopular: boolean;    // Whether to mark as popular
}
```

## Adding or Removing Wallet Options

To add a new wallet option or remove an existing one, modify the `walletOptions` array in the `use-wallet-connection.ts` file:

```typescript
// Example: Adding a new wallet
const walletOptions = [
  {
    id: 'joyid',
    name: 'JoyID',
    icon: '/wallet-icons/joyid.svg',
    description: 'Connect using biometric security',
    networks: ['CKB'],
    isPopular: true
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/wallet-icons/metamask.svg',
    description: 'Connect using MetaMask extension',
    networks: ['CKB', 'ETH'],
    isPopular: true
  },
  {
    id: 'utxoglobal',
    name: 'UTXO Global',
    icon: '/wallet-icons/utxoglobal.svg',
    description: 'Connect using UTXO Global mobile wallet',
    networks: ['CKB'],
    isPopular: false
  },
  // Add your new wallet here
  {
    id: 'newwallet',
    name: 'New Wallet',
    icon: '/wallet-icons/newwallet.svg',
    description: 'Description of new wallet',
    networks: ['CKB'],
    isPopular: false
  }
];
```

To remove a wallet, simply delete its entry from the array.

## Updating Wallet Icons

Wallet icons are stored in the `public/wallet-icons/` directory. To update an icon:

1. Create or obtain the new SVG icon (recommended for best quality)
2. Save the icon to the `public/wallet-icons/` directory (e.g., `newwallet.svg`)
3. Update the `icon` path in the wallet configuration:

```typescript
{
  id: 'joyid',
  name: 'JoyID',
  icon: '/wallet-icons/updated-joyid.svg', // Updated icon path
  // other properties...
}
```

### Icon Requirements

For optimal display:

- Use SVG format for crisp rendering at all sizes
- Keep icons square (1:1 aspect ratio)
- Use a transparent background
- Ensure icon is recognizable at small sizes (32×32px)
- File size should be optimized (<10KB recommended)

## Network Restrictions

You can restrict which networks a wallet supports by modifying the `networks` array for each wallet:

```typescript
{
  id: 'joyid',
  name: 'JoyID',
  icon: '/wallet-icons/joyid.svg',
  description: 'Connect using biometric security',
  networks: ['CKB'], // This wallet only supports CKB
  isPopular: true
}
```

To allow a wallet on all networks, include all network identifiers in the array:

```typescript
networks: ['CKB', 'ETH', 'BTC'] // This wallet supports multiple networks
```

## Default Wallet Settings

The default wallet behavior is configured in the `WalletContext.tsx` file. To change which wallet is suggested by default:

```typescript
// In WalletContext.tsx
const defaultWallet = 'joyid'; // Change this to your preferred default wallet ID
```

You can also set preferred connection methods and timeout settings:

```typescript
// Connection timeout in milliseconds
const CONNECTION_TIMEOUT = 30000; // Adjust as needed

// Auto-reconnect settings
const SHOULD_AUTO_RECONNECT = true;
const AUTO_RECONNECT_PRIORITY = ['joyid', 'metamask', 'utxoglobal'];
```

## Wallet-Specific Configurations

### JoyID Configuration

JoyID requires specific configuration for authentication:

```typescript
// In use-wallet-connection.ts
const joyidConfig = {
  name: 'SiTa Minter', // Application name shown during authentication
  logo: '/app-logo.png', // Application logo shown during authentication
  joyidAppURL: 'https://app.joy.id'
};
```

### MetaMask Configuration

For MetaMask, you can configure network detection and chain switching behavior:

```typescript
// Example MetaMask configuration
const metamaskConfig = {
  requiredChainId: '0x...', // Required chain ID in hex
  addEthereumChain: { /* Chain details */ },
  allowMultipleNetworks: false
};
```

### UTXO Global Configuration

UTXO Global wallet may require specific deep linking configuration:

```typescript
// Example UTXO Global configuration
const utxoGlobalConfig = {
  mobileAppDeepLink: 'utxoglobal://',
  callbackUrl: window.location.origin
};
```

## Troubleshooting

### Common Issues and Solutions

#### Wallet Not Connecting

- Check console for errors
- Verify wallet extension is installed and unlocked
- Confirm the wallet supports the selected network
- Try clearing browser cache and cookies

#### Wallet Icon Not Displaying

- Verify the icon file exists in the correct path
- Check for path typos in the configuration
- Ensure the icon file is in a web-compatible format (SVG, PNG)

#### Multiple Wallet Connection Conflicts

If users experience issues with multiple wallets:

```typescript
// In WalletContext.tsx
// Add disconnect logic when switching wallets
const connectWallet = async (walletId) => {
  if (currentWalletId && currentWalletId !== walletId) {
    await disconnectWallet(); // Ensure previous wallet is disconnected
  }
  // Connection logic...
};
```

#### Network Mismatch Errors

Add additional validation to ensure wallets are connected to the correct network:

```typescript
// Check if connected to the expected network
const validateNetwork = (walletId, connectedChainId) => {
  const expectedChainId = getExpectedChainId(walletId);
  if (connectedChainId !== expectedChainId) {
    showNetworkError(walletId, expectedChainId);
    return false;
  }
  return true;
};
```

## Advanced Customization

For advanced wallet integration scenarios:

1. Create a new adapter in `client/src/lib/walletAdapters/`
2. Implement the required interface methods
3. Register the adapter in the wallet connection hook
4. Add the new wallet option to the available options list

Always test thoroughly after making changes to wallet configurations, especially across different browsers and devices.