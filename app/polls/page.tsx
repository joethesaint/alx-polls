import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default async function PollsPage() {
  let session = null;

  // Only check session if not in dev mode
  if (process.env.NODE_ENV !== "development") {
    const { data } = await supabase.auth.getSession();
    session = data.session;

    if (!session) {
      redirect("/auth/login");
    }
  }

  // Fetch all polls
  const { data: polls, error } = await supabase
    .from("polls")
    .select(`
      id,
      question,
      created_at,
      users!inner(email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching polls:", error);
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Polls</h1>
        <Link
          href="/polls/create"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
        >
          Create New Poll
        </Link>
      </div>

      {polls && polls.length > 0 ? (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <div key={poll.id} className="card">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold">{poll.question}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(poll.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Created by: {poll.users?.[0]?.email || "Unknown"}
                </span>

                <div className="space-x-2">
                  <Link
                    href={`/polls/${poll.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    View & Vote
                  </Link>
                  <Link
                    href={`/polls/${poll.id}/share`}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Share
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No polls available yet.</p>
          <Link
            href="/polls/create"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Create the First Poll
          </Link>
        </div>
      )}
    </div>
  );
}
