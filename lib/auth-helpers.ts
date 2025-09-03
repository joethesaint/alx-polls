import { supabase } from './supabase';
import { AuthUser, ActionResult } from './types';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ? { id: session.user.id, email: session.user.email } : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user has already voted on a poll (for authenticated users)
 */
export async function hasUserVoted(pollId: string, userId: string): Promise<boolean> {
  try {
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();
    
    return !!existingVote;
  } catch (error) {
    console.error('Error checking if user has voted:', error);
    return false;
  }
}

/**
 * Validate voting permissions for a user on a poll
 */
export async function validateVotingPermissions(
  pollId: string, 
  userId: string | null,
  allowMultipleVotes: boolean
): Promise<ActionResult<void>> {
  // If multiple votes are allowed, no need to check
  if (allowMultipleVotes) {
    return { success: true };
  }

  // For authenticated users, check if they've already voted
  if (userId) {
    const hasVoted = await hasUserVoted(pollId, userId);
    if (hasVoted) {
      return {
        success: false,
        errors: { root: { _errors: ['You have already voted on this poll'] } }
      };
    }
  }

  return { success: true };
}