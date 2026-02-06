import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Sfera
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Home Feed</h2>
          <p className="text-gray-600">
            Your community posts will appear here. Start by joining some
            communities!
          </p>
          {currentUser && (
            <p className="mt-4 text-sm text-gray-500">
              Logged in as: {currentUser.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
