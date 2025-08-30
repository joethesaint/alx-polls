export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to ALX Polls</h1>
        <p className="text-xl mb-8">
          Create, share, and participate in polls on any topic.
        </p>
        
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <h3 className="text-lg font-medium mb-2">Create Polls</h3>
              <p className="text-gray-600">
                Easily create custom polls with multiple options and share them with others.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Vote Securely</h3>
              <p className="text-gray-600">
                Cast your vote on polls and see real-time results as they come in.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Track Results</h3>
              <p className="text-gray-600">
                Monitor poll performance with detailed analytics and visualizations.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Get Started Today</h2>
          <p className="mb-6">
            Join our community and start creating and participating in polls.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md"
            >
              Sign Up
            </a>
            <a
              href="/auth/login"
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-md border border-blue-200"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
