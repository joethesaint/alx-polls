"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PollQRCode from "../../../../components/PollQRCode";

export default function SharePollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const _router = useRouter();
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollId, setPollId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPollDetails = async () => {
      try {
        setLoading(true);
        const resolvedParams = await params;
        const response = await fetch(`/api/polls/${resolvedParams.id}`);

        if (response.ok) {
          const pollData = await response.json();
          setPollQuestion(pollData.question);
          setPollId(pollData.id);
        } else {
          setError("Failed to load poll details");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching poll details:", error);
        setError("Failed to load poll details");
        setLoading(false);
      }
    };

    fetchPollDetails();
  }, [params]);

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
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold text-center mb-6">
            {pollQuestion}
          </h1>

          <div className="mb-8">
            <PollQRCode pollId={pollId} size={200} />
          </div>

          <div className="flex space-x-4">
            <Link href={`/polls/${pollId}`} className="btn btn-primary">
              View Poll
            </Link>

            <Link href="/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}