import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCommunities,
  getAllCommunities,
} from "../services/communityService";
import CreateCommunity from "../components/CreateCommunity";

function Communities() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [myCommunities, setMyCommunities] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("my"); // my, explore

  useEffect(() => {
    loadCommunities();
  }, [currentUser]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const [myComms, allComms] = await Promise.all([
          getCommunities(currentUser.uid),
          getAllCommunities(),
        ]);
        console.log("My Communities:", myComms);
        console.log("All Communities:", allComms);
        console.log("Current User ID:", currentUser.uid);
        setMyCommunities(myComms);
        setAllCommunities(allComms);
      } else {
        const allComms = await getAllCommunities();
        setAllCommunities(allComms);
      }
    } catch (error) {
      console.error("Error loading communities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Communities</h1>
          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create Community</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        {currentUser && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("my")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "my"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Communities ({myCommunities.length})
              </button>
              <button
                onClick={() => setActiveTab("explore")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "explore"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Communities ({allCommunities.length})
              </button>
            </nav>
          </div>
        )}

        {/* Communities Grid */}
        {activeTab === "my" && currentUser ? (
          <div>
            {myCommunities.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No communities yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create or join a community to get started
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Community
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onClick={() => navigate(`/communities/${community.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {allCommunities.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No communities yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to create a community!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onClick={() => navigate(`/communities/${community.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunity onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

// Community Card Component
const CommunityCard = ({ community, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {community.imageUrl && (
        <img
          src={community.imageUrl}
          alt={community.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {community.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {community.description}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>{community.memberCount}</span>
            </span>
            <span>•</span>
            <span className="capitalize">
              {community.isPublic ? "Public" : "Private"}
            </span>
          </div>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            {community.isCollaborative ? "Collaborative" : "Informational"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Communities;
