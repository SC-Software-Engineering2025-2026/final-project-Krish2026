import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCommunities, joinCommunity } from "../services/communityService";
import { searchUsers } from "../services/profileService";
import { useAuth } from "../context/AuthContext";
import COLORS from "../theme/colors";

function Discover() {
  const [activeTab, setActiveTab] = useState("communities"); // "communities" or "users"
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await searchUsers();

      // Filter out current user
      const otherUsers = currentUser
        ? data.filter((user) => user.id !== currentUser.uid)
        : data;

      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === "communities") {
      fetchCommunities();
    } else {
      fetchUsers();
    }
  }, [activeTab, fetchCommunities, fetchUsers]);

  useEffect(() => {
    // Filter based on active tab and search term
    if (activeTab === "communities") {
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
    } else {
      if (searchTerm.trim() === "") {
        setFilteredUsers(users);
      } else {
        const filtered = users.filter(
          (user) =>
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.displayName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        setFilteredUsers(filtered);
      }
    }
  }, [searchTerm, communities, users, activeTab]);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600 dark:text-gray-400">
              Loading communities...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
          Discover
        </h1>

        {/* Tabs */}
        <div className="mb-6 flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab("communities");
              setSearchTerm("");
            }}
            style={{
              backgroundColor:
                activeTab === "communities" ? COLORS.Dark_Gray : "transparent",
              color: activeTab === "communities" ? COLORS.Beige : "inherit",
              borderBottomWidth: activeTab === "communities" ? "2px" : "0",
              borderBottomColor:
                activeTab === "communities" ? COLORS.Dark_Gray : "transparent",
            }}
            className="px-6 py-3 font-medium rounded-t-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            Communities
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
              setSearchTerm("");
            }}
            style={{
              backgroundColor:
                activeTab === "users" ? COLORS.Dark_Gray : "transparent",
              color: activeTab === "users" ? COLORS.Beige : "inherit",
              borderBottomWidth: activeTab === "users" ? "2px" : "0",
              borderBottomColor:
                activeTab === "users" ? COLORS.Dark_Gray : "transparent",
            }}
            className="px-6 py-3 font-medium rounded-t-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            Users
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={
                activeTab === "communities"
                  ? "Search communities by name or description..."
                  : "Search users by username or name..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {activeTab === "communities"
              ? `Showing ${filteredCommunities.length} of ${communities.length} communities`
              : `Showing ${filteredUsers.length} of ${users.length} users`}
          </p>
        </div>

        {/* Communities Grid */}
        {activeTab === "communities" && (
          <>
            {filteredCommunities.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
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
                    className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
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
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                          {community.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            community.isPublic
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          }`}
                        >
                          {community.isPublic ? "Public" : "Private"}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {community.description || "No description available"}
                      </p>

                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                        className="w-full px-4 py-2 rounded-lg transition-colors"
                        style={{
                          backgroundColor: COLORS.Dark_Gray,
                          color: COLORS.Beige,
                        }}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Users Grid */}
        {activeTab === "users" && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {searchTerm
                    ? "No users found matching your search."
                    : "No users available."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    {/* User Profile Image */}
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.username}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 text-xl font-medium">
                              {user.username?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {user.displayName || user.username || "User"}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{user.username || "unknown"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {user.followersCount || 0}
                            </span>{" "}
                            followers
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {user.followingCount || 0}
                            </span>{" "}
                            following
                          </div>
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${user.id}`);
                        }}
                        className="w-full mt-4 px-4 py-2 rounded-lg transition-colors"
                        style={{
                          backgroundColor: COLORS.Dark_Gray,
                          color: COLORS.Beige,
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Discover;
