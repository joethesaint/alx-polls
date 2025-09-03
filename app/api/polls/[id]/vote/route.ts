import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { optionIndex } = await request.json();

    // Get the current user session (skip in dev mode)
    let session = null;
    let userId = '00000000-0000-0000-0000-000000000001'; // Default dev user ID
    
    if (process.env.NODE_ENV !== 'development') {
      const { data } = await supabase.auth.getSession();
      session = data.session;
      
      if (!session) {
        return NextResponse.json(
          { error: 'You must be logged in to vote' },
          { status: 401 }
        );
      }
      
      userId = session.user.id;
    }

    // Get the poll details
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Check if poll is active
    if (!poll.is_active) {
      return NextResponse.json(
        { error: 'This poll is no longer active' },
        { status: 400 }
      );
    }

    // Check if poll has expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This poll has expired' },
        { status: 400 }
      );
    }

    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Check if user has already voted (if multiple votes not allowed)
    if (!poll.allow_multiple_votes) {
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', id)
        .eq('user_id', userId)
        .single();

      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted on this poll' },
          { status: 400 }
        );
      }
    }

    // Insert the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: id,
        user_id: userId,
        option_index: optionIndex,
        created_at: new Date().toISOString()
      });

    if (voteError) {
      console.error('Error inserting vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
