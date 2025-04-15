# CCC Wallet Connector Integration Documentation

## Overview

The SiTa Minter application has been upgraded to use the Cryptape Consensus Cell (CCC) wallet connector, which provides integration with multiple wallet providers in the Nervos ecosystem. This document describes the implementation details of the CCC wallet connector in the application.

## CCC Wallet Connector

### Library

The application uses the following CCC-related packages:
- `@ckb-ccc/ccc` - Core CCC library
- `@ckb-ccc/connector-react` - React bindings for CCC

### Configuration

#### Provider Setup

The CCC Provider is initialized in `client/src/App.tsx`:

```typescript
import { CccProvider } from "@ckb-ccc/connector-react";

function App() {
  return (
    <CccProvider
      signerFilter={(signer) => {
        // Filter logic for wallets and chains
        // ...
      }}
    >
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </CccProvider>
  );
}
```

#### Wallet Filtering

The application filters available wallets to show only specific options:

```typescript
signerFilter: (signer) => {
  const name = signer.name.toLowerCase();
  
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
  
  return isAllowed;
}
```

This filtering ensures that:
1. Only JoyID, MetaMask, and UTXO Global wallets are shown to the user
2. Within JoyID wallet, only CKB, BTC, and EVM chains are displayed
3. Unwanted wallet options are hidden

## Wallet Context Implementation

### Context Definition

The `WalletContext` (`client/src/context/WalletContext.tsx`) manages the wallet state and provides wallet functionality to the entire application:

```typescript
const WalletContext = createContext<WalletContextType>({
  signer: null,
  walletConnected: false,
  connecting: false,
  network: "testnet",
  walletAddress: null,
  walletBalance: null,
  userScript: null,
  error: null,
  
  connectWallet: async () => {},
  disconnectWallet: () => {},
  setNetwork: () => {},
});
```

### Provider Implementation

The `WalletProvider` component wraps the application and provides wallet state and functions:

```typescript
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [signer, setSigner] = useState<ccc.Signer | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [network, setNetworkState] = useState<"mainnet" | "testnet">(() => {
    const savedNetwork = localStorage.getItem('sitaminter_network');
    return (savedNetwork === 'testnet') ? 'testnet' : 'mainnet';
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [userScript, setUserScript] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Connection method
  const connectWallet = async () => {
    try {
      setConnecting(true);
      
      // Get client for the current network
      const client = getClientForNetwork(network);
      
      // Set the wallet preference order based on network
      const networks = getPreferredNetworks(network);
      
      // Connect using CCC
      const tempSigner = await ccc.connect({
        client,
        networks,
        signerFilter: (signer) => {
          // Wallet filtering logic (same as in CccProvider)
          // ...
        }
      });
      
      // Get wallet address and script
      const addressObj = await tempSigner.getRecommendedAddressObj();
      const { address, script } = addressObj;
      
      // Get wallet balance
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

  // Disconnection method
  const disconnectWallet = () => {
    setSigner(null);
    setWalletConnected(false);
    setWalletAddress(null);
    setWalletBalance(null);
    setUserScript(null);
    
    // Clear storage
    localStorage.removeItem('sitaminter_wallet_connected');
    localStorage.removeItem('sitaminter_wallet_address');
    localStorage.removeItem('sitaminter_user_script');
  };

  // Network switching method
  const setNetwork = (newNetwork: "mainnet" | "testnet") => {
    setNetworkState(newNetwork);
    localStorage.setItem('sitaminter_network', newNetwork);
    
    // If wallet is connected, disconnect it
    if (walletConnected) {
      disconnectWallet();
    }
  };

  // Provide wallet context to children
  const value: WalletContextType = {
    signer,
    walletConnected,
    connecting,
    network,
    walletAddress,
    walletBalance,
    userScript,
    error,
    
    connectWallet,
    disconnectWallet,
    setNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
```

## Network Configuration

The application supports both mainnet and testnet networks:

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

## Wallet Connector Component

The `WalletConnector` component (`client/src/components/WalletConnector.tsx`) provides the UI for connecting to and displaying wallet information:

```typescript
export default function WalletConnector({ 
  size = "default",
  translations = {
    connect: "Connect Wallet",
    connecting: "Connecting...",
    disconnect: "Disconnect",
    walletConnectedTo: "Wallet Connected to",
    testnetText: "Testnet",
    mainnetText: "Mainnet",
  } 
}) {
  const { 
    signer,
    walletConnected, 
    connecting, 
    network, 
    walletAddress,
    walletBalance,
    connectWallet, 
    disconnectWallet 
  } = useWallet();

  // Button rendering logic based on connection state
  if (walletConnected && walletAddress) {
    return (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`flex items-center gap-2 border-green-500 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 shadow-sm`}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">{formatAddress(walletAddress)}</span>
                  <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                    {formatBalance(walletBalance)} CKB
                  </span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{translations.walletConnectedTo} {network === "mainnet" ? translations.mainnetText : translations.testnetText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-bold">Wallet Connected</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{walletAddress}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="text-xs">Balance: {formatBalance(walletBalance)} CKB</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex items-center gap-2 text-red-600 focus:text-red-600" 
            onClick={disconnectWallet}
          >
            <LogOut className="w-4 h-4" />
            <span>{translations.disconnect}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Loading/connecting button state
  return connecting ? (
    <Button 
      variant="outline" 
      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 relative overflow-hidden"
      disabled={true}
    >
      <div className="absolute inset-0 bg-blue-100/30 animate-pulse"></div>
      <div className="flex items-center gap-2 z-10 relative">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{translations.connecting}</span>
      </div>
    </Button>
  ) : (
    <Button 
      variant="default" 
      className="bg-primary hover:bg-primary/90 relative group transition-all duration-300 shadow-sm hover:shadow"
      onClick={connectWallet}
    >
      <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
      <div className="flex items-center gap-2 z-10 relative">
        <Wallet className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span>{translations.connect}</span>
      </div>
    </Button>
  );
}
```

## Transaction Signing

When making transactions, the application uses the CCC signer:

```typescript
// Example: Creating a transaction with CCC signer
const transaction = ccc.Transaction.from({
  outputs: [{ 
    lock: targetScript,
    type: null,
    capacity: amount 
  }],
  outputsData: ['0x']
});

// Complete inputs
await transaction.completeInputsByCapacity(signer);

// Add fee cells
await transaction.completeFeeBy(signer, feeRate);

// Sign and send transaction
const txHash = await signer.sendTransaction(transaction);
```

## Auto-Reconnection Logic

The application attempts to reconnect to a previously connected wallet when it loads:

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

## Network Switching Support

The application allows users to switch between testnet and mainnet:

```typescript
// Network switching in UI
const handleNetworkChange = (newNetwork: "mainnet" | "testnet") => {
  setNetwork(newNetwork);
};

// Network indicator display
<div className={`px-2 py-1 rounded text-xs font-medium ${
  network === "mainnet" 
    ? "bg-orange-100 text-orange-700" 
    : "bg-purple-100 text-purple-700"
}`}>
  {network === "mainnet" ? "Mainnet" : "Testnet"}
</div>
```

## JoyID Logo Implementation

The application provides a custom logo for the JoyID wallet popup:

```typescript
// Add the site logo URL for JoyID
const logoUrl = `${window.location.origin}/assets/N.png`;

// CCC connection with JoyID logo
const tempSigner = await ccc.connect({
  client,
  networks,
  signerFilter: (signer) => {
    // ...
  },
  connectOptions: {
    joyidOptions: {
      name: "SiTa Minter",
      logo: logoUrl
    }
  }
});
```

## Conclusion

The CCC wallet connector implementation in SiTa Minter provides a flexible and user-friendly way to interact with multiple wallets in the Nervos ecosystem. The implementation focuses on:

1. **Multi-wallet support**: JoyID, MetaMask, and UTXO Global wallets
2. **Chain filtering**: Showing only relevant chains for each wallet
3. **Network switching**: Supporting both mainnet and testnet
4. **User-friendly UI**: Clear wallet connection status and balance display

This implementation enables users to easily connect their preferred wallet and use it to perform token issuance and other operations within the application.