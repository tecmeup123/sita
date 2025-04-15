/**
 * Browser security checks for Web3 applications
 * Helps detect phishing websites and malicious browser extensions
 */
import { logSecurity, logWarning } from '../lib/logger';

interface SecurityCheckResult {
  safe: boolean;
  warnings: string[];
  critical: string[];
}

// List of known suspicious domains
const KNOWN_PHISHING_PATTERNS = [
  'ckb-wallet',
  'connect-wallet',
  'wallet-connect',
  'nervios-wallet',
  'wallet-validation',
  'wallet-verify',
  'validate-wallet',
  'wallet-restore',
  'restore-wallet',
  'wallet-claim',
  'claim-token',
  'airdrop',
  'free-token',
  'nervos-airdrop',
  'sita-token'
];

/**
 * Run all browser security checks to detect potential threats
 * @returns Security check results with warning and critical issues
 */
export function runBrowserSecurityChecks(): SecurityCheckResult {
  const result: SecurityCheckResult = {
    safe: true,
    warnings: [],
    critical: []
  };

  // Check for phishing indicators
  const phishingResult = checkForPhishing();
  result.warnings = [...result.warnings, ...phishingResult.warnings];
  result.critical = [...result.critical, ...phishingResult.critical];

  // Check for malicious extensions
  const extensionResult = checkForMaliciousExtensions();
  result.warnings = [...result.warnings, ...extensionResult.warnings];
  result.critical = [...result.critical, ...extensionResult.critical];

  // Set overall safety status
  result.safe = result.critical.length === 0 && result.warnings.length === 0;

  return result;
}

/**
 * Check for common phishing indicators
 */
function checkForPhishing(): { warnings: string[], critical: string[] } {
  const result = {
    warnings: [] as string[],
    critical: [] as string[]
  };

  // Get current URL and hostname
  const currentUrl = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();

  // Check for suspicious URL patterns
  for (const pattern of KNOWN_PHISHING_PATTERNS) {
    if (hostname.includes(pattern)) {
      result.critical.push(`Suspicious domain detected: ${hostname} matches known phishing pattern "${pattern}"`);
    }
  }

  // Check for Unicode character confusion attacks (homograph attacks)
  if (/[^\x00-\x7F]/.test(hostname)) {
    result.warnings.push('Domain contains non-ASCII characters which could be used for spoofing');
  }

  // Check if site is being loaded in an iframe
  if (window !== window.top) {
    result.critical.push('Page is loaded inside an iframe which could indicate clickjacking');
  }

  // Check for very recent domain registration (requires backend API)
  // This would typically use an API to check domain age

  // Check for suspicious URL parameters that might indicate a phishing campaign
  if (currentUrl.includes('wallet=') || currentUrl.includes('seed=') || currentUrl.includes('private=')) {
    result.critical.push('URL contains suspicious parameters potentially used for phishing');
  }

  return result;
}

/**
 * Check for signs of malicious browser extensions
 */
function checkForMaliciousExtensions(): { warnings: string[], critical: string[] } {
  const result = {
    warnings: [] as string[],
    critical: [] as string[]
  };

  // Check for tampering with the window.ethereum object
  if (typeof window.ethereum !== 'undefined') {
    // Store original properties for comparison
    const originalProperties = Object.getOwnPropertyNames(window.ethereum);
    
    // Check for suspicious injected methods that might be used to intercept transactions
    const suspiciousProperties = [
      '__intercept', 
      'hijack', 
      'intercept', 
      'capture', 
      'customSign',
      'customRequest',
      'originalRequest',
      'proxyProvider',
      '__proto__'
    ];
    
    for (const prop of suspiciousProperties) {
      if (originalProperties.includes(prop)) {
        result.critical.push(`Potentially malicious property detected in Web3 provider: ${prop}`);
      }
    }
  }

  // Check for excessive permissions of the page context
  try {
    // Check for notification permissions which could be abused
    if (Notification.permission === 'granted') {
      result.warnings.push('Page has notification permissions which could be abused by malicious sites');
    }
  } catch (e) {
    // API not available, ignore
  }

  // Check for suspicious browser behavior indicating extension tampering
  if (typeof document.documentElement.getAttribute('__malicious_attr__') !== 'undefined') {
    result.critical.push('Evidence of DOM tampering detected');
  }

  return result;
}

/**
 * Continuously monitor for changes to Web3 providers
 * This helps detect malicious extensions that wait before modifying providers
 */
function monitorWeb3Providers(): void {
  // Store the original ethereum provider
  const originalEthereum = window.ethereum;

  // Periodically check for changes to the provider
  setInterval(() => {
    // Check if the provider has been swapped out
    if (window.ethereum !== originalEthereum && originalEthereum !== undefined) {
      logSecurity('Web3 provider has been modified after page load', {
        originalProvider: typeof originalEthereum,
        newProvider: typeof window.ethereum
      });
      
      displaySecurityAlert('WARNING: Your Web3 wallet provider has been modified by a browser extension. This could be a sign of a malicious extension trying to steal your funds.');
    }
    
    // Check if methods have been tampered with
    if (window.ethereum && typeof window.ethereum.request === 'function') {
      // We could implement more sophisticated checks here
    }
  }, 3000);
}

/**
 * Display a security alert to the user
 */
function displaySecurityAlert(message: string): void {
  // Log the alert
  logSecurity('Security Alert Displayed: ' + message);
  
  // In a real application, we would display a modal or notification
  // to alert the user of potential security risks
  console.error('%c⚠️ SECURITY ALERT', 'color: red; font-size: 24px; font-weight: bold;');
  console.error('%c' + message, 'color: red; font-size: 16px;');
  
  // We could also prevent certain operations in high-risk scenarios
}

/**
 * Verify integrity of Web3 request before sending
 * Can help detect tampering with transaction parameters
 */
export function verifyTransactionIntegrity(
  originalTx: any,
  currentTx: any
): boolean {
  // Verify that critical transaction parameters haven't been modified
  if (originalTx.to !== currentTx.to) {
    logSecurity('Transaction recipient address was modified', {
      original: originalTx.to,
      modified: currentTx.to
    });
    return false;
  }
  
  // Check if the amount has been altered
  if (originalTx.value !== currentTx.value) {
    logSecurity('Transaction amount was modified', {
      original: originalTx.value,
      modified: currentTx.value
    });
    return false;
  }
  
  // Check if gas parameters have been significantly modified
  // A small increase might be normal, but a large increase is suspicious
  if (currentTx.gasPrice && originalTx.gasPrice) {
    const originalGas = parseInt(originalTx.gasPrice, 16);
    const currentGas = parseInt(currentTx.gasPrice, 16);
    
    if (currentGas > originalGas * 2) {
      logWarning('Transaction gas price was significantly increased', {
        original: originalGas,
        modified: currentGas
      });
      // This might be legitimate in some cases, so just warn, don't block
    }
  }
  
  return true;
}

/**
 * Initialize Web3 Browser Security
 * Should be called as early as possible in the application
 */
export function initWeb3BrowserSecurity(): void {
  // Run initial check
  const initialCheck = runBrowserSecurityChecks();
  
  // Log the results
  if (!initialCheck.safe) {
    logSecurity('Browser security check detected issues', {
      warnings: initialCheck.warnings,
      critical: initialCheck.critical
    });
  }
  
  // Start monitoring for provider changes
  monitorWeb3Providers();
  
  // Set up protection for transaction signing
  if (typeof window.ethereum !== 'undefined') {
    try {
      // We could implement more sophisticated protections here
      // such as wrapping the request method to verify transactions before sending
    } catch (e) {
      logWarning('Failed to set up transaction protection', { error: e });
    }
  }
  
  // Listen for visibility changes that might indicate tab switching during transactions
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // When user returns to page, run security check again
      runBrowserSecurityChecks();
    }
  });
  
  logSecurity('Web3 browser security initialized');
}