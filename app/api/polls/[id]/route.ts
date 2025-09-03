import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: poll, error } = await supabase
      .from("polls")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
