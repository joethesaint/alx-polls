import { ActionResult } from './types';

/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string | string[]): ActionResult {
  const messages = Array.isArray(message) ? message : [message];
  return {
    success: false,
    errors: { root: { _errors: messages } }
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data?: T): ActionResult<T> {
  return {
    success: true,
    ...(data !== undefined && { data })
  };
}

/**
 * Handle and log errors consistently
 */
export function handleError(error: unknown, context: string): ActionResult {
  console.error(`Error in ${context}:`, error);
  
  // Check if it's a known error type
  if (error instanceof Error) {
    return createErrorResponse(`${context} failed: ${error.message}`);
  }
  
  return createErrorResponse('An unexpected error occurred. Please try again.');
}

/**
 * Validation error response
 */
export function createValidationErrorResponse(errors: any): ActionResult {
  return {
    success: false,
    errors
  };
}

/**
 * Database error response
 */
export function createDatabaseErrorResponse(operation: string): ActionResult {
  return createErrorResponse(`Failed to ${operation}. Please try again.`);
}

/**
 * Authentication error response
 */
export function createAuthErrorResponse(message = 'Authentication required'): ActionResult {
  return createErrorResponse(message);
}

/**
 * Not found error response
 */
export function createNotFoundErrorResponse(resource: string): ActionResult {
  return createErrorResponse(`${resource} not found`);
}