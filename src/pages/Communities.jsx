import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCommunities } from "../services/communityService";
import CreateCommunity from "../components/CreateCommunity";
import { COLORS } from "../theme/colors";

function Communities() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [myCommunities, setMyCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, [currentUser]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const myComms = await getCommunities(currentUser.uid);
        console.log("My Communities:", myComms);
        console.log("Current User ID:", currentUser.uid);
        setMyCommunities(myComms);
      }
    } catch (error) {
      console.error("Error loading communities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Communities
          </h1>
          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-lg flex items-center space-x-2 font-medium"
              style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
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

        {/* Communities Grid */}
        {currentUser && (
          <div>
            {myCommunities.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No communities yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create or join a community to get started
                </p>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2 rounded-lg"
                    style={{
                      backgroundColor: COLORS.Dark_Gray,
                      color: COLORS.Beige,
                    }}
                  >
                    Create Your First Community
                  </button>
                  <button
                    onClick={() => navigate("/discover")}
                    className="px-6 py-2 rounded-lg"
                    style={{
                      backgroundColor: COLORS.Dark_Gray,
                      color: COLORS.Beige,
                    }}
                  >
                    Go to Discover Page
                  </button>
                </div>
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      {community.imageUrl && (
        <img
          src={community.imageUrl}
          alt={community.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6 flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {community.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {community.description}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>
                {
                  new Set([
                    ...(community.members || []),
                    ...(community.admins || []),
                  ]).size
                }
              </span>
            </span>
            <span>•</span>
            <span className="capitalize">
              {community.isPublic ? "Public" : "Private"}
            </span>
          </div>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
            {community.isCollaborative ? "Collaborative" : "Informational"}
          </span>
        </div>
        {/* Category bubbles horizontal list at bottom */}
        {community.categories?.some((cat) => cat) && (
          <div className="flex flex-row flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {community.categories
              .slice(0, 3)
              .filter((cat) => cat)
              .map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 bg-gray-800 dark:bg-beige-700 text-gray-100 dark:text-beige-100 text-xs font-medium rounded-full border border-gray-900 dark:border-beige-800"
                >
                  {cat}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Communities;
