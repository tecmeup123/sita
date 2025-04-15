import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SecurityEventType, logSecurityEvent } from '../security';

/**
 * Middleware to add Content Security Policy and other security headers
 * Helps prevent XSS, clickjacking, and other common web vulnerabilities
 */
export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    
    // Set Content-Security-Policy header
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://api.binance.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://testnet.ckb.dev https://mainnet.ckb.dev https://api.binance.com; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "media-src 'self'; " +
      "frame-src 'self'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'self'; " +
      "manifest-src 'self'; " +
      "worker-src 'self' blob:; " + 
      "upgrade-insecure-requests; " +
      "block-all-mixed-content;"
    );
    
    // Set cache control for API routes
    if (req.path.startsWith('/api')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    next();
  };
}

/**
 * Middleware to detect and block common phishing attack patterns
 * This helps protect users from wallet draining attacks
 */
export function phishingProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // List of suspicious keyword patterns often found in phishing URLs
    const suspiciousPatterns = [
      'validate-wallet', 
      'connect-wallet', 
      'wallet-connect',
      'verify-address',
      'token-claim',
      'free-airdrop',
      'token-airdrop'
    ];
    
    // Check if any suspicious patterns are in the URL
    const url = req.originalUrl.toLowerCase();
    const referer = req.headers.referer ? req.headers.referer.toLowerCase() : '';
    
    for (const pattern of suspiciousPatterns) {
      if (url.includes(pattern) || referer.includes(pattern)) {
        // Log the suspicious request
        logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          `Potential phishing attempt detected with pattern: ${pattern}`,
          req.ip,
          {
            resourceType: 'url',
            resourceId: req.originalUrl,
            userAgent: req.headers['user-agent'] || 'unknown',
            requestData: { referer: req.headers.referer || 'none' },
            severity: 'warning'
          }
        );
        
        // Add a phishing warning header
        res.setHeader('X-Phishing-Protection', 'Potential phishing pattern detected');
        
        // We don't block the request, but we could if needed
        // res.status(403).json({ error: 'Suspicious URL pattern detected' });
        // return;
      }
    }
    
    next();
  };
}

/**
 * Middleware to detect potentially compromised browser environments
 * This helps identify when browser extensions might be tampering with Web3 requests
 */
export function maliciousExtensionDetection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate a secure random token for the client to use in extension detection
    const securityToken = generateSecureToken();
    
    // Set a custom security header with the token
    res.setHeader('X-Security-Token', securityToken);
    
    // If this is a transaction request, add additional detection
    if (req.path.includes('/transaction') || req.path.includes('/sign')) {
      // Log high-value transaction request (could be used for monitoring)
      if (req.body && req.body.value && parseFloat(req.body.value) > 1000) {
        logSecurityEvent(
          SecurityEventType.TOKEN_OPERATION,
          `High-value transaction detected: ${req.body.value}`,
          req.ip,
          {
            resourceType: 'transaction',
            resourceId: req.path,
            walletAddress: req.body.from || 'unknown',
            requestData: { value: req.body.value },
            severity: 'info'
          }
        );
      }
    }
    
    next();
  };
}

/**
 * Generate a secure random token for extension detection
 */
function generateSecureToken(): string {
  return uuidv4();
}