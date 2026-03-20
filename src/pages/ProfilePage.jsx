import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUserProfile,
  toggleProfilePrivacy,
  subscribeToUserProfile,
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowers,
  getUserFollowing,
  sendFollowRequest,
  cancelFollowRequest,
  hasFollowRequestPending,
} from "../services/profileService";
import { getCommunitiesByIds } from "../services/communityService";
import COLORS from "../theme/colors";
import EditProfile from "../components/EditProfile";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  LockOpenIcon,
  PhotoIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  UserPlusIcon,
  UserMinusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  canMessageUser,
  createOrGetDirectMessageChannel,
} from "../services/directMessageService";

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showCommunitiesModal, setShowCommunitiesModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [followersSearchQuery, setFollowersSearchQuery] = useState("");
  const [followingSearchQuery, setFollowingSearchQuery] = useState("");
  const [communitiesSearchQuery, setCommunitiesSearchQuery] = useState("");
  const [hasRequestedFollow, setHasRequestedFollow] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);
  const [privacyPopupMessage, setPrivacyPopupMessage] = useState("");
  const [startingDirectMessage, setStartingDirectMessage] = useState(false);
  const dropdownRef = useRef(null);

  // Determine if viewing own profile
  const isOwnProfile = currentUser && (userId === currentUser.uid || !userId);
  const profileId = userId || currentUser?.uid;

  useEffect(() => {
    if (!profileId) {
      navigate("/login");
      return;
    }

    // Subscribe to profile updates in real-time
    const unsubscribe = subscribeToUserProfile(
      profileId,
      async (profileData) => {
        setLoading(true);
        setError(null);

        if (!profileData) {
          setError("Profile not found");
          setLoading(false);
          return;
        }

        // Load profile data regardless of privacy settings
        // We'll handle the view restrictions in the UI
        setProfile(profileData);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [profileId, isOwnProfile, navigate]);

  // Check if current user is following this profile
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isOwnProfile && currentUser && profileId) {
        try {
          const following = await isFollowing(currentUser.uid, profileId);
          setIsFollowingUser(following);

          // Also check if there's a pending follow request
          if (!following) {
            const hasPendingRequest = await hasFollowRequestPending(
              currentUser.uid,
              profileId,
            );
            setHasRequestedFollow(hasPendingRequest);
          }
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      }
    };

    checkFollowStatus();
  }, [isOwnProfile, currentUser, profileId]);

  // Fetch communities when communities tab is active or joinedCommunities changes
  useEffect(() => {
    const fetchCommunities = async () => {
      if (
        profile &&
        profile.joinedCommunities &&
        profile.joinedCommunities.length > 0
      ) {
        setCommunitiesLoading(true);
        try {
          const communityDetails = await getCommunitiesByIds(
            profile.joinedCommunities,
          );
          setCommunities(communityDetails);
        } catch (error) {
          console.error("Error fetching communities:", error);
        } finally {
          setCommunitiesLoading(false);
        }
      } else {
        setCommunities([]);
        setCommunitiesLoading(false);
      }
    };

    if (activeTab === "communities" && profile) {
      fetchCommunities();
    }
  }, [activeTab, profile?.joinedCommunities, profile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTogglePrivacy = async () => {
    try {
      const newPrivacyStatus = !profile.isPrivate;
      await toggleProfilePrivacy(profileId, newPrivacyStatus);
      // Profile will be updated via subscription
    } catch (err) {
      console.error("Error toggling privacy:", err);
      alert("Failed to update privacy settings");
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      setFollowLoading(true);

      if (isFollowingUser) {
        // Check if profile is private, require confirmation
        if (profile.isPrivate) {
          setShowUnfollowConfirm(true);
          setFollowLoading(false);
          return;
        }

        // Regular unfollow
        await unfollowUser(currentUser.uid, profileId);
        setIsFollowingUser(false);
        setProfile({
          ...profile,
          followersCount: Math.max((profile.followersCount || 0) - 1, 0),
        });
      } else if (hasRequestedFollow) {
        // Cancel pending follow request
        await cancelFollowRequest(currentUser.uid, profileId);
        setHasRequestedFollow(false);
      } else {
        // Check if profile is private
        if (profile.isPrivate) {
          // Send follow request
          await sendFollowRequest(currentUser.uid, profileId);
          setHasRequestedFollow(true);
        } else {
          // Regular follow
          await followUser(currentUser.uid, profileId);
          setIsFollowingUser(true);
          setProfile({
            ...profile,
            followersCount: (profile.followersCount || 0) + 1,
          });
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleConfirmUnfollow = async () => {
    try {
      setFollowLoading(true);
      await unfollowUser(currentUser.uid, profileId);
      setIsFollowingUser(false);
      setProfile({
        ...profile,
        followersCount: Math.max((profile.followersCount || 0) - 1, 0),
      });
      setShowUnfollowConfirm(false);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      alert("Failed to unfollow");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    // Profile will be updated via subscription
    setIsEditMode(false);
  };

  const handleStartDirectMessage = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!profileId || isOwnProfile) {
      return;
    }

    try {
      setStartingDirectMessage(true);
      const permission = await canMessageUser(currentUser.uid, profileId);

      if (!permission.allowed) {
        alert("This user is not accepting direct messages from you.");
        return;
      }

      const channel = await createOrGetDirectMessageChannel(
        currentUser.uid,
        profileId,
      );

      navigate(`/inbox?section=direct_messages&channel=${channel.id}`);
    } catch (error) {
      console.error("Error starting direct message:", error);
      alert("Failed to start direct message");
    } finally {
      setStartingDirectMessage(false);
    }
  };

  const handleOpenFollowersModal = async () => {
    // Check if profile is private and user is not following
    if (!isOwnProfile && profile.isPrivate && !isFollowingUser) {
      setPrivacyPopupMessage(
        "You cannot view followers due to privacy settings",
      );
      setShowPrivacyPopup(true);
      return;
    }

    setShowFollowersModal(true);
    setLoadingFollowers(true);
    try {
      const followers = await getUserFollowers(profileId);
      setFollowersList(followers);
    } catch (error) {
      console.error("Error loading followers:", error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handleOpenFollowingModal = async () => {
    // Check if profile is private and user is not following
    if (!isOwnProfile && profile.isPrivate && !isFollowingUser) {
      setPrivacyPopupMessage(
        "You cannot view following due to privacy settings",
      );
      setShowPrivacyPopup(true);
      return;
    }

    setShowFollowingModal(true);
    setLoadingFollowing(true);
    try {
      const following = await getUserFollowing(profileId);
      setFollowingList(following);
    } catch (error) {
      console.error("Error loading following:", error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleOpenCommunitiesModal = async () => {
    // Check if profile is private and user is not following
    if (!isOwnProfile && profile.isPrivate && !isFollowingUser) {
      setPrivacyPopupMessage(
        "You cannot view communities due to privacy settings",
      );
      setShowPrivacyPopup(true);
      return;
    }

    setShowCommunitiesModal(true);
    if (profile?.joinedCommunities && profile.joinedCommunities.length > 0) {
      setCommunitiesLoading(true);
      try {
        const communityDetails = await getCommunitiesByIds(
          profile.joinedCommunities,
        );
        setCommunities(communityDetails);
      } catch (error) {
        console.error("Error fetching communities:", error);
      } finally {
        setCommunitiesLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      alert("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <LockClosedIcon className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{error}</h2>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg"
            style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
          >
            Go Back
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <EditProfile
        profile={profile}
        onSave={handleProfileUpdate}
        onCancel={() => setIsEditMode(false)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        {/* Banner Image */}
        {profile.bannerImage && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-200">
            <img
              key={profile.bannerImage}
              src={`${profile.bannerImage}${profile.bannerImage.includes("?") ? "&" : "?"}t=${Date.now()}`}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex items-start gap-6 mt-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {profile.profileImage ? (
              <img
                key={profile.profileImage}
                src={`${profile.profileImage}${profile.profileImage.includes("?") ? "&" : "?"}t=${Date.now()}`}
                alt={profile.displayName}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <UserCircleIcon className="w-32 h-32 text-gray-400" />
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.firstName && profile.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.displayName || "Anonymous User"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {isOwnProfile && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                      title="More options"
                    >
                      <EllipsisVerticalIcon className="h-6 w-6" />
                    </button>
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            setIsEditMode(true);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                        >
                          <PencilIcon className="h-5 w-5" />
                          <span>Edit Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            navigate("/settings");
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                        >
                          <Cog6ToothIcon className="h-5 w-5" />
                          <span>Settings</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {profile.username && (
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                @{profile.username}
              </p>
            )}

            {profile.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div
                className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                onClick={handleOpenCommunitiesModal}
                title="View communities"
              >
                <p className="font-bold text-xl text-gray-900 dark:text-white">
                  {profile.joinedCommunities?.length || 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Communities
                </p>
              </div>
              <div
                className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                onClick={handleOpenFollowersModal}
                title="View followers"
              >
                <p className="font-bold text-xl text-gray-900 dark:text-white">
                  {profile.followersCount || 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Followers
                </p>
              </div>
              <div
                className="text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                onClick={handleOpenFollowingModal}
                title="View following"
              >
                <p className="font-bold text-xl text-gray-900 dark:text-white">
                  {profile.followingCount || 0}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Following
                </p>
              </div>
            </div>

            {/* Follow Button - positioned under stats */}
            {!isOwnProfile && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    backgroundColor:
                      isFollowingUser || hasRequestedFollow
                        ? "#d1d5db"
                        : COLORS.Dark_Gray,
                    color:
                      isFollowingUser || hasRequestedFollow
                        ? "#374151"
                        : COLORS.Beige,
                  }}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {followLoading ? (
                    <div
                      className="animate-spin rounded-full h-5 w-5 border-b-2"
                      style={{
                        borderColor:
                          isFollowingUser || hasRequestedFollow
                            ? "#374151"
                            : COLORS.Beige,
                      }}
                    ></div>
                  ) : hasRequestedFollow ? (
                    <>
                      <XMarkIcon className="h-5 w-5" />
                      <span>Requested</span>
                    </>
                  ) : isFollowingUser ? (
                    <>
                      <UserMinusIcon className="h-5 w-5" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5" />
                      <span>{profile.isPrivate ? "Request" : "Follow"}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleStartDirectMessage}
                  disabled={startingDirectMessage}
                  style={{
                    backgroundColor: COLORS.Dark_Gray,
                    color: COLORS.Beige,
                  }}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>
                    {startingDirectMessage ? "Opening..." : "Message"}
                  </span>
                </button>
              </div>
            )}

            {/* Links */}
            {profile.links && profile.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Me Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium text-black dark:text-[#EDE8DD]">
            <PhotoIcon className="h-5 w-5" />
            <span>About Me</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {!isOwnProfile && profile.isPrivate && !isFollowingUser ? (
          // Private profile view for non-followers
          <div className="text-center py-12">
            <LockClosedIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              This Account is Private
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {hasRequestedFollow
                ? "Your follow request is pending"
                : "Follow this account to see their photos"}
            </p>
          </div>
        ) : profile.coverImages && profile.coverImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.coverImages.map((imageUrl, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden bg-gray-200 aspect-[3/4]"
              >
                <img
                  src={imageUrl}
                  alt={`Cover photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PhotoIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No cover photos yet
            </h3>
            {isOwnProfile && (
              <p className="text-gray-600 dark:text-gray-400">
                Add cover photos to personalize your profile!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFollowersModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-stone-200">
                Followers
              </h2>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search followers..."
                  value={followersSearchQuery}
                  onChange={(e) => setFollowersSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-stone-200 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-160px)]">
              {loadingFollowers ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : followersList.filter((follower) => {
                  const searchLower = followersSearchQuery.toLowerCase();
                  const fullName =
                    `${follower.firstName || ""} ${follower.lastName || ""}`.toLowerCase();
                  const displayName = (
                    follower.displayName || ""
                  ).toLowerCase();
                  const username = (follower.username || "").toLowerCase();
                  return (
                    fullName.includes(searchLower) ||
                    displayName.includes(searchLower) ||
                    username.includes(searchLower)
                  );
                }).length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {followersList
                    .filter((follower) => {
                      const searchLower = followersSearchQuery.toLowerCase();
                      const fullName =
                        `${follower.firstName || ""} ${follower.lastName || ""}`.toLowerCase();
                      const displayName = (
                        follower.displayName || ""
                      ).toLowerCase();
                      const username = (follower.username || "").toLowerCase();
                      return (
                        fullName.includes(searchLower) ||
                        displayName.includes(searchLower) ||
                        username.includes(searchLower)
                      );
                    })
                    .map((follower) => (
                      <div
                        key={follower.id}
                        onClick={() => {
                          setShowFollowersModal(false);
                          navigate(`/profile/${follower.id}`);
                        }}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                      >
                        {follower.profileImage ? (
                          <img
                            key={follower.profileImage}
                            src={`${follower.profileImage}${follower.profileImage.includes("?") ? "&" : "?"}t=${Date.now()}`}
                            alt={follower.displayName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                              {follower.displayName?.[0]?.toUpperCase() ||
                                follower.firstName?.[0]?.toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-stone-200 truncate">
                            {follower.firstName && follower.lastName
                              ? `${follower.firstName} ${follower.lastName}`
                              : follower.displayName || "Anonymous User"}
                          </p>
                          {follower.username && (
                            <p className="text-sm text-gray-600 dark:text-stone-300 truncate">
                              @{follower.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-stone-300">
                    {followersSearchQuery
                      ? "No followers found"
                      : "No followers yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFollowingModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-stone-200">
                Following
              </h2>
              <button
                onClick={() => setShowFollowingModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search following..."
                  value={followingSearchQuery}
                  onChange={(e) => setFollowingSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-stone-200 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-160px)]">
              {loadingFollowing ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : followingList.filter((followingUser) => {
                  const searchLower = followingSearchQuery.toLowerCase();
                  const fullName =
                    `${followingUser.firstName || ""} ${followingUser.lastName || ""}`.toLowerCase();
                  const displayName = (
                    followingUser.displayName || ""
                  ).toLowerCase();
                  const username = (followingUser.username || "").toLowerCase();
                  return (
                    fullName.includes(searchLower) ||
                    displayName.includes(searchLower) ||
                    username.includes(searchLower)
                  );
                }).length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {followingList
                    .filter((followingUser) => {
                      const searchLower = followingSearchQuery.toLowerCase();
                      const fullName =
                        `${followingUser.firstName || ""} ${followingUser.lastName || ""}`.toLowerCase();
                      const displayName = (
                        followingUser.displayName || ""
                      ).toLowerCase();
                      const username = (
                        followingUser.username || ""
                      ).toLowerCase();
                      return (
                        fullName.includes(searchLower) ||
                        displayName.includes(searchLower) ||
                        username.includes(searchLower)
                      );
                    })
                    .map((followingUser) => (
                      <div
                        key={followingUser.id}
                        onClick={() => {
                          setShowFollowingModal(false);
                          navigate(`/profile/${followingUser.id}`);
                        }}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                      >
                        {followingUser.profileImage ? (
                          <img
                            key={followingUser.profileImage}
                            src={`${followingUser.profileImage}${followingUser.profileImage.includes("?") ? "&" : "?"}t=${Date.now()}`}
                            alt={followingUser.displayName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                              {followingUser.displayName?.[0]?.toUpperCase() ||
                                followingUser.firstName?.[0]?.toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-stone-200 truncate">
                            {followingUser.firstName && followingUser.lastName
                              ? `${followingUser.firstName} ${followingUser.lastName}`
                              : followingUser.displayName || "Anonymous User"}
                          </p>
                          {followingUser.username && (
                            <p className="text-sm text-gray-600 dark:text-stone-300 truncate">
                              @{followingUser.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-stone-300">
                    {followingSearchQuery
                      ? "No users found"
                      : "Not following anyone yet"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Communities Modal */}
      {showCommunitiesModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCommunitiesModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-stone-200">
                Communities
              </h2>
              <button
                onClick={() => setShowCommunitiesModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={communitiesSearchQuery}
                  onChange={(e) => setCommunitiesSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-stone-200 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-160px)] p-6">
              {communitiesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : communities.filter((community) => {
                  const searchLower = communitiesSearchQuery.toLowerCase();
                  const name = (community.name || "").toLowerCase();
                  const description = (
                    community.description || ""
                  ).toLowerCase();
                  return (
                    name.includes(searchLower) ||
                    description.includes(searchLower)
                  );
                }).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communities
                    .filter((community) => {
                      const searchLower = communitiesSearchQuery.toLowerCase();
                      const name = (community.name || "").toLowerCase();
                      const description = (
                        community.description || ""
                      ).toLowerCase();
                      return (
                        name.includes(searchLower) ||
                        description.includes(searchLower)
                      );
                    })
                    .map((community) => (
                      <div
                        key={community.id}
                        onClick={() => {
                          setShowCommunitiesModal(false);
                          navigate(`/communities/${community.id}`);
                        }}
                        className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {community.imageUrl ? (
                            <img
                              src={community.imageUrl}
                              alt={community.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-stone-200 truncate mb-1">
                              {community.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-stone-300 mb-2 line-clamp-2">
                              {community.description || "No description"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-stone-400">
                              <span>{community.memberCount} members</span>
                              <span>•</span>
                              <span>
                                {community.isPublic ? "Public" : "Private"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-stone-200 mb-2">
                    {communitiesSearchQuery
                      ? "No communities found"
                      : "No communities yet"}
                  </h3>
                  {isOwnProfile && !communitiesSearchQuery && (
                    <>
                      <p className="text-gray-600 dark:text-stone-300 mb-4">
                        Join communities to connect with others!
                      </p>
                      <button
                        onClick={() => {
                          setShowCommunitiesModal(false);
                          navigate("/communities");
                        }}
                        className="inline-block px-6 py-2 rounded-lg transition"
                        style={{
                          backgroundColor: COLORS.Dark_Gray,
                          color: COLORS.Beige,
                        }}
                      >
                        Browse Communities
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unfollow Confirmation Modal */}
      {showUnfollowConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUnfollowConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <LockClosedIcon className="h-8 w-8 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Unfollow Private Account?
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to unfollow{" "}
              <span className="font-semibold">
                @{profile.username || "this user"}
              </span>
              ? This account is private, so you will have to request to follow
              them again if you want to refollow.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnfollowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnfollow}
                disabled={followLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                {followLoading ? "Unfollowing..." : "Unfollow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Popup */}
      {showPrivacyPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPrivacyPopup(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <LockClosedIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Private Profile
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {privacyPopupMessage}
            </p>
            <button
              onClick={() => setShowPrivacyPopup(false)}
              className="w-full px-4 py-2 rounded-lg transition font-medium"
              style={{
                backgroundColor: COLORS.Dark_Gray,
                color: COLORS.Beige,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
