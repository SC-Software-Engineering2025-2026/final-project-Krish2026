import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  createCommunityPost,
  getCommunityPosts,
  likeCommunityPost,
  addCommentToCommunityPost,
  getCommunityPostComments,
  subscribeToCommunityPosts,
  deleteCommunityPost,
  updateCommunityPostComment,
  deleteCommunityPostComment,
  likeCommunityPostComment,
} from "../services/communityPostService";
import { getUserProfile } from "../services/profileService";
import ImageCropper from "./ImageCropper";
import LocationPicker from "./LocationPicker";
import { getCroppedImg } from "../utils/cropImage";
import { shortenLocation } from "../utils/locationUtils";

import { COLORS } from "../theme/colors";

const CommunityPosts = ({ communityId, userRole, isCollaborative }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filter, setFilter] = useState("all"); // all, images, videos, text
  const [selectedPost, setSelectedPost] = useState(null);

  const canPost = isCollaborative || userRole === "admin";

  useEffect(() => {
    setLoading(true);

    // Subscribe to posts in real-time
    const unsubscribe = subscribeToCommunityPosts(communityId, async (data) => {
      console.log("Raw posts data:", data);

      // Fetch user profiles for each post
      const postsWithProfiles = await Promise.all(
        data.map(async (post) => {
          try {
            const profile = await getUserProfile(post.userId);
            console.log(`Profile for post ${post.id}:`, profile);
            return { ...post, userProfile: profile };
          } catch (error) {
            console.error("Error fetching user profile:", error);
            return { ...post, userProfile: null };
          }
        }),
      );

      console.log("Posts with profiles:", postsWithProfiles);
      setPosts(postsWithProfiles);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [communityId]);

  const handleLike = async (postId) => {
    try {
      // Format postId correctly for likeCommunityPost
      const formattedPostId = `${communityId}/posts/${postId}`;
      await likeCommunityPost(formattedPostId, currentUser.uid);
      // Real-time listener will automatically update the posts
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteCommunityPost(communityId, postId, currentUser.uid);
      // Real-time listener will automatically update the posts
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === "all") return true;
    if (filter === "images") return post.images?.length > 0;
    if (filter === "videos") return post.videos?.length > 0;
    if (filter === "text") return !post.images?.length && !post.videos?.length;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              style={{
                backgroundColor:
                  filter === "all" ? COLORS.Dark_Gray : COLORS.Beige,
                color: filter === "all" ? COLORS.Beige : COLORS.Dark_Gray,
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              All
            </button>
            <button
              onClick={() => setFilter("images")}
              style={{
                backgroundColor:
                  filter === "images" ? COLORS.Dark_Gray : COLORS.Beige,
                color: filter === "images" ? COLORS.Beige : COLORS.Dark_Gray,
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              Images
            </button>
            <button
              onClick={() => setFilter("videos")}
              style={{
                backgroundColor:
                  filter === "videos" ? COLORS.Dark_Gray : COLORS.Beige,
                color: filter === "videos" ? COLORS.Beige : COLORS.Dark_Gray,
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              Videos
            </button>
            <button
              onClick={() => setFilter("text")}
              style={{
                backgroundColor:
                  filter === "text" ? COLORS.Dark_Gray : COLORS.Beige,
                color: filter === "text" ? COLORS.Beige : COLORS.Dark_Gray,
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              Text
            </button>
          </div>

          {canPost && (
            <button
              onClick={() => setShowCreatePost(true)}
              style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
              className="px-4 py-2 rounded-lg flex items-center space-x-2"
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
              <span>Create Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No posts yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {canPost
                ? "Be the first to create a post!"
                : "No posts have been created yet"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={() => setSelectedPost(post)}
              onDelete={handleDeletePost}
              currentUserId={currentUser.uid}
              communityId={communityId}
            />
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          communityId={communityId}
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            // Real-time subscription will automatically update posts
          }}
        />
      )}

      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          post={selectedPost}
          communityId={communityId}
          onClose={() => setSelectedPost(null)}
          onCommentAdded={() => {
            // Real-time subscription will automatically update comments
          }}
        />
      )}
    </div>
  );
};

// Post Card Component
const PostCard = ({
  post,
  onLike,
  onComment,
  onDelete,
  currentUserId,
  communityId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const isLiked = post.likes?.includes(currentUserId);
  const isAuthor = post.userId === currentUserId;

  const handleLikeClick = () => {
    setIsAnimating(true);
    onLike(post.id);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handleImageScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndex(index);
  };

  const handleVideoScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentVideoIndex(index);
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone.",
      )
    ) {
      try {
        await onDelete(post.id);
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post");
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {post.userProfile?.profileImage ? (
            <img
              src={post.userProfile.profileImage}
              alt={post.userProfile.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {post.userProfile?.username?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {post.userProfile?.username || "User"}
            </p>
            {post.location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {shortenLocation(post.location)}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {post.createdAt?.toDate?.().toLocaleDateString() || "Just now"}
            </p>
          </div>
        </div>

        {/* 3-Dot Menu (Only for post author) */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center space-x-2 transition"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="relative">
          <div
            className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            onScroll={handleImageScroll}
          >
            <div className="flex">
              {post.images.map((image, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 snap-center snap-always flex justify-center bg-gray-50 dark:bg-gray-800"
                >
                  <img
                    src={image}
                    alt={`Post ${index + 1}`}
                    className="h-auto object-contain"
                    style={{
                      maxHeight: "400px",
                      width: "100%",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Pagination indicators */}
          {post.images.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2 pb-2">
              {post.images.map((_, index) => (
                <div
                  key={index}
                  className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor:
                      currentImageIndex === index ? "#171717" : "#9ca3af",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Videos */}
      {post.videos && post.videos.length > 0 && (
        <div className="relative">
          <div
            className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            onScroll={handleVideoScroll}
          >
            <div className="flex">
              {post.videos.map((video, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 snap-center snap-always flex justify-center bg-gray-50"
                >
                  <video
                    src={video}
                    controls
                    className="rounded"
                    style={{
                      maxHeight: "400px",
                      width: "100%",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Pagination indicators */}
          {post.videos.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2 pb-2">
              {post.videos.map((_, index) => (
                <div
                  key={index}
                  className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor:
                      currentVideoIndex === index ? "#171717" : "#9ca3af",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Content */}
      {post.content && (
        <div className="px-4 pb-3 pt-3">
          <p className="text-gray-900 dark:text-white pl-2.5">{post.content}</p>
          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 pl-2.5">
              {post.hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
          <span>
            {post.likesCount || 0}{" "}
            {(post.likesCount || 0) === 1 ? "like" : "likes"}
          </span>
          <span>
            {post.commentsCount || 0}{" "}
            {(post.commentsCount || 0) === 1 ? "comment" : "comments"}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLikeClick}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isLiked
                ? "text-red-600 bg-red-50 dark:bg-red-900/30"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <svg
              className={`w-5 h-5 ${isAnimating ? "like-animate" : ""}`}
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>Like</span>
          </button>
          <button
            onClick={onComment}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Comment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Post Modal Component
const CreatePostModal = ({ communityId, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [postType, setPostType] = useState(null); // 'text' or 'media'
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [location, setLocation] = useState(null); // { name, coordinates: { lat, lng } }
  const [hashtags, setHashtags] = useState("");
  const [taggedUsers, setTaggedUsers] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (postType === "text" && !content.trim()) {
      alert("Please add some text content");
      return;
    }

    if (postType === "media" && mediaFiles.length === 0 && !content.trim()) {
      alert("Please add media or content");
      return;
    }

    setLoading(true);
    try {
      const postData = {
        content: content.trim(),
        location: location?.name || "",
        locationCoordinates: location?.coordinates || null,
        hashtags: hashtags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        taggedUsers: taggedUsers
          .split(",")
          .map((user) => user.trim())
          .filter((user) => user),
      };

      await createCommunityPost(
        communityId,
        currentUser.uid,
        postData,
        mediaFiles,
      );

      // Clean up previews
      mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview));

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length + mediaFiles.length > 20) {
      alert("Maximum 20 media files allowed");
      return;
    }

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        alert(`${file.name} is too large. Maximum size is 100MB`);
        continue;
      }

      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert(`${file.name} is not a valid image or video file`);
        continue;
      }

      // If it's an image, show cropper with 4:3 aspect ratio
      if (file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file);
        setImageToCrop(imageUrl);
        setCurrentImageIndex(mediaFiles.length); // Store index for where to insert
      } else {
        // For videos, just add them directly
        setMediaFiles((prev) => [...prev, file]);
        setMediaPreviews((prev) => [
          ...prev,
          {
            url: URL.createObjectURL(file),
            type: "video",
          },
        ]);
      }
    }

    // Reset file input
    e.target.value = "";
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      // Convert blob to file
      const croppedFile = new File(
        [croppedBlob],
        `cropped-image-${Date.now()}.jpg`,
        { type: "image/jpeg" },
      );

      // Add to media files and previews
      setMediaFiles((prev) => [...prev, croppedFile]);
      setMediaPreviews((prev) => [
        ...prev,
        {
          url: URL.createObjectURL(croppedFile),
          type: "image",
        },
      ]);

      // Clean up
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
      setCurrentImageIndex(null);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image");
      setImageToCrop(null);
      setCurrentImageIndex(null);
    }
  };

  const handleCropCancel = () => {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setCurrentImageIndex(null);
  };

  const handleRemoveMedia = (index) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);

    // Revoke object URL to free memory
    URL.revokeObjectURL(mediaPreviews[index].url);

    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  // Step 1: Choose post type
  if (!postType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold dark:text-white">
              Choose Post Type
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setPostType("text")}
              className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition group"
            >
              <div className="flex flex-col items-center space-y-3">
                <svg
                  className="w-12 h-12 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    Text Post
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Share your thoughts with text
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setPostType("media")}
              className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition group"
            >
              <div className="flex flex-col items-center space-y-3">
                <svg
                  className="w-12 h-12 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    Photo/Video Post
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Share photos or videos with captions
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Text post form
  if (postType === "text") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPostType(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-xl font-semibold dark:text-white">
                Create Text Post
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              rows={8}
              maxLength={5000}
              disabled={loading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {content.length}/5000 characters
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                style={{
                  backgroundColor: !content.trim()
                    ? "#d1d5db"
                    : COLORS.Dark_Gray,
                  color: !content.trim() ? "#888" : COLORS.Beige,
                  cursor:
                    loading || !content.trim() ? "not-allowed" : "pointer",
                }}
                className="px-6 py-2 rounded-lg transition"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Media post form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPostType(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-xl font-semibold dark:text-white">
              Create Photo/Video Post
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Media Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photos/Videos ({mediaPreviews.length}/20)
            </label>

            {/* Media Previews */}
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square">
                    {preview.type === "video" ? (
                      <video
                        src={preview.url}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      style={{
                        backgroundColor: COLORS.Dark_Gray,
                        color: COLORS.Beige,
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {mediaPreviews.length < 20 && (
              <label
                style={{
                  backgroundColor: COLORS.Beige,
                  color: COLORS.Dark_Gray,
                }}
                className="cursor-pointer w-full flex flex-col items-center justify-center gap-2 px-6 py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition"
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaChange}
                  className="hidden"
                  disabled={loading}
                />
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Click to upload photos or videos
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Up to 20 files, 100MB each
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Caption */}
          <div>
            <label
              htmlFor="caption"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Caption
            </label>
            <textarea
              id="caption"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Write a caption..."
              maxLength={2200}
              disabled={loading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {content.length}/2200 characters
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Location</span>
              </div>
            </label>
            {location ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-gray-900 dark:text-white">
                      {location.name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLocation(null)}
                  disabled={loading}
                  style={{
                    backgroundColor: COLORS.Dark_Gray,
                    color: COLORS.Beige,
                  }}
                  className="px-3 py-2 rounded-lg transition"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                disabled={loading}
                style={{
                  backgroundColor: COLORS.Dark_Gray,
                  color: COLORS.Beige,
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition text-left flex items-center gap-2"
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Add location</span>
              </button>
            )}
          </div>

          {/* Location Picker Modal */}
          {showLocationPicker && (
            <LocationPicker
              onLocationSelect={(selectedLocation) => {
                setLocation(selectedLocation);
                setShowLocationPicker(false);
              }}
              onClose={() => setShowLocationPicker(false)}
              currentLocation={location}
            />
          )}

          {/* Hashtags */}
          <div>
            <label
              htmlFor="hashtags"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <div className="flex items-center gap-2">
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
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                <span>Hashtags</span>
              </div>
            </label>
            <input
              type="text"
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Add hashtags separated by commas (e.g., nature, travel, photography)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate hashtags with commas
            </p>
          </div>

          {/* Tagged Users */}
          <div>
            <label
              htmlFor="taggedUsers"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <div className="flex items-center gap-2">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Tag Users</span>
              </div>
            </label>
            <input
              type="text"
              id="taggedUsers"
              value={taggedUsers}
              onChange={(e) => setTaggedUsers(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Tag users by username, separated by commas (e.g., @john, @jane)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate usernames with commas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || (mediaFiles.length === 0 && !content.trim())}
              style={{
                backgroundColor:
                  mediaFiles.length === 0 && !content.trim()
                    ? "#d1d5db"
                    : COLORS.Dark_Gray,
                color:
                  mediaFiles.length === 0 && !content.trim()
                    ? "#888"
                    : COLORS.Beige,
                cursor:
                  loading || (mediaFiles.length === 0 && !content.trim())
                    ? "not-allowed"
                    : "pointer",
              }}
              className="flex-1 px-6 py-3 rounded-lg transition font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Posting...
                </span>
              ) : (
                "Share Post"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Image Cropper Modal - User can choose 1:1, 4:3, or 3:4 */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={4 / 3}
          allowRatioChange={true}
        />
      )}
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ post, communityId, onClose, onCommentAdded }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [selectedComment, setSelectedComment] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [collapsedReplies, setCollapsedReplies] = useState({});
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const replyInputRef = useRef(null);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  useEffect(() => {
    // Scroll to bottom when comments update
    if (commentsEndRef.current && comments.length > 0) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const postPath = `${communityId}/posts/${post.id}`;
      const data = await getCommunityPostComments(postPath);

      // Fetch user profiles for each comment
      const commentsWithProfiles = await Promise.all(
        data.map(async (comment) => {
          try {
            const profile = await getUserProfile(comment.userId);
            return { ...comment, userProfile: profile };
          } catch (error) {
            return { ...comment, userProfile: null };
          }
        }),
      );

      // Organize comments into parent-child structure
      const topLevelComments = commentsWithProfiles.filter(
        (c) => !c.parentCommentId,
      );
      const repliesMap = {};

      commentsWithProfiles.forEach((comment) => {
        if (comment.parentCommentId) {
          if (!repliesMap[comment.parentCommentId]) {
            repliesMap[comment.parentCommentId] = [];
          }
          repliesMap[comment.parentCommentId].push(comment);
        }
      });

      // Attach replies to their parent comments
      const commentsWithReplies = topLevelComments.map((comment) => ({
        ...comment,
        replies: repliesMap[comment.id] || [],
      }));

      setComments(commentsWithReplies);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentDoubleClick = (comment, event) => {
    if (comment.userId !== currentUser.uid) return; // Only allow editing own comments
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedComment(comment);
    setContextMenuPosition({
      x: event.clientX,
      y: rect.bottom + 5,
    });
  };

  const handleReplyDoubleClick = (reply, event) => {
    if (reply.userId !== currentUser.uid) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedComment(reply);
    setContextMenuPosition({
      x: event.clientX,
      y: rect.bottom + 5,
    });
  };

  const handleEditComment = () => {
    if (!selectedComment) return;
    setEditingComment(selectedComment);
    setEditText(selectedComment.text);
    setContextMenuPosition(null);
    setSelectedComment(null);
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const postPath = `${communityId}/posts/${post.id}`;
        await deleteCommunityPostComment(postPath, selectedComment.id);
        await loadComments();
        setContextMenuPosition(null);
        setSelectedComment(null);
      } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Failed to delete comment");
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingComment) return;
    try {
      const postPath = `${communityId}/posts/${post.id}`;
      await updateCommunityPostComment(postPath, editingComment.id, editText);
      await loadComments();
      setEditingComment(null);
      setEditText("");
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setReplyText("");
    setTimeout(() => replyInputRef.current?.focus(), 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    const commentText = replyText.trim();
    setLoading(true);

    try {
      const postPath = `${communityId}/posts/${post.id}`;
      await addCommentToCommunityPost(
        postPath,
        currentUser.uid,
        commentText,
        replyingTo.id,
      );
      await loadComments();
      onCommentAdded();
      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Failed to post reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleReplies = (commentId) => {
    setCollapsedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleCommentLike = async (commentId) => {
    try {
      const postPath = `${communityId}/posts/${post.id}`;
      await likeCommunityPostComment(postPath, commentId, currentUser.uid);
      await loadComments();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuPosition(null);
      setSelectedComment(null);
    };

    if (contextMenuPosition) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenuPosition]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentText = newComment.trim();

    // Create optimistic comment immediately with basic user info
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      text: commentText,
      userId: currentUser.uid,
      userProfile: {
        username:
          currentUser.displayName || currentUser.email?.split("@")[0] || "User",
        profilePicture: currentUser.photoURL || null,
      },
      createdAt: { toDate: () => new Date() },
    };

    // Add comment to UI instantly
    setComments((prev) => [...prev, optimisticComment]);

    // Clear input and blur it immediately for instant feedback
    setNewComment("");
    if (inputRef.current) {
      inputRef.current.blur();
    }

    // Auto-scroll to bottom to show new comment
    setTimeout(() => {
      if (commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);

    setLoading(true);

    try {
      const postPath = `${communityId}/posts/${post.id}`;
      await addCommentToCommunityPost(
        postPath,
        currentUser.uid,
        commentText,
        null,
      );

      // Reload comments from server to ensure data consistency
      await loadComments();
      onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);

      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));

      // Restore text to input field for user to try again
      setNewComment(commentText);

      // Show error message
      alert("Failed to post comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Comments
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg
                className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex space-x-3">
                    {comment.userProfile?.profileImage ? (
                      <img
                        src={comment.userProfile.profileImage}
                        alt={comment.userProfile.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {comment.userProfile?.username?.[0]?.toUpperCase() ||
                            "U"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {comment.userProfile?.username || "User"}
                      </p>
                      {editingComment?.id === comment.id ? (
                        <div className="mt-1">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-gray-900 dark:text-white mt-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1 -ml-1"
                          onDoubleClick={(e) =>
                            handleCommentDoubleClick(comment, e)
                          }
                        >
                          {comment.text}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {comment.createdAt
                            ?.toDate?.()
                            ?.toLocaleDateString() || "Just now"}
                          {comment.updatedAt && (
                            <span className="italic ml-2">(edited)</span>
                          )}
                        </p>
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
                        >
                          <svg
                            className={`w-3.5 h-3.5 ${
                              comment.likes?.includes(currentUser.uid)
                                ? "fill-red-600 text-red-600"
                                : "fill-none"
                            }`}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          <span>{comment.likesCount || 0}</span>
                        </button>
                        <button
                          onClick={() => handleReply(comment)}
                          className="text-xs text-blue-600 dark:text-stone-300 hover:text-blue-700 dark:hover:text-stone-200 font-medium"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Reply Form */}
                      {replyingTo?.id === comment.id && (
                        <form onSubmit={handleSubmitReply} className="mt-2">
                          <div className="flex space-x-2">
                            <input
                              ref={replyInputRef}
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Reply to ${comment.userProfile?.username || "User"}...`}
                              className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              disabled={loading}
                            />
                            <button
                              type="submit"
                              disabled={loading || !replyText.trim()}
                              style={{
                                backgroundColor: COLORS.Dark_Gray,
                                color: COLORS.Beige,
                              }}
                              className="px-3 py-1 rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {loading ? "..." : "Reply"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelReply}
                              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Replies Section */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                          >
                            <svg
                              className={`w-4 h-4 transition-transform ${collapsedReplies[comment.id] ? "" : "rotate-90"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                            <span>
                              {collapsedReplies[comment.id] ? "Show" : "Hide"}{" "}
                              {comment.replies.length}{" "}
                              {comment.replies.length === 1
                                ? "reply"
                                : "replies"}
                            </span>
                          </button>

                          {!collapsedReplies[comment.id] && (
                            <div className="ml-6 mt-2 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex space-x-2">
                                  {reply.userProfile?.profileImage ? (
                                    <img
                                      src={reply.userProfile.profileImage}
                                      alt={reply.userProfile.username}
                                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center">
                                      <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                                        {reply.userProfile?.username?.[0]?.toUpperCase() ||
                                          "U"}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="font-semibold text-xs text-gray-900 dark:text-white">
                                      {reply.userProfile?.username || "User"}
                                    </p>
                                    {editingComment?.id === reply.id ? (
                                      <div className="mt-1">
                                        <input
                                          ref={editInputRef}
                                          type="text"
                                          value={editText}
                                          onChange={(e) =>
                                            setEditText(e.target.value)
                                          }
                                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          autoFocus
                                        />
                                        <div className="flex space-x-2 mt-1">
                                          <button
                                            onClick={handleSaveEdit}
                                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={handleCancelEdit}
                                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p
                                        className="text-gray-900 dark:text-white text-sm mt-0.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1 -ml-1"
                                        onDoubleClick={(e) =>
                                          handleReplyDoubleClick(reply, e)
                                        }
                                      >
                                        {reply.text}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {reply.createdAt
                                        ?.toDate?.()
                                        ?.toLocaleDateString() || "Just now"}
                                      {reply.updatedAt && (
                                        <span className="italic ml-2">
                                          (edited)
                                        </span>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleCommentLike(reply.id)
                                        }
                                        className="inline-flex items-center space-x-1 ml-3 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-medium"
                                      >
                                        <svg
                                          className={`w-3 h-3 ${
                                            reply.likes?.includes(
                                              currentUser.uid,
                                            )
                                              ? "fill-red-600 text-red-600"
                                              : "fill-none"
                                          }`}
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                          />
                                        </svg>
                                        <span>{reply.likesCount || 0}</span>
                                      </button>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </>
          )}
          {/* Context Menu */}
          {contextMenuPosition && selectedComment && (
            <div
              className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[60]"
              style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleEditComment}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteComment}
                className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t dark:border-gray-700"
        >
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
              className="px-6 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunityPosts;
