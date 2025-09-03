'use server';

import { revalidatePath } from 'next/cache';
import { VoteFormValues, ActionResult, Poll } from './types';
import { getCurrentUser, validateVotingPermissions } from './auth-helpers';
import { getPollById, submitPollVote, getPollResults as getPollResultsFromDB } from './poll-operations';
import { validateVoteData, validatePollId } from './validation-helpers';
import { createErrorResponse, createSuccessResponse, handleError } from './error-helpers';

/**
 * Server action to submit a vote for a poll option
 */
export async function submitVote(formData: VoteFormValues): Promise<ActionResult> {
  try {
    // Validate the form data
    const validationResult = validateVoteData(formData);
    if (!validationResult.success) {
      return validationResult;
    }

    const validatedData = validationResult.data!;

    // Get the current user
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id;

    // Get poll information
    const pollResult = await getPollById(validatedData.pollId);
    if (!pollResult.success) {
      return pollResult;
    }

    const poll = pollResult.data!;

    // Validate voting permissions
    const permissionResult = await validateVotingPermissions(
      validatedData.pollId,
      userId || null,
      poll.allow_multiple_votes
    );
    if (!permissionResult.success) {
      return permissionResult;
    }

    // For anonymous users, use IP address to track votes
    // In a real implementation, you would get the IP from the request
    const voterIp = userId ? undefined : 'anonymous-ip-placeholder';

    // Submit the vote
    const voteResult = await submitPollVote(
      validatedData.pollId,
      validatedData.optionId,
      userId,
      voterIp
    );

    if (!voteResult.success) {
      return voteResult;
    }

    // Revalidate the poll page to show updated results
    revalidatePath(`/polls/${validatedData.pollId}`);

    return createSuccessResponse();
  } catch (error) {
    return handleError(error, 'submitVote');
  }
}

/**
 * Get poll results with vote counts
 */
export async function getPollResults(pollId: string): Promise<ActionResult<Poll>> {
  try {
    // Validate poll ID
    const pollIdValidation = validatePollId(pollId);
    if (!pollIdValidation.success) {
      return pollIdValidation;
    }

    const validatedPollId = pollIdValidation.data!;

    // Get poll results from database
    const pollResult = await getPollResultsFromDB(validatedPollId);
    if (!pollResult.success) {
      return pollResult;
    }

    return createSuccessResponse(pollResult.data);
  } catch (error) {
    return handleError(error, 'getPollResults');
  }
}