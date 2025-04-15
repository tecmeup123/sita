# Security Configurations Guide

This guide covers the key security configurations implemented in the SiTa Minter application.

## Server-side Security

### Security Headers

The security headers are configured in `server/middleware/securityHeaders.ts`:

```
server/middleware/securityHeaders.ts
```

These headers provide protection against common web vulnerabilities:

- **Content Security Policy (CSP)**: Restricts which resources can be loaded
- **X-XSS-Protection**: Helps prevent cross-site scripting attacks
- **X-Frame-Options**: Prevents clickjacking by controlling iframe embedding
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer-Policy**: Controls how much referrer information is included
- **Permissions-Policy**: Restricts which browser features the application can use

To update the CSP policy:

```typescript
const CSP_POLICY = `
  default-src 'self';
  script-src 'self' https://trusted-domain.com 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://trusted-image-domain.com;
  connect-src 'self' wss://*.replit.dev https://api.coingecko.com https://api.nervos.org;
  font-src 'self';
  frame-src 'self';
  object-src 'none';
`;
```

### Rate Limiting

Rate limiting is implemented in `server/routes.ts` using the `express-rate-limit` package:

```typescript
const networkBasedRateLimiting = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const networkType = req.headers['x-network-type'] as string || 'unknown';
  
  // Create a unique key combining IP and network
  const rateLimitKey = `${clientIp}:${networkType}`;
  
  // Apply rate limiting
  const limiter = createStrictRateLimiter({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 50,                   // limit each IP+network to 50 requests per windowMs
    keyGenerator: () => rateLimitKey,
    networkType: networkType
  });
  
  limiter(req, res, next);
};
```

### Wallet Address Validation

Wallet validation is implemented in `server/security.ts`:

```typescript
export const WALLET_VALIDATORS = {
  CKB: (address: string) => /^ck[br]1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{42}$/.test(address),
  // Add other network validators as needed
};

export function validateWalletAddress(
  address: string,
  type: keyof typeof WALLET_VALIDATORS = 'CKB'
): boolean {
  const validator = WALLET_VALIDATORS[type];
  if (!validator) return false;
  return validator(address);
}
```

## Client-side Security

### Browser Security Checks

Browser security checks are implemented in `client/src/utils/browserSecurityChecks.ts`:

```typescript
export function runBrowserSecurityChecks() {
  // Check if running in an iframe
  if (window !== window.top) {
    logSecurityEvent("IFRAME_DETECTED", "Application running in an iframe", "high");
    // Optionally display warning or take mitigation action
  }

  // Check for Web3 provider tampering
  if (window.ethereum) {
    if (typeof window.ethereum.isMetaMask !== 'boolean') {
      logSecurityEvent("PROVIDER_TAMPERING", "Web3 provider may be tampered", "medium");
    }
    
    // More provider checks
  }
  
  // Additional checks
}
```

### Secure Logging

Secure logging is configured in `client/src/lib/logger.ts`:

```typescript
export const logSecurityEvent = (
  event: string,
  message: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  data?: any
) => {
  // Log locally
  console.warn(`[SECURITY][${severity.toUpperCase()}] ${event}: ${message}`);
  
  // Send to server if serious
  if (severity === 'high' || severity === 'critical') {
    reportToServer(event, message, severity, data);
  }
};
```

## Maintaining Security Updates

When updating security configurations:

1. **Always test changes thoroughly** in a development environment first
2. Consider the impact on legitimate users when tightening security
3. Keep the CSP policy as restrictive as possible while allowing needed functionality
4. Update validation rules when adding support for new wallet types
5. Be mindful of performance implications when adding new security checks
6. Document all security changes in the application's security documentation

## Security Logging

Security events are logged both client-side and server-side:

```typescript
export async function logSecurityEvent(
  event: SecurityEventType, 
  message: string, 
  ip: string,
  data?: SecurityEventData
): Promise<void> {
  // Log locally
  console.log(`[SECURITY] ${event}: ${message} (IP: ${ip})`);
  
  // Store in database for auditing
  try {
    const eventRecord: InsertSecurityEvent = {
      eventType: event,
      message: message,
      ipAddress: ip,
      timestamp: new Date(),
      userId: data?.userId,
      walletAddress: data?.walletAddress,
      userAgent: data?.userAgent,
      resourceType: data?.resourceType,
      resourceId: data?.resourceId,
      requestData: data?.requestData ? JSON.stringify(data.requestData) : null,
      severity: data?.severity || 'info',
      network: data?.network
    };
    
    await db.insert(securityEvents).values(eventRecord);
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}
```

Always review security logs regularly for suspicious patterns or attempted attacks.