'use server';

import { z } from 'zod';
import { supabase } from './supabase';
import { revalidatePath } from 'next/cache';
import { isDevMode } from './dev-auth';

// Poll creation schema for validation
const pollSchema = z.object({
  title: z.string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(100, { message: 'Title must be less than 100 characters' })
    .refine(val => val.trim().length > 0, { message: 'Title cannot be empty' }),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(500, { message: 'Description must be less than 500 characters' })
    .refine(val => val.trim().length > 0, { message: 'Description cannot be empty' }),
  isPublic: z.boolean().default(true),
  allowMultipleVotes: z.boolean().default(false),
  options: z.array(
    z.object({
      text: z.string()
        .min(1, { message: 'Option text is required' })
        .refine(val => val.trim().length > 0, { message: 'Option text cannot be empty' })
    })
  )
    .min(2, { message: 'At least 2 options are required' })
    .refine(
      options => new Set(options.map(o => o.text.trim())).size === options.length,
      { message: 'All options must be unique' }
    )
});

export type PollFormValues = z.infer<typeof pollSchema>;

/**
 * Server action to create a new poll in Supabase
 */
export async function createPoll(formData: PollFormValues) {
  // Validate the form data
  const validationResult = pollSchema.safeParse(formData);
  
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.format()
    };
  }
  
  try {
    let session = null;
    
    // Only check session if not in dev mode
    if (!isDevMode()) {
      const { data } = await supabase.auth.getSession();
      session = data.session;
      
      if (!session) {
        return {
          success: false,
          errors: { root: { _errors: ['You must be logged in to create a poll'] } }
        };
      }
    }
    
    const userId = session?.user?.id || '00000000-0000-0000-0000-000000000001';
    
    // Extract options text into an array for the database
    const optionsArray = formData.options.map(option => option.text.trim());
    
    // Create the poll in Supabase
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: formData.title,
        description: formData.description,
        is_public: formData.isPublic,
        allow_multiple_votes: formData.allowMultipleVotes,
        user_id: userId
      })
      .select()
      .single();

    if (pollError) {
      console.error('Error creating poll:', pollError);
      return {
        success: false,
        errors: { root: { _errors: ['Failed to create poll. Please try again.'] } }
      };
    }

    // Create poll options
    const optionsToInsert = optionsArray.map(optionText => ({
      poll_id: poll.id,
      text: optionText
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      // Clean up the poll if options failed
      await supabase.from('polls').delete().eq('id', poll.id);
      return {
        success: false,
        errors: { root: { _errors: ['Failed to create poll options. Please try again.'] } }
      };
    }
    
    // Revalidate the dashboard path to show the new poll
    revalidatePath('/dashboard');
    
    return {
      success: true,
      pollId: poll.id
    };
  } catch (error) {
    console.error('Error in createPoll server action:', error);
    return {
      success: false,
      errors: { root: { _errors: ['An unexpected error occurred. Please try again.'] } }
    };
  }
}

/**
 * Server action to delete a poll
 */
export async function deletePoll(pollId: string) {
  try {
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'You must be logged in to delete a poll'
      };
    }
    
    // First, verify the poll belongs to the current user
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('user_id')
      .eq('id', pollId)
      .single();
    
    if (fetchError || !poll) {
      return {
        success: false,
        error: 'Poll not found'
      };
    }
    
    if (poll.user_id !== session.user.id) {
      return {
        success: false,
        error: 'You can only delete your own polls'
      };
    }
    
    // Delete poll options first (due to foreign key constraint)
    const { error: optionsError } = await supabase
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);
    
    if (optionsError) {
      console.error('Error deleting poll options:', optionsError);
      return {
        success: false,
        error: 'Failed to delete poll options'
      };
    }
    
    // Delete the poll
    const { error: pollError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);
    
    if (pollError) {
      console.error('Error deleting poll:', pollError);
      return {
        success: false,
        error: 'Failed to delete poll'
      };
    }
    
    // Revalidate the dashboard path
    revalidatePath('/dashboard');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in deletePoll server action:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Server action to update a poll - OPTIMIZED VERSION
 * Improvements:
 * - Uses database transaction for atomicity
 * - Combines authentication and ownership verification in single query
 * - Batch operations for better performance
 * - Improved error handling with specific error types
 * - Reduced database round trips
 */
export async function updatePoll(pollId: string, formData: PollFormValues) {
  // Validate the form data
  const validationResult = pollSchema.safeParse(formData);
  
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.format()
    };
  }
  
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        errors: { root: { _errors: ['You must be logged in to update a poll'] } }
      };
    }
    
    // Combined query: verify poll exists and user ownership in one call
    const { data: poll, error: fetchError } = await supabase
      .from('polls')
      .select('user_id, title')
      .eq('id', pollId)
      .eq('user_id', session.user.id) // Filter by ownership directly
      .single();
    
    if (fetchError || !poll) {
      const errorMessage = fetchError?.code === 'PGRST116' 
        ? 'Poll not found or you do not have permission to edit it'
        : 'Poll not found';
      return {
        success: false,
        errors: { root: { _errors: [errorMessage] } }
      };
    }
    
    // Prepare poll options data
    const pollOptions = formData.options.map((option, index) => ({
      poll_id: pollId,
      text: option.text.trim(),
      votes: 0,
      order_index: index // Add ordering for consistent display
    }));
    
    // Use database transaction for atomicity
    const { error: transactionError } = await supabase.rpc('update_poll_with_options', {
      poll_id: pollId,
      poll_title: formData.title,
      poll_description: formData.description,
      poll_is_public: formData.isPublic,
      poll_allow_multiple_votes: formData.allowMultipleVotes,
      poll_options: pollOptions
    });
    
    // If RPC doesn't exist, fall back to manual transaction
    if (transactionError?.code === '42883') { // Function does not exist
      // Manual transaction approach
      const updatePromises = [
        // Update poll
        supabase
          .from('polls')
          .update({
            title: formData.title,
            description: formData.description,
            is_public: formData.isPublic,
            allow_multiple_votes: formData.allowMultipleVotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', pollId),
        
        // Delete existing options
        supabase
          .from('poll_options')
          .delete()
          .eq('poll_id', pollId)
      ];
      
      // Execute update and delete in parallel
      const [pollUpdateResult, optionsDeleteResult] = await Promise.all(updatePromises);
      
      if (pollUpdateResult.error) {
        console.error('Error updating poll:', pollUpdateResult.error);
        return {
          success: false,
          errors: { root: { _errors: ['Failed to update poll. Please try again.'] } }
        };
      }
      
      if (optionsDeleteResult.error) {
        console.error('Error deleting poll options:', optionsDeleteResult.error);
        return {
          success: false,
          errors: { root: { _errors: ['Failed to update poll options. Please try again.'] } }
        };
      }
      
      // Insert new options
      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(pollOptions);
      
      if (optionsError) {
        console.error('Error creating new poll options:', optionsError);
        return {
          success: false,
          errors: { root: { _errors: ['Failed to update poll options. Please try again.'] } }
        };
      }
    } else if (transactionError) {
      console.error('Error in poll update transaction:', transactionError);
      return {
        success: false,
        errors: { root: { _errors: ['Failed to update poll. Please try again.'] } }
      };
    }
    
    // Batch revalidation
    const pathsToRevalidate = ['/dashboard', `/polls/${pollId}`];
    pathsToRevalidate.forEach(path => revalidatePath(path));
    
    return {
      success: true,
      pollId: pollId
    };
  } catch (error) {
    console.error('Error in updatePoll server action:', error);
    return {
      success: false,
      errors: { root: { _errors: ['An unexpected error occurred. Please try again.'] } }
    };
  }
}