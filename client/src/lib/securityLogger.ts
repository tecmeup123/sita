/**
 * Security Logger for client-side security event tracking
 * This handles logging security-related events in a standardized format
 * to aid in security auditing and monitoring
 */

// Define security event types for consistent logging
export enum SecurityEvent {
  // Authentication events
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  
  // Wallet-related security events
  WALLET_CONNECTED = "WALLET_CONNECTED",
  WALLET_DISCONNECTED = "WALLET_DISCONNECTED",
  UNAUTHORIZED_WALLET_ACCESS = "UNAUTHORIZED_WALLET_ACCESS",
  
  // Transaction security events
  TRANSACTION_INITIATED = "TRANSACTION_INITIATED",
  TRANSACTION_CONFIRMED = "TRANSACTION_CONFIRMED",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  
  // Token operations
  TOKEN_MINTED = "TOKEN_MINTED",
  TOKEN_TRANSFERRED = "TOKEN_TRANSFERRED",
  
  // Transaction lock events
  LOCK_ACQUIRED = "LOCK_ACQUIRED",
  LOCK_ACQUISITION_FAILED = "LOCK_ACQUISITION_FAILED",
  LOCK_RELEASED = "LOCK_RELEASED",
  
  // Input validation events
  INPUT_VALIDATION_FAILED = "INPUT_VALIDATION_FAILED",
  
  // Network-related events
  NETWORK_SWITCHED = "NETWORK_SWITCHED",
  
  // API-related events
  API_ERROR = "API_ERROR",
  RATE_LIMIT_HIT = "RATE_LIMIT_HIT",
  
  // General security events
  SECURITY_POLICY_VIOLATION = "SECURITY_POLICY_VIOLATION",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY"
}

// Type for sensitive data fields that should be redacted in logs
type SensitiveFields = {
  [key: string]: any;
}

class SecurityLogger {
  // Enable/disable security logging globally
  private enabled: boolean = true;
  
  // Store logs in memory for potential submission to a server
  private logs: SecurityLogEntry[] = [];
  
  // Maximum number of logs to keep in memory
  private maxLogsInMemory: number = 1000;
  
  constructor() {
    // Initialize any necessary setup
    this.setupUnhandledRejectionHandler();
  }
  
  /**
   * Log a security event with standardized format
   * @param event Type of security event
   * @param message Description of what happened
   * @param data Optional data related to the event (will be redacted if sensitive)
   * @param userId Optional user identifier (wallet address, etc.)
   * @param network Current network (mainnet/testnet)
   */
  public security(
    event: SecurityEvent,
    message: string,
    data?: Record<string, any>,
    userId?: string,
    network?: "mainnet" | "testnet"
  ): void {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    
    // Create standardized log entry
    const logEntry: SecurityLogEntry = {
      timestamp,
      event,
      message,
      network: network || 'unknown',
      data: data ? this.redactSensitiveData(data) : undefined,
      userId: userId || 'anonymous'
    };
    
    // Store log in memory
    this.addLogToMemory(logEntry);
    
    // Log to console with styling based on event severity
    const severity = this.getEventSeverity(event);
    
    // Color code based on severity
    let colorCode = '';
    switch (severity) {
      case 'high':
        colorCode = '\x1b[31m'; // Red
        break;
      case 'medium':
        colorCode = '\x1b[33m'; // Yellow
        break;
      case 'low':
        colorCode = '\x1b[36m'; // Cyan
        break;
      default:
        colorCode = '';
    }
    
    // Format: [SECURITY] [EventType] Message - {data}
    console.warn(
      `%c[SECURITY] [${event}] ${message}`,
      `color: ${this.getSeverityColor(severity)}; font-weight: bold;`,
      logEntry.data
    );
  }
  
  /**
   * Log validation errors as security events
   * @param fieldName Field that failed validation
   * @param value Value that was invalid
   * @param validationRule Rule that was violated
   * @param userId Optional user identifier
   */
  public validationError(
    fieldName: string,
    value: any,
    validationRule: string,
    userId?: string
  ): void {
    // For security, redact the actual value depending on the field
    const redactedValue = this.shouldRedactField(fieldName) ? '[REDACTED]' : value;
    
    const message = `Validation failed for field '${fieldName}': ${validationRule}`;
    const data = {
      field: fieldName,
      value: redactedValue,
      rule: validationRule
    };
    
    this.security(SecurityEvent.INPUT_VALIDATION_FAILED, message, data, userId);
  }
  
  /**
   * Maps event types to severity levels for visual indication
   */
  private getEventSeverity(event: SecurityEvent): 'high' | 'medium' | 'low' {
    const highSeverityEvents = [
      SecurityEvent.UNAUTHORIZED_WALLET_ACCESS,
      SecurityEvent.TRANSACTION_FAILED,
      SecurityEvent.LOCK_ACQUISITION_FAILED,
      SecurityEvent.SECURITY_POLICY_VIOLATION,
      SecurityEvent.SUSPICIOUS_ACTIVITY
    ];
    
    const mediumSeverityEvents = [
      SecurityEvent.LOGIN_FAILURE,
      SecurityEvent.INPUT_VALIDATION_FAILED,
      SecurityEvent.API_ERROR,
      SecurityEvent.RATE_LIMIT_HIT
    ];
    
    if (highSeverityEvents.includes(event)) return 'high';
    if (mediumSeverityEvents.includes(event)) return 'medium';
    return 'low';
  }
  
  /**
   * Get CSS color string based on severity
   */
  private getSeverityColor(severity: 'high' | 'medium' | 'low'): string {
    switch (severity) {
      case 'high': return '#ff3030'; // Red
      case 'medium': return '#ff9900'; // Orange
      case 'low': return '#2196f3'; // Blue
      default: return '#000000'; // Black
    }
  }
  
  /**
   * Add log to memory, respecting the maximum log count
   */
  private addLogToMemory(logEntry: SecurityLogEntry): void {
    this.logs.push(logEntry);
    
    // Trim log collection if it exceeds the max size
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }
  }
  
  /**
   * Determine if a field should be redacted based on its name
   */
  private shouldRedactField(fieldName: string): boolean {
    const sensitiveFieldPatterns = [
      'password', 'token', 'secret', 'key', 'auth', 'private', 'seed', 'mnemonic'
    ];
    
    return sensitiveFieldPatterns.some(pattern => 
      fieldName.toLowerCase().includes(pattern)
    );
  }
  
  /**
   * Redact sensitive fields from log data
   */
  private redactSensitiveData(data: Record<string, any>): Record<string, any> {
    const redactedData: Record<string, any> = {};
    
    Object.keys(data).forEach(key => {
      if (this.shouldRedactField(key)) {
        redactedData[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        redactedData[key] = this.redactSensitiveData(data[key]);
      } else {
        redactedData[key] = data[key];
      }
    });
    
    return redactedData;
  }
  
  /**
   * Setup global unhandled promise rejection handler
   */
  private setupUnhandledRejectionHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.security(
          SecurityEvent.API_ERROR,
          'Unhandled Promise Rejection',
          {
            reason: event.reason?.message || 'Unknown error',
            stack: event.reason?.stack
          }
        );
      });
    }
  }
  
  /**
   * Get all security logs (could be sent to a server)
   */
  public getLogs(): SecurityLogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Clear all stored logs
   */
  public clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Enable or disable security logging
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export a singleton instance
export const logger = new SecurityLogger();

// Type definitions
interface SecurityLogEntry {
  timestamp: string;
  event: SecurityEvent;
  message: string;
  network: string;
  userId: string;
  data?: Record<string, any>;
}

// Default export for the singleton
export default logger;