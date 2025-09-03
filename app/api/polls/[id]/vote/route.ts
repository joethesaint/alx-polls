import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { optionId } = await request.json();

    // Get the current user session (skip in dev mode)
    let session = null;
    let userId = "00000000-0000-0000-0000-000000000001"; // Default dev user ID

    if (process.env.NODE_ENV !== "development") {
      const { data } = await supabase.auth.getSession();
      session = data.session;

      if (!session) {
        return NextResponse.json(
          { error: "You must be logged in to vote" },
          { status: 401 },
        );
      }

      userId = session.user.id;
    }

    // Get the poll details
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, question, user_id") // Select only necessary fields
      .eq("id", id)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Validate option ID (assuming optionId is a valid UUID)
    // You might want to add more robust validation here, e.g., checking if optionId belongs to the poll

    // Insert the vote
    const { error: voteError } = await supabase.from("poll_votes").insert({
      poll_id: id,
      option_id: optionId,
      user_id: userId,
      voter_ip: userId ? undefined : "anonymous-ip-placeholder", // Add voter_ip if userId is null
    });

    if (voteError) {
      console.error("Error inserting vote:", voteError);
      return NextResponse.json(
        { error: "Failed to record vote" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
