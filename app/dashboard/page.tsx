import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface Poll {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_public: boolean;
  allow_multiple_votes: boolean;
  user_id: string;
  vote_count: number;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Fetch user's polls from Supabase
  const { data: polls, error } = await supabase
    .from('polls')
    .select('id, title, description, created_at, is_public, allow_multiple_votes, user_id, vote_count')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching polls:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Polls Dashboard</h1>
        <Link 
          href="/polls/create" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Poll
        </Link>
      </div>

      {!polls || polls.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">No polls found</p>
          <Link 
            href="/polls/create" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create your first poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{poll.description}</p>
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                <span>{poll.vote_count || 0} votes</span>
              </div>
              <div className="flex space-x-2">
                <Link 
                  href={`/polls/${poll.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm flex-1 text-center"
                >
                  View Poll
                </Link>
                <Link 
                  href={`/polls/${poll.id}/share`}
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}