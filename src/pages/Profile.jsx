import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRightOnRectangleIcon,
  PencilIcon,
  UserPlusIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";
import {
  getUserProfile,
  followUser,
  unfollowUser,
  isFollowing,
} from "../services/profileService";
import EditProfile from "../components/EditProfile";

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.uid;
  const profileUserId = userId || currentUser?.uid;

  useEffect(() => {
    loadProfile();
  }, [profileUserId]);

  useEffect(() => {
    if (!isOwnProfile && currentUser && profileUserId) {
      checkFollowStatus();
    }
  }, [isOwnProfile, currentUser, profileUserId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getUserProfile(profileUserId);
      setProfile(profileData);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const following = await isFollowing(currentUser.uid, profileUserId);
      setIsFollowingUser(following);
    } catch (error) {
      console.error("Error checking follow status:", error);
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
        await unfollowUser(currentUser.uid, profileUserId);
        setIsFollowingUser(false);
        setProfile({
          ...profile,
          followersCount: Math.max((profile.followersCount || 0) - 1, 0),
        });
      } else {
        await followUser(currentUser.uid, profileUserId);
        setIsFollowingUser(true);
        setProfile({
          ...profile,
          followersCount: (profile.followersCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleSaveProfile = async () => {
    setIsEditing(false);
    await loadProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile not found
          </h2>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <EditProfile
        profile={profile}
        onSave={handleSaveProfile}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Profile</h1>
          <div className="flex gap-3">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <PencilIcon className="w-5 h-5" />
                  <span className="font-medium">Edit Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md font-medium ${
                  isFollowingUser
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : isFollowingUser ? (
                  <>
                    <UserMinusIcon className="w-5 h-5" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Banner Image */}
          {profile.bannerImage && (
            <div className="h-48 md:h-64 w-full overflow-hidden">
              <img
                src={profile.bannerImage}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="-mt-16 md:-mt-20">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {profile.firstName?.[0] ||
                        profile.displayName?.[0] ||
                        "?"}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900">
                  {profile.firstName && profile.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.displayName || "Anonymous User"}
                </h2>
                {profile.username && (
                  <p className="text-gray-600 text-lg">@{profile.username}</p>
                )}
                {profile.email && (
                  <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
                )}
                {profile.bio && (
                  <p className="text-gray-700 mt-4">{profile.bio}</p>
                )}

                {/* Stats */}
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {profile.postsCount || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {profile.followersCount || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {profile.followingCount || 0}
                    </p>
                    <p className="text-gray-600 text-sm">Following</p>
                  </div>
                </div>

                {/* Links */}
                {profile.links && profile.links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition"
                      >
                        {link.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cover Images */}
            {profile.coverImages && profile.coverImages.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Gallery
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {profile.coverImages.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-200"
                    >
                      <img
                        src={image}
                        alt={`Cover ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
