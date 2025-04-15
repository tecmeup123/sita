/**
 * Types for enhanced token security
 */

export enum TokenValidationErrorType {
  // Economic security errors
  SUPPLY_OVERFLOW = "SUPPLY_OVERFLOW",
  SUSPICIOUS_DECIMALS = "SUSPICIOUS_DECIMALS",
  UNREASONABLE_VALUES = "UNREASONABLE_VALUES",
  
  // Spoofing errors
  NAME_SPOOFING = "NAME_SPOOFING",
  SYMBOL_SPOOFING = "SYMBOL_SPOOFING",
  
  // Transaction security
  FRONTRUNNING_RISK = "FRONTRUNNING_RISK",
  REPLAY_ATTACK = "REPLAY_ATTACK",
  TIMESTAMP_MANIPULATION = "TIMESTAMP_MANIPULATION",
  
  // Rate limiting
  RATE_LIMIT = "RATE_LIMIT",
  CONCURRENT_OPERATIONS = "CONCURRENT_OPERATIONS",
  
  // System errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_FAILURE = "VALIDATION_FAILURE"
}

export interface TokenValidationError {
  type: TokenValidationErrorType;
  message: string;
  details?: any;
  remediation?: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  fee?: any;
  errors?: TokenValidationError[];
  warnings?: TokenValidationError[];
  message?: string;
}

export interface TokenTransactionValidationResponse {
  valid: boolean;
  txHash?: string;
  errors?: TokenValidationError[];
  warnings?: TokenValidationError[];
  message?: string;
}

/**
 * Lock state to prevent concurrent token operations from the same wallet
 * This helps prevent double-spending and frontrunning attacks
 */
export interface TokenOperationLock {
  walletAddress: string;
  operationType: 'validation' | 'issuance' | 'transaction';
  acquired: number; // Timestamp when the lock was acquired
  expires: number; // Timestamp when the lock expires
  validated: boolean; // Whether the operation has been validated
}

/**
 * Security enhancement to protect against simultaneous token operations
 * across different sessions but same wallet
 */
export class TokenOperationLockManager {
  private static locks: Map<string, TokenOperationLock> = new Map();
  private static readonly LOCK_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes
  
  /**
   * Acquire a lock for a token operation 
   * @param walletAddress The wallet performing the operation
   * @param operationType The type of operation
   * @returns true if lock was acquired, false if already locked
   */
  public static acquireLock(walletAddress: string, operationType: 'validation' | 'issuance' | 'transaction'): boolean {
    const now = Date.now();
    const key = `${walletAddress}:${operationType}`;
    
    // Check if lock exists and is still valid
    const existingLock = this.locks.get(key);
    if (existingLock && existingLock.expires > now) {
      // Lock exists and has not expired
      return false;
    }
    
    // Create new lock
    const lock: TokenOperationLock = {
      walletAddress,
      operationType,
      acquired: now,
      expires: now + this.LOCK_EXPIRY_MS,
      validated: false
    };
    
    this.locks.set(key, lock);
    return true;
  }
  
  /**
   * Release a lock for a token operation
   */
  public static releaseLock(walletAddress: string, operationType: 'validation' | 'issuance' | 'transaction'): boolean {
    const key = `${walletAddress}:${operationType}`;
    return this.locks.delete(key);
  }
  
  /**
   * Mark a lock as validated
   */
  public static markValidated(walletAddress: string, operationType: 'validation' | 'issuance' | 'transaction'): boolean {
    const key = `${walletAddress}:${operationType}`;
    const lock = this.locks.get(key);
    
    if (lock) {
      lock.validated = true;
      this.locks.set(key, lock);
      return true;
    }
    
    return false;
  }
  
  /**
   * Clean up expired locks (to be called periodically)
   */
  public static cleanupExpiredLocks(): void {
    const now = Date.now();
    
    // Use Array.from to avoid iterator issues with Map.entries()
    Array.from(this.locks.keys()).forEach(key => {
      const lock = this.locks.get(key);
      if (lock && lock.expires <= now) {
        this.locks.delete(key);
      }
    });
  }
}

// Set up a periodic cleanup every minute
setInterval(() => {
  TokenOperationLockManager.cleanupExpiredLocks();
}, 60 * 1000);