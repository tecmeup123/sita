import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCsrfToken } from "./csrf";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Enhanced API request function with CSRF token support
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url API endpoint URL
 * @param data Optional request body data
 * @returns Promise resolving to Response object
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Only add CSRF token for non-GET requests
  const needsCsrfToken = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  
  // Set up the base headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add CSRF token to headers for non-GET requests
  if (needsCsrfToken) {
    const token = await getCsrfToken();
    headers["csrf-token"] = token;
    
    // If data is an object, also include CSRF token in body
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      data = {
        ...data,
        _csrf: token
      };
    }
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Always use GET method for queries
    // CSRF token is not required for GET requests
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
