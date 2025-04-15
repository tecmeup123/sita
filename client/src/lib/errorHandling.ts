/**
 * Error handling utilities for standardized error processing
 */
import { logger, SecurityEvent } from './securityLogger';

// Define standard error types for consistent handling
export enum ErrorType {
  // User input errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  
  // Network-related errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Wallet-related errors
  WALLET_CONNECTION_ERROR = 'WALLET_CONNECTION_ERROR',
  WALLET_SIGNATURE_ERROR = 'WALLET_SIGNATURE_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNAUTHORIZED_WALLET = 'UNAUTHORIZED_WALLET',
  
  // Transaction errors
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  TRANSACTION_LOCK_ERROR = 'TRANSACTION_LOCK_ERROR',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  
  // Token-related errors
  TOKEN_CREATION_ERROR = 'TOKEN_CREATION_ERROR',
  TOKEN_TRANSFER_ERROR = 'TOKEN_TRANSFER_ERROR',
  
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Interface for standardized error objects
export interface StandardError {
  type: ErrorType;
  message: string;
  code?: number;
  details?: string;
  suggestion?: string;
  originalError?: any;
}

/**
 * Error factory function
 * Creates standardized error objects with consistent structure
 */
export function createError(
  type: ErrorType,
  message: string,
  options?: {
    code?: number;
    details?: string;
    suggestion?: string;
    originalError?: any;
  }
): StandardError {
  // Log this error to the security logger if it's security-related
  const securityRelatedTypes = [
    ErrorType.UNAUTHORIZED_WALLET,
    ErrorType.TRANSACTION_LOCK_ERROR,
    ErrorType.WALLET_SIGNATURE_ERROR
  ];
  
  if (securityRelatedTypes.includes(type)) {
    const eventType = 
      type === ErrorType.UNAUTHORIZED_WALLET
        ? SecurityEvent.UNAUTHORIZED_WALLET_ACCESS
        : type === ErrorType.TRANSACTION_LOCK_ERROR
          ? SecurityEvent.LOCK_ACQUISITION_FAILED
          : SecurityEvent.TRANSACTION_FAILED;
    
    logger.security(
      eventType,
      message,
      {
        errorType: type,
        details: options?.details,
        originalError: options?.originalError instanceof Error 
          ? options.originalError.message
          : options?.originalError
      }
    );
  }
  
  return {
    type,
    message,
    code: options?.code,
    details: options?.details,
    suggestion: options?.suggestion || getDefaultSuggestion(type),
    originalError: options?.originalError
  };
}

/**
 * Get a user-friendly suggestion based on error type
 */
function getDefaultSuggestion(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    
    case ErrorType.INVALID_PARAMETER:
      return 'One or more parameters are invalid. Please review and correct.';
    
    case ErrorType.NETWORK_ERROR:
      return 'Please check your internet connection and try again.';
    
    case ErrorType.API_ERROR:
      return 'There was an error communicating with the server. Please try again later.';
    
    case ErrorType.TIMEOUT_ERROR:
      return 'The request timed out. Please try again later when the network is less congested.';
    
    case ErrorType.WALLET_CONNECTION_ERROR:
      return 'Unable to connect to your wallet. Please ensure your wallet is unlocked and try again.';
    
    case ErrorType.WALLET_SIGNATURE_ERROR:
      return 'Failed to sign transaction. Please try again or use a different wallet.';
    
    case ErrorType.INSUFFICIENT_FUNDS:
      return 'You don\'t have enough CKB to complete this transaction. Please add more CKB to your wallet.';
    
    case ErrorType.UNAUTHORIZED_WALLET:
      return 'This wallet is not authorized for this operation. Please use an authorized wallet.';
    
    case ErrorType.TRANSACTION_ERROR:
      return 'There was an error processing your transaction. Please try again.';
    
    case ErrorType.TRANSACTION_LOCK_ERROR:
      return 'Another transaction is in progress. Please wait and try again.';
    
    case ErrorType.TRANSACTION_REJECTED:
      return 'Transaction was rejected. Please check your wallet and try again.';
    
    case ErrorType.TOKEN_CREATION_ERROR:
      return 'Failed to create token. Please check your inputs and try again.';
    
    case ErrorType.TOKEN_TRANSFER_ERROR:
      return 'Failed to transfer tokens. Please try again later.';
    
    case ErrorType.INTERNAL_ERROR:
      return 'An internal error occurred. Our team has been notified and is working on a solution.';
    
    case ErrorType.UNKNOWN_ERROR:
    default:
      return 'An unexpected error occurred. Please try again later or contact support.';
  }
}

/**
 * Parse error from any source into a standardized error object
 */
export function parseError(error: any): StandardError {
  // If it's already a StandardError, return it
  if (error && error.type && Object.values(ErrorType).includes(error.type)) {
    return error as StandardError;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return createError(ErrorType.NETWORK_ERROR, 'Network connection error', {
        details: error.message,
        originalError: error
      });
    }
    
    // Timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return createError(ErrorType.TIMEOUT_ERROR, 'Request timed out', {
        details: error.message,
        originalError: error
      });
    }
    
    // API errors
    if (error.name === 'ApiError' || error.message.includes('API')) {
      return createError(ErrorType.API_ERROR, 'API error', {
        details: error.message,
        originalError: error
      });
    }
    
    // For all other Error objects
    return createError(ErrorType.UNKNOWN_ERROR, error.message, {
      details: error.stack,
      originalError: error
    });
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    // Wallet errors
    if (error.includes('wallet') || error.includes('signature')) {
      return createError(
        error.includes('signature') 
          ? ErrorType.WALLET_SIGNATURE_ERROR 
          : ErrorType.WALLET_CONNECTION_ERROR,
        error
      );
    }
    
    // Transaction errors
    if (error.includes('transaction') || error.includes('tx')) {
      return createError(ErrorType.TRANSACTION_ERROR, error);
    }
    
    // Network errors
    if (error.includes('network') || error.includes('connection')) {
      return createError(ErrorType.NETWORK_ERROR, error);
    }
    
    // Fallback for string errors
    return createError(ErrorType.UNKNOWN_ERROR, error);
  }
  
  // Handle other object types
  if (error && typeof error === 'object') {
    const message = error.message || error.error || 'Unknown error';
    let errorType = ErrorType.UNKNOWN_ERROR;
    
    // Try to infer the error type from the message
    if (message.includes('validation') || message.includes('invalid')) {
      errorType = ErrorType.VALIDATION_ERROR;
    } else if (message.includes('wallet')) {
      errorType = ErrorType.WALLET_CONNECTION_ERROR;
    } else if (message.includes('transaction')) {
      errorType = ErrorType.TRANSACTION_ERROR;
    } else if (message.includes('network') || message.includes('connection')) {
      errorType = ErrorType.NETWORK_ERROR;
    }
    
    return createError(errorType, message, {
      details: JSON.stringify(error),
      originalError: error
    });
  }
  
  // Default for any other type
  return createError(
    ErrorType.UNKNOWN_ERROR,
    'An unknown error occurred',
    { originalError: error }
  );
}

/**
 * Validate token creation parameters
 * Returns an array of errors, empty if validation passes
 */
export function validateTokenParameters(params: {
  name?: string;
  symbol?: string;
  amount?: string | number;
  decimals?: string | number;
}): StandardError[] {
  const errors: StandardError[] = [];
  
  // Validate token name
  if (!params.name || typeof params.name !== 'string') {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token name is required',
      {
        code: 400,
        details: 'Token name must be provided as a string',
        suggestion: 'Please enter a token name between 1-30 characters'
      }
    ));
  } else if (params.name.length < 1 || params.name.length > 30) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token name must be between 1 and 30 characters',
      {
        code: 400,
        details: `Provided name "${params.name}" has ${params.name.length} characters`,
        suggestion: 'Please enter a token name between 1-30 characters'
      }
    ));
  } else if (!/^[a-zA-Z0-9 ]+$/.test(params.name)) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token name contains invalid characters',
      {
        code: 400,
        details: 'Token name should only contain letters, numbers, and spaces',
        suggestion: 'Please use only letters, numbers, and spaces in your token name'
      }
    ));
  }
  
  // Validate token symbol
  if (!params.symbol || typeof params.symbol !== 'string') {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token symbol is required',
      {
        code: 400,
        details: 'Token symbol must be provided as a string',
        suggestion: 'Please enter a token symbol between 2-8 characters'
      }
    ));
  } else if (params.symbol.length < 2 || params.symbol.length > 8) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token symbol must be between 2 and 8 characters',
      {
        code: 400,
        details: `Provided symbol "${params.symbol}" has ${params.symbol.length} characters`,
        suggestion: 'Please enter a token symbol between 2-8 characters'
      }
    ));
  } else if (!/^[a-zA-Z0-9]+$/.test(params.symbol)) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token symbol contains invalid characters',
      {
        code: 400,
        details: 'Token symbol should only contain letters and numbers, no spaces or special characters',
        suggestion: 'Please use only letters and numbers in your token symbol'
      }
    ));
  }
  
  // Validate amount
  const amount = typeof params.amount === 'string' 
    ? parseFloat(params.amount) 
    : params.amount;
    
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token amount is required and must be a number',
      {
        code: 400,
        details: 'Token amount must be provided as a number',
        suggestion: 'Please enter a positive number for the token amount'
      }
    ));
  } else if (amount <= 0) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token amount must be greater than zero',
      {
        code: 400,
        details: `Provided amount "${amount}" is not positive`,
        suggestion: 'Please enter a positive number for the token amount'
      }
    ));
  } else if (!Number.isFinite(amount)) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token amount is too large',
      {
        code: 400,
        details: 'Token amount must be a finite number',
        suggestion: 'Please enter a smaller number for the token amount'
      }
    ));
  }
  
  // Validate decimals
  const decimals = typeof params.decimals === 'string' 
    ? parseInt(params.decimals, 10) 
    : params.decimals;
    
  if (decimals === undefined || decimals === null || isNaN(Number(decimals))) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token decimals is required and must be a number',
      {
        code: 400,
        details: 'Token decimals must be provided as a number',
        suggestion: 'Please enter a number between 0 and 18 for token decimals'
      }
    ));
  } else if (!Number.isInteger(decimals)) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token decimals must be an integer',
      {
        code: 400,
        details: `Provided decimals "${decimals}" is not an integer`,
        suggestion: 'Please enter a whole number for token decimals'
      }
    ));
  } else if (decimals < 0 || decimals > 18) {
    errors.push(createError(
      ErrorType.VALIDATION_ERROR,
      'Token decimals must be between 0 and 18',
      {
        code: 400,
        details: `Provided decimals "${decimals}" is out of range`,
        suggestion: 'Please enter a number between 0 and 18 for token decimals'
      }
    ));
  }
  
  return errors;
}

/**
 * Format error for display in UI
 * Returns a user-friendly error message
 */
export function formatErrorForDisplay(error: any): string {
  const standardError = parseError(error);
  
  // Start with the error message
  let displayMessage = standardError.message;
  
  // Add the suggestion if available
  if (standardError.suggestion) {
    displayMessage += ' ' + standardError.suggestion;
  }
  
  return displayMessage;
}

/**
 * Handle errors with standardized approach
 * Logs the error, formats it, and returns it for display
 */
export function handleError(error: any): StandardError {
  const standardError = parseError(error);
  
  // Log to console
  console.error('Error:', standardError.type, standardError.message, standardError);
  
  return standardError;
}

export default {
  createError,
  parseError,
  validateTokenParameters,
  formatErrorForDisplay,
  handleError,
  ErrorType
};