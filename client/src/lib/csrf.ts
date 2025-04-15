/**
 * CSRF Token Management for API Requests
 * 
 * This module provides functions to fetch, store, and retrieve CSRF tokens
 * for use with API requests to protect against Cross-Site Request Forgery attacks.
 */

import axios from 'axios';

// Store the current CSRF token
let csrfToken: string | null = null;

/**
 * Fetch a new CSRF token from the server
 * @returns Promise resolving to the CSRF token string
 */
export const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get('/api/csrf-token');
    if (response.data && response.data.csrfToken) {
      csrfToken = response.data.csrfToken;
      return response.data.csrfToken;
    }
    throw new Error('Failed to retrieve CSRF token from server');
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    
    // Handle specific API errors
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        console.error('Authentication issue when fetching CSRF token');
      } else if (error.response.status === 429) {
        console.error('Rate limited when fetching CSRF token');
      } else {
        console.error(`Server error (${error.response.status}) when fetching CSRF token`);
      }
    }
    
    throw error;
  }
};

/**
 * Get the current CSRF token, fetching a new one if needed
 * @returns Promise resolving to the CSRF token string
 */
export const getCsrfToken = async (): Promise<string> => {
  if (!csrfToken) {
    return fetchCsrfToken();
  }
  return csrfToken as string;
};

/**
 * Add CSRF token to the request headers or body
 * @param options - Request options to modify
 * @returns Promise resolving to updated options with CSRF token
 */
export const addCsrfToken = async (options: any = {}): Promise<any> => {
  const token = await getCsrfToken();
  
  // Create a new options object to avoid mutating the original
  const updatedOptions = { ...options };
  
  // Set headers if they don't exist
  if (!updatedOptions.headers) {
    updatedOptions.headers = {};
  }
  
  // Add token to headers
  updatedOptions.headers['csrf-token'] = token;
  
  // If there's a body and it's an object, add the token there too
  // This provides fallback in case headers are stripped
  if (updatedOptions.data && typeof updatedOptions.data === 'object' && !Array.isArray(updatedOptions.data)) {
    updatedOptions.data = {
      ...updatedOptions.data,
      _csrf: token
    };
  }
  
  return updatedOptions;
};

/**
 * Create an Axios request interceptor to automatically add CSRF tokens to requests
 * @param axiosInstance - Optional Axios instance (uses global axios by default)
 */
export const setupCsrfInterceptor = (axiosInstance = axios) => {
  // Request interceptor to add CSRF token to requests
  axiosInstance.interceptors.request.use(async (config) => {
    // Only add CSRF token for non-GET requests to our own API
    if (
      config.method && 
      ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase()) &&
      (!config.url?.startsWith('http') || config.url?.startsWith(window.location.origin))
    ) {
      const token = await getCsrfToken();
      
      // Set the CSRF token in headers
      config.headers = config.headers || {};
      config.headers['csrf-token'] = token;
      
      // Also add to request body if it's an object
      if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
        config.data = {
          ...config.data,
          _csrf: token
        };
      }
    }
    return config;
  });
  
  // Response interceptor to handle CSRF errors
  axiosInstance.interceptors.response.use(
    (response) => response, 
    async (error) => {
      // Check if it's a CSRF validation error
      if (
        error.response && 
        error.response.status === 403 && 
        error.response.data && 
        error.response.data.error && 
        error.response.data.error.includes('CSRF')
      ) {
        console.error('CSRF validation failed. Refreshing token and retrying...');
        
        // Force refresh the CSRF token
        csrfToken = null;
        await fetchCsrfToken();
        
        // Retry the original request with new token
        const originalRequest = error.config;
        
        // Make sure we're not stuck in a loop
        if (!originalRequest._retryCount || originalRequest._retryCount < 1) {
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          // Add new token to request
          const token = await getCsrfToken();
          originalRequest.headers['csrf-token'] = token;
          
          // Also update token in request body if it exists
          if (originalRequest.data && typeof originalRequest.data === 'object') {
            originalRequest.data._csrf = token;
          }
          
          return axiosInstance(originalRequest);
        }
      }
      
      // Let other errors propagate
      return Promise.reject(error);
    }
  );
};

// Initialize by setting up the interceptor
setupCsrfInterceptor();

export default {
  fetchCsrfToken,
  getCsrfToken,
  addCsrfToken,
  setupCsrfInterceptor
};