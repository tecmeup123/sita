import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { SecurityEventType, logSecurityEvent } from "./security";
import { 
  sessionMiddleware, 
  sessionRotation, 
  csrfProtection, 
  handleCsrfError,
  setupCsrfRoutes, 
  sessionSecurity 
} from "./middleware/session";
import { 
  standardRateLimit, 
  strictRateLimit, 
  configureRateLimits 
} from "./middleware/rateLimit";
import {
  securityHeaders,
  phishingProtection,
  maliciousExtensionDetection
} from "./middleware/securityHeaders";

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = reason instanceof Error ? reason.stack || reason.message : String(reason);
  log(`CRITICAL: Unhandled Promise Rejection at: ${new Date().toISOString()}`, "error");
  log(`Reason: ${errorMessage}`, "error");
  
  // Log as security event if it appears to be related to sensitive operations
  const errorString = String(errorMessage).toLowerCase();
  if (
    errorString.includes('token') || 
    errorString.includes('wallet') || 
    errorString.includes('transaction') ||
    errorString.includes('auth') ||
    errorString.includes('sign')
  ) {
    logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      `Unhandled Promise Rejection potentially related to sensitive operation: ${errorString.substring(0, 100)}...`
    );
  }
  
  // Don't exit process in production, but log thoroughly
  console.error('Unhandled Promise Rejection:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  log(`CRITICAL: Uncaught Exception at: ${new Date().toISOString()}`, "error");
  log(`Error: ${error.stack || error.message}`, "error");
  
  // Log critical exceptions as security events
  logSecurityEvent(
    SecurityEventType.SUSPICIOUS_ACTIVITY,
    `Uncaught Exception: ${error.message}`
  );
  
  // In production, we should keep the server running if possible
  console.error('Uncaught Exception:', error);
});

const app = express();

// Trust proxy for correct IP resolution behind Replit's proxy
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add enhanced security middleware
// Apply comprehensive security headers
app.use(securityHeaders());

// Add phishing protection middleware
app.use(phishingProtection());

// Add malicious extension detection
app.use(maliciousExtensionDetection());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Apply configured rate limiting to API routes
configureRateLimits(app);

// Apply session management middleware
app.use(sessionMiddleware);

// Apply session security middleware to protect against session fixation and hijacking
app.use(sessionSecurity);

// Check for session rotation needs (extend session if close to expiry)
app.use(sessionRotation);

// Apply CSRF protection for all non-GET requests
app.use(csrfProtection);

// Handle CSRF errors
app.use(handleCsrfError);

// Setup CSRF token API endpoint
setupCsrfRoutes(app);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error properly instead of throwing (which could crash the server)
    const errorStack = err.stack || '';
    log(`API Error: ${status} ${message}`, "error");
    
    if (errorStack) {
      log(`Error Stack: ${errorStack}`, "error");
    }
    
    // Check if security-related error
    if (
      status === 401 || 
      status === 403 || 
      message.toLowerCase().includes('auth') || 
      message.toLowerCase().includes('permission') ||
      message.toLowerCase().includes('token')
    ) {
      logSecurityEvent(
        SecurityEventType.AUTHENTICATION_FAILURE,
        `Authentication/Authorization error: ${message}`,
        _req.ip
      );
    }

    // Only send response if it hasn't been sent already
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
