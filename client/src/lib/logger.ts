/**
 * Enhanced logging for security and debugging
 */

// Define log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SECURITY = 'security'
}

interface LogOptions {
  // Additional metadata to include with the log
  meta?: Record<string, any>;
  // Whether to also send this log to the server
  reportToServer?: boolean;
  // The level at which to log
  level?: LogLevel;
}

/**
 * Log a standard message
 */
export function logMessage(message: string, options?: LogOptions): void {
  const level = options?.level || LogLevel.INFO;
  const meta = options?.meta || {};
  
  // Format the log message
  const formattedMessage = `[${level.toUpperCase()}] ${message}`;
  
  // Log to console with appropriate styling
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage, meta);
      break;
    case LogLevel.INFO:
      console.log(formattedMessage, meta);
      break;
    case LogLevel.WARNING:
      console.warn('%c' + formattedMessage, 'color: #ff9900; font-weight: bold;', meta);
      break;
    case LogLevel.ERROR:
      console.error('%c' + formattedMessage, 'color: #ff3b30; font-weight: bold;', meta);
      break;
    case LogLevel.SECURITY:
      console.error('%c[SECURITY] ' + message, 'color: #ff2d55; font-weight: bold; background: #fff5f5; padding: 2px 4px; border-radius: 2px;', meta);
      break;
  }
  
  // Report to server if enabled
  if (options?.reportToServer) {
    reportLogToServer(level, message, meta);
  }
}

/**
 * Log a security-related message
 */
export function logSecurity(message: string, meta?: Record<string, any>): void {
  logMessage(message, { 
    level: LogLevel.SECURITY, 
    meta, 
    reportToServer: true
  });
}

/**
 * Log a warning message
 */
export function logWarning(message: string, meta?: Record<string, any>): void {
  logMessage(message, { 
    level: LogLevel.WARNING, 
    meta
  });
}

/**
 * Log an error message
 */
export function logError(message: string, meta?: Record<string, any>): void {
  logMessage(message, { 
    level: LogLevel.ERROR, 
    meta, 
    reportToServer: true
  });
  
  // Capture stack trace for errors
  if (!meta?.stack) {
    try {
      throw new Error('Stack trace');
    } catch (e) {
      const stack = e instanceof Error ? e.stack : 'No stack trace available';
      console.debug('Error stack trace:', stack);
    }
  }
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(message: string, meta?: Record<string, any>): void {
  // Only log in development mode
  if (process.env.NODE_ENV !== 'production') {
    logMessage(message, { 
      level: LogLevel.DEBUG, 
      meta
    });
  }
}

/**
 * Send logs to the server for monitoring and alerting
 */
async function reportLogToServer(
  level: LogLevel,
  message: string,
  meta?: Record<string, any>
): Promise<void> {
  try {
    // Don't send debug logs to server
    if (level === LogLevel.DEBUG) {
      return;
    }
    
    // Send security and error logs to the server
    if (level === LogLevel.SECURITY || level === LogLevel.ERROR) {
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level,
          message,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          meta
        })
      }).catch(err => {
        // Silently fail - we don't want to create an infinite loop of error logging
        console.debug('Failed to send log to server:', err);
      });
    }
  } catch (error) {
    // Silently fail
    console.debug('Error reporting log to server:', error);
  }
}

// Initialize error tracking
window.addEventListener('error', (event) => {
  logError('[UNHANDLED_ERROR] ' + new Date().toISOString() + ':', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logError('[UNHANDLED_PROMISE_REJECTION] ' + new Date().toISOString() + ':', {
    reason: event.reason
  });
});