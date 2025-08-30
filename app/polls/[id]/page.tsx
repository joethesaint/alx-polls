'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  options: PollOption[];
  totalVotes: number;
}

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching poll details from an API
    const fetchPollDetails = async () => {
      try {
        // This would be replaced with an actual API call
        setTimeout(() => {
          // Mock data based on the poll ID
          const mockPoll: Poll = {
            id: params.id,
            title: params.id === '1' 
              ? 'Favorite Programming Language' 
              : params.id === '2' 
                ? 'Best Frontend Framework' 
                : 'Remote Work Preference',
            description: params.id === '1' 
              ? 'What is your favorite programming language?' 
              : params.id === '2' 
                ? 'Which frontend framework do you prefer?' 
                : 'Do you prefer working remotely or in an office?',
            createdAt: new Date().toISOString(),
            options: params.id === '1' 
              ? [
                  { id: '1', text: 'JavaScript', votes: 15 },
                  { id: '2', text: 'Python', votes: 12 },
                  { id: '3', text: 'Java', votes: 8 },
                  { id: '4', text: 'C#', votes: 7 },
                ] 
              : params.id === '2' 
                ? [
                    { id: '1', text: 'React', votes: 18 },
                    { id: '2', text: 'Vue', votes: 10 },
                    { id: '3', text: 'Angular', votes: 8 },
                  ] 
                : [
                    { id: '1', text: 'Remote', votes: 15 },
                    { id: '2', text: 'Office', votes: 8 },
                    { id: '3', text: 'Hybrid', votes: 5 },
                  ],
            totalVotes: params.id === '1' ? 42 : params.id === '2' ? 36 : 28,
          };
          setPoll(mockPoll);
          setLoading(false);
        }, 1000);
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
      // Simulate API call to submit vote
      console.log(`Voting for option ${selectedOption} in poll ${params.id}`);
      
      // Update UI optimistically
      if (poll) {
        const updatedOptions = poll.options.map(option => {
          if (option.id === selectedOption) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });
        
        setPoll({
          ...poll,
          options: updatedOptions,
          totalVotes: poll.totalVotes + 1
        });
        
        setHasVoted(true);
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
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
        <p className="text-gray-600 mb-4">{poll.description}</p>
        <div className="text-sm text-gray-500 mb-6">
          Created on {new Date(poll.createdAt).toLocaleDateString()} • {poll.totalVotes} votes
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
              {poll.options.map((option) => {
                const percentage = poll.totalVotes > 0 
                  ? Math.round((option.votes / poll.totalVotes) * 100) 
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
              {poll.options.map((option) => (
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