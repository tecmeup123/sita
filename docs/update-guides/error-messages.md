# SiTa Minter Error Messages Guide

This guide provides instructions for updating error messages and notifications throughout the SiTa Minter application, ensuring they are consistent across all supported languages.

## Table of Contents

1. [Introduction](#introduction)
2. [Error Message Files](#error-message-files)
3. [Error Categories](#error-categories)
4. [Adding or Updating Error Messages](#adding-or-updating-error-messages)
5. [Multilingual Error Messages](#multilingual-error-messages)
6. [Error Display Components](#error-display-components)
7. [Testing Error Messages](#testing-error-messages)
8. [Best Practices](#best-practices)

## Introduction

Clear and informative error messages are crucial for a good user experience. This guide explains how to update and maintain error messages in the SiTa Minter application across all supported languages.

## Error Message Files

Error messages are primarily managed in these files:

- `client/src/lib/errors.ts` - Core error definitions and handling
- `client/src/locales/[language-code]/errors.ts` - Language-specific error messages
- `client/src/components/ErrorBoundary.tsx` - Global error handling component
- `client/src/hooks/use-notifications.ts` - Toast notification system for errors

## Error Categories

SiTa Minter categorizes errors into these main groups:

### 1. Wallet Connection Errors

Errors related to connecting and interacting with wallets:

```typescript
// Example from errors.ts
export const WALLET_ERRORS = {
  CONNECTION_FAILED: 'wallet_connection_failed',
  REJECTED: 'wallet_request_rejected',
  TIMEOUT: 'wallet_connection_timeout',
  DISCONNECTED: 'wallet_disconnected',
  UNSUPPORTED_NETWORK: 'wallet_unsupported_network',
  INSUFFICIENT_BALANCE: 'wallet_insufficient_balance'
};
```

### 2. Transaction Errors

Errors related to blockchain transactions:

```typescript
export const TRANSACTION_ERRORS = {
  CREATION_FAILED: 'transaction_creation_failed',
  SUBMISSION_FAILED: 'transaction_submission_failed',
  REJECTED: 'transaction_rejected',
  TIMEOUT: 'transaction_timeout',
  VALIDATION_FAILED: 'transaction_validation_failed'
};
```

### 3. Network Errors

Errors related to blockchain network connectivity:

```typescript
export const NETWORK_ERRORS = {
  CONNECTION_FAILED: 'network_connection_failed',
  INVALID_RESPONSE: 'network_invalid_response',
  TIMEOUT: 'network_timeout',
  UNSUPPORTED: 'network_unsupported'
};
```

### 4. Form Validation Errors

Errors for form input validation:

```typescript
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'validation_required_field',
  INVALID_FORMAT: 'validation_invalid_format',
  MIN_VALUE: 'validation_min_value',
  MAX_VALUE: 'validation_max_value',
  DUPLICATE_NAME: 'validation_duplicate_name'
};
```

### 5. Server Errors

Errors from server responses:

```typescript
export const SERVER_ERRORS = {
  INTERNAL_ERROR: 'server_internal_error',
  RATE_LIMITED: 'server_rate_limited',
  MAINTENANCE: 'server_maintenance',
  UNAUTHORIZED: 'server_unauthorized',
  BAD_REQUEST: 'server_bad_request'
};
```

## Adding or Updating Error Messages

### Adding a New Error Type

To add a new error type:

1. Add the error code to the appropriate category in `errors.ts`:

```typescript
export const WALLET_ERRORS = {
  // Existing errors...
  NEW_ERROR_TYPE: 'wallet_new_error_type'
};
```

2. Add the error message for each supported language.

### Updating Existing Error Messages

To update an existing error message, modify the message text in each language file:

```typescript
// In client/src/locales/en/errors.ts
export const ERROR_MESSAGES = {
  // Other errors...
  wallet_connection_failed: 'Failed to connect to your wallet. Please try again.',
  // Update this message:
  wallet_request_rejected: 'You declined the connection request. Please approve the request in your wallet to continue.'
};
```

## Multilingual Error Messages

SiTa Minter supports multiple languages for error messages. When adding or updating errors, ensure all languages are updated:

### English (en)

```typescript
// In client/src/locales/en/errors.ts
export const ERROR_MESSAGES = {
  wallet_connection_failed: 'Failed to connect to your wallet. Please try again.',
  // Other error messages...
};
```

### Chinese (zh)

```typescript
// In client/src/locales/zh/errors.ts
export const ERROR_MESSAGES = {
  wallet_connection_failed: '无法连接到你的钱包。请重试。',
  // Other error messages...
};
```

### Spanish (es)

```typescript
// In client/src/locales/es/errors.ts
export const ERROR_MESSAGES = {
  wallet_connection_failed: 'Error al conectar con tu billetera. Por favor, inténtalo de nuevo.',
  // Other error messages...
};
```

Repeat this process for all supported languages:
- Portuguese (pt)
- French (fr)
- Italian (it)

## Error Display Components

SiTa Minter uses several components to display errors to users:

### Toast Notifications

For temporary error notifications:

```typescript
// Example usage in a component
import { useNotifications } from '@/hooks/use-notifications';

const { showError } = useNotifications();

// Show error toast
showError('wallet_connection_failed');

// With parameters
showError('validation_min_value', { value: '100' });
```

To update the toast notification styling, modify the `ErrorToast` component.

### Inline Error Messages

For form validation errors:

```tsx
// Example in a form component
<FormField
  name="tokenAmount"
  render={({ field, fieldState }) => (
    <>
      <FormItem>
        <FormLabel>Amount</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        {fieldState.error && (
          <FormMessage>{getErrorMessage(fieldState.error.message)}</FormMessage>
        )}
      </FormItem>
    </>
  )}
/>
```

### Error Screens

For critical errors that prevent application functionality:

```tsx
// Example of an error screen component
import { ErrorScreen } from '@/components/ErrorScreen';

// In a component
if (criticalError) {
  return <ErrorScreen errorCode="server_internal_error" />;
}
```

## Testing Error Messages

When updating error messages, test all error scenarios:

1. **Validation Error Testing**:
   - Submit forms with invalid data
   - Check that appropriate error messages appear
   - Verify messages are displayed in the correct language

2. **Wallet Error Testing**:
   - Disconnect wallet during operations
   - Reject wallet requests
   - Test with insufficient balance

3. **Network Error Testing**:
   - Test with network disconnection
   - Test with slow connections

4. **Multilingual Testing**:
   - Switch between languages and verify all error messages are translated
   - Check for proper text wrapping and layout in all languages

## Best Practices

### For Error Message Content

1. **Be Specific**: Clearly explain what went wrong
2. **Be Actionable**: Tell users what they can do to fix the issue
3. **Be Concise**: Keep messages brief and to the point
4. **Be User-Friendly**: Avoid technical jargon
5. **Be Consistent**: Use consistent terminology and tone

### Example Structure

A good error message typically includes:

1. **What happened**: "Failed to connect to your wallet"
2. **Why it happened** (if relevant): "The connection request was declined"
3. **How to fix it**: "Please approve the request in your wallet to continue"

### Formatting with Parameters

For dynamic error messages, use parameter placeholders:

```typescript
// In client/src/locales/en/errors.ts
export const ERROR_MESSAGES = {
  validation_min_value: 'Value must be at least {{value}}',
  transaction_timeout: 'Transaction timed out after {{seconds}} seconds'
};

// Usage
getErrorMessage('validation_min_value', { value: '100' });
// "Value must be at least 100"
```

## Error Internationalization Function

The core function for retrieving localized error messages:

```typescript
// In client/src/lib/errors.ts
export function getErrorMessage(errorCode: string, params?: Record<string, string>) {
  const { language } = useLanguage();
  let message = ERROR_MESSAGES[language][errorCode] || ERROR_MESSAGES.en[errorCode] || 'An unknown error occurred';
  
  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{{${key}}}`, value);
    });
  }
  
  return message;
}
```

## Conclusion

Maintaining clear, helpful, and consistent error messages across all supported languages is essential for a good user experience. Regularly review error messages for clarity and accuracy, especially after adding new features or modifying existing functionality.