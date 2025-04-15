// Import Node.js polyfills first
import "./nodePolyfills.js";
// Import browser polyfills next
import "./browserPolyfills.js";

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./materialIcons.css";

// Import enhanced security modules
import { runBrowserSecurityChecks, initWeb3BrowserSecurity } from "./utils/browserSecurityChecks";
import { logSecurity, logWarning, logError } from "./lib/logger";

// Global error logger for client-side errors - will be replaced by enhanced version later
const originalLogClientError = (error: Error, errorInfo?: string, source?: string) => {
  // Log to console with formatted message
  console.error(`[${source || 'CLIENT_ERROR'}] ${new Date().toISOString()}:`, error);
  
  if (errorInfo) {
    console.error('Additional error info:', errorInfo);
  }
  
  // In the future, we could add error reporting to a backend endpoint
  try {
    // Redact sensitive information from error message
    const safeErrorMessage = error.message
      .replace(/0x[a-fA-F0-9]{30,}/g, '[REDACTED_ADDRESS]') // Redact addresses
      .replace(/("private\w*"|"secret\w*"|"key\w*")\s*:\s*"[^"]*"/gi, '$1:"[REDACTED]"'); // Redact private/secret keys
      
    // We could send this to a backend API endpoint for server-side logging
    // fetch('/api/client-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message: safeErrorMessage,
    //     source: source || 'client',
    //     stack: error.stack,
    //     timestamp: new Date().toISOString()
    //   })
    // }).catch(e => console.error('Failed to report error:', e));
  } catch (reportingError) {
    console.error('Error during error reporting:', reportingError);
  }
}

// Define our enhanced logger - initially use the original implementation,
// but we'll replace this implementation after security checks are run
const logClientError = (error: Error, errorInfo?: string, source?: string) => {
  logError(`[${source || 'CLIENT_ERROR'}] ${error.message}`, {
    errorInfo,
    stack: error.stack,
    source: source || 'client'
  });
};

// Set up global error handlers
window.addEventListener('error', (event) => {
  logClientError(
    event.error || new Error(event.message), 
    `at ${event.filename}:${event.lineno}:${event.colno}`,
    'WINDOW.ONERROR'
  );
});

window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error 
    ? event.reason 
    : new Error(String(event.reason || 'Unknown Promise Rejection'));
  
  logClientError(error, undefined, 'UNHANDLED_PROMISE_REJECTION');
  
  // Check if the error appears to be wallet-related
  const errorText = String(event.reason).toLowerCase();
  if (
    errorText.includes('wallet') || 
    errorText.includes('transaction') || 
    errorText.includes('sign') || 
    errorText.includes('connect')
  ) {
    // In a real app, we could show a user-friendly toast message for common wallet errors
    console.warn('Wallet-related error detected:', errorText.substring(0, 100));
  }
});

// React error boundary would typically go here as a wrapper around the App component
// but we're using the built-in React error handling for this example

// Initialize Web3 browser security as early as possible
initWeb3BrowserSecurity();

// Run browser security checks and handle any issues
const securityCheckResult = runBrowserSecurityChecks();
if (!securityCheckResult.safe) {
  // Log all security warnings
  securityCheckResult.warnings.forEach(warning => {
    logWarning(`Security Warning: ${warning}`, { securityCheck: true });
  });
  
  // Log critical security issues
  securityCheckResult.critical.forEach(critical => {
    logSecurity(`Critical Security Issue: ${critical}`, { securityCheck: true });
    
    // We could display security alerts to the user here
    // or prevent certain high-risk operations
  });
}

// Our error logger is now fully set up and ready to use

createRoot(document.getElementById("root")!).render(<App />);
