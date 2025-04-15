# SiTa Minter Troubleshooting Guide

This comprehensive guide provides solutions for common issues that users and administrators might encounter with the SiTa Minter application.

## Table of Contents

1. [Introduction](#introduction)
2. [Wallet Connection Issues](#wallet-connection-issues)
3. [Transaction Errors](#transaction-errors)
4. [Network Connectivity Problems](#network-connectivity-problems)
5. [UI and Display Issues](#ui-and-display-issues)
6. [Performance Problems](#performance-problems)
7. [Database Issues](#database-issues)
8. [Security Alerts](#security-alerts)
9. [Deployment Troubleshooting](#deployment-troubleshooting)
10. [Advanced Debugging Techniques](#advanced-debugging-techniques)

## Introduction

This troubleshooting guide will help you identify and resolve common issues with the SiTa Minter application. Each section includes:

- Common symptoms
- Possible causes
- Step-by-step solutions
- Prevention tips

## Wallet Connection Issues

### Wallet Not Connecting

**Symptoms:**
- "Connect Wallet" button doesn't respond
- Connection dialog appears but then disappears
- Continuous loading indicator when connecting

**Possible Causes:**
1. Wallet extension not installed
2. Wallet locked or needs authentication
3. Browser blocking popups
4. Incompatible wallet version
5. Network mismatch

**Solutions:**

1. **Check Wallet Installation:**
   - Verify the wallet extension is properly installed
   - For JoyID, check browser compatibility (Chrome, Firefox, Edge are supported)
   - For MetaMask, ensure it's unlocked and up to date

2. **Browser Settings:**
   ```javascript
   // Check if wallet is accessible
   const checkWalletAvailability = () => {
     if (typeof window.ethereum !== 'undefined') {
       console.log('MetaMask is installed');
     } else {
       console.error('MetaMask is not installed');
       // Show installation guide
       showWalletInstallationGuide('metamask');
     }
     
     // Similar checks for other wallet types
   };
   ```

3. **Network Configuration:**
   - Ensure wallet is connected to the correct network
   - For Nervos CKB, check if the wallet is configured for the right network (testnet/mainnet)

4. **Fix MetaMask Network:**
   ```javascript
   const addCKBNetwork = async () => {
     try {
       await window.ethereum.request({
         method: 'wallet_addEthereumChain',
         params: [{
           chainId: '0x...', // CKB Chain ID in hex
           chainName: 'Nervos CKB Mainnet',
           nativeCurrency: {
             name: 'CKB',
             symbol: 'CKB',
             decimals: 8
           },
           rpcUrls: ['https://mainnet.ckb.dev'],
           blockExplorerUrls: ['https://explorer.nervos.org']
         }]
       });
     } catch (error) {
       console.error('Failed to add CKB network:', error);
     }
   };
   ```

5. **JoyID Specific Issues:**
   - Clear browser cache and cookies
   - Check if WebAuthn is supported by the browser
   - Verify device has biometric capabilities enabled
   - Try alternative authentication method if available

### Wallet Disconnects Unexpectedly

**Symptoms:**
- Wallet shows connected then suddenly disconnects
- Session expires too quickly
- "Reconnect Wallet" appears during operations

**Solutions:**

1. **Implement Auto-Reconnect:**
   ```javascript
   // In WalletContext.tsx
   useEffect(() => {
     const handleVisibilityChange = async () => {
       if (document.visibilityState === 'visible' && walletType && !isConnected) {
         try {
           console.log('Attempting to reconnect wallet...');
           await connectWallet(walletType);
         } catch (error) {
           console.error('Failed to reconnect wallet:', error);
         }
       }
     };
     
     document.addEventListener('visibilitychange', handleVisibilityChange);
     window.addEventListener('focus', handleVisibilityChange);
     
     return () => {
       document.removeEventListener('visibilitychange', handleVisibilityChange);
       window.removeEventListener('focus', handleVisibilityChange);
     };
   }, [walletType, isConnected, connectWallet]);
   ```

2. **Connection Error Handling:**
   ```javascript
   const handleConnectionError = (error) => {
     console.error('Wallet connection error:', error);
     
     if (error.message.includes('User rejected')) {
       showError('wallet_request_rejected');
     } else if (error.message.includes('timeout')) {
       showError('wallet_connection_timeout');
     } else {
       showError('wallet_connection_failed');
       // Log detailed error for debugging
       logError('wallet_connection', {
         walletType,
         errorMessage: error.message,
         errorStack: error.stack
       });
     }
   };
   ```

## Transaction Errors

### Transaction Fails to Submit

**Symptoms:**
- Transaction submission dialog shows error
- "Transaction Failed" notification appears
- Process stops during token creation

**Possible Causes:**
1. Insufficient balance
2. Network congestion
3. Incorrect transaction parameters
4. Wallet rejection
5. Gas/fee estimation issues

**Solutions:**

1. **Balance Check:**
   ```javascript
   const checkSufficientBalance = async (address, requiredAmount) => {
     try {
       const balance = await getBalance(address);
       
       if (balance.lt(requiredAmount)) {
         const formatted = formatCKB(balance);
         const required = formatCKB(requiredAmount);
         
         showError('wallet_insufficient_balance', {
           balance: formatted,
           required: required
         });
         
         return false;
       }
       
       return true;
     } catch (error) {
       console.error('Balance check failed:', error);
       showError('balance_check_failed');
       return false;
     }
   };
   ```

2. **Transaction Parameter Verification:**
   ```javascript
   const verifyTransactionParameters = (parameters) => {
     const errors = [];
     
     if (!parameters.to || !isValidAddress(parameters.to)) {
       errors.push('Invalid recipient address');
     }
     
     if (parameters.amount <= 0) {
       errors.push('Amount must be greater than zero');
     }
     
     // More validations...
     
     return {
       isValid: errors.length === 0,
       errors
     };
   };
   ```

3. **Retry Mechanism:**
   ```javascript
   const submitTransactionWithRetry = async (txParams, maxRetries = 3) => {
     let retries = 0;
     
     while (retries < maxRetries) {
       try {
         const txHash = await submitTransaction(txParams);
         return txHash;
       } catch (error) {
         retries++;
         console.warn(`Transaction attempt ${retries} failed:`, error);
         
         if (retries >= maxRetries) {
           throw new Error(`Transaction failed after ${maxRetries} attempts: ${error.message}`);
         }
         
         // Wait before retrying (exponential backoff)
         await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
       }
     }
   };
   ```

### Transaction Stuck Pending

**Symptoms:**
- Transaction shown as "Pending" for extended period
- No confirmation after long wait
- Token creation process incomplete

**Solutions:**

1. **Check Transaction Status:**
   ```javascript
   const checkTransactionStatus = async (txHash) => {
     try {
       const status = await getTransactionStatus(txHash);
       
       switch (status) {
         case 'confirmed':
           showSuccess('transaction_confirmed');
           return true;
         case 'pending':
           // Still pending, continue waiting
           return false;
         case 'rejected':
           showError('transaction_rejected');
           return false;
         default:
           showError('transaction_unknown_status');
           return false;
       }
     } catch (error) {
       console.error('Failed to check transaction status:', error);
       showError('transaction_status_check_failed');
       return false;
     }
   };
   ```

2. **Transaction Monitoring:**
   ```javascript
   const monitorTransaction = async (txHash, maxAttempts = 30, intervalMs = 5000) => {
     let attempts = 0;
     
     const checkInterval = setInterval(async () => {
       attempts++;
       
       try {
         const confirmed = await checkTransactionStatus(txHash);
         
         if (confirmed) {
           clearInterval(checkInterval);
           onTransactionConfirmed(txHash);
         } else if (attempts >= maxAttempts) {
           clearInterval(checkInterval);
           showWarning('transaction_confirmation_timeout');
           onTransactionTimeout(txHash);
         }
       } catch (error) {
         console.error('Transaction monitoring error:', error);
         
         if (attempts >= maxAttempts) {
           clearInterval(checkInterval);
           showError('transaction_monitoring_failed');
         }
       }
     }, intervalMs);
     
     // Return the interval ID so it can be cleared if needed
     return checkInterval;
   };
   ```

## Network Connectivity Problems

### Unable to Connect to Blockchain

**Symptoms:**
- "Network Error" messages
- Application shows offline status
- Cannot load blockchain data

**Possible Causes:**
1. RPC endpoint unavailable
2. Network configuration issues
3. Internet connectivity problems
4. Firewall or proxy blocks

**Solutions:**

1. **RPC Health Check:**
   ```javascript
   const checkRPCHealth = async (networkId = 'mainnet') => {
     const network = NETWORK_CONFIGS[networkId];
     
     try {
       const response = await fetch(network.rpcUrl, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           jsonrpc: '2.0',
           method: 'ping',
           params: [],
           id: 1,
         }),
         timeout: 5000
       });
       
       if (!response.ok) {
         throw new Error(`RPC endpoint returned status ${response.status}`);
       }
       
       const data = await response.json();
       return { healthy: true, data };
     } catch (error) {
       console.error(`RPC health check failed for ${networkId}:`, error);
       return { 
         healthy: false, 
         error: error.message 
       };
     }
   };
   ```

2. **Fallback RPC Endpoints:**
   ```javascript
   const RPC_FALLBACKS = {
     mainnet: [
       'https://mainnet.ckb.dev',
       'https://mainnet-backup.ckb.dev',
       'https://ckb-mainnet-rpc.coinex.net'
     ],
     testnet: [
       'https://testnet.ckb.dev',
       'https://testnet-backup.ckb.dev'
     ]
   };
   
   const getFallbackRPC = async (networkId) => {
     const fallbacks = RPC_FALLBACKS[networkId] || [];
     
     for (const rpcUrl of fallbacks) {
       try {
         const response = await fetch(rpcUrl, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             jsonrpc: '2.0',
             method: 'ping',
             params: [],
             id: 1,
           }),
           timeout: 3000
         });
         
         if (response.ok) {
           return rpcUrl;
         }
       } catch (error) {
         console.warn(`Fallback RPC ${rpcUrl} check failed:`, error);
       }
     }
     
     throw new Error('All RPC endpoints are unavailable');
   };
   ```

3. **Network Switch Recommendation:**
   ```javascript
   const suggestNetworkSwitch = (currentNetwork) => {
     const isMainnet = currentNetwork === 'mainnet';
     const alternateNetwork = isMainnet ? 'testnet' : 'mainnet';
     
     showWarning('network_connectivity_issue', {
       current: currentNetwork,
       alternate: alternateNetwork
     });
     
     // Offer a button to switch networks
     showNetworkSwitchDialog(alternateNetwork);
   };
   ```

### Network Congestion

**Symptoms:**
- Very slow transaction confirmations
- High fee estimates
- Timeouts during blockchain operations

**Solutions:**

1. **Dynamic Fee Adjustment:**
   ```javascript
   const getRecommendedFee = async () => {
     try {
       // Get network congestion data
       const congestionData = await fetchNetworkCongestion();
       
       // Calculate recommended fee based on congestion
       let multiplier = 1.0;
       
       if (congestionData.level === 'high') {
         multiplier = 1.5;
       } else if (congestionData.level === 'very_high') {
         multiplier = 2.0;
       }
       
       const baseFee = DEFAULT_FEE_RATE;
       const recommendedFee = Math.ceil(baseFee * multiplier);
       
       return {
         recommended: recommendedFee,
         min: baseFee,
         max: baseFee * 3,
         congestionLevel: congestionData.level
       };
     } catch (error) {
       console.error('Failed to get recommended fee:', error);
       return {
         recommended: DEFAULT_FEE_RATE,
         min: DEFAULT_FEE_RATE,
         max: DEFAULT_FEE_RATE * 3,
         congestionLevel: 'unknown'
       };
     }
   };
   ```

2. **User Wait Time Estimation:**
   ```javascript
   const estimateWaitTime = (feeRate, congestionLevel) => {
     // Base wait times in minutes
     const baseWaitTimes = {
       low: 5,
       medium: 15,
       high: 30,
       very_high: 60
     };
     
     const baseTime = baseWaitTimes[congestionLevel] || 15;
     
     // Adjust based on fee rate relative to recommended
     const recommendedFee = getRecommendedFee();
     const feeRatio = feeRate / recommendedFee;
     
     let adjustedTime = baseTime;
     
     if (feeRatio >= 2.0) {
       adjustedTime = baseTime * 0.5; // 50% faster
     } else if (feeRatio >= 1.5) {
       adjustedTime = baseTime * 0.7; // 30% faster
     } else if (feeRatio < 0.8) {
       adjustedTime = baseTime * 1.5; // 50% slower
     }
     
     return Math.round(adjustedTime);
   };
   ```

## UI and Display Issues

### Rendering Problems

**Symptoms:**
- UI elements misaligned or overlapping
- Text or buttons cut off
- Images not loading correctly
- Layout breaks on certain screen sizes

**Solutions:**

1. **Responsive Design Fixes:**
   ```css
   /* Example CSS fixes for responsive issues */
   @media (max-width: 768px) {
     .token-card {
       flex-direction: column;
     }
     
     .button-container {
       width: 100%;
       justify-content: center;
     }
     
     .form-field {
       min-width: unset;
       width: 100%;
     }
   }
   
   /* Fix for text overflow */
   .token-name {
     overflow: hidden;
     text-overflow: ellipsis;
     white-space: nowrap;
     max-width: 200px;
   }
   ```

2. **Image Loading Error Handling:**
   ```jsx
   // React component for handling image loading errors
   const SafeImage = ({ src, alt, fallbackSrc, ...props }) => {
     const [imgSrc, setImgSrc] = useState(src);
     const [hasError, setHasError] = useState(false);
     
     const handleError = () => {
       if (!hasError) {
         setHasError(true);
         setImgSrc(fallbackSrc || '/images/placeholder.svg');
       }
     };
     
     return (
       <img
         src={imgSrc}
         alt={alt}
         onError={handleError}
         {...props}
       />
     );
   };
   ```

3. **Layout Debugging Tool:**
   ```javascript
   // Add to development environment only
   const enableLayoutDebugging = () => {
     if (process.env.NODE_ENV !== 'production') {
       const style = document.createElement('style');
       style.textContent = `
         * {
           outline: 1px solid rgba(255, 0, 0, 0.2);
         }
         
         *:hover {
           outline: 1px solid rgba(255, 0, 0, 0.6);
         }
       `;
       document.head.appendChild(style);
       
       console.log('Layout debugging enabled. Press Esc to disable.');
       
       document.addEventListener('keydown', (event) => {
         if (event.key === 'Escape') {
           document.head.removeChild(style);
           console.log('Layout debugging disabled.');
         }
       }, { once: true });
     }
   };
   
   // Add a keyboard shortcut (Ctrl+Shift+D) to toggle
   if (process.env.NODE_ENV !== 'production') {
     document.addEventListener('keydown', (event) => {
       if (event.ctrlKey && event.shiftKey && event.key === 'D') {
         enableLayoutDebugging();
       }
     });
   }
   ```

### Localization Issues

**Symptoms:**
- Text appears in wrong language
- Translations missing or incorrect
- UI breaks with certain languages
- Date or number format issues

**Solutions:**

1. **Translation Fallback:**
   ```javascript
   const getTranslation = (key, language, fallbackLanguage = 'en') => {
     // Try to get translation in requested language
     const translation = TRANSLATIONS[language]?.[key];
     
     // If not found, try fallback language
     if (!translation) {
       const fallback = TRANSLATIONS[fallbackLanguage]?.[key];
       
       // If still not found, return the key
       if (!fallback) {
         console.warn(`Translation missing for key: ${key}`);
         return key;
       }
       
       return fallback;
     }
     
     return translation;
   };
   ```

2. **String Length Handling:**
   ```jsx
   // Component for handling long text in different languages
   const LocalizedText = ({ textKey, maxLength, ...props }) => {
     const { t, language } = useTranslation();
     const text = t(textKey);
     
     // Different languages need different truncation rules
     const shouldTruncate = text.length > maxLength;
     
     // Some languages need more space than others
     const languageExpansionFactor = {
       en: 1,
       de: 1.3, // German often needs ~30% more space
       ru: 1.2,
       ja: 0.5, // Japanese can be more compact
       zh: 0.5  // Chinese can be more compact
     };
     
     const adjustedMaxLength = Math.floor(maxLength * (languageExpansionFactor[language] || 1));
     
     const displayText = shouldTruncate 
       ? `${text.substring(0, adjustedMaxLength)}...` 
       : text;
     
     return (
       <span title={shouldTruncate ? text : undefined} {...props}>
         {displayText}
       </span>
     );
   };
   ```

## Performance Problems

### Slow Page Loading

**Symptoms:**
- Pages take a long time to load
- UI freezes temporarily
- Delayed response to user interactions

**Solutions:**

1. **Component Lazy Loading:**
   ```javascript
   // In router configuration
   import { lazy, Suspense } from 'react';

   const TokenCreator = lazy(() => import('./pages/TokenCreator'));
   const WalletManager = lazy(() => import('./pages/WalletManager'));

   function AppRoutes() {
     return (
       <Suspense fallback={<LoadingSpinner />}>
         <Route path="/create-token" component={TokenCreator} />
         <Route path="/wallet" component={WalletManager} />
       </Suspense>
     );
   }
   ```

2. **Performance Monitoring:**
   ```javascript
   // Simple performance logger
   const logPerformance = (operation, timeMs) => {
     console.log(`Performance: ${operation} took ${timeMs.toFixed(2)}ms`);
     
     // Log to server if significantly slow
     if (timeMs > 1000) {
       sendPerformanceMetric(operation, timeMs);
     }
   };
   
   // Measure function performance
   const withPerformanceTracking = (fn, operationName) => {
     return (...args) => {
       const start = performance.now();
       const result = fn(...args);
       const end = performance.now();
       
       logPerformance(operationName, end - start);
       
       return result;
     };
   };
   
   // For async functions
   const withAsyncPerformanceTracking = (fn, operationName) => {
     return async (...args) => {
       const start = performance.now();
       
       try {
         const result = await fn(...args);
         const end = performance.now();
         
         logPerformance(operationName, end - start);
         
         return result;
       } catch (error) {
         const end = performance.now();
         logPerformance(`${operationName} (failed)`, end - start);
         throw error;
       }
     };
   };
   ```

3. **Optimize Rendering:**
   ```javascript
   // Memoize components
   const TokenCard = React.memo(function TokenCard({ token, onSelect }) {
     // Component implementation
   });
   
   // Use useCallback for event handlers
   const handleTokenSelect = useCallback((token) => {
     setSelectedToken(token);
   }, []);
   
   // Use useMemo for expensive calculations
   const filteredTokens = useMemo(() => {
     return tokens.filter(token => token.name.includes(searchQuery));
   }, [tokens, searchQuery]);
   ```

### Memory Leaks

**Symptoms:**
- Application becomes slower over time
- Browser tab uses increasing memory
- Browser eventually crashes

**Solutions:**

1. **Cleanup in useEffect:**
   ```javascript
   useEffect(() => {
     // Subscribe to events
     const subscription = someService.subscribe(handleEvent);
     
     // Set up interval
     const intervalId = setInterval(checkStatus, 5000);
     
     // Important: Clean up resources when component unmounts
     return () => {
       subscription.unsubscribe();
       clearInterval(intervalId);
     };
   }, []);
   ```

2. **Event Listener Management:**
   ```javascript
   // Bad: Adding event listeners without cleanup
   useEffect(() => {
     window.addEventListener('resize', handleResize);
     document.addEventListener('click', handleOutsideClick);
   }, []);
   
   // Good: Properly adding and removing event listeners
   useEffect(() => {
     window.addEventListener('resize', handleResize);
     document.addEventListener('click', handleOutsideClick);
     
     return () => {
       window.removeEventListener('resize', handleResize);
       document.removeEventListener('click', handleOutsideClick);
     };
   }, []);
   ```

## Database Issues

### Connection Errors

**Symptoms:**
- "Database connection failed" errors
- Operations timeout when accessing data
- Server responds with 500 errors

**Solutions:**

1. **Database Health Check:**
   ```javascript
   // In server/health.js
   const checkDatabaseHealth = async () => {
     try {
       // Try a simple query to check connection
       const result = await db.query('SELECT 1');
       
       return {
         status: 'ok',
         message: 'Database connection is healthy',
         timestamp: new Date().toISOString()
       };
     } catch (error) {
       console.error('Database health check failed:', error);
       
       return {
         status: 'error',
         message: 'Database connection failed',
         error: error.message,
         timestamp: new Date().toISOString()
       };
     }
   };
   
   // Add a health check endpoint
   app.get('/api/health/database', async (req, res) => {
     const health = await checkDatabaseHealth();
     
     const statusCode = health.status === 'ok' ? 200 : 500;
     res.status(statusCode).json(health);
   });
   ```

2. **Connection Retry Logic:**
   ```javascript
   // In server/db.js
   const connectWithRetry = async (maxRetries = 5, delay = 5000) => {
     let retries = 0;
     
     while (retries < maxRetries) {
       try {
         await db.connect();
         console.log('Database connected successfully');
         return true;
       } catch (error) {
         retries++;
         console.error(`Database connection attempt ${retries} failed:`, error);
         
         if (retries >= maxRetries) {
           console.error(`Failed to connect to database after ${maxRetries} attempts`);
           throw error;
         }
         
         console.log(`Retrying in ${delay}ms...`);
         await new Promise(resolve => setTimeout(resolve, delay));
       }
     }
   };
   ```

### Data Inconsistency

**Symptoms:**
- Unexpected data in UI
- Transactions appear incomplete
- User reports missing information

**Solutions:**

1. **Data Validation Middleware:**
   ```javascript
   // In server/middleware/validate.js
   const validateData = (schema) => {
     return (req, res, next) => {
       const { error, value } = schema.validate(req.body);
       
       if (error) {
         return res.status(400).json({
           error: 'Validation failed',
           details: error.details.map(d => d.message)
         });
       }
       
       // Replace request body with validated data
       req.body = value;
       next();
     };
   };
   ```

2. **Data Integrity Checks:**
   ```javascript
   // In server/utils/integrity.js
   const checkDataIntegrity = async () => {
     const issues = [];
     
     // Example: Check for tokens with missing creators
     const tokensWithMissingCreators = await db.query(`
       SELECT id, name FROM tokens 
       WHERE creator_id NOT IN (SELECT id FROM users)
     `);
     
     if (tokensWithMissingCreators.length > 0) {
       issues.push({
         type: 'missing_reference',
         entity: 'tokens',
         count: tokensWithMissingCreators.length,
         samples: tokensWithMissingCreators.slice(0, 5).map(t => t.id)
       });
     }
     
     // More integrity checks...
     
     return {
       hasIssues: issues.length > 0,
       issueCount: issues.length,
       issues
     };
   };
   ```

## Security Alerts

### Suspicious Activity Detection

**Symptoms:**
- Security alerts in application logs
- Unusual pattern of requests
- Users report unauthorized actions

**Solutions:**

1. **Security Event Logging:**
   ```javascript
   // In server/security.js
   const logSecurityEvent = async (event, message, ip, data = {}) => {
     try {
       // Log to database
       await db.securityEvents.create({
         event,
         message,
         ip,
         timestamp: new Date(),
         data: JSON.stringify(data)
       });
       
       // Log to console
       console.warn(`[SECURITY] ${event}: ${message} from IP ${ip}`);
       
       // For critical events, send alerts
       if (['UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY'].includes(event)) {
         sendSecurityAlert(event, message, ip, data);
       }
     } catch (error) {
       console.error('Failed to log security event:', error);
     }
   };
   ```

2. **Rate Limiting:**
   ```javascript
   // In server/middleware/rateLimit.js
   const createRateLimiter = (options) => {
     const { windowMs, max, message, keyGenerator, handler } = {
       windowMs: 15 * 60 * 1000, // 15 minutes
       max: 100, // limit each IP to 100 requests per windowMs
       message: 'Too many requests, please try again later.',
       keyGenerator: (req) => req.ip,
       handler: (req, res) => {
         res.status(429).json({ error: 'Rate limit exceeded' });
       },
       ...options
     };
     
     const requests = new Map();
     
     const cleanup = () => {
       const now = Date.now();
       for (const [key, { timestamp }] of requests.entries()) {
         if (now - timestamp > windowMs) {
           requests.delete(key);
         }
       }
     };
     
     // Clean up old entries every minute
     setInterval(cleanup, 60 * 1000);
     
     return (req, res, next) => {
       const key = keyGenerator(req);
       const now = Date.now();
       
       if (!requests.has(key)) {
         requests.set(key, {
           count: 1,
           timestamp: now
         });
         return next();
       }
       
       const request = requests.get(key);
       
       // Reset if outside window
       if (now - request.timestamp > windowMs) {
         request.count = 1;
         request.timestamp = now;
         return next();
       }
       
       // Increment count
       request.count++;
       
       // Check if over limit
       if (request.count > max) {
         // Log security event
         logSecurityEvent(
           'RATE_LIMIT_EXCEEDED',
           `Rate limit of ${max} requests per ${windowMs/1000}s exceeded`,
           req.ip,
           { path: req.path, method: req.method }
         );
         
         return handler(req, res, next);
       }
       
       next();
     };
   };
   ```

3. **IP Blacklisting:**
   ```javascript
   // In server/middleware/security.js
   const checkIpBlacklist = (req, res, next) => {
     const clientIp = req.ip;
     
     // Check against database of blacklisted IPs
     db.blacklistedIps.findOne({ ip: clientIp })
       .then(blacklisted => {
         if (blacklisted) {
           logSecurityEvent(
             'BLOCKED_REQUEST',
             'Request from blacklisted IP',
             clientIp,
             { path: req.path, method: req.method }
           );
           
           return res.status(403).json({
             error: 'Access denied'
           });
         }
         
         next();
       })
       .catch(error => {
         console.error('Error checking IP blacklist:', error);
         // Continue in case of database error
         next();
       });
   };
   ```

## Deployment Troubleshooting

### Deployment Failures

**Symptoms:**
- Build process fails
- Application doesn't start after deployment
- Features work in development but not in production

**Solutions:**

1. **Environment Variable Check:**
   ```javascript
   // In server/startup.js
   const checkRequiredEnvVars = () => {
     const required = [
       'NODE_ENV',
       'DATABASE_URL',
       'PORT'
     ];
     
     const missing = required.filter(key => !process.env[key]);
     
     if (missing.length > 0) {
       console.error(`Error: Missing required environment variables: ${missing.join(', ')}`);
       console.error('Application startup failed');
       process.exit(1);
     }
   };
   
   // Run at startup
   checkRequiredEnvVars();
   ```

2. **Deployment Verification Script:**
   ```javascript
   // In scripts/verify-deployment.js
   const verifyDeployment = async () => {
     console.log('Verifying deployment...');
     
     // Check if server is running
     try {
       const healthResponse = await fetch('http://localhost:3000/api/health');
       const health = await healthResponse.json();
       
       console.log('Server health:', health);
       
       if (health.status !== 'ok') {
         console.error('Server health check failed');
         return false;
       }
     } catch (error) {
       console.error('Failed to connect to server:', error);
       return false;
     }
     
     // Check database connection
     try {
       const dbHealthResponse = await fetch('http://localhost:3000/api/health/database');
       const dbHealth = await dbHealthResponse.json();
       
       console.log('Database health:', dbHealth);
       
       if (dbHealth.status !== 'ok') {
         console.error('Database health check failed');
         return false;
       }
     } catch (error) {
       console.error('Failed to check database health:', error);
       return false;
     }
     
     console.log('Deployment verification successful');
     return true;
   };
   
   verifyDeployment()
     .then(success => {
       if (!success) {
         console.error('Deployment verification failed');
         process.exit(1);
       }
     })
     .catch(error => {
       console.error('Deployment verification error:', error);
       process.exit(1);
     });
   ```

## Advanced Debugging Techniques

### Application Logging

**Implementing Comprehensive Logging:**

```javascript
// In client/src/lib/logger.js
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Configure log level
const LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO 
  : LogLevel.DEBUG;

export const logger = {
  debug: (message, ...args) => {
    if (LOG_LEVEL <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
    
    // Optionally send to analytics or server logs
    if (sendLogsToServer && message.includes('important')) {
      sendLog('debug', message, args);
    }
  },
  
  info: (message, ...args) => {
    if (LOG_LEVEL <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
    
    if (sendLogsToServer) {
      sendLog('info', message, args);
    }
  },
  
  warn: (message, ...args) => {
    if (LOG_LEVEL <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
    
    sendLog('warn', message, args);
  },
  
  error: (message, error, ...args) => {
    if (LOG_LEVEL <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
    
    sendLog('error', message, { error: serializeError(error), ...args });
  },
  
  // Function to enable/disable server logging
  setServerLogging: (enabled) => {
    sendLogsToServer = enabled;
  }
};

// Helper to serialize error objects for logging
function serializeError(error) {
  if (!error) return null;
  
  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
    code: error.code
  };
}

// Function to send logs to server
async function sendLog(level, message, details) {
  if (!sendLogsToServer) return;
  
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        details,
        clientInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          timestamp: new Date().toISOString()
        }
      }),
    });
  } catch (error) {
    // Don't use logger here to avoid infinite loop
    console.error('Failed to send log to server:', error);
  }
}
```

### Browser Developer Tools

**Tips for Effective Debugging:**

1. **Console Filtering**:
   - Use console.debug, console.info, console.warn, and console.error appropriately
   - Filter console by message types in browser dev tools

2. **Performance Profiling**:
   - Use Performance tab to record and analyze rendering performance
   - Look for long tasks and rendering bottlenecks

3. **Network Request Analysis**:
   - Monitor API calls in Network tab
   - Check for slow responses or failed requests
   - Simulate slow connections for testing

4. **React DevTools**:
   - Install React DevTools extension
   - Use Profiler to detect unnecessary renders
   - Inspect component props and state

5. **Application Storage**:
   - Examine localStorage and sessionStorage in Application tab
   - Check cookie values and expiration

## Conclusion

This troubleshooting guide covers the most common issues you might encounter with the SiTa Minter application. Remember to:

1. Identify the specific symptoms
2. Determine the most likely causes
3. Try the recommended solutions
4. Document what worked for future reference

If you encounter issues not covered in this guide, please report them to the development team so we can expand this resource and improve the application.