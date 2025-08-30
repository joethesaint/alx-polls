'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Poll {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  votesCount: number;
}

export default function DashboardPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching polls from an API
    const fetchPolls = async () => {
      try {
        // This would be replaced with an actual API call
        setTimeout(() => {
          const mockPolls: Poll[] = [
            {
              id: '1',
              title: 'Favorite Programming Language',
              description: 'What is your favorite programming language?',
              createdAt: new Date().toISOString(),
              votesCount: 42,
            },
            {
              id: '2',
              title: 'Best Frontend Framework',
              description: 'Which frontend framework do you prefer?',
              createdAt: new Date().toISOString(),
              votesCount: 36,
            },
            {
              id: '3',
              title: 'Remote Work Preference',
              description: 'Do you prefer working remotely or in an office?',
              createdAt: new Date().toISOString(),
              votesCount: 28,
            },
          ];
          setPolls(mockPolls);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching polls:', error);
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
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
            <Link key={poll.id} href={`/polls/${poll.id}`}>
              <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">{poll.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                  <span>{poll.votesCount} votes</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}