import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isDevMode } from "../../lib/dev-auth";
import { supabase } from "../../lib/supabase";

interface Poll {
  id: string;
  question: string;
  created_at: string;
}

async function getPolls(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("polls")
    .select("id, question, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching polls:", error);
    return [];
  }
  return data;
}

export default async function DashboardPage() {
  let session = null;

  // Only check session if not in dev mode
  if (!isDevMode()) {
    const { data } = await supabase.auth.getSession();
    session = data.session;

    if (!session) {
      redirect("/auth/login");
    }
  }

  // For dev mode, we'll use a placeholder user ID
  const userId = session?.user?.id || "00000000-0000-0000-0000-000000000001";
  const polls = await getPolls(supabase, userId);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Polls Dashboard</h1>
          <p className="text-muted-foreground">Create and manage your polls.</p>
          {isDevMode() && !session && (
            <p className="text-sm text-yellow-600 mt-1">
              🟡 Development Mode - Using dev user session
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/polls/create" className="btn btn-primary">
            Create Poll
          </Link>
          {isDevMode() && !session && (
            <Link
              href="/auth/logout"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout (Dev)
            </Link>
          )}
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-12">
          <h2 className="text-xl font-medium">No Polls Found</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            Get started by creating your first poll.
          </p>
          <Link href="/polls/create" className="btn btn-secondary">
            Create a Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll: Poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-lg">
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-4">{poll.question}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{new Date(poll.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex space-x-2">
          <Link href={`/polls/${poll.id}`} className="btn btn-secondary flex-1">
            View
          </Link>
          <Link href={`/polls/${poll.id}/share`} className="btn btn-ghost">
            Share
          </Link>
        </div>
      </div>
    </div>
  );
}
