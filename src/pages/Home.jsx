import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../services/profileService";
import PostUpload from "../components/PostUpload";
import {
  PlusIcon,
  PhotoIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showPostUpload, setShowPostUpload] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
    };
    loadUserProfile();
  }, [currentUser]);

  const handlePostCreated = (postId) => {
    // Navigate to the new post or refresh feed
    navigate(`/post/${postId}`);
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Sfera
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A modern social media platform for digital communities
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <PhotoIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Share Your Moments
            </h3>
            <p className="text-gray-600">
              Upload photos and share your experiences with the community
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <UserGroupIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Join Communities
            </h3>
            <p className="text-gray-600">
              Connect with like-minded people in various communities
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <GlobeAltIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Discover Content
            </h3>
            <p className="text-gray-600">
              Explore new content and discover amazing creators
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back,{" "}
              {userProfile?.username || currentUser.displayName || "User"}!
            </h1>
            <p className="text-gray-600">
              View new moments from your communities!
            </p>
          </div>
          <button
            onClick={() => setShowPostUpload(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Feed Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Feed</h2>
        <div className="text-center py-12">
          <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start following people or join communities to see posts in your feed
          </p>
          <button
            onClick={() => setShowPostUpload(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Create Your First Post
          </button>
        </div>
      </div>

      {/* Post Upload Modal */}
      {showPostUpload && (
        <PostUpload
          onClose={() => setShowPostUpload(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default Home;
