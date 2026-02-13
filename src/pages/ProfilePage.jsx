import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUserProfile,
  toggleProfilePrivacy,
} from "../services/profileService";
import {
  getUserPosts,
  likePost,
  unlikePost,
  hasLikedPost,
  subscribeToUserPosts,
  subscribeToUserLikes,
} from "../services/postService";
import PostGrid from "../components/PostGrid";
import EditProfile from "../components/EditProfile";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  LockOpenIcon,
  PhotoIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  // Determine if viewing own profile
  const isOwnProfile = currentUser && (userId === currentUser.uid || !userId);
  const profileId = userId || currentUser?.uid;

  useEffect(() => {
    if (!profileId) {
      navigate("/login");
      return;
    }
    loadProfile();
  }, [profileId]);

  useEffect(() => {
    if (profileId && activeTab === "posts") {
      setPostsLoading(true);

      // Subscribe to posts in real-time
      const unsubscribePosts = subscribeToUserPosts(profileId, (userPosts) => {
        setPosts(userPosts);
        setPostsLoading(false);
      });

      // Subscribe to likes in real-time if user is logged in
      let unsubscribeLikes;
      if (currentUser) {
        unsubscribeLikes = subscribeToUserLikes(
          currentUser.uid,
          (likedPostIds) => {
            const likedStatus = {};
            likedPostIds.forEach((postId) => {
              likedStatus[postId] = true;
            });
            setLikedPosts(likedStatus);
          },
        );
      }

      // Cleanup subscriptions
      return () => {
        unsubscribePosts();
        if (unsubscribeLikes) {
          unsubscribeLikes();
        }
      };
    }
  }, [profileId, activeTab, currentUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await getUserProfile(profileId);

      if (!profileData) {
        setError("Profile not found");
        return;
      }

      // Check privacy settings
      if (!isOwnProfile && profileData.isPrivate) {
        setError("This profile is private");
        return;
      }

      setProfile(profileData);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      const { posts: userPosts } = await getUserPosts(profileId);
      setPosts(userPosts);

      // Check liked status for each post if user is logged in
      if (currentUser) {
        const likedStatus = {};
        await Promise.all(
          userPosts.map(async (post) => {
            const liked = await hasLikedPost(post.id, currentUser.uid);
            likedStatus[post.id] = liked;
          }),
        );
        setLikedPosts(likedStatus);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const newPrivacyStatus = !profile.isPrivate;
      await toggleProfilePrivacy(profileId, newPrivacyStatus);
      setProfile({ ...profile, isPrivate: newPrivacyStatus });
    } catch (err) {
      console.error("Error toggling privacy:", err);
      alert("Failed to update privacy settings");
    }
  };

  const handleProfileUpdate = async () => {
    await loadProfile();
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

  const handleLike = async (postId, isCurrentlyLiked) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isCurrentlyLiked) {
        await unlikePost(postId, currentUser.uid);
      } else {
        await likePost(postId, currentUser.uid);
      }
      // No need to manually update state - real-time listeners will handle it
    } catch (err) {
      console.error("Error toggling like:", err);
      alert("Failed to update like");
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.displayName || "Anonymous User"}
              </h1>
              {isOwnProfile && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
                  title="Edit Profile"
                >
                  <Cog6ToothIcon className="h-6 w-6" />
                </button>
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

            {/* Privacy Toggle and Logout (Own Profile Only) */}
            {isOwnProfile && (
              <div className="flex gap-3">
                <button
                  onClick={handleTogglePrivacy}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  {profile.isPrivate ? (
                    <>
                      <LockClosedIcon className="h-5 w-5" />
                      <span>Private Profile</span>
                    </>
                  ) : (
                    <>
                      <LockOpenIcon className="h-5 w-5" />
                      <span>Public Profile</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
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
            onClick={() => setActiveTab("posts")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === "posts"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <PhotoIcon className="h-5 w-5" />
            <span>Posts</span>
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

      {activeTab === "posts" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {postsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : posts.length > 0 ? (
            <PostGrid
              posts={posts}
              onPostClick={(post) => navigate(`/post/${post.id}`)}
              currentUserId={currentUser?.uid}
              onLike={handleLike}
              likedPosts={likedPosts}
            />
          ) : (
            <div className="text-center py-12">
              <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No posts yet
              </h3>
              {isOwnProfile && (
                <p className="text-gray-600">
                  Share your first post to get started!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "communities" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {profile.joinedCommunities && profile.joinedCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.joinedCommunities.map((communityId, index) => (
                <Link
                  key={index}
                  to={`/community/${communityId}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      {communityId}
                    </span>
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
                <p className="text-gray-600">
                  Join communities to connect with others!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
