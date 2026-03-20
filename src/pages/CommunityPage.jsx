import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCommunity,
  joinCommunity,
  subscribeToCommunity,
} from "../services/communityService";
import { useCommunityRole } from "../hooks/useCommunityPermissions";
import CommunityHome from "../components/CommunityHome";
import InfoCommunityHome from "../components/InfoCommunityHome";
import CommunityPosts from "../components/CommunityPosts";
import InfoCommunityPosts from "../components/InfoCommunityPosts";
import CommunityChat from "../components/CommunityChat";
import AdminChat from "../components/AdminChat";
import UserToAdminMessaging from "../components/UserToAdminMessaging";
import MediaLibrary from "../components/MediaLibrary";
import CommunitySettings from "../components/CommunitySettings";
import { COLORS } from "../theme/colors";

const CommunityPage = () => {
  const { communityId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [joining, setJoining] = useState(false);
  const [membershipRefresh, setMembershipRefresh] = useState(0);

  const {
    role,
    isAdmin,
    isMember,
    loading: roleLoading,
  } = useCommunityRole(communityId, currentUser?.uid, membershipRefresh);

  useEffect(() => {
    if (!communityId) return;

    // Subscribe to real-time community updates
    const unsubscribe = subscribeToCommunity(communityId, (data) => {
      setCommunity(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [communityId]);

  const handleJoin = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setJoining(true);
    try {
      await joinCommunity(communityId, currentUser.uid);
      // Trigger a refresh of the membership status
      setMembershipRefresh((prev) => prev + 1);
      // Set active tab to home
      setActiveTab("home");
    } catch (error) {
      console.error("Error joining community:", error);
      alert(error.message || "Failed to join community");
    } finally {
      setJoining(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Community Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The community you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate("/communities")}
          className="px-6 py-2 rounded-lg"
          style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
        >
          Browse Communities
        </button>
      </div>
    );
  }

  // Allow non-members to view public communities but they will see join button on home page
  // We don't block access, just pass the isMember status to components

  // Private community non-member view
  if (!isMember && !community.isPublic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Private Community
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This is a private community. You need an invitation to join.
          </p>
          <button
            onClick={() => navigate("/communities")}
            className="px-6 py-2 rounded-lg"
            style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
          >
            Browse Other Communities
          </button>
        </div>
      </div>
    );
  }

  // Determine available tabs based on community type
  const tabs = [];
  tabs.push({ id: "home", label: "Home" });

  // Only show other tabs if user is a member
  if (isMember) {
    tabs.push({ id: "posts", label: "Posts" });

    if (community.isCollaborative) {
      // Check if chat is enabled (defaults to true if not specified)
      if (community.chatEnabled !== false) {
        tabs.push({ id: "chat", label: "Chat" });
      }
      // Check if media is enabled (defaults to true if not specified)
      if (community.mediaEnabled !== false) {
        tabs.push({ id: "media", label: "Media" });
      }
    } else {
      // Informational community tabs
      if (isAdmin) {
        tabs.push({ id: "adminChat", label: "Admin Chat" });
      }
      tabs.push({
        id: "userToAdmin",
        label: isAdmin ? "Member Messages" : "Message Admins",
      });
    }

    if (isAdmin) {
      tabs.push({ id: "settings", label: "Settings" });
    }
  } // End of isMember check

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-8">
      {/* Community Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              {community.imageUrl && (
                <img
                  src={community.imageUrl}
                  alt={community.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {community.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {community.memberCount} members
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/communities")}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Back to Communities
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "home" &&
          (community.isCollaborative ? (
            <CommunityHome
              communityId={communityId}
              userRole={role}
              isMember={isMember}
              onJoin={handleJoin}
              joining={joining}
            />
          ) : (
            <InfoCommunityHome
              communityId={communityId}
              userRole={role}
              isMember={isMember}
              onJoin={handleJoin}
              joining={joining}
            />
          ))}

        {activeTab === "posts" &&
          (community.isCollaborative ? (
            <CommunityPosts
              communityId={communityId}
              userRole={role}
              isCollaborative={community.isCollaborative}
            />
          ) : (
            <InfoCommunityPosts communityId={communityId} userRole={role} />
          ))}

        {activeTab === "chat" && community.isCollaborative && (
          <CommunityChat communityId={communityId} />
        )}

        {activeTab === "adminChat" && !community.isCollaborative && isAdmin && (
          <AdminChat communityId={communityId} />
        )}

        {activeTab === "userToAdmin" && !community.isCollaborative && (
          <UserToAdminMessaging communityId={communityId} userRole={role} />
        )}

        {activeTab === "media" && community.isCollaborative && (
          <MediaLibrary communityId={communityId} userRole={role} />
        )}

        {activeTab === "settings" && isAdmin && (
          <CommunitySettings communityId={communityId} userRole={role} />
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
