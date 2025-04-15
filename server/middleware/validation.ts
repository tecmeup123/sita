/**
 * Enhanced validation middleware for request input validation
 * Provides standardized schema validation with additional security checks
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SecurityEventType, logSecurityEvent } from '../security';

/**
 * Validate request input against a zod schema
 * @param schema The zod schema to validate the input against
 * @param source Source of data to validate ('body', 'query', 'params')
 * @returns Middleware function that validates request data
 */
export const validateSchema = (
  schema: z.ZodType<any, any>,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on the source
      const data = req[source];
      
      // Validate the data against the schema
      const validationResult = schema.safeParse(data);
      
      if (!validationResult.success) {
        // Extract and format the validation errors
        const errors = validationResult.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        // Create a summary message for logging
        const fieldsWithErrors = errors.map(err => err.path).join(', ');
        
        // Log the validation failure as a security event
        logSecurityEvent(
          SecurityEventType.INVALID_INPUT,
          `Validation failed for ${req.method} ${req.path} on fields: ${fieldsWithErrors}`,
          req.ip
        );
        
        // Return a 400 Bad Request response with details about the validation errors
        return res.status(400).json({ 
          status: 'error', 
          message: 'Input validation failed',
          errors
        });
      }
      
      // Replace the original data with the validated and potentially transformed data
      req[source] = validationResult.data;
      next();
    } catch (error) {
      // Log unexpected errors during validation
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logSecurityEvent(
        SecurityEventType.INVALID_INPUT,
        `Unexpected error during validation for ${req.method} ${req.path}: ${errorMessage}`,
        req.ip
      );
      
      return res.status(500).json({ 
        status: 'error', 
        message: 'Internal server error during input validation' 
      });
    }
  };
};

/**
 * Sanitizes potentially dangerous input patterns
 * @param input Input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Replace potentially dangerous patterns
  return input
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove other potentially dangerous HTML tags
    .replace(/<[^>]*>/g, '')
    // Filter out SQL injection patterns
    .replace(/(\b(select|update|insert|delete|drop|alter|exec|union|create)\b)/gi, '')
    // Remove common XSS vectors
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/(\b(alert|confirm|prompt|console)\b)/gi, '');
};

/**
 * Middleware to sanitize common input parameters
 * Use this for fields that won't be validated with a schema but need sanitization
 */
export const sanitizeInputs = (fields: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Sanitize specified body fields
      if (req.body && typeof req.body === 'object') {
        fields.forEach(field => {
          if (req.body[field] && typeof req.body[field] === 'string') {
            req.body[field] = sanitizeInput(req.body[field]);
          }
        });
      }
      
      // Sanitize specified query parameters
      if (req.query) {
        fields.forEach(field => {
          if (req.query[field] && typeof req.query[field] === 'string') {
            req.query[field] = sanitizeInput(req.query[field] as string);
          }
        });
      }
      
      // Continue to next middleware
      next();
    } catch (error) {
      // Log error and continue (don't block request if sanitization fails)
      console.error('Error in input sanitization:', error);
      next();
    }
  };
};

/**
 * Enhanced parameter validation with security checks
 * @param paramSchema Object describing the parameters and their validation rules
 */
export const validateParams = (
  paramSchema: Record<string, (value: any) => boolean>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: { param: string; message: string }[] = [];
    
    // Check each parameter against its validation rule
    Object.entries(paramSchema).forEach(([param, validateFn]) => {
      // Check body, query, and params for the parameter
      const sources = [
        { name: 'body', data: req.body },
        { name: 'query', data: req.query },
        { name: 'params', data: req.params }
      ];
      
      // Find parameter in any source
      const source = sources.find(s => s.data && param in s.data);
      
      if (source) {
        const value = source.data[param];
        
        // Skip validation if the value is undefined or null
        if (value === undefined || value === null) return;
        
        // Validate the parameter
        if (!validateFn(value)) {
          errors.push({
            param,
            message: `Invalid value for parameter: ${param}`
          });
        }
      }
    });
    
    // If there are validation errors, return a 400 response
    if (errors.length > 0) {
      // Log the validation errors
      logSecurityEvent(
        SecurityEventType.INVALID_INPUT,
        `Parameter validation failed for ${req.method} ${req.path}: ${errors.map(e => e.param).join(', ')}`,
        req.ip
      );
      
      return res.status(400).json({
        status: 'error',
        message: 'Parameter validation failed',
        errors
      });
    }
    
    next();
  };
};

/**
 * Common validation patterns for reuse across routes
 */
export const validationPatterns = {
  /**
   * Validates that a string is a valid network value (mainnet or testnet)
   */
  isValidNetwork: (value: string): boolean => {
    return ['mainnet', 'testnet'].includes(value);
  },
  
  /**
   * Validates that a string is a valid UUID
   */
  isUuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  
  /**
   * Validates that a value is a positive integer
   */
  isPositiveInteger: (value: any): boolean => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  },
  
  /**
   * Validates that a value is a non-negative integer (zero or positive)
   */
  isNonNegativeInteger: (value: any): boolean => {
    const num = Number(value);
    return Number.isInteger(num) && num >= 0;
  },
  
  /**
   * Validates that a string matches a specific format (using a regular expression)
   */
  matchesFormat: (regex: RegExp) => (value: string): boolean => {
    return regex.test(value);
  }
};