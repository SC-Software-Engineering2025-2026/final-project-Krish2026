import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUserProfile,
  toggleProfilePrivacy,
  subscribeToUserProfile,
} from "../services/profileService";
import { getCommunitiesByIds } from "../services/communityService";
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
} from "@heroicons/react/24/outline";

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

        // Check privacy settings
        if (!isOwnProfile && profileData.isPrivate) {
          setError("This profile is private");
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [profileId, isOwnProfile, navigate]);

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

  const handleProfileUpdate = async () => {
    // Profile will be updated via subscription
    setIsEditMode(false);
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Banner Image */}
        {profile.bannerImage && (
          <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-200">
            <img
              src={profile.bannerImage}
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
                src={profile.profileImage}
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
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.displayName || "Anonymous User"}
              </h1>
              {isOwnProfile && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
                    title="More options"
                  >
                    <EllipsisVerticalIcon className="h-6 w-6" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setIsEditMode(true);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <PencilIcon className="h-5 w-5" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/settings");
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        <span>Settings</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {profile.username && (
              <p className="text-gray-600 mb-2">@{profile.username}</p>
            )}

            {profile.bio && <p className="text-gray-700 mb-4">{profile.bio}</p>}

            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div className="text-center">
                <p className="font-bold text-xl text-gray-900">
                  {profile.postsCount || 0}
                </p>
                <p className="text-gray-600 text-sm">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-gray-900">
                  {profile.followersCount || 0}
                </p>
                <p className="text-gray-600 text-sm">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-gray-900">
                  {profile.followingCount || 0}
                </p>
                <p className="text-gray-600 text-sm">Following</p>
              </div>
            </div>

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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === "about"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <PhotoIcon className="h-5 w-5" />
            <span>About Me</span>
          </button>
          <button
            onClick={() => setActiveTab("communities")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === "communities"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <UserGroupIcon className="h-5 w-5" />
            <span>Communities</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "about" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {profile.coverImages && profile.coverImages.length > 0 ? (
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
              <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No cover photos yet
              </h3>
              {isOwnProfile && (
                <p className="text-gray-600">
                  Add cover photos to personalize your profile!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "communities" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {communitiesLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {communities.map((community) => (
                <Link
                  key={community.id}
                  to={`/community/${community.id}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-3">
                    {community.imageUrl ? (
                      <img
                        src={community.imageUrl}
                        alt={community.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {community.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {community.description || "No description"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{community.memberCount} members</span>
                        <span>•</span>
                        <span>{community.isPublic ? "Public" : "Private"}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No communities yet
              </h3>
              {isOwnProfile && (
                <>
                  <p className="text-gray-600 mb-4">
                    Join communities to connect with others!
                  </p>
                  <Link
                    to="/communities"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Browse Communities
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
