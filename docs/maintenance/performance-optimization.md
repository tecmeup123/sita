# SiTa Minter Performance Optimization Guide

This guide provides best practices and instructions for optimizing the performance of the SiTa Minter application, including caching strategies, load handling, and overall responsiveness improvements.

## Table of Contents

1. [Introduction](#introduction)
2. [Frontend Performance](#frontend-performance)
3. [Backend Performance](#backend-performance)
4. [Network Optimization](#network-optimization)
5. [Database Optimization](#database-optimization)
6. [Caching Strategies](#caching-strategies)
7. [Monitoring Performance](#monitoring-performance)
8. [Common Performance Issues](#common-performance-issues)
9. [Testing Performance Improvements](#testing-performance-improvements)

## Introduction

Optimizing performance is crucial for providing a smooth user experience, especially for blockchain applications like SiTa Minter that involve complex operations. This guide covers various techniques for improving application performance.

## Frontend Performance

### JavaScript Optimization

#### Code Splitting

SiTa Minter uses React with Vite, which provides native code splitting support:

```typescript
// Example: Lazy loading components
import React, { Suspense, lazy } from 'react';

// Replace direct import:
// import TokenCreation from './components/TokenCreation';

// With lazy loading:
const TokenCreation = lazy(() => import('./components/TokenCreation'));

// In your component:
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TokenCreation />
    </Suspense>
  );
}
```

#### Memoization

Use React's memoization features to prevent unnecessary re-renders:

```typescript
// Use React.memo for function components
const TokenCard = React.memo(function TokenCard({ token }) {
  // Component logic
});

// Use useMemo for expensive calculations
const { sortedTokens } = useMemo(() => {
  return { sortedTokens: sortAndFilterTokens(tokens, filter) };
}, [tokens, filter]);

// Use useCallback for functions passed as props
const handleTokenSelect = useCallback((tokenId) => {
  // Handler logic
}, [/* dependencies */]);
```

#### Bundle Size Optimization

Analyze and optimize your bundle size:

1. **Regular Audits**:
   ```bash
   # Using source-map-explorer (install if needed)
   npm install -g source-map-explorer
   npm run build
   source-map-explorer 'dist/assets/*.js'
   ```

2. **Tree Shaking**:
   ```typescript
   // Do:
   import { Button } from '@/components/ui/button';
   
   // Don't:
   import * from '@/components/ui';
   ```

### Image Optimization

Optimize images for faster loading:

1. **Use SVGs** for icons and simple graphics
2. **Lazy load** images below the fold
3. **Specify dimensions** to reduce layout shifts

```tsx
// Example: Lazy loading images with proper dimensions
import { useState, useEffect } from 'react';

function LazyImage({ src, alt, width, height }) {
  const [imageSrc, setImageSrc] = useState(null);
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
    };
  }, [src]);
  
  return (
    <div style={{ width, height }} className="lazy-image-container">
      {imageSrc ? (
        <img src={imageSrc} alt={alt} width={width} height={height} />
      ) : (
        <div className="image-placeholder" />
      )}
    </div>
  );
}
```

### CSS Optimization

Optimize CSS for faster rendering:

1. **Purge unused CSS**:
   SiTa Minter uses Tailwind CSS which includes PurgeCSS by default. Ensure it's properly configured:

   ```js
   // In tailwind.config.js
   module.exports = {
     content: [
       './client/src/**/*.{js,jsx,ts,tsx}',
       // Add any other files that contain class names
     ],
     // ...
   };
   ```

2. **Critical CSS**:
   Inline critical CSS for faster initial rendering.

3. **Reduce specificity**:
   Simpler selectors require less calculation time.

## Backend Performance

### API Optimization

#### Request Batching

For multiple related operations, implement request batching:

```typescript
// Instead of multiple endpoints:
// GET /api/token/123
// GET /api/token/456
// GET /api/token/789

// Create a batched endpoint:
// POST /api/tokens/batch
// Body: { ids: [123, 456, 789] }

// In server/routes.ts
app.post('/api/tokens/batch', validateInput(batchSchema), async (req, res) => {
  const { ids } = req.body;
  
  // Fetch multiple tokens in one database query
  const tokens = await getTokensByIds(ids);
  
  res.json({ tokens });
});
```

#### Response Optimization

Optimize API responses:

1. **Pagination**:
   ```typescript
   // In server/routes.ts
   app.get('/api/tokens', async (req, res) => {
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;
     
     const offset = (page - 1) * limit;
     
     const { tokens, total } = await getTokensPaginated(limit, offset);
     
     res.json({
       tokens,
       pagination: {
         total,
         pages: Math.ceil(total / limit),
         current: page,
         limit
       }
     });
   });
   ```

2. **Field Filtering**:
   Allow clients to request only needed fields:
   ```typescript
   // GET /api/tokens?fields=id,name,symbol

   app.get('/api/tokens', async (req, res) => {
     const requestedFields = req.query.fields?.split(',') || null;
     
     const tokens = await getTokens(requestedFields);
     
     res.json({ tokens });
   });
   ```

### Blockchain Interaction Optimization

Blockchain interactions can be slow. Optimize with:

1. **Batch Transactions**:
   ```typescript
   // Instead of multiple separate transactions:
   const batchResults = await batchTransactions([
     { type: 'mint', params: { ... } },
     { type: 'transfer', params: { ... } }
   ]);
   ```

2. **Parallel Processing**:
   ```typescript
   // Process blockchain operations in parallel
   const [balanceResult, allowanceResult, historyResult] = await Promise.all([
     getBalance(address),
     getAllowance(address, spender),
     getTransactionHistory(address)
   ]);
   ```

## Network Optimization

### RPC Connection Pooling

For blockchain RPC connections:

```typescript
// In server/lib/rpc-client.ts
class RPCConnectionPool {
  private connections = [];
  private maxConnections = 5;
  
  constructor() {
    // Initialize connection pool
    for (let i = 0; i < this.maxConnections; i++) {
      this.connections.push({
        client: new RPCClient(),
        busy: false
      });
    }
  }
  
  async getConnection() {
    // Find available connection or wait
    const available = this.connections.find(conn => !conn.busy);
    if (available) {
      available.busy = true;
      return available.client;
    }
    
    // Wait for a connection to become available
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        const available = this.connections.find(conn => !conn.busy);
        if (available) {
          clearInterval(checkInterval);
          available.busy = true;
          resolve(available.client);
        }
      }, 100);
    });
  }
  
  releaseConnection(client) {
    const connection = this.connections.find(conn => conn.client === client);
    if (connection) {
      connection.busy = false;
    }
  }
}
```

### Content Delivery

Optimize content delivery:

1. **Serve static assets from CDN**
2. **Set proper cache headers**:
   ```typescript
   // In server/routes.ts
   app.use('/assets', express.static('public', {
     maxAge: '7d', // Cache for 7 days
     immutable: true
   }));
   ```

## Database Optimization

### Query Optimization

Optimize database queries:

1. **Use indexes**:
   ```sql
   -- Example for PostgreSQL
   CREATE INDEX idx_transactions_user_id ON transactions(user_id);
   CREATE INDEX idx_tokens_symbol ON tokens(symbol);
   ```

2. **Optimize JOIN operations**:
   ```typescript
   // Instead of separate queries:
   const token = await db.token.findUnique({ where: { id } });
   const creator = await db.user.findUnique({ where: { id: token.creatorId } });
   
   // Use JOIN:
   const tokenWithCreator = await db.token.findUnique({
     where: { id },
     include: { creator: true }
   });
   ```

### Connection Pooling

Ensure your database connection is properly pooled:

```typescript
// In server/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  max: 20, // Maximum connections in the pool
  idleTimeoutMillis: 30000, // How long a client can be idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Export query function
export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

## Caching Strategies

### Client-Side Caching

Implement client-side caching:

1. **React Query**:
   SiTa Minter uses TanStack Query (React Query) for client-side caching:

   ```typescript
   // Example cache configuration
   // In client/src/lib/queryClient.ts
   import { QueryClient } from '@tanstack/react-query';

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 10 * 60 * 1000, // 10 minutes
         refetchOnWindowFocus: false,
         retry: 1
       }
     }
   });
   ```

2. **LocalStorage for non-sensitive data**:
   ```typescript
   // Helper functions for local storage caching
   export function setCache(key, data, ttl = 3600000) {
     const item = {
       value: data,
       expiry: Date.now() + ttl
     };
     localStorage.setItem(`cache_${key}`, JSON.stringify(item));
   }

   export function getCache(key) {
     const cachedItem = localStorage.getItem(`cache_${key}`);
     if (!cachedItem) return null;
     
     const item = JSON.parse(cachedItem);
     if (Date.now() > item.expiry) {
       localStorage.removeItem(`cache_${key}`);
       return null;
     }
     
     return item.value;
   }
   ```

### Server-Side Caching

Implement server-side caching:

1. **Memory Cache**:
   ```typescript
   // In server/cache.ts
   import NodeCache from 'node-cache';

   const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

   export function getOrSet(key, fetchFn, ttl = 600) {
     const cachedValue = cache.get(key);
     if (cachedValue !== undefined) {
       return Promise.resolve(cachedValue);
     }

     return fetchFn().then(result => {
       cache.set(key, result, ttl);
       return result;
     });
   }
   ```

2. **Route-Level Caching**:
   ```typescript
   // In server/middleware/cache.ts
   export function cacheMiddleware(duration) {
     return (req, res, next) => {
       const key = `__express__${req.originalUrl || req.url}`;
       const cachedResponse = cache.get(key);
       
       if (cachedResponse) {
         res.send(cachedResponse);
         return;
       }
       
       const originalSend = res.send;
       res.send = function(body) {
         cache.set(key, body, duration);
         originalSend.call(this, body);
       };
       
       next();
     };
   }
   
   // Usage
   app.get('/api/tokens', cacheMiddleware(300), (req, res) => {
     // This response will be cached for 5 minutes
   });
   ```

### Blockchain Data Caching

Cache blockchain data to reduce RPC calls:

```typescript
// In client/src/hooks/use-blockchain-data.ts
export function useTokenDetails(tokenId) {
  return useQuery({
    queryKey: ['token', tokenId],
    queryFn: () => fetchTokenDetails(tokenId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });
}

// Multiple tokens in one query
export function useTokensList() {
  return useQuery({
    queryKey: ['tokens-list'],
    queryFn: fetchTokensList,
    staleTime: 2 * 60 * 1000, // 2 minutes
    // Other options...
  });
}
```

## Monitoring Performance

### Client-Side Monitoring

Implement performance monitoring on the client:

```typescript
// In client/src/lib/performance.ts
export function trackPerformance() {
  if (typeof window === 'undefined' || !window.performance) return;
  
  // Core Web Vitals
  const reportWebVitals = ({ name, delta, id }) => {
    // Send to analytics or logging
    console.log(`Performance: ${name} - ${Math.round(delta)}ms (ID: ${id})`);
  };
  
  // Track page load performance
  window.addEventListener('load', () => {
    const timing = window.performance.timing;
    const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
    const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
    const connectionTime = timing.connectEnd - timing.connectStart;
    const domLoadTime = timing.domComplete - timing.domLoading;
    
    console.log(`Page load: ${pageLoadTime}ms`);
    console.log(`DNS: ${dnsTime}ms`);
    console.log(`Connection: ${connectionTime}ms`);
    console.log(`DOM: ${domLoadTime}ms`);
  });
  
  // Track specific operations
  export function measureOperation(name, operation) {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    console.log(`Operation "${name}" took ${Math.round(duration)}ms`);
    return result;
  }
  
  // Async version
  export async function measureAsyncOperation(name, operation) {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    
    console.log(`Async operation "${name}" took ${Math.round(duration)}ms`);
    return result;
  }
}
```

### Server-Side Monitoring

Monitor backend performance:

```typescript
// In server/middleware/performance.ts
export function performanceMiddleware(req, res, next) {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    console.log(`${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
}

// Usage
app.use(performanceMiddleware);
```

## Common Performance Issues

### Blockchain Performance Issues

1. **Slow RPC Response**:
   - Implement timeout handling:
   ```typescript
   const fetchWithTimeout = async (url, options, timeout = 10000) => {
     const controller = new AbortController();
     const id = setTimeout(() => controller.abort(), timeout);
     
     try {
       const response = await fetch(url, {
         ...options,
         signal: controller.signal
       });
       clearTimeout(id);
       return response;
     } catch (error) {
       clearTimeout(id);
       if (error.name === 'AbortError') {
         throw new Error('Request timeout');
       }
       throw error;
     }
   };
   ```

2. **Multiple RPC Calls**:
   - Batch related calls where possible
   - Implement progressive loading patterns

### React Performance Issues

1. **Excessive Re-renders**:
   - Use React DevTools to profile component rendering
   - Fix with proper memoization and state management

2. **Large Component Trees**:
   - Split into smaller components
   - Use virtualization for long lists:
   ```tsx
   import { FixedSizeList } from 'react-window';
   
   function TokenList({ tokens }) {
     const Row = ({ index, style }) => (
       <div style={style}>
         <TokenItem token={tokens[index]} />
       </div>
     );
     
     return (
       <FixedSizeList
         height={500}
         width="100%"
         itemCount={tokens.length}
         itemSize={60}
       >
         {Row}
       </FixedSizeList>
     );
   }
   ```

## Testing Performance Improvements

Always test performance improvements:

1. **Establish Baselines**:
   - Measure performance before changes
   - Document specific metrics (load time, render time, etc.)

2. **Use Lighthouse**:
   - Run regular audits for overall performance

3. **Test on Multiple Devices**:
   - Especially mobile devices with varying network conditions

4. **Monitor Real User Metrics**:
   - Collect performance data from actual users when possible

## Conclusion

Performance optimization is an ongoing process. Regularly review application performance, identify bottlenecks, and implement appropriate optimizations. Always test changes thoroughly to ensure they actually improve performance without introducing new issues.

When adding new features to SiTa Minter, consider performance implications from the start and follow the best practices outlined in this guide.