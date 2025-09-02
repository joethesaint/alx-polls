'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitVote, getPollResults } from '../../../lib/vote-actions';
import PollQRCode from '../../../components/PollQRCode';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_public: boolean;
  allow_multiple_votes: boolean;
  user_id: string;
  poll_options: {
    id: string;
    text: string;
    votes: number;
  }[];
}

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch poll details using the server action
    const fetchPollDetails = async () => {
      try {
        setLoading(true);
        const result = await getPollResults(params.id);
        
        if (result.success && result.poll) {
          setPoll(result.poll);
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

  const handleVote = async () => {
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    setError(null);
    
    try {
      // Call the server action to submit the vote
      const result = await submitVote({
        pollId: params.id,
        optionId: selectedOption
      });
      
      if (result.success) {
        // Fetch updated poll results
        const updatedResult = await getPollResults(params.id);
        
        if (updatedResult.success && updatedResult.poll) {
          setPoll(updatedResult.poll);
        }
        
        setHasVoted(true);
      } else if (result.errors?.root?._errors) {
        setError(result.errors.root._errors[0]);
      } else {
        setError('Failed to submit your vote. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('Failed to submit your vote. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading poll details...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 p-4 rounded-md mb-4">
          <p className="text-yellow-700">Poll not found</p>
        </div>
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
        <p className="text-gray-600 mb-4">{poll.description}</p>
        <div className="text-sm text-gray-500 mb-6">
          Created on {new Date(poll.created_at).toLocaleDateString()} • {poll.poll_options.reduce((sum, option) => sum + option.votes, 0)} votes
        </div>
        
        {/* Share Poll Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Share this Poll</h2>
              <Link 
                href={`/polls/${params.id}/share`}
                className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share Page
              </Link>
            </div>
            <PollQRCode pollId={params.id} />
          </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {hasVoted ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="space-y-4">
              {poll.poll_options.map((option) => {
                const totalVotes = poll.poll_options.reduce((sum, opt) => sum + opt.votes, 0);
                const percentage = totalVotes > 0 
                  ? Math.round((option.votes / totalVotes) * 100) 
                  : 0;
                
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{option.text}</span>
                      <span className="text-gray-500">
                        {option.votes} votes ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <p className="text-green-600 font-medium">Thank you for voting!</p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Cast your vote</h2>
            <div className="space-y-3">
              {poll.poll_options.map((option) => (
                <div key={option.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${option.id}`}
                    name="poll-option"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={() => setSelectedOption(option.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label 
                    htmlFor={`option-${option.id}`} 
                    className="ml-2 block text-gray-700"
                  >
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button
                onClick={handleVote}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
              >
                Submit Vote
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}