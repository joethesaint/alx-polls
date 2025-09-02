'use server';

import { z } from 'zod';
import { supabase } from './supabase';
import { revalidatePath } from 'next/cache';

// Vote submission schema
const voteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
});

type VoteFormValues = z.infer<typeof voteSchema>;

/**
 * Server action to submit a vote for a poll option
 */
export async function submitVote(formData: VoteFormValues) {
  // Validate the form data
  const validationResult = voteSchema.safeParse(formData);
  
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.format()
    };
  }
  
  try {
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Check if the poll allows multiple votes
    const { data: poll } = await supabase
      .from('polls')
      .select('allow_multiple_votes')
      .eq('id', formData.pollId)
      .single();
    
    if (!poll) {
      return {
        success: false,
        errors: { root: { _errors: ['Poll not found'] } }
      };
    }
    
    // If user is authenticated, check if they've already voted (if multiple votes not allowed)
    if (userId && !poll.allow_multiple_votes) {
      const { data: existingVote } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', formData.pollId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingVote) {
        return {
          success: false,
          errors: { root: { _errors: ['You have already voted on this poll'] } }
        };
      }
    }
    
    // For anonymous users, use IP address to track votes
    // In a real implementation, you would get the IP from the request
    // For this example, we'll use a placeholder
    const voterIp = userId ? null : 'anonymous-ip-placeholder';
    
    // Submit the vote
    const { error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: formData.pollId,
        option_id: formData.optionId,
        user_id: userId,
        voter_ip: voterIp
      });
    
    if (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        errors: { root: { _errors: ['Failed to submit vote. Please try again.'] } }
      };
    }
    
    // Revalidate the poll page to show updated results
    revalidatePath(`/polls/${formData.pollId}`);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in submitVote server action:', error);
    return {
      success: false,
      errors: { root: { _errors: ['An unexpected error occurred. Please try again.'] } }
    };
  }
}

/**
 * Get poll results
 */
export async function getPollResults(pollId: string) {
  try {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .eq('id', pollId)
      .single();
    
    if (pollError) {
      console.error('Error fetching poll results:', pollError);
      return {
        success: false,
        errors: { root: { _errors: ['Failed to fetch poll results. Please try again.'] } }
      };
    }
    
    return {
      success: true,
      poll
    };
  } catch (error) {
    console.error('Error in getPollResults server action:', error);
    return {
      success: false,
      errors: { root: { _errors: ['An unexpected error occurred. Please try again.'] } }
    };
  }
}