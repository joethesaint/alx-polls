import { z } from 'zod';
import { voteSchema, VoteFormValues, ActionResult } from './types';

/**
 * Validate vote form data
 */
export function validateVoteData(formData: VoteFormValues): ActionResult<VoteFormValues> {
  const validationResult = voteSchema.safeParse(formData);
  
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.format()
    };
  }
  
  return {
    success: true,
    data: validationResult.data
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Sanitize and validate poll ID
 */
export function validatePollId(pollId: string): ActionResult<string> {
  if (!pollId || typeof pollId !== 'string') {
    return {
      success: false,
      errors: { root: { _errors: ['Poll ID is required'] } }
    };
  }
  
  if (!validateUUID(pollId)) {
    return {
      success: false,
      errors: { root: { _errors: ['Invalid poll ID format'] } }
    };
  }
  
  return {
    success: true,
    data: pollId.trim()
  };
}