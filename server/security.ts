import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { log } from './vite';
import { db } from './db';
import { securityEvents, InsertSecurityEvent } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Security logging interface for extended event data
 */
export interface SecurityEventData {
  userId?: number;
  walletAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  requestData?: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  network?: string;
}

/**
 * Security logging function specialized for security events
 * Logs to console and stores in database
 * 
 * @param event Security event type
 * @param message Description of the event
 * @param ip IP address associated with the event
 * @param data Additional event data to store
 */
export async function logSecurityEvent(
  event: SecurityEventType, 
  message: string, 
  ip?: string,
  data?: SecurityEventData
): Promise<void> {
  const eventInfo = ip ? `[${event}] [IP: ${ip}] ${message}` : `[${event}] ${message}`;
  
  // Use console.warn for security logs to make them stand out
  console.warn(`\x1b[31m[SECURITY]\x1b[0m ${new Date().toISOString()} ${eventInfo}`);
  
  // Also log through the standard logging system
  log(`Security event: ${event} - ${message}`, "security");
  
  try {
    // Store security event in database
    const eventRecord: InsertSecurityEvent = {
      event_type: event,
      message,
      ip_address: ip,
      user_id: data?.userId,
      wallet_address: data?.walletAddress,
      user_agent: data?.userAgent,
      resource_type: data?.resourceType,
      resource_id: data?.resourceId,
      request_data: data?.requestData,
      severity: data?.severity || 'info',
      network: data?.network || 'testnet',
    };
    
    await db.insert(securityEvents).values(eventRecord);
  } catch (err) {
    console.error('Failed to store security event in database:', err);
    // Still continue execution - logging should not block application flow
  }
}

/**
 * Standard security event types for consistent logging
 */
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_INPUT = "INVALID_INPUT",
  AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  TOKEN_OPERATION = "TOKEN_OPERATION",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  WALLET_VALIDATION = "WALLET_VALIDATION",
  ACCESS_CONTROL = "ACCESS_CONTROL"
}

/**
 * Wallet address formats and validation rules
 */
export const WALLET_VALIDATORS = {
  // Nervos CKB addresses typically start with "ckb" and have different formats
  // We support both legacy and new formats
  CKB: {
    // Legacy address format (starts with 'ckb')
    legacyFormat: /^ckb[a-zA-Z0-9]{42,46}$/,
    // New address format using 0x prefix (hex)
    hexFormat: /^0x[a-fA-F0-9]{40,42}$/,
    // Function to validate a CKB wallet address
    validate: (address: string): boolean => {
      const validators = WALLET_VALIDATORS.CKB;
      return validators.legacyFormat.test(address) || validators.hexFormat.test(address);
    }
  }
};

/**
 * Validates a wallet address based on its format
 * @param address The wallet address to validate
 * @param type The blockchain type (defaults to CKB)
 * @returns Boolean indicating if address is valid
 */
export function validateWalletAddress(
  address: string, 
  type: 'CKB' = 'CKB'
): boolean {
  if (!address) return false;
  
  // Remove any whitespace
  address = address.trim();
  
  // Get the validator for the specified blockchain type
  const validator = WALLET_VALIDATORS[type];
  if (!validator) return false;
  
  return validator.validate(address);
}

/**
 * Create a strict rate limiter for sensitive operations like token minting
 */
export const createStrictRateLimiter = (
  windowMs: number = 60 * 60 * 1000, // 1 hour by default
  maxRequests: number = 5, // 5 requests per window by default
  eventType: SecurityEventType = SecurityEventType.RATE_LIMIT_EXCEEDED
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      message: "Too many attempts, please try again later."
    },
    handler: (req: Request, res: Response, next: NextFunction, options: any) => {
      // Log the rate limit hit as a security event with enhanced data
      const walletAddress = req.body?.walletAddress || req.query?.walletAddress;
      
      // Store the security event in database with detailed information
      logSecurityEvent(
        eventType,
        `Rate limit exceeded for sensitive operation: ${req.path}`,
        req.ip,
        {
          walletAddress: typeof walletAddress === 'string' ? walletAddress : undefined,
          userAgent: req.headers['user-agent'],
          resourceType: 'endpoint',
          resourceId: req.path,
          requestData: {
            method: req.method,
            query: req.query,
            body: req.body,
          },
          severity: 'warning', // Rate limiting is a warning level event
          network: req.body?.network || req.query?.network || 'testnet',
        }
      );
      
      // Return the standard rate limit response
      res.status(options.statusCode).json(options.message);
    }
  });
};

/**
 * Middleware to validate API inputs
 * Checks request body against provided schema and logs security events for invalid inputs
 * Enhanced with comprehensive security audit trail
 */
/**
 * Middleware to validate wallet addresses in requests
 * Ensures that any wallet address in the request is correctly formatted
 * Will reject requests with invalid wallet addresses
 */
export const validateWalletMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check request body if it's a POST/PUT/PATCH request
      if (req.body && req.body.walletAddress) {
        const isValid = validateWalletAddress(req.body.walletAddress);
        
        if (!isValid) {
          // Log invalid wallet address attempt
          logSecurityEvent(
            SecurityEventType.WALLET_VALIDATION,
            `Invalid wallet address format in request body: ${req.body.walletAddress}`,
            req.ip,
            {
              walletAddress: req.body.walletAddress,
              userAgent: req.headers['user-agent'],
              resourceType: 'wallet_validation',
              resourceId: req.path,
              requestData: {
                method: req.method,
                body: req.body,
              },
              severity: 'warning',
              network: req.body.network || 'testnet',
            }
          );
          
          return res.status(400).json({
            status: 400,
            message: "Invalid wallet address format",
          });
        }
      }
      
      // Check query parameters for wallet addresses
      if (req.query && req.query.walletAddress) {
        const address = req.query.walletAddress as string;
        const isValid = validateWalletAddress(address);
        
        if (!isValid) {
          // Log invalid wallet address attempt
          logSecurityEvent(
            SecurityEventType.WALLET_VALIDATION,
            `Invalid wallet address format in query parameters: ${address}`,
            req.ip,
            {
              walletAddress: address,
              userAgent: req.headers['user-agent'],
              resourceType: 'wallet_validation',
              resourceId: req.path,
              requestData: {
                method: req.method,
                query: req.query,
              },
              severity: 'warning',
              network: req.query.network as string || 'testnet',
            }
          );
          
          return res.status(400).json({
            status: 400,
            message: "Invalid wallet address format in query parameter",
          });
        }
      }
      
      // All wallet addresses are valid, proceed to next middleware
      next();
    } catch (error) {
      // Log any exceptions during validation
      logSecurityEvent(
        SecurityEventType.WALLET_VALIDATION,
        `Exception during wallet address validation: ${error}`,
        req.ip,
        {
          userAgent: req.headers['user-agent'],
          resourceType: 'wallet_validation',
          resourceId: req.path,
          requestData: {
            method: req.method,
            error: String(error)
          },
          severity: 'error',
        }
      );
      
      return res.status(500).json({
        status: 500,
        message: "Internal server error during wallet validation"
      });
    }
  };
};

export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        // Extract wallet address if available
        const walletAddress = req.body?.walletAddress || req.query?.walletAddress;
        
        // Log the validation failure as a security event with enhanced data
        logSecurityEvent(
          SecurityEventType.INVALID_INPUT,
          `Input validation failed for ${req.path}: ${JSON.stringify(validationResult.error.issues)}`,
          req.ip,
          {
            walletAddress: typeof walletAddress === 'string' ? walletAddress : undefined,
            userAgent: req.headers['user-agent'],
            resourceType: 'api_validation',
            resourceId: req.path,
            requestData: {
              method: req.method,
              body: req.body,
              validationErrors: validationResult.error.issues
            },
            severity: 'warning', // Input validation failures are warning level
            network: req.body?.network || req.query?.network || 'testnet',
          }
        );
        
        return res.status(400).json({ 
          status: 400, 
          message: "Input validation failed",
          errors: validationResult.error.issues
        });
      }
      
      // Replace the request body with the validated data
      req.body = validationResult.data;
      next();
    } catch (error) {
      // Extract wallet address if available
      const walletAddress = req.body?.walletAddress || req.query?.walletAddress;
      
      // Log unhandled exception as a security event with enhanced data
      logSecurityEvent(
        SecurityEventType.INVALID_INPUT,
        `Exception during input validation for ${req.path}: ${error}`,
        req.ip,
        {
          walletAddress: typeof walletAddress === 'string' ? walletAddress : undefined,
          userAgent: req.headers['user-agent'],
          resourceType: 'api_validation',
          resourceId: req.path,
          requestData: {
            method: req.method,
            body: req.body,
            error: String(error)
          },
          severity: 'error', // Exceptions during validation are error level
          network: req.body?.network || req.query?.network || 'testnet',
        }
      );
      
      return res.status(500).json({ 
        status: 500, 
        message: "Internal server error during input validation" 
      });
    }
  };
};