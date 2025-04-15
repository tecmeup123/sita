import session from 'express-session';
import { Request, Response, NextFunction } from 'express';
import connectPgSimple from 'connect-pg-simple';
import csurf from 'csurf';
import { SecurityEventType, logSecurityEvent } from '../security';
import { pool } from '../db';

// Extend the session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    userIp?: string;
    created?: number;
  }
}

// One hour in milliseconds
const ONE_HOUR = 60 * 60 * 1000;

// Configuration for session expiration
const SESSION_EXPIRY = 24 * ONE_HOUR; // 24 hours
const SESSION_RENEWAL_WINDOW = 6 * ONE_HOUR; // Renew if less than 6 hours left

// Connect PostgreSQL session store
const PgSession = connectPgSimple(session);

// Create PostgreSQL session store
const pgStore = new PgSession({
  pool: pool, 
  tableName: 'user_sessions',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
});

// Configure session middleware
export const sessionMiddleware = session({
  store: pgStore,
  secret: process.env.SESSION_SECRET || 'sita-token-minter-session-secret',
  name: 'sita.session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: SESSION_EXPIRY,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

// Middleware to check if session needs to be rotated based on expiry time
export const sessionRotation = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.cookie && req.session.cookie.expires) {
    const currentTime = Date.now();
    const expiryTime = new Date(req.session.cookie.expires).getTime();
    const timeLeft = expiryTime - currentTime;
    
    // If time left is less than renewal window, extend the session
    if (timeLeft < SESSION_RENEWAL_WINDOW) {
      // Log session renewal
      logSecurityEvent(
        SecurityEventType.TOKEN_OPERATION,
        `Session rotated/renewed for user session`,
        req.ip
      );
      
      req.session.regenerate((err) => {
        if (err) {
          logSecurityEvent(
            SecurityEventType.AUTHENTICATION_FAILURE,
            `Failed to regenerate session: ${err.message}`,
            req.ip
          );
          return next(err);
        }
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
};

// Create CSRF protection middleware
export const csrfProtection = csurf({
  cookie: false, // Don't use cookies for CSRF, we have sessions
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods that don't modify state
  value: (req: Request) => {
    // Custom function to extract token from request
    // First check for token in headers, then in request body
    return req.headers['csrf-token'] as string || (req.body && req.body._csrf);
  }
});

// Error handler for CSRF errors
export const handleCsrfError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }
  
  // Log security event for CSRF failures
  logSecurityEvent(
    SecurityEventType.UNAUTHORIZED_ACCESS,
    `CSRF token validation failed for ${req.method} ${req.path}`,
    req.ip
  );
  
  // Send forbidden response
  res.status(403).json({ error: 'CSRF token validation failed' });
};

// API to expose CSRF token
export const setupCsrfRoutes = (app: any) => {
  app.get('/api/csrf-token', csrfProtection, (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken() });
  });
};

// Session security middleware to prevent session fixation and hijacking
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious IP changes within a session
  if (req.session.userIp && req.session.userIp !== req.ip) {
    logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      `Potential session hijacking detected: IP changed from ${req.session.userIp} to ${req.ip}`,
      req.ip
    );
    
    // Force session regeneration
    return req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      // Continue with a fresh session
      req.session.userIp = req.ip;
      next();
    });
  }
  
  // Store current IP in session for future comparison
  req.session.userIp = req.ip;
  
  // Prevent session fixation by regenerating the session periodically
  if (req.session.created) {
    const sessionAge = Date.now() - req.session.created;
    // Force rotation every 12 hours regardless of activity
    if (sessionAge > 12 * ONE_HOUR) {
      return req.session.regenerate((err) => {
        if (err) {
          return next(err);
        }
        req.session.created = Date.now();
        req.session.userIp = req.ip;
        next();
      });
    }
  } else {
    // Set creation time for new sessions
    req.session.created = Date.now();
  }
  
  next();
};