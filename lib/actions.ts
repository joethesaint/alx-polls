'use server';

import { z } from 'zod';
import { supabase } from './supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        errors: { root: { _errors: ['You must be logged in to create a poll'] } }
      };
    }
    
    const userId = session.user.id;
    
    // Create the poll in Supabase
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: formData.title,
        description: formData.description,
        is_public: formData.isPublic,
        allow_multiple_votes: formData.allowMultipleVotes,
        user_id: userId,
        created_at: new Date().toISOString()
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
    
    // Create the poll options
    const pollOptions = formData.options.map(option => ({
      poll_id: poll.id,
      text: option.text.trim(),
      votes: 0
    }));
    
    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(pollOptions);
    
    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
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