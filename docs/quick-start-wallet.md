# Quick Start Guide: Wallet Connector

This is a concise guide for developers who want to quickly integrate the wallet connector into their components in the Sita Minter application.

## Basic Integration

### Step 1: Set Up the Provider

When setting up your application, you can customize which wallet providers are available for users to select:

```jsx
// In your App.tsx or main component
import { WalletProvider } from '@/context/WalletContext';

function App() {
  // Only show JoyID, MetaMask, and UTXO Global
  const allowedWallets = ['joyid', 'metamask', 'utxo-global'];
  
  return (
    <WalletProvider availableWallets={allowedWallets}>
      {/* Your app */}
    </WalletProvider>
  );
}
```

This configuration will:
1. Filter the wallet providers to only show JoyID, MetaMask, and UTXO Global
2. For JoyID specifically, only show options for CKB, BTC, and EVM chains
3. For other wallets, show their default chain options

The wallet and chain filtering is implemented using the `signerFilter` property of the CCC Provider.

If you want to show all available wallets, you can simply omit the `availableWallets` prop:

```jsx
<WalletProvider>
  {/* Your app */}
</WalletProvider>
```

### Step 2: Import the Hook

```jsx
import { useWallet } from '@/context/WalletContext';
```

### Step 3: Use the Hook in Your Component

```jsx
function MyComponent() {
  const { 
    walletConnected, 
    signer,
    walletAddress,
    walletBalance,
    network,
    connectWallet, 
    disconnectWallet 
  } = useWallet();

  return (
    <div>
      {walletConnected ? (
        <div>
          <p>Connected: {walletAddress}</p>
          <p>Balance: {walletBalance} CKB</p>
          <p>Network: {network}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Common Tasks

### Check if Wallet is Connected

```jsx
const { walletConnected } = useWallet();

if (walletConnected) {
  // Perform actions that require a wallet connection
}
```

### Get Wallet Address

```jsx
const { walletAddress } = useWallet();

console.log("Wallet address:", walletAddress);
```

### Sign a Transaction

```jsx
const { signer } = useWallet();

async function signAndSendTransaction() {
  if (!signer) return;
  
  // Create transaction
  const tx = /* ... */;
  
  // Sign transaction
  const signedTx = await signer.signTransaction(tx);
  
  // Send transaction
  const txHash = await signer.client.sendTransaction(signedTx);
  
  return txHash;
}
```

### Switch Networks

```jsx
const { network, setNetwork } = useWallet();

function switchToMainnet() {
  setNetwork('mainnet');
}

function switchToTestnet() {
  setNetwork('testnet');
}
```

### Network-Specific UI

```jsx
const { network } = useWallet();

function NetworkBadge() {
  return (
    <span className={network === 'mainnet' ? 'badge-green' : 'badge-orange'}>
      {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
    </span>
  );
}
```

### Handle Connection Errors

```jsx
const { error, connectWallet } = useWallet();

async function connectWithErrorHandling() {
  try {
    await connectWallet();
  } catch (e) {
    console.error("Failed to connect wallet:", e);
  }
}

// Display error message if exists
{error && <div className="error-message">{error}</div>}
```

## Example: Complete Wallet UI Component

Here's a complete example of a wallet UI component:

```jsx
import { useWallet } from '@/context/WalletContext';
import { shortenAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Wallet, LogOut } from 'lucide-react';

export function WalletPanel() {
  const { 
    walletConnected, 
    connecting,
    walletAddress, 
    walletBalance,
    network,
    error,
    connectWallet, 
    disconnectWallet,
    setNetwork
  } = useWallet();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="mr-2" size={20} />
          Wallet
          {walletConnected && (
            <Badge variant="success" className="ml-2">
              <CheckCircle size={12} className="mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 flex items-start">
            <AlertCircle size={16} className="mr-2 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      
        {walletConnected ? (
          <>
            <div className="grid gap-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-mono">{shortenAddress(walletAddress || '')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Balance:</span>
                <span>{walletBalance} CKB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Network:</span>
                <Badge variant={network === 'mainnet' ? 'default' : 'secondary'}>
                  {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <span>Use Mainnet</span>
              <Switch 
                checked={network === 'mainnet'}
                onCheckedChange={(checked) => setNetwork(checked ? 'mainnet' : 'testnet')}
              />
            </div>
            
            <Button 
              variant="destructive"
              onClick={disconnectWallet}
              className="w-full"
            >
              <LogOut size={16} className="mr-2" />
              Disconnect Wallet
            </Button>
          </>
        ) : (
          <Button 
            onClick={connectWallet} 
            disabled={connecting}
            className="w-full"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

## Tips and Best Practices

1. **Always Check Connection**: Before performing any wallet operations, verify the wallet is connected
2. **Handle Loading States**: Use the `connecting` state to show loading indicators
3. **Error Handling**: Display error messages to users for better experience
4. **Handle Network Changes**: Listen for network changes and update your UI accordingly
5. **Account for Null Values**: Wallet address, balance, and signer can be null, always check before using
6. **Type Safety**: Use optional chaining and null checks to prevent TypeScript errors

## Additional Resources

- For more details, see the full [Wallet Connector Documentation](./wallet-connector.md)
- For implementation details, see the [Wallet Implementation Documentation](./wallet-implementation.md)
- View the source code at `client/src/context/WalletContext.tsx`