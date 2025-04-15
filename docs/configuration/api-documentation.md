# SiTa Minter API Documentation

This document provides comprehensive documentation for all API endpoints in the SiTa Minter application, including request/response formats, authentication requirements, and usage examples.

## Table of Contents

1. [Introduction](#introduction)
2. [API Overview](#api-overview)
3. [Authentication](#authentication)
4. [User Endpoints](#user-endpoints)
5. [Token Endpoints](#token-endpoints)
6. [Transaction Endpoints](#transaction-endpoints)
7. [Wallet Endpoints](#wallet-endpoints)
8. [Utility Endpoints](#utility-endpoints)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [CORS Policy](#cors-policy)
12. [API Versioning](#api-versioning)

## Introduction

The SiTa Minter API provides a RESTful interface for interacting with the application backend. These endpoints support token creation, transaction processing, and other core functionalities.

## API Overview

### Base URL

The base URL for all API requests is:

```
https://your-domain.com/api
```

For local development:

```
http://localhost:3000/api
```

### Response Format

All API responses follow this general structure:

```json
{
  "data": { ... },  // Response data (if successful)
  "error": { ... },  // Error details (if failed)
  "meta": { ... }   // Metadata about the request/response
}
```

### HTTP Status Codes

The API uses standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Authentication

Most API endpoints require authentication using a wallet address.

### Authentication Methods

1. **CSRF Token Authentication**

   For browser-based requests, a CSRF token is required.

   ```javascript
   // CSRF token is provided in the HTML meta tag
   const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
   
   // Include token in request headers
   const headers = {
     'Content-Type': 'application/json',
     'X-CSRF-Token': csrfToken
   };
   
   fetch('/api/users/profile', {
     method: 'GET',
     headers: headers
   });
   ```

2. **Wallet Signature Authentication**

   For wallet-based authentication:

   ```javascript
   // Generate a message to sign
   const response = await fetch('/api/auth/nonce', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ walletAddress })
   });
   
   const { nonce } = await response.json();
   
   // Sign the message with the wallet
   const signatureData = await wallet.signMessage(`Login to SiTa Minter: ${nonce}`);
   
   // Authenticate with the signature
   const authResponse = await fetch('/api/auth/verify', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       walletAddress,
       signature: signatureData,
       nonce
     })
   });
   
   // If successful, server will set a session cookie
   ```

## User Endpoints

### Get User Profile

Retrieves the profile information for the authenticated user.

**Request:**

```
GET /api/users/profile
```

**Headers:**
- `X-CSRF-Token`: CSRF protection token

**Response:**

```json
{
  "data": {
    "id": 123,
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "username": "tokenCreator",
    "createdAt": "2023-01-15T12:34:56Z",
    "tokensCreated": 5
  }
}
```

### Update User Profile

Updates the profile information for the authenticated user.

**Request:**

```
PATCH /api/users/profile
```

**Headers:**
- `Content-Type`: application/json
- `X-CSRF-Token`: CSRF protection token

**Body:**

```json
{
  "username": "newUsername"
}
```

**Response:**

```json
{
  "data": {
    "id": 123,
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "username": "newUsername",
    "createdAt": "2023-01-15T12:34:56Z",
    "updatedAt": "2023-04-20T10:11:12Z"
  }
}
```

## Token Endpoints

### List Tokens

Returns a list of tokens, with optional filtering.

**Request:**

```
GET /api/tokens
```

**Query Parameters:**
- `creator`: (optional) Filter by creator wallet address
- `network`: (optional) Filter by network ID (mainnet, testnet)
- `status`: (optional) Filter by status (pending, confirmed, failed)
- `page`: (optional) Page number for pagination (default: 1)
- `limit`: (optional) Number of tokens per page (default: 10)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Example Token",
      "symbol": "EXT",
      "supply": "1000000",
      "creatorId": 123,
      "creatorAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "description": "An example token",
      "iconUrl": "https://example.com/icon.png",
      "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
      "networkId": "mainnet",
      "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      "status": "confirmed",
      "createdAt": "2023-01-15T12:34:56Z"
    },
    // More tokens...
  ],
  "meta": {
    "pagination": {
      "total": 42,
      "pages": 5,
      "current": 1,
      "limit": 10
    }
  }
}
```

### Get Token Details

Retrieves detailed information about a specific token.

**Request:**

```
GET /api/tokens/:id
```

**Path Parameters:**
- `id`: Token ID

**Response:**

```json
{
  "data": {
    "id": 1,
    "name": "Example Token",
    "symbol": "EXT",
    "supply": "1000000",
    "creatorId": 123,
    "creatorAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "description": "An example token",
    "iconUrl": "https://example.com/icon.png",
    "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
    "networkId": "mainnet",
    "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    "status": "confirmed",
    "createdAt": "2023-01-15T12:34:56Z",
    "transactions": [
      {
        "id": 456,
        "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
        "txType": "create",
        "status": "confirmed",
        "createdAt": "2023-01-15T12:34:56Z"
      }
    ]
  }
}
```

### Create Token

Initiates the token creation process.

**Request:**

```
POST /api/tokens
```

**Headers:**
- `Content-Type`: application/json
- `X-CSRF-Token`: CSRF protection token

**Body:**

```json
{
  "name": "New Token",
  "symbol": "NTK",
  "supply": "1000000",
  "description": "A new token on the Nervos network",
  "iconUrl": "https://example.com/icon.png",
  "networkId": "mainnet",
  "includeTip": true
}
```

**Response:**

```json
{
  "data": {
    "id": 2,
    "name": "New Token",
    "symbol": "NTK",
    "supply": "1000000",
    "creatorId": 123,
    "creatorAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "description": "A new token on the Nervos network",
    "iconUrl": "https://example.com/icon.png",
    "networkId": "mainnet",
    "status": "pending",
    "createdAt": "2023-04-20T10:11:12Z"
  }
}
```

### Update Token Status

Updates the status of a token, typically after blockchain confirmation.

**Request:**

```
PATCH /api/tokens/:id/status
```

**Path Parameters:**
- `id`: Token ID

**Headers:**
- `Content-Type`: application/json
- `X-CSRF-Token`: CSRF protection token

**Body:**

```json
{
  "status": "confirmed",
  "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
  "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12"
}
```

**Response:**

```json
{
  "data": {
    "id": 2,
    "status": "confirmed",
    "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    "contractAddress": "0xabcdef1234567890abcdef1234567890abcdef12",
    "updatedAt": "2023-04-20T10:30:45Z"
  }
}
```

## Transaction Endpoints

### List Transactions

Returns a list of transactions for the authenticated user.

**Request:**

```
GET /api/transactions
```

**Query Parameters:**
- `tokenId`: (optional) Filter by token ID
- `status`: (optional) Filter by status (pending, confirmed, failed)
- `txType`: (optional) Filter by transaction type (create, transfer, etc.)
- `page`: (optional) Page number for pagination (default: 1)
- `limit`: (optional) Number of transactions per page (default: 10)

**Headers:**
- `X-CSRF-Token`: CSRF protection token

**Response:**

```json
{
  "data": [
    {
      "id": 456,
      "userId": 123,
      "tokenId": 1,
      "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      "txType": "create",
      "status": "confirmed",
      "amount": null,
      "networkId": "mainnet",
      "createdAt": "2023-01-15T12:34:56Z"
    },
    // More transactions...
  ],
  "meta": {
    "pagination": {
      "total": 15,
      "pages": 2,
      "current": 1,
      "limit": 10
    }
  }
}
```

### Get Transaction Details

Retrieves detailed information about a specific transaction.

**Request:**

```
GET /api/transactions/:id
```

**Path Parameters:**
- `id`: Transaction ID

**Headers:**
- `X-CSRF-Token`: CSRF protection token

**Response:**

```json
{
  "data": {
    "id": 456,
    "userId": 123,
    "tokenId": 1,
    "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    "txType": "create",
    "status": "confirmed",
    "amount": null,
    "networkId": "mainnet",
    "metadata": {
      "gasUsed": "123456",
      "blockNumber": "789012",
      "timestamp": "2023-01-15T12:34:56Z"
    },
    "createdAt": "2023-01-15T12:34:56Z",
    "token": {
      "id": 1,
      "name": "Example Token",
      "symbol": "EXT"
    }
  }
}
```

### Create Transaction

Records a new transaction in the system.

**Request:**

```
POST /api/transactions
```

**Headers:**
- `Content-Type`: application/json
- `X-CSRF-Token`: CSRF protection token

**Body:**

```json
{
  "tokenId": 1,
  "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
  "txType": "transfer",
  "amount": "1000",
  "networkId": "mainnet",
  "metadata": {
    "recipient": "0xabcdef1234567890abcdef1234567890abcdef12"
  }
}
```

**Response:**

```json
{
  "data": {
    "id": 457,
    "userId": 123,
    "tokenId": 1,
    "txHash": "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
    "txType": "transfer",
    "status": "pending",
    "amount": "1000",
    "networkId": "mainnet",
    "metadata": {
      "recipient": "0xabcdef1234567890abcdef1234567890abcdef12"
    },
    "createdAt": "2023-04-20T11:22:33Z"
  }
}
```

### Update Transaction Status

Updates the status of a transaction, typically after blockchain confirmation.

**Request:**

```
PATCH /api/transactions/:id/status
```

**Path Parameters:**
- `id`: Transaction ID

**Headers:**
- `Content-Type`: application/json
- `X-CSRF-Token`: CSRF protection token

**Body:**

```json
{
  "status": "confirmed",
  "metadata": {
    "gasUsed": "123456",
    "blockNumber": "789012",
    "timestamp": "2023-04-20T11:30:45Z"
  }
}
```

**Response:**

```json
{
  "data": {
    "id": 457,
    "status": "confirmed",
    "metadata": {
      "recipient": "0xabcdef1234567890abcdef1234567890abcdef12",
      "gasUsed": "123456",
      "blockNumber": "789012",
      "timestamp": "2023-04-20T11:30:45Z"
    },
    "updatedAt": "2023-04-20T11:35:00Z"
  }
}
```

## Wallet Endpoints

### Get Wallet Balance

Retrieves the balance information for a wallet address.

**Request:**

```
GET /api/wallet/balance
```

**Query Parameters:**
- `address`: Wallet address
- `network`: (optional) Network ID (default: mainnet)

**Response:**

```json
{
  "data": {
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "network": "mainnet",
    "balance": "1234567890",
    "formattedBalance": "12.3456 CKB",
    "lastUpdated": "2023-04-20T12:00:00Z"
  }
}
```

### Get Wallet Tokens

Retrieves tokens owned by a specific wallet address.

**Request:**

```
GET /api/wallet/tokens
```

**Query Parameters:**
- `address`: Wallet address
- `network`: (optional) Network ID (default: mainnet)
- `page`: (optional) Page number for pagination (default: 1)
- `limit`: (optional) Number of tokens per page (default: 10)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Example Token",
      "symbol": "EXT",
      "balance": "500000",
      "iconUrl": "https://example.com/icon.png"
    },
    // More tokens...
  ],
  "meta": {
    "pagination": {
      "total": 3,
      "pages": 1,
      "current": 1,
      "limit": 10
    }
  }
}
```

## Utility Endpoints

### Get Network Status

Retrieves the status of supported blockchain networks.

**Request:**

```
GET /api/networks/status
```

**Response:**

```json
{
  "data": {
    "mainnet": {
      "status": "online",
      "blockHeight": 12345678,
      "lastBlockTime": "2023-04-20T12:34:56Z",
      "peerCount": 42
    },
    "testnet": {
      "status": "online",
      "blockHeight": 9876543,
      "lastBlockTime": "2023-04-20T12:34:00Z",
      "peerCount": 36
    }
  }
}
```

### Get Fee Estimates

Retrieves current fee estimates for token operations.

**Request:**

```
GET /api/fees/estimate
```

**Query Parameters:**
- `network`: (optional) Network ID (default: mainnet)
- `operation`: (optional) Operation type (default: token_creation)

**Response:**

```json
{
  "data": {
    "network": "mainnet",
    "operation": "token_creation",
    "platformFee": "300",
    "networkFee": "0.01",
    "tipFee": "144",
    "totalFee": "444.01",
    "feeUSD": "0.53",
    "formattedFee": "444.01 CKB",
    "lastUpdated": "2023-04-20T12:00:00Z"
  }
}
```

### Get CKB Price

Retrieves current CKB price information.

**Request:**

```
GET /api/price/ckb
```

**Response:**

```json
{
  "data": {
    "symbol": "CKB",
    "price": {
      "usd": "0.01234",
      "btc": "0.00000123",
      "eth": "0.0000123"
    },
    "change24h": "2.5",
    "lastUpdated": "2023-04-20T12:00:00Z"
  }
}
```

### Log Client Event

Logs an event from the client side.

**Request:**

```
POST /api/logs
```

**Headers:**
- `Content-Type`: application/json
- `X-CSRF-Token`: CSRF protection token

**Body:**

```json
{
  "level": "error",
  "message": "Failed to connect wallet",
  "details": {
    "walletType": "metamask",
    "errorCode": "user_rejected",
    "timestamp": "2023-04-20T12:34:56Z"
  }
}
```

**Response:**

```json
{
  "data": {
    "received": true,
    "logId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}
```

## Error Handling

The API uses consistent error responses:

```json
{
  "error": {
    "code": "invalid_input",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "supply",
        "message": "Token supply must be a positive number"
      }
    ]
  }
}
```

### Common Error Codes

- `invalid_input`: Request validation failed
- `not_found`: Requested resource not found
- `unauthorized`: Authentication required
- `forbidden`: Permission denied
- `rate_limited`: Too many requests
- `server_error`: Internal server error
- `network_error`: Blockchain network error
- `wallet_error`: Wallet-related error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Standard Endpoints**: 60 requests per minute per IP
- **Authentication Endpoints**: 20 requests per minute per IP
- **Token Creation**: 10 requests per hour per wallet

When rate limits are exceeded, the API returns a `429 Too Many Requests` response:

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limitType": "ip",
      "resetAt": "2023-04-20T12:35:00Z"
    }
  }
}
```

## CORS Policy

The API implements Cross-Origin Resource Sharing (CORS) with the following policy:

- **Allowed Origins**: Only the official SiTa Minter frontend domains
- **Allowed Methods**: GET, POST, PATCH, OPTIONS
- **Allowed Headers**: Content-Type, X-CSRF-Token, Authorization
- **Credentials**: Supported
- **Max Age**: 86400 seconds (24 hours)

## API Versioning

The current API version is v1 (implicit in the path). Future versions will be explicitly versioned:

```
/api/v2/tokens
```

When API changes are made:

1. **Minor Updates**: Non-breaking changes will be made without version changes
2. **Major Updates**: Breaking changes will increment the API version
3. **Deprecation**: Old API versions will be supported for at least 6 months after a new version is released

### Changelog

**v1 (Current)**
- Initial API release

## Conclusion

This API documentation provides a comprehensive reference for all endpoints in the SiTa Minter application. If you have questions or need further assistance, please contact the development team.

For SDK integration examples and additional code samples, please refer to the [Developer Resources](./developer-resources.md) documentation.