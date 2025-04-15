/**
 * Rate limiting middleware for API protection
 * Provides tiered and targeted rate limiting for different API operations
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { SecurityEventType, logSecurityEvent } from '../security';

/**
 * Standard rate limiter for general API endpoints
 * Allows relatively liberal access to general API functionality
 */
export const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  },
  handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
    // Log the rate limit exceeded event
    logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      `Standard rate limit exceeded for ${req.method} ${req.path}`,
      req.ip
    );
    
    // Return standard response for rate limiting
    res.status(429).json(options.message);
  }
});

/**
 * Stricter rate limiter for sensitive operations (token minting, wallet operations)
 * Applies tighter limits to protect from abuse on critical endpoints
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many sensitive operations attempted. Please try again later.'
  },
  handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
    // Log the rate limit exceeded event with higher severity
    logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      `STRICT rate limit exceeded for sensitive operation: ${req.method} ${req.path}`,
      req.ip
    );
    
    // Return standard response for rate limiting
    res.status(429).json(options.message);
  }
});

/**
 * Very strict rate limiter for security-critical operations
 * Used for extremely sensitive operations like security setting changes
 */
export const securityCriticalRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 requests per day
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many security-critical operations attempted. Please try again tomorrow.'
  },
  handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
    // Log the security critical rate limit exceeded event
    logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      `SECURITY CRITICAL rate limit exceeded: ${req.method} ${req.path}`,
      req.ip
    );
    
    // Return standard response for rate limiting
    res.status(429).json(options.message);
  }
});

/**
 * Create a rate limiter that operates on specific paths
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum number of requests in the window
 * @param message Custom message to return
 * @returns A configured rate limiter
 */
export const createPathRateLimit = (
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 30,
  message: string = 'Too many requests for this resource. Please try again later.'
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message
    },
    handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
      logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        `Path-specific rate limit exceeded for ${req.method} ${req.path}`,
        req.ip
      );
      
      res.status(429).json(options.message);
    }
  });
};

/**
 * Dynamic rate limiter based on user authentication status
 * Allows more requests for authenticated users
 */
export const authAwareRateLimit = (
  reqToAuth: (req: Request) => boolean,  // Function to determine if request is authenticated
  defaultMax: number = 30,               // Limit for unauthenticated users
  authenticatedMax: number = 100         // Higher limit for authenticated users
) => {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Apply different rate limits based on authentication status
      return reqToAuth(req) ? authenticatedMax : defaultMax;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Rate limit exceeded. Please try again later.'
    },
    handler: (req: Request, res: Response, _next: NextFunction, options: any) => {
      const authStatus = reqToAuth(req) ? 'authenticated' : 'unauthenticated';
      
      logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        `Auth-aware rate limit exceeded for ${authStatus} user: ${req.method} ${req.path}`,
        req.ip
      );
      
      res.status(429).json(options.message);
    }
  });
  
  return limiter;
};

/**
 * Apply appropriate rate limiters to different API routes
 * @param app Express application
 */
export const configureRateLimits = (app: any) => {
  // Apply standard rate limiting to all API routes as a baseline
  app.use('/api/', standardRateLimit);
  
  // Apply strict rate limiting to sensitive token operations
  app.use('/api/token', strictRateLimit);
  
  // Apply security-critical rate limiting to wallet and security-related endpoints
  app.use('/api/wallet', strictRateLimit);
  
  // Path-specific rate limits for other endpoints
  app.use('/api/content', createPathRateLimit(15 * 60 * 1000, 50, 'Too many content requests.'));
  app.use('/api/faq', createPathRateLimit(30 * 60 * 1000, 100, 'Too many FAQ requests.'));
};