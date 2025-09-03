import { supabase } from "./supabase";
import { Poll, ActionResult } from "./types";

/**
 * Get a poll by ID with its options
 */
export async function getPollById(pollId: string): Promise<ActionResult<Poll>> {
  try {
    const { data: poll, error } = await supabase
      .from("polls")
      .select("id, question, created_at, updated_at, user_id, poll_options(*)")
      .eq("id", pollId)
      .single();

    if (error) {
      console.error("Error fetching poll:", error);
      return {
        success: false,
        errors: { root: { _errors: ["Poll not found"] } },
      };
    }

    return {
      success: true,
      data: poll as Poll,
    };
  } catch (error) {
    console.error("Error in getPollById:", error);
    return {
      success: false,
      errors: {
        root: { _errors: ["Failed to fetch poll. Please try again."] },
      },
    };
  }
}

/**
 * Submit a vote for a poll option
 */
export async function submitPollVote(
  pollId: string,
  optionId: string,
  userId?: string,
  voterIp?: string,
): Promise<ActionResult<void>> {
  try {
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
      voter_ip: voterIp,
    });

    if (error) {
      console.error("Error submitting vote:", error);
      return {
        success: false,
        errors: {
          root: { _errors: ["Failed to submit vote. Please try again."] },
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in submitPollVote:", error);
    return {
      success: false,
      errors: {
        root: { _errors: ["An unexpected error occurred. Please try again."] },
      },
    };
  }
}

/**
 * Get poll results with vote counts
 */
export async function getPollResults(
  pollId: string,
): Promise<ActionResult<Poll>> {
  try {
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(`
        id,
        question,
        created_at,
        updated_at,
        user_id,
        poll_options (
          *,
          poll_votes (count)
        )
      `)
      .eq("id", pollId)
      .single();

    if (pollError) {
      console.error("Error fetching poll results:", pollError);
      return {
        success: false,
        errors: {
          root: {
            _errors: ["Failed to fetch poll results. Please try again."],
          },
        },
      };
    }

    return {
      success: true,
      data: poll as Poll,
    };
  } catch (error) {
    console.error("Error in getPollResults:", error);
    return {
      success: false,
      errors: {
        root: { _errors: ["An unexpected error occurred. Please try again."] },
      },
    };
  }
}
