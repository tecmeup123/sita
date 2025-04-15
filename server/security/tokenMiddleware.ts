import { Request, Response, NextFunction } from 'express';
import { TokenOperationLockManager, TokenValidationErrorType } from './tokenTypes';
import { TokenOperationTracker } from './tokenValidation';
import { logSecurityEvent, SecurityEventType } from '../security';

/**
 * Advanced rate limiting for token operations based on wallet address
 * This is in addition to the IP-based rate limiting
 */
export const tokenOperationWalletLimiter = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const walletAddress = req.body?.walletAddress || req.query?.walletAddress as string;
      
      // If no wallet address, skip this middleware
      if (!walletAddress) {
        return next();
      }
      
      // Combine IP and wallet for stronger identification
      const identifier = `${req.ip}:${walletAddress}`;
      
      // Check if this identifier has exceeded failed attempts
      const shouldBlock = TokenOperationTracker.recordFailedAttempt(identifier);
      
      if (shouldBlock) {
        // Log the security event
        await logSecurityEvent(
          SecurityEventType.RATE_LIMIT_EXCEEDED,
          `Too many failed token operations from wallet: ${walletAddress}`,
          req.ip,
          {
            walletAddress,
            userAgent: req.headers['user-agent'],
            resourceType: 'token_operation',
            resourceId: req.path,
            severity: 'warning',
            network: req.body.network || req.query.network as string || 'testnet',
          }
        );
        
        return res.status(429).json({
          status: 429,
          message: "Too many failed operations. Please try again later.",
          error: {
            type: TokenValidationErrorType.RATE_LIMIT,
            message: "Rate limit exceeded for this wallet address"
          }
        });
      }
      
      next();
    } catch (error) {
      // Log error but allow request to continue to avoid blocking legitimate requests
      console.error("Error in wallet-based rate limiter:", error);
      next();
    }
  };
};

/**
 * Prevents concurrent token operations from the same wallet address
 * This helps prevent double-spending and transaction confusion
 */
export const tokenConcurrentOperationGuard = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const walletAddress = req.body?.walletAddress;
      
      // If no wallet address, skip this middleware
      if (!walletAddress) {
        return next();
      }
      
      // Determine operation type based on the endpoint
      let operationType: 'validation' | 'issuance' | 'transaction' = 'validation';
      
      if (req.path.includes('/token/issue')) {
        operationType = 'issuance';
      } else if (req.path.includes('/token/transaction')) {
        operationType = 'transaction';
      }
      
      // Try to acquire a lock
      const lockAcquired = TokenOperationLockManager.acquireLock(
        walletAddress,
        operationType
      );
      
      if (!lockAcquired) {
        // Log the concurrent operation attempt
        await logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          `Concurrent token operation attempt for wallet: ${walletAddress}`,
          req.ip,
          {
            walletAddress,
            userAgent: req.headers['user-agent'],
            resourceType: 'token_operation_lock',
            resourceId: req.path,
            requestData: {
              operationType,
              path: req.path,
              method: req.method
            },
            severity: 'warning',
            network: req.body.network || req.query.network as string || 'testnet',
          }
        );
        
        return res.status(409).json({
          status: 409,
          message: "Another token operation is already in progress",
          error: {
            type: TokenValidationErrorType.CONCURRENT_OPERATIONS,
            message: "Cannot perform multiple token operations simultaneously"
          }
        });
      }
      
      // Store lock information in request for later use
      req.body._lockInfo = {
        walletAddress,
        operationType,
        acquired: Date.now()
      };
      
      // Add a response hook to release the lock when the response is sent
      res.on('finish', () => {
        // Only release the lock if the operation wasn't successful
        if (res.statusCode >= 400) {
          TokenOperationLockManager.releaseLock(walletAddress, operationType);
        } else {
          // For successful operations, mark the lock as validated
          TokenOperationLockManager.markValidated(walletAddress, operationType);
        }
      });
      
      next();
    } catch (error) {
      // Log error but allow request to continue
      console.error("Error in concurrent operation guard:", error);
      next();
    }
  };
};

/**
 * Adds request and response cycle durations to security logging
 * Helps identify abnormally slow requests that might indicate attacks
 */
export const tokenOperationTimingMonitor = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Record start time
    const startTime = Date.now();
    
    // Store it in the request
    req.body._timing = {
      start: startTime
    };
    
    // Track response completion
    res.on('finish', async () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log unusually long operations (more than 5 seconds)
      if (duration > 5000) {
        await logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          `Unusually long token operation: ${duration}ms`,
          req.ip,
          {
            walletAddress: req.body?.walletAddress,
            userAgent: req.headers['user-agent'],
            resourceType: 'token_operation_timing',
            resourceId: req.path,
            requestData: {
              duration,
              path: req.path,
              method: req.method,
              statusCode: res.statusCode
            },
            severity: 'info', // Not immediately concerning, just monitoring
            network: req.body.network || req.query.network as string || 'testnet',
          }
        );
      }
    });
    
    next();
  };
};