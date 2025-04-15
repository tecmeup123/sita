import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createStrictRateLimiter, SecurityEventType, validateInput, logSecurityEvent } from "./security";
import { 
  enhancedTokenMetadataSchema as tokenMetadataSchema, 
  enhancedTokenTransactionSchema as tokenTransactionSchema,
  validateTokenParameters,
  antiFrontrunningMiddleware
} from "./security/tokenValidation";
import {
  tokenOperationWalletLimiter,
  tokenConcurrentOperationGuard,
  tokenOperationTimingMonitor
} from "./security/tokenMiddleware";
import { TokenValidationErrorType } from "./security/tokenTypes";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure strict rate limiters for sensitive operations
  const tokenRateLimiter = createStrictRateLimiter(
    15 * 60 * 1000, // 15 minutes window
    5, // 5 requests per window
    SecurityEventType.TOKEN_OPERATION
  );
  
  // More aggressive rate limiter for very sensitive operations (issuing tokens)
  const tokenIssuanceLimiter = createStrictRateLimiter(
    60 * 60 * 1000, // 1 hour window
    3, // 3 requests per hour
    SecurityEventType.TOKEN_OPERATION
  );
  
  // Even stricter rate limiter for token issuance on mainnet
  const mainnetTokenIssuanceLimiter = createStrictRateLimiter(
    3 * 60 * 60 * 1000, // 3 hour window
    2, // 2 requests per window
    SecurityEventType.TOKEN_OPERATION
  );
  
  // Extremely strict rate limiter for potential abuse vectors
  const securitySensitiveLimiter = createStrictRateLimiter(
    24 * 60 * 60 * 1000, // 24 hour window
    10, // 10 requests per day
    SecurityEventType.SUSPICIOUS_ACTIVITY
  );
  
  // Using enhanced validation schemas for token operations 
  // to prevent economic exploits and ensure proper parameter validation
  
  // Network-specific middleware for token operations
  const networkBasedRateLimiting = (req: Request, res: Response, next: NextFunction) => {
    // Apply stricter limits for mainnet operations
    if (req.body.network === 'mainnet') {
      return mainnetTokenIssuanceLimiter(req, res, next);
    } else {
      return tokenIssuanceLimiter(req, res, next);
    }
  };
  // Public API endpoints
  
  // Content items
  app.get('/api/content', async (req, res) => {
    try {
      const { language = 'en', network = 'testnet', key } = req.query;
      
      if (key) {
        const item = await storage.getContentItemByKey(
          key as string, 
          language as string, 
          network as string
        );
        
        if (!item) {
          return res.status(404).json({ error: 'Content item not found' });
        }
        
        return res.json(item);
      }
      
      const items = await storage.getContentItems(
        language as string, 
        network as string
      );
      
      return res.json(items);
    } catch (error) {
      console.error('Error fetching content:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // FAQ categories and items
  app.get('/api/faq/categories', async (req, res) => {
    try {
      const { language = 'en', network = 'testnet' } = req.query;
      
      const categories = await storage.getFaqCategories(
        language as string, 
        network as string
      );
      
      return res.json(categories);
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/api/faq/items', async (req, res) => {
    try {
      const { language = 'en', network = 'testnet', category_id } = req.query;
      
      const items = await storage.getFaqItems(
        category_id ? parseInt(category_id as string) : undefined,
        language as string, 
        network as string
      );
      
      return res.json(items);
    } catch (error) {
      console.error('Error fetching FAQ items:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // App settings
  app.get('/api/settings', async (req, res) => {
    try {
      const { key } = req.query;
      
      if (key) {
        const setting = await storage.getAppSetting(key as string);
        
        if (!setting) {
          return res.status(404).json({ error: 'Setting not found' });
        }
        
        return res.json(setting);
      }
      
      const settings = await storage.getAppSettings();
      return res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // End of public API endpoints

  // Token-related API endpoints with enhanced security measures
  
  // Endpoint to verify token parameters before minting
  app.post('/api/token/validate', 
    // Standard rate limiting
    tokenRateLimiter,
    // Basic schema validation 
    validateInput(tokenMetadataSchema),
    // Enhanced security validations for economic exploits
    validateTokenParameters(),
    // Wallet-based rate limiting (in addition to IP-based)
    tokenOperationWalletLimiter(),
    // Timing monitoring for performance anomalies
    tokenOperationTimingMonitor(),
    // Prevent concurrent token operations from same wallet
    tokenConcurrentOperationGuard(),
    async (req, res) => {
      try {
        const { name, symbol, decimals, supply } = req.body;
        
        // Log verification attempt with redacted data
        console.log(`Token validation request for symbol: ${symbol}, decimals: ${decimals}`);
        
        // Check for warnings added by middleware
        const warnings = req.body._warnings || {};
        
        // Build the response
        const response = { 
          valid: true, 
          message: "Token parameters are valid", 
          fee: await storage.getAppSetting("tokenFee") || { value: "99" },
          // Add warnings if any were detected
          warnings: Object.keys(warnings).length > 0 ? warnings : undefined
        };
        
        // Log successful validation
        logSecurityEvent(
          SecurityEventType.TOKEN_OPERATION,
          `Token parameters validated successfully: ${symbol} (${name})`,
          req.ip,
          {
            walletAddress: req.body?.walletAddress,
            userAgent: req.headers['user-agent'],
            resourceType: 'token_validation',
            requestData: {
              symbol,
              decimals,
              warnings
            },
            severity: 'info',
            network: req.body.network || req.query.network as string || 'testnet',
          }
        );
        
        return res.json(response);
      } catch (error) {
        console.error('Error during token validation:', error);
        
        // Log the error
        logSecurityEvent(
          SecurityEventType.TOKEN_OPERATION,
          `Token validation error: ${error}`,
          req.ip,
          {
            walletAddress: req.body?.walletAddress,
            userAgent: req.headers['user-agent'],
            resourceType: 'token_validation',
            requestData: {
              body: req.body,
              error: String(error)
            },
            severity: 'error',
            network: req.body.network || req.query.network as string || 'testnet',
          }
        );
        
        return res.status(500).json({ 
          valid: false,
          error: 'Token validation error', 
          message: 'Could not validate token parameters',
          errorType: TokenValidationErrorType.INTERNAL_ERROR
        });
      }
    }
  );
  
  // Endpoint to record a token issuance transaction
  app.post('/api/token/issue', 
    // Network-based rate limiting (stricter for mainnet)
    networkBasedRateLimiting,
    // Basic schema validation
    validateInput(tokenTransactionSchema),
    // Front-running protection
    antiFrontrunningMiddleware(),
    // Wallet-based rate limiting
    tokenOperationWalletLimiter(),
    // Prevent concurrent token operations from same wallet
    tokenConcurrentOperationGuard(),
    // Timing monitoring
    tokenOperationTimingMonitor(),
    async (req, res) => {
      try {
        const { txHash, network, metadata } = req.body;
        const walletAddress = req.body?.walletAddress;
        
        // Log the issuance
        console.log(`Token issuance recorded: ${txHash} on ${network}`);
        
        // Check for warnings from middleware
        const warnings = req.body._warnings || {};
        
        // Record the transaction in security logs with enhanced data
        logSecurityEvent(
          SecurityEventType.TOKEN_OPERATION,
          `Token issuance transaction: ${txHash.substring(0, 10)}... on ${network}`,
          req.ip,
          {
            walletAddress: walletAddress,
            userAgent: req.headers['user-agent'],
            resourceType: 'token_issuance',
            resourceId: txHash,
            requestData: {
              network,
              metadata,
              timeDiff: warnings.timeDiff,
              warnings
            },
            severity: 'info', // Successful issuance is an info event
            network: network || 'testnet',
          }
        );
        
        // Build response
        const response = {
          success: true, 
          message: "Token issuance recorded successfully",
          txHash,
          // Add warnings if any were detected
          warnings: Object.keys(warnings).length > 0 ? warnings : undefined
        };
        
        return res.json(response);
      } catch (error) {
        console.error('Error recording token issuance:', error);
        
        // Log the error
        logSecurityEvent(
          SecurityEventType.TOKEN_OPERATION,
          `Token issuance error: ${error}`,
          req.ip,
          {
            walletAddress: req.body?.walletAddress,
            userAgent: req.headers['user-agent'],
            resourceType: 'token_issuance',
            requestData: {
              body: req.body,
              error: String(error)
            },
            severity: 'error',
            network: req.body.network || 'testnet',
          }
        );
        
        return res.status(500).json({ 
          success: false,
          error: 'Token issuance error', 
          message: 'Could not record token issuance',
          errorType: TokenValidationErrorType.INTERNAL_ERROR
        });
      }
    }
  );
  
  // Endpoint to verify transaction status
  app.get('/api/token/transaction/:txHash',
    // Standard rate limiting
    tokenRateLimiter,
    // Timing monitoring
    tokenOperationTimingMonitor(),
    async (req, res) => {
      try {
        const { txHash } = req.params;
        const { network = 'testnet', walletAddress } = req.query;
        
        // Validate transaction hash format with stricter validation
        if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
          // Log the invalid format
          logSecurityEvent(
            SecurityEventType.INVALID_INPUT,
            `Invalid transaction hash format: ${txHash}`,
            req.ip,
            {
              walletAddress: walletAddress as string,
              userAgent: req.headers['user-agent'],
              resourceType: 'transaction_check',
              resourceId: txHash,
              severity: 'warning',
              network: network as string,
            }
          );
          
          return res.status(400).json({ 
            error: 'Invalid transaction hash format',
            errorType: TokenValidationErrorType.VALIDATION_FAILURE
          });
        }
        
        // Log the request
        console.log(`Transaction status check for: ${txHash} on ${network}`);
        
        // Log the check in the security events
        logSecurityEvent(
          SecurityEventType.TOKEN_OPERATION,
          `Transaction status check: ${txHash.substring(0, 10)}... on ${network}`,
          req.ip,
          {
            walletAddress: walletAddress as string,
            userAgent: req.headers['user-agent'],
            resourceType: 'transaction_check',
            resourceId: txHash,
            severity: 'info',
            network: network as string,
          }
        );
        
        // For now we return a mock response as we don't have actual transaction checking
        // In a real implementation, this would query the blockchain
        return res.json({ 
          confirmed: true,
          confirmations: 6,
          blockNumber: 12345678,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error checking transaction status:', error);
        
        // Log the error
        logSecurityEvent(
          SecurityEventType.TOKEN_OPERATION,
          `Transaction status check error: ${error}`,
          req.ip,
          {
            walletAddress: req.query.walletAddress as string,
            userAgent: req.headers['user-agent'],
            resourceType: 'transaction_check',
            requestData: {
              params: req.params,
              query: req.query,
              error: String(error)
            },
            severity: 'error',
            network: req.query.network as string || 'testnet',
          }
        );
        
        return res.status(500).json({ 
          error: 'Transaction status check failed',
          message: 'Could not verify transaction status',
          errorType: TokenValidationErrorType.INTERNAL_ERROR
        });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
