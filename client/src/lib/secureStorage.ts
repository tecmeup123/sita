/**
 * Secure Storage Utility
 * 
 * This module provides a secure way to store sensitive data in the browser's localStorage
 * with encryption, TTL (time-to-live), and automatic cleanup.
 * 
 * Features:
 * - Encryption of stored values
 * - Time-based expiration
 * - Tamper detection
 * - Automatic cleanup of expired items
 * - Type-safe access
 */

// Encryption key (in real scenarios, this would be derived from a more secure source)
const ENCRYPTION_KEY = 'sita-minter-secure-storage-key';

// StorageItem interface defines the structure of items stored in secure storage
interface StorageItem<T> {
  value: T;           // The encrypted value
  expiry: number;     // Timestamp when this item expires
  hash: string;       // Hash for tamper detection
  createdAt: number;  // When the item was created
}

/**
 * Encrypt a string value
 * Note: This is a simple encryption for demo purposes.
 * In production, use a proper encryption library.
 */
const encrypt = (value: string, key: string): string => {
  try {
    // Simple XOR-based encryption for demo purposes
    let result = '';
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode the result
  } catch (error) {
    console.warn('Encryption failed in secure storage');
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt an encrypted string value
 */
const decrypt = (encrypted: string, key: string): string => {
  try {
    const decoded = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.warn('Decryption failed in secure storage - possible tampering');
    throw new Error('Decryption failed - data may have been tampered with');
  }
};

/**
 * Generate a simple hash for tamper detection
 */
const generateHash = (value: string, timestamp: number): string => {
  const combined = `${value}-${timestamp}-${ENCRYPTION_KEY}`;
  // Simple hash function for demo purposes
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

/**
 * Verify hash for tamper detection
 */
const verifyHash = (hash: string, value: string, timestamp: number): boolean => {
  const expectedHash = generateHash(value, timestamp);
  return hash === expectedHash;
};

/**
 * SecureStorage class provides a secure interface to localStorage
 */
export class SecureStorage {
  private prefix: string;
  private defaultTTL: number;
  
  /**
   * Create a new SecureStorage instance
   * @param prefix Prefix for all storage keys to prevent collisions
   * @param defaultTTL Default time-to-live in milliseconds (default: 24 hours)
   */
  constructor(prefix: string = 'sita-secure-', defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
    
    // Run cleanup on initialization
    this.cleanup();
    
    // Set up periodic cleanup
    if (typeof window !== 'undefined') {
      // Run cleanup every hour
      setInterval(() => this.cleanup(), 60 * 60 * 1000); 
    }
  }
  
  /**
   * Store a value securely
   * @param key Storage key
   * @param value Value to store
   * @param ttl Time-to-live in milliseconds (optional)
   */
  setItem<T>(key: string, value: T, ttl?: number): void {
    try {
      const storageKey = this.prefix + key;
      const now = Date.now();
      const expiryTime = now + (ttl || this.defaultTTL);
      
      // Convert value to string
      const valueStr = JSON.stringify(value);
      
      // Encrypt the value
      const encryptedValue = encrypt(valueStr, ENCRYPTION_KEY);
      
      // Generate hash for tamper detection
      const hash = generateHash(valueStr, expiryTime);
      
      // Create storage item
      const item: StorageItem<string> = {
        value: encryptedValue,
        expiry: expiryTime,
        hash,
        createdAt: now
      };
      
      // Store in localStorage
      localStorage.setItem(storageKey, JSON.stringify(item));
    } catch (error) {
      console.warn(`Failed to securely store item with key: ${key}`);
      throw new Error(`Failed to store value for key: ${key}`);
    }
  }
  
  /**
   * Retrieve a value securely
   * @param key Storage key
   * @returns The stored value or null if not found or expired
   */
  getItem<T>(key: string): T | null {
    try {
      const storageKey = this.prefix + key;
      const itemStr = localStorage.getItem(storageKey);
      
      if (!itemStr) return null;
      
      // Parse the storage item
      const item: StorageItem<string> = JSON.parse(itemStr);
      
      // Check if expired
      if (item.expiry < Date.now()) {
        this.removeItem(key);
        return null;
      }
      
      // Decrypt the value
      const decryptedValue = decrypt(item.value, ENCRYPTION_KEY);
      
      // Verify hash for tamper detection
      if (!verifyHash(item.hash, decryptedValue, item.expiry)) {
        console.warn(`Tampered storage detected for key: ${key}`);
        this.removeItem(key);
        throw new Error('Storage tampered - data has been cleared');
      }
      
      // Parse the decrypted value
      return JSON.parse(decryptedValue) as T;
    } catch (error) {
      console.warn(`Error retrieving secure storage for key: ${key}`);
      return null;
    }
  }
  
  /**
   * Remove an item from storage
   * @param key Storage key
   */
  removeItem(key: string): void {
    const storageKey = this.prefix + key;
    localStorage.removeItem(storageKey);
  }
  
  /**
   * Clear all items managed by this SecureStorage instance
   */
  clear(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
  
  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    try {
      const keysToRemove: string[] = [];
      const now = Date.now();
      
      // Find all expired items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          try {
            const itemStr = localStorage.getItem(key);
            if (itemStr) {
              const item: StorageItem<any> = JSON.parse(itemStr);
              if (item.expiry < now) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // If we can't parse it, remove it
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove expired items
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      if (keysToRemove.length > 0) {
        console.info(`Cleaned up ${keysToRemove.length} expired items from secure storage`);
      }
    } catch (error) {
      console.error('Error cleaning up secure storage:', error);
    }
  }
  
  /**
   * Update the expiry time for an item
   * @param key Storage key
   * @param ttl New time-to-live in milliseconds
   * @returns true if successful, false if item not found
   */
  updateExpiry(key: string, ttl: number): boolean {
    try {
      const storageKey = this.prefix + key;
      const itemStr = localStorage.getItem(storageKey);
      
      if (!itemStr) return false;
      
      // Parse the storage item
      const item: StorageItem<string> = JSON.parse(itemStr);
      
      // If already expired, return false
      if (item.expiry < Date.now()) {
        this.removeItem(key);
        return false;
      }
      
      // Update expiry
      const newExpiry = Date.now() + ttl;
      
      // Decrypt the original value to recalculate hash
      const decryptedValue = decrypt(item.value, ENCRYPTION_KEY);
      
      // Update hash and expiry
      item.hash = generateHash(decryptedValue, newExpiry);
      item.expiry = newExpiry;
      
      // Store updated item
      localStorage.setItem(storageKey, JSON.stringify(item));
      
      return true;
    } catch (error) {
      console.warn(`Error updating expiry for key: ${key}`);
      return false;
    }
  }
}

// Export a singleton instance for general use
export const secureStorage = new SecureStorage();

// Export storage keys for type safety
export enum SecureStorageKeys {
  NETWORK_PREFERENCE = 'network-preference',
  SESSION_DATA = 'session-data',
  WALLET_CONNECTION = 'wallet-connection',
  RECENT_TOKENS = 'recent-tokens',
  TOKEN_ISSUING_SETTINGS = 'token-issuing-settings',
  LAST_CONNECTED_WALLET = 'last-connected-wallet'
}

// Utility for working with typed storage
export const typedStorage = {
  /**
   * Get a typed item from secure storage
   */
  get<T>(key: SecureStorageKeys): T | null {
    return secureStorage.getItem<T>(key);
  },
  
  /**
   * Set a typed item in secure storage
   */
  set<T>(key: SecureStorageKeys, value: T, ttl?: number): void {
    secureStorage.setItem<T>(key, value, ttl);
  },
  
  /**
   * Remove a typed item from secure storage
   */
  remove(key: SecureStorageKeys): void {
    secureStorage.removeItem(key);
  }
};