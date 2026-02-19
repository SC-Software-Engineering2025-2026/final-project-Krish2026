import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../services/profileService";
import {
  getUserCommunitiesPosts,
  likeCommunityPost,
  addCommentToCommunityPost,
  getCommunityPostComments,
} from "../services/communityPostService";
import {
  subscribeToAllPosts,
  likePost,
  unlikePost,
  subscribeToUserLikes,
  getPostComments,
  addComment,
} from "../services/postService";
import PostUpload from "../components/PostUpload";
import {
  PlusIcon,
  PhotoIcon,
  UserGroupIcon,
  GlobeAltIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showPostUpload, setShowPostUpload] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [personalPosts, setPersonalPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentImageIndices, setCurrentImageIndices] = useState({});

  const handleImageScroll = (postId, e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImageIndices((prev) => ({ ...prev, [postId]: index }));
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
    };
    loadUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Subscribe to personal posts in real-time
    const unsubscribePosts = subscribeToAllPosts(async (postsData) => {
      // Fetch user profiles for personal posts
      const postsWithProfiles = await Promise.all(
        postsData.map(async (post) => {
          try {
            const profile = await getUserProfile(post.userId);
            return {
              ...post,
              userProfile: profile,
              postType: "personal",
            };
          } catch (error) {
            return { ...post, userProfile: null, postType: "personal" };
          }
        }),
      );
      setPersonalPosts(postsWithProfiles);
    });

    // Subscribe to user likes in real-time
    const unsubscribeLikes = subscribeToUserLikes(
      currentUser.uid,
      (likedPostIds) => {
        const likedStatus = {};
        likedPostIds.forEach((postId) => {
          likedStatus[postId] = true;
        });
        setLikedPosts(likedStatus);
      },
    );

    // Load community posts
    const loadCommunityPosts = async () => {
      try {
        const communityPostsData = await getUserCommunitiesPosts(
          currentUser.uid,
        );
        setCommunityPosts(
          communityPostsData.map((post) => ({
            ...post,
            postType: "community",
          })),
        );
      } catch (error) {
        console.error("Error loading community posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunityPosts();

    // Cleanup subscriptions
    return () => {
      unsubscribePosts();
      unsubscribeLikes();
    };
  }, [currentUser]);

  // Group posts by community and include personal posts
  useEffect(() => {
    const grouped = {};

    // Add personal posts as a separate group
    if (personalPosts.length > 0) {
      grouped["personal"] = {
        name: "Personal Posts",
        image: null,
        posts: [...personalPosts]
          .sort((a, b) => {
            const aTime =
              a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime =
              b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
          })
          .slice(0, 4),
      };
    }

    // Group community posts by community
    communityPosts.forEach((post) => {
      const key = post.communityId;
      if (!grouped[key]) {
        grouped[key] = {
          name: post.communityName,
          image: post.communityImage,
          isCollaborative: post.isCollaborative,
          communityId: post.communityId,
          posts: [],
        };
      }
      grouped[key].posts.push(post);
    });

    // Sort posts within each community by date and limit to 4
    Object.keys(grouped).forEach((key) => {
      if (key !== "personal") {
        grouped[key].posts.sort((a, b) => {
          const aTime =
            a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bTime =
            b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bTime - aTime;
        });
        grouped[key].posts = grouped[key].posts.slice(0, 4);
      }
    });

    setPosts(grouped);
  }, [personalPosts, communityPosts]);

  const handlePostCreated = async (postId) => {
    // Close the modal
    setShowPostUpload(false);
    // Reload community posts to refresh the feed
    try {
      const communityPosts = await getUserCommunitiesPosts(currentUser.uid);
      setPosts(communityPosts);
    } catch (error) {
      console.error("Error reloading posts:", error);
    }
    // Optionally navigate to the new post
    // navigate(`/post/${postId}`);
  };

  const handleLike = async (post) => {
    try {
      if (post.postType === "community") {
        // Optimistically update UI
        const isLiked = post.likes?.includes(currentUser.uid);
        const updatedLikes = isLiked
          ? post.likes.filter((uid) => uid !== currentUser.uid)
          : [...(post.likes || []), currentUser.uid];

        setCommunityPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === post.id
              ? {
                  ...p,
                  likes: updatedLikes,
                  likesCount: updatedLikes.length,
                }
              : p,
          ),
        );

        // Community post like - format postId correctly
        const postId = `${post.communityId}/posts/${post.id}`;
        await likeCommunityPost(postId, currentUser.uid);
      } else {
        // Personal post like
        const isLiked = likedPosts[post.id];
        if (isLiked) {
          await unlikePost(post.id, currentUser.uid);
        } else {
          await likePost(post.id, currentUser.uid);
        }
        // Real-time listener will update the UI
      }
    } catch (error) {
      console.error("Error liking post:", error);
      // Reload community posts on error to sync state
      if (post.postType === "community") {
        const communityPostsData = await getUserCommunitiesPosts(
          currentUser.uid,
        );
        setCommunityPosts(
          communityPostsData.map((p) => ({ ...p, postType: "community" })),
        );
      }
    }
  };

  const handleOpenComments = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handleCommentAdded = () => {
    // Reload posts to update comment count
    const loadPosts = async () => {
      try {
        const communityPosts = await getUserCommunitiesPosts(currentUser.uid);
        setPosts(communityPosts);
      } catch (error) {
        console.error("Error reloading posts:", error);
      }
    };
    loadPosts();
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Sfera
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A modern social media platform for digital communities
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <PhotoIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Share Your Moments
            </h3>
            <p className="text-gray-600">
              Upload photos and share your experiences with the community
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <UserGroupIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Join Communities
            </h3>
            <p className="text-gray-600">
              Connect with like-minded people in various communities
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <GlobeAltIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Discover Content
            </h3>
            <p className="text-gray-600">
              Explore new content and discover amazing creators
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back,{" "}
              {userProfile?.firstName ||
                userProfile?.username ||
                currentUser.displayName ||
                "User"}
              !
            </h1>
            <p className="text-gray-600">
              View new moments from your communities!
            </p>
          </div>
        </div>
      </div>

      {/* Feed Section */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : Object.keys(posts).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600 mb-6">
                Join communities to see posts in your feed
              </p>
              <button
                onClick={() => navigate("/communities")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Explore Communities
              </button>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(posts).map(([groupKey, group]) => (
              <div key={groupKey} className="bg-white rounded-lg shadow-md p-6">
                {/* Community Header */}
                {groupKey === "personal" ? (
                  <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
                    <PhotoIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Personal Posts
                      </h2>
                      <p className="text-sm text-gray-500">
                        {group.posts.length}{" "}
                        {group.posts.length === 1 ? "post" : "posts"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      navigate(`/communities/${group.communityId}`)
                    }
                    className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-t-lg transition"
                  >
                    {group.image && (
                      <img
                        src={group.image}
                        alt={group.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        {group.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {group.isCollaborative
                          ? "Collaborative"
                          : "Informational"}{" "}
                        • {group.posts.length}{" "}
                        {group.posts.length === 1 ? "post" : "posts"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Posts Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {group.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      likedPosts={likedPosts}
                      currentImageIndices={currentImageIndices}
                      handleImageScroll={handleImageScroll}
                      handleLike={handleLike}
                      handleOpenComments={handleOpenComments}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Post Upload Modal */}
      {showPostUpload && (
        <PostUpload
          onClose={() => setShowPostUpload(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedPost && (
        <CommentsModal
          post={selectedPost}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedPost(null);
          }}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
};

// Comments Modal Component
const CommentsModal = ({ post, onClose, onCommentAdded }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [selectedComment, setSelectedComment] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

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
      let data;

      // Load comments based on post type
      if (post.postType === "community") {
        const postPath = `${post.communityId}/posts/${post.id}`;
        data = await getCommunityPostComments(postPath);
      } else {
        // Personal post
        data = await getPostComments(post.id);
      }

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

  const handleCommentDoubleClick = (comment, event) => {
    if (comment.userId !== currentUser.uid) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedComment(comment);
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
        alert("Delete functionality needs to be implemented in the service");
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
      alert("Edit functionality needs to be implemented in the service");
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
      // Add comment based on post type
      if (post.postType === "community") {
        const postPath = `${post.communityId}/posts/${post.id}`;
        await addCommentToCommunityPost(postPath, currentUser.uid, commentText);
      } else {
        // Personal post
        await addComment(post.id, currentUser.uid, commentText);
      }

      // Reload comments from server to ensure data consistency
      await loadComments();
      onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);

      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));

      // Restore text to input field for user to try again
      setNewComment(commentText);

      // Show error message (optional - could add toast notification)
      alert("Failed to post comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Comments</h2>
            <p className="text-sm text-gray-500">
              {post.postType === "community"
                ? post.communityName
                : "Personal Post"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  {comment.userProfile?.profileImage ? (
                    <img
                      src={comment.userProfile.profileImage}
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
                    {editingComment?.id === comment.id ? (
                      <div className="mt-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-gray-900 mt-1 cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1"
                        onDoubleClick={(e) =>
                          handleCommentDoubleClick(comment, e)
                        }
                      >
                        {comment.text}
                      </p>
                    )}
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
          {contextMenuPosition && selectedComment && (
            <div
              className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60]"
              style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleEditComment}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
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
                className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2"
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

        {/* Comment Input */}
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

// Compact Post Card Component for Grid Display
const PostCard = ({
  post,
  currentUser,
  likedPosts,
  currentImageIndices,
  handleImageScroll,
  handleLike,
  handleOpenComments,
  navigate,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const onLikeClick = () => {
    setIsAnimating(true);
    handleLike(post);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
      {/* Author Info */}
      <div className="flex items-center space-x-2 p-3 bg-gray-50 border-b border-gray-200">
        {post.userProfile?.profileImage ? (
          <img
            src={post.userProfile.profileImage}
            alt={post.userProfile.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-xs font-medium">
              {post.userProfile?.username?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">
            {post.userProfile?.username || "User"}
          </p>
          <p className="text-xs text-gray-500">
            {post.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-3">
        {/* Post Text */}
        {(post.content || post.caption) && (
          <p className="text-sm text-gray-800 mb-3 line-clamp-3 whitespace-pre-wrap">
            {post.content || post.caption}
          </p>
        )}

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="relative mb-3">
            <div
              className="overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              onScroll={(e) => handleImageScroll(post.id, e)}
            >
              <div className="flex">
                {post.images.map((image, index) => (
                  <div
                    key={index}
                    className="w-full flex-shrink-0 snap-center snap-always flex justify-center bg-gray-50"
                  >
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="h-auto object-contain cursor-pointer"
                      style={{
                        maxHeight: "250px",
                        width: "100%",
                      }}
                      onClick={() => {
                        if (post.postType === "community") {
                          navigate(`/communities/${post.communityId}`);
                        } else {
                          navigate(`/post/${post.id}`);
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Pagination indicators */}
            {post.images.length > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {post.images.map((_, index) => (
                  <div
                    key={index}
                    className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                    style={{
                      backgroundColor:
                        (currentImageIndices[post.id] || 0) === index
                          ? "#171717"
                          : "#9ca3af",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center space-x-4 pt-2 border-t border-gray-200">
          <button
            onClick={onLikeClick}
            className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition"
          >
            {(
              post.postType === "community"
                ? post.likes?.includes(currentUser.uid)
                : likedPosts[post.id]
            ) ? (
              <HeartIconSolid
                className={`h-5 w-5 text-red-600 ${isAnimating ? "like-animate" : ""}`}
              />
            ) : (
              <HeartIcon
                className={`h-5 w-5 ${isAnimating ? "like-animate" : ""}`}
              />
            )}
            <span className="text-xs font-medium">{post.likesCount || 0}</span>
          </button>
          <button
            onClick={() => handleOpenComments(post)}
            className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            <span className="text-xs font-medium">
              {post.commentsCount || 0}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
