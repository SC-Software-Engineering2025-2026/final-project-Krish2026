import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCommunities, joinCommunity } from "../services/communityService";
import { useAuth } from "../context/AuthContext";

function Discover() {
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningCommunityId, setJoiningCommunityId] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllCommunities();

      // Filter out communities the user has already joined
      const unjoined = currentUser
        ? data.filter(
            (community) => !community.members?.includes(currentUser.uid),
          )
        : data;

      setCommunities(unjoined);
      setFilteredCommunities(unjoined);
    } catch (err) {
      console.error("Error fetching communities:", err);
      setError("Failed to load communities");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  useEffect(() => {
    // Filter communities based on search term
    if (searchTerm.trim() === "") {
      setFilteredCommunities(communities);
    } else {
      const filtered = communities.filter(
        (community) =>
          community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (community.description &&
            community.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      );
      setFilteredCommunities(filtered);
    }
  }, [searchTerm, communities]);

  const handleJoinCommunity = async (communityId, isPublic) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      setJoiningCommunityId(communityId);
      await joinCommunity(currentUser.uid, communityId, isPublic);
      // Refresh communities to update member status
      await fetchCommunities();
    } catch (err) {
      console.error("Error joining community:", err);
      alert("Failed to join community. Please try again.");
    } finally {
      setJoiningCommunityId(null);
    }
  };

  const handleViewCommunity = (communityId) => {
    navigate(`/communities/${communityId}`);
  };

  const isMember = (community) => {
    return currentUser && community.members?.includes(currentUser.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading communities...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Discover Communities
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search communities by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
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
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredCommunities.length} of {communities.length}{" "}
            communities
          </p>
        </div>

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">
              {searchTerm
                ? "No communities found matching your search."
                : currentUser
                  ? "You've joined all available communities!"
                  : "No communities available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
              >
                {/* Community Image */}
                {community.imageUrl && (
                  <img
                    src={community.imageUrl}
                    alt={community.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}

                {/* Community Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 flex-1">
                      {community.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        community.isPublic
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {community.isPublic ? "Public" : "Private"}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {community.description || "No description available"}
                  </p>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <svg
                      className="h-4 w-4 mr-1"
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
                    {community.memberCount || 0} members
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleViewCommunity(community.id)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Discover;
