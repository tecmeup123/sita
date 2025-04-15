import { z } from "zod";
import { logSecurityEvent, SecurityEventType, SecurityEventData } from "../security";
import { Request, Response, NextFunction } from "express";

/**
 * Enhanced token validation schema with additional checks against economic exploits
 * Enforces stricter validation than the basic schema
 */
export const enhancedTokenMetadataSchema = z.object({
  name: z.string()
    .min(1, "Token name must not be empty")
    .max(64, "Token name must be at most 64 characters")
    .trim()
    .refine(name => /^[a-zA-Z0-9 ]+$/.test(name), {
      message: "Token name must only contain alphanumeric characters and spaces"
    }),
  
  symbol: z.string()
    .min(1, "Token symbol must not be empty")
    .max(10, "Token symbol must be at most 10 characters")
    .trim()
    .refine(symbol => /^[A-Z0-9]+$/.test(symbol), {
      message: "Token symbol must only contain uppercase letters and numbers"
    }),
  
  decimals: z.number()
    .int("Token decimals must be an integer")
    .min(0, "Token decimals must be at least 0")
    .max(18, "Token decimals must be at most 18"),
  
  description: z.string()
    .max(1024, "Description must be at most 1024 characters")
    .optional(),
  
  icon: z.string()
    .url("Icon must be a valid URL")
    .optional(),
  
  supply: z.string()
    .regex(/^\d+$/, "Supply must be a valid integer string")
    .refine(supply => {
      const supplyBigInt = BigInt(supply);
      // Prevent unreasonable supply sizes
      const MAX_SUPPLY = BigInt("18446744073709551615"); // 2^64-1, Maximum reasonable supply
      return supplyBigInt > 0 && supplyBigInt <= MAX_SUPPLY;
    }, {
      message: "Supply must be positive and within reasonable limits"
    })
});

/**
 * Enhanced transaction schema with anti-frontrunning protections
 */
export const enhancedTokenTransactionSchema = z.object({
  txHash: z.string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Transaction hash must be a valid 32-byte hex string"),
  
  network: z.enum(["mainnet", "testnet"]),
  
  // Tracking nonce helps prevent replay attacks
  nonce: z.string()
    .regex(/^0x[a-fA-F0-9]+$/, "Nonce must be a valid hex string")
    .optional(),
  
  // Allow additional details for tracking issuance
  metadata: z.object({
    // Optional fields to track token details with the transaction
    tokenName: z.string().optional(),
    tokenSymbol: z.string().optional(),
    tokenDecimals: z.number().optional(),
    tokenSupply: z.string().optional(),
    // Timestamp when the user initiated the transaction (client-side)
    clientTimestamp: z.number().optional(),
  }).optional()
});

/**
 * Middleware to validate token parameters against economic exploits
 * Performs deeper validation than the basic schema check
 */
export const validateTokenParameters = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, symbol, decimals, supply } = req.body;
      
      // Additional validations beyond schema checks
      
      // Check for token name spoofing (common scam tactic)
      const knownTokens = [
        "Bitcoin", "Ethereum", "Tether", "USDC", "USD Coin", "XRP", "BNB", 
        "Cardano", "Solana", "Dogecoin", "Polygon", "Nervos", "CKB", "Polkadot"
      ];
      
      const nameUpperCase = name.toUpperCase();
      const symbolUpperCase = symbol.toUpperCase();
      
      // Check if token name is too similar to well-known tokens
      const potentialNameSpoofing = knownTokens.some(knownToken => {
        // Direct match or very close similarity
        return nameUpperCase === knownToken.toUpperCase() ||
          nameUpperCase.includes(knownToken.toUpperCase()) ||
          knownToken.toUpperCase().includes(nameUpperCase);
      });
      
      // Check if symbol is too similar to well-known tokens
      const knownSymbols = ["BTC", "ETH", "USDT", "USDC", "XRP", "BNB", "ADA", "SOL", "DOGE", "MATIC", "CKB", "DOT"];
      const potentialSymbolSpoofing = knownSymbols.some(knownSymbol => 
        symbolUpperCase === knownSymbol || 
        symbolUpperCase.includes(knownSymbol) ||
        knownSymbol.includes(symbolUpperCase)
      );
      
      // If potential spoofing is detected, log it but don't block it
      // Just add a warning flag so the UI can warn the user
      if (potentialNameSpoofing || potentialSymbolSpoofing) {
        // Log the potential spoofing attempt
        const securityData: SecurityEventData = {
          walletAddress: req.body?.walletAddress,
          userAgent: req.headers['user-agent'],
          resourceType: 'token_validation',
          resourceId: 'token_spoof_check',
          requestData: {
            name,
            symbol,
            decimals,
            supply,
            potentialNameSpoofing,
            potentialSymbolSpoofing
          },
          severity: 'warning',
          network: req.body.network || req.query.network as string || 'testnet',
        };
        
        await logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          `Potential token name/symbol spoofing attempt: ${name} (${symbol})`,
          req.ip,
          securityData
        );
        
        // Add a warning flag to request for downstream handlers
        req.body._warnings = {
          potentialSpoofing: true,
          nameCheck: potentialNameSpoofing,
          symbolCheck: potentialSymbolSpoofing
        };
      }
      
      // Verify that the supply isn't unreasonably large to prevent economic exploits
      try {
        const supplyBigInt = BigInt(supply);
        // Calculate 10^decimals without using ** operator for BigInt
        let decimalsPower = BigInt(1);
        for (let i = 0; i < decimals; i++) {
          decimalsPower = decimalsPower * BigInt(10);
        }
        
        // Calculate actual token amount (considering decimals)
        const totalRealSupply = supplyBigInt * decimalsPower;
        
        // Use a pre-calculated value for MAX_REASONABLE_SUPPLY (10^27)
        const MAX_REASONABLE_SUPPLY = BigInt("1000000000000000000000000000"); // 10^27, billion billion billion
        if (totalRealSupply > MAX_REASONABLE_SUPPLY) {
          // This is a suspicious amount - log but don't block
          await logSecurityEvent(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            `Unusually large token supply detected: ${supply} with ${decimals} decimals`,
            req.ip,
            {
              walletAddress: req.body?.walletAddress,
              userAgent: req.headers['user-agent'],
              resourceType: 'token_validation',
              resourceId: 'token_supply_check',
              requestData: {
                name,
                symbol,
                decimals,
                supply
              },
              severity: 'warning',
              network: req.body.network || req.query.network as string || 'testnet',
            }
          );
          
          // Add warning to request
          req.body._warnings = {
            ...(req.body._warnings || {}),
            largeSupply: true
          };
        }
      } catch (err) {
        // Error converting supply - this should have been caught by schema validation
        // but we'll add an extra log here just in case
        await logSecurityEvent(
          SecurityEventType.INVALID_INPUT,
          `Error validating token supply: ${err}`,
          req.ip,
          {
            severity: 'warning',
            requestData: { supply, error: String(err) }
          }
        );
      }
      
      // Proceed to next middleware
      next();
    } catch (error) {
      // Log the error
      await logSecurityEvent(
        SecurityEventType.INVALID_INPUT,
        `Exception during enhanced token validation: ${error}`,
        req.ip,
        {
          userAgent: req.headers['user-agent'],
          resourceType: 'token_validation',
          requestData: {
            body: req.body,
            error: String(error)
          },
          severity: 'error',
        }
      );
      
      return res.status(500).json({
        status: 500,
        message: "Internal server error during token validation"
      });
    }
  };
};

/**
 * Anti-frontrunning middleware for token operations
 * Helps prevent transaction manipulation attacks
 */
export const antiFrontrunningMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Add a server timestamp to compare with client timestamp
      req.body._serverTimestamp = Date.now();
      
      // 2. Check for suspicious time differences if client provided a timestamp
      if (req.body.metadata?.clientTimestamp) {
        const clientTime = req.body.metadata.clientTimestamp;
        const serverTime = req.body._serverTimestamp;
        const timeDiff = Math.abs(serverTime - clientTime);
        
        // If time difference is more than 5 minutes, it's suspicious
        // Could indicate replay attack or manipulation
        if (timeDiff > 5 * 60 * 1000) {
          await logSecurityEvent(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            `Suspicious timestamp difference in token operation: ${timeDiff}ms`,
            req.ip,
            {
              walletAddress: req.body?.walletAddress,
              userAgent: req.headers['user-agent'],
              resourceType: 'anti_frontrunning',
              requestData: {
                clientTime,
                serverTime,
                timeDiff,
                txHash: req.body.txHash
              },
              severity: 'warning',
              network: req.body.network || 'testnet',
            }
          );
          
          // Add warning to request
          req.body._warnings = {
            ...(req.body._warnings || {}),
            suspiciousTimeDiff: true,
            timeDiff
          };
        }
      }
      
      // Continue to next middleware
      next();
    } catch (error) {
      // Log the error
      await logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        `Exception during anti-frontrunning check: ${error}`,
        req.ip,
        {
          userAgent: req.headers['user-agent'],
          resourceType: 'anti_frontrunning',
          requestData: {
            error: String(error)
          },
          severity: 'error',
        }
      );
      
      // Allow the request to proceed anyway since this is just an additional layer
      next();
    }
  };
};

/**
 * Track consecutive failed token operations from the same IP or wallet
 * to detect potential attack patterns
 */
export class TokenOperationTracker {
  private static failedAttempts: Map<string, { count: number, lastAttempt: number }> = new Map();
  private static readonly ATTEMPT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  
  /**
   * Record a failed token operation
   * @returns true if the user should be blocked due to too many failures
   */
  public static recordFailedAttempt(identifier: string): boolean {
    const now = Date.now();
    const record = this.failedAttempts.get(identifier);
    
    // If record exists and hasn't expired, increment count
    if (record && (now - record.lastAttempt) < this.ATTEMPT_EXPIRY_MS) {
      record.count++;
      record.lastAttempt = now;
      this.failedAttempts.set(identifier, record);
      
      // Return true if max attempts exceeded
      return record.count > this.MAX_FAILED_ATTEMPTS;
    } else {
      // Create new record
      this.failedAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }
  }
  
  /**
   * Reset the failed attempts counter for an identifier
   */
  public static resetAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }
  
  /**
   * Clean up expired records (to be called periodically)
   */
  public static cleanupExpiredRecords(): void {
    const now = Date.now();
    
    // Use Array.from to avoid iterator issues with Map.entries()
    Array.from(this.failedAttempts.keys()).forEach(identifier => {
      const record = this.failedAttempts.get(identifier);
      if (record && (now - record.lastAttempt) >= this.ATTEMPT_EXPIRY_MS) {
        this.failedAttempts.delete(identifier);
      }
    });
  }
}

// Set up a periodic cleanup every 10 minutes
setInterval(() => {
  TokenOperationTracker.cleanupExpiredRecords();
}, 10 * 60 * 1000);