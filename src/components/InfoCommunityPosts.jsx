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
} from "../services/communityPostService";
import { getUserProfile } from "../services/profileService";

const InfoCommunityPosts = ({ communityId, userRole }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);

  const isAdmin = userRole === "admin";

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
      await likeCommunityPost(postId, currentUser.uid);
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
      alert(error.message || "Failed to delete post");
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notice for Non-Admins */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900">Admin-Only Posting</h3>
              <p className="text-sm text-blue-800 mt-1">
                Only admins can create posts in this informational community.
                You can view, like, and comment on posts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("images")}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === "images"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setFilter("videos")}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === "videos"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFilter("text")}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === "text"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Text
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No posts yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin
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
            loadPosts();
          }}
        />
      )}

      {/* Comments Modal */}
      {selectedPost && (
        <CommentsModal
          post={selectedPost}
          communityId={communityId}
          onClose={() => setSelectedPost(null)}
          onCommentAdded={loadPosts}
        />
      )}
    </div>
  );
};

// Post Card Component (reused from CommunityPosts)
const PostCard = ({
  post,
  onLike,
  onComment,
  onDelete,
  currentUserId,
  communityId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isLiked = post.likes?.includes(currentUserId);
  const isAuthor = post.userId === currentUserId;

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
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {post.userProfile?.profilePicture ? (
            <img
              src={post.userProfile.profilePicture}
              alt={post.userProfile.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {post.userProfile?.username?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold">
                {post.userProfile?.username || "Admin"}
              </p>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Admin
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {post.createdAt?.toDate?.().toLocaleDateString() || "Just now"}
            </p>
          </div>
        </div>

        {/* 3-Dot Menu (Only for post author) */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
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

      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-900">{post.content}</p>
        </div>
      )}

      {post.images && post.images.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Post ${index + 1}`}
              className="w-full h-64 object-cover"
            />
          ))}
        </div>
      )}

      {post.videos && post.videos.length > 0 && (
        <div className="space-y-2">
          {post.videos.map((video, index) => (
            <video key={index} src={video} controls className="w-full" />
          ))}
        </div>
      )}

      <div className="p-4 border-t">
        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3 font-medium">
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
            onClick={() => onLike(post.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              isLiked
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg
              className="w-5 h-5"
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
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
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

// Create Post Modal (reused)
const CreatePostModal = ({ communityId, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && images.length === 0) {
      alert("Please add content or images");
      return;
    }

    setLoading(true);
    try {
      await createCommunityPost(
        communityId,
        currentUser.uid,
        {
          content: content.trim(),
        },
        images,
      );
      onSuccess();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      alert("Maximum 4 images allowed");
      return;
    }
    setImages([...images, ...files]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
            placeholder="Share an announcement or update..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={6}
          />

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages(images.filter((_, i) => i !== index))
                    }
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
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
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <label className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-gray-800">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Add Photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                disabled={loading}
              />
            </label>

            <button
              type="submit"
              disabled={loading || (!content.trim() && images.length === 0)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Comments Modal (reused)
const CommentsModal = ({ post, communityId, onClose, onCommentAdded }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

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

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

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
      await addCommentToCommunityPost(postPath, currentUser.uid, commentText);

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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="h-12 w-12 mx-auto mb-2 text-gray-400"
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
                <div key={comment.id} className="flex space-x-3">
                  {comment.userProfile?.profilePicture ? (
                    <img
                      src={comment.userProfile.profilePicture}
                      alt={comment.userProfile.username}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {comment.userProfile?.username?.[0]?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {comment.userProfile?.username || "User"}
                    </p>
                    <p className="text-gray-900 mt-1">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.createdAt?.toDate?.()?.toLocaleDateString() ||
                        "Just now"}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InfoCommunityPosts;
