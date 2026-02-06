import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Profile page coming soon...</p>
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

export default Profile;
