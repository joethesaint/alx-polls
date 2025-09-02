'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PollQRCode from '../../../../components/PollQRCode';
import { getPollResults } from '../../../../lib/vote-actions';

export default function SharePollPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pollTitle, setPollTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPollDetails = async () => {
      try {
        setLoading(true);
        const result = await getPollResults(params.id);
        
        if (result.success && result.poll) {
          setPollTitle(result.poll.title);
        } else {
          setError('Failed to load poll details');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching poll details:', error);
        setError('Failed to load poll details');
        setLoading(false);
      }
    };

    fetchPollDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <p className="text-red-800">{error}</p>
        </div>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold text-center mb-6">{pollTitle}</h1>
          
          <div className="mb-8">
            <PollQRCode pollId={params.id} size={200} />
          </div>
          
          <div className="flex space-x-4">
            <Link 
              href={`/polls/${params.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
            >
              View Poll
            </Link>
            
            <Link 
              href="/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}